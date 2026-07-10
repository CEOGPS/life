# ============================================================
# Erebus Planner — Multi-step agentic loop with tool execution
# ============================================================

import re
import json
import asyncio
import httpx
from datetime import datetime
from typing import AsyncGenerator

from .memory  import ErebusMemory
from .router  import ModelRouter


MAX_STEPS = 8

PLANNER_SYSTEM = """You are Erebus — autonomous intelligence. You execute multi-step tasks by reasoning and using tools.

TOOL SYNTAX (one per line, no code blocks):
  SEARCH_WEB: query
  BROWSE_URL: https://url
  SCRAPE_PAGE: https://url | selector=.css
  READ_LIFEOS: crm | tasks | goals | calendar
  UPDATE_LEAD: name=X status=hot notes=Y
  CREATE_TASK: text=X priority=high|medium|low
  REMEMBER_FACT: key=X value=Y
  DRAFT_EMAIL: to=X subject=Y body=Z
  NOTIFY: message=X
  DONE: final answer here

RULES:
- Think step by step. Use tools to gather real data before concluding.
- Emit exactly ONE action per response — either a tool call OR your reasoning, not both.
- When you have enough information, emit: DONE: <your final answer>
- Never fabricate data — use READ_LIFEOS or SEARCH_WEB instead.
- Keep each response under 200 words unless the task requires depth.
"""


class ToolExecutor:
    """Executes tool calls and returns results as strings."""

    def __init__(self, lifeos_data: dict = None):
        self.lifeos_data = lifeos_data or {}
        # prefix -> (handler, is_async). Dispatch table keeps execute() flat
        # (low cyclomatic complexity); add a tool by adding one row here.
        self._dispatch = (
            ("SEARCH_WEB:",    self._search_web,    True),
            ("BROWSE_URL:",    self._browse,        True),
            ("SCRAPE_PAGE:",   self._scrape,        True),
            ("READ_LIFEOS:",   self._read_lifeos,   False),
            ("UPDATE_LEAD:",   self._update_lead,   False),
            ("CREATE_TASK:",   self._create_task,   False),
            ("REMEMBER_FACT:", self._remember_fact, False),
            ("DRAFT_EMAIL:",   self._draft_email,   False),
            ("NOTIFY:",        self._notify,        False),
        )

    async def execute(self, line: str) -> str:
        line = line.strip()
        try:
            for prefix, handler, is_async in self._dispatch:
                if line.startswith(prefix):
                    arg = line[len(prefix):].strip()
                    return await handler(arg) if is_async else handler(arg)
        except Exception as e:
            return f"[Tool error] {e}"
        return f"[Unknown tool] {line}"

    def _notify(self, spec: str) -> str:
        return f"[Notification queued] {spec}"

    async def _search_web(self, query: str) -> str:
        """DuckDuckGo instant answers — no API key required."""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                r = await client.get(
                    "https://api.duckduckgo.com/",
                    params={"q": query, "format": "json", "no_html": 1, "skip_disambig": 1},
                    headers={"User-Agent": "Mozilla/5.0"},
                )
                data = r.json()
            abstract = data.get("AbstractText", "")
            related  = [t.get("Text", "") for t in data.get("RelatedTopics", [])[:3] if isinstance(t, dict)]
            result   = abstract or " | ".join(filter(None, related)) or "No instant results found."
            return f"[SEARCH: {query}] {result[:800]}"
        except Exception as e:
            return f"[SEARCH error] {e}"

    async def _browse(self, url: str) -> str:
        try:
            async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
                r = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            text = re.sub(r"<[^>]+>", " ", r.text)
            text = re.sub(r"\s+", " ", text).strip()
            return f"[BROWSE: {url}] {text[:1200]}"
        except Exception as e:
            return f"[BROWSE error] {e}"

    async def _scrape(self, spec: str) -> str:
        parts = spec.split("|", 1)
        return await self._browse(parts[0].strip())

    def _read_lifeos(self, key: str) -> str:
        data = self.lifeos_data.get(key.strip(), {})
        if not data:
            return f"[READ_LIFEOS: {key}] No data available (sync with frontend first)."
        return f"[READ_LIFEOS: {key}] {json.dumps(data, ensure_ascii=False)[:1500]}"

    def _update_lead(self, spec: str) -> str:
        params = dict(re.findall(r'(\w+)=([^=\s]+(?:\s[^=\s]+)*?)(?=\s+\w+=|$)', spec))
        return f"[UPDATE_LEAD] Queued update for {params.get('name', '?')}: {params}"

    def _create_task(self, spec: str) -> str:
        params = dict(re.findall(r'(\w+)=([^=\s]+(?:\s[^=\s]+)*?)(?=\s+\w+=|$)', spec))
        return f"[CREATE_TASK] Task queued: {params.get('text', '?')} [{params.get('priority', 'normal')}]"

    def _remember_fact(self, spec: str) -> str:
        params = dict(re.findall(r'(\w+)=([^=\s]+(?:\s[^=\s]+)*?)(?=\s+\w+=|$)', spec))
        return f"[REMEMBER_FACT] Stored: {params.get('key', '?')} = {params.get('value', '?')}"

    def _draft_email(self, spec: str) -> str:
        params = dict(re.findall(r'(\w+)=([^=\s]+(?:\s[^=\s]+)*?)(?=\s+\w+=|$)', spec))
        return f"[DRAFT_EMAIL] Draft created for {params.get('to', '?')}: {params.get('subject', '?')}"


TOOL_PREFIXES = (
    "SEARCH_WEB:", "BROWSE_URL:", "SCRAPE_PAGE:", "READ_LIFEOS:",
    "UPDATE_LEAD:", "CREATE_TASK:", "REMEMBER_FACT:", "DRAFT_EMAIL:", "NOTIFY:",
)


class TaskPlanner:
    """Multi-step agentic loop — plan, act, observe, repeat."""

    def __init__(self, router: ModelRouter, memory: ErebusMemory):
        self.router   = router
        self.memory   = memory
        self.executor = ToolExecutor()

    def set_lifeos_data(self, data: dict):
        self.executor.lifeos_data = data

    def _extract_tool_line(self, response: str) -> str | None:
        for line in response.splitlines():
            line = line.strip()
            if any(line.startswith(p) for p in TOOL_PREFIXES):
                return line
        return None

    def _extract_done(self, response: str) -> str | None:
        for line in response.splitlines():
            line = line.strip()
            if line.startswith("DONE:"):
                return line[5:].strip()
        return None

    def _seed_history(self, context: str) -> list:
        history = []
        if context:
            history.append({"role": "user",      "content": f"[Context]\n{context}"})
            history.append({"role": "assistant", "content": "Understood. Ready."})
        return history

    def _done_event(self, answer: str, step: int) -> dict:
        return {
            "type":   "done",
            "answer": answer,
            "steps":  step,
            "model":  self.router.get_active_model(),
        }

    async def run_task(self, task: str, context: str = "") -> AsyncGenerator[dict, None]:
        """
        Agentic loop — yields step dicts for SSE streaming:
          {"type": "step",  "step": n, "thought": "...", "tool": "...", "result": "..."}
          {"type": "done",  "answer": "...", "steps": n, "model": "..."}
          {"type": "error", "message": "..."}
        """
        history  = self._seed_history(context)
        user_msg = f"Task: {task}"
        self.memory.remember("user", user_msg)

        for step in range(1, MAX_STEPS + 1):
            try:
                response = await self.router.route(
                    message=user_msg,
                    mode="reasoning",
                    system=PLANNER_SYSTEM,
                    history=history,
                )
            except Exception as e:
                yield {"type": "error", "message": str(e)}
                return

            self.memory.extract_and_learn(response)

            done_answer = self._extract_done(response)
            if done_answer:
                self.memory.remember("assistant", done_answer)
                yield self._done_event(done_answer, step)
                return

            tool_line = self._extract_tool_line(response)
            if not tool_line:
                # Pure reasoning — treat as final answer
                self.memory.remember("assistant", response)
                yield self._done_event(response, step)
                return

            tool_result = await self.executor.execute(tool_line)
            yield {
                "type":    "step",
                "step":    step,
                "thought": response.replace(tool_line, "").strip()[:300],
                "tool":    tool_line[:120],
                "result":  tool_result[:600],
            }
            history.append({"role": "assistant", "content": response})
            history.append({"role": "user",      "content": f"[Tool result]\n{tool_result}"})
            user_msg = "Continue."

        # Max steps hit
        last = history[-1]["content"] if history else "No result."
        yield self._done_event(f"Reached step limit. Last observation: {last[:400]}", MAX_STEPS)

    async def run_task_sync(self, task: str, context: str = "") -> dict:
        """Non-streaming — collects all steps and returns final result."""
        steps  = []
        answer = None
        model  = self.router.get_active_model()

        async for event in self.run_task(task, context):
            if event["type"] == "step":
                steps.append(event)
            elif event["type"] == "done":
                answer = event["answer"]
                model  = event.get("model", model)
            elif event["type"] == "error":
                return {"error": event["message"], "steps": steps}

        return {"answer": answer, "steps": steps, "model": model}
