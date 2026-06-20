"use client";

import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { httpBatchStreamLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import { useState, useMemo } from "react";
import SuperJSON from "superjson";

import { type AppRouter } from "lifeos1/server/api/root";
import { createQueryClient } from "./query-client";

let clientQueryClientSingleton: QueryClient | undefined = undefined;

const getQueryClient = () => {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return createQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client
  clientQueryClientSingleton ??= createQueryClient();

  return clientQueryClientSingleton;
};

export const api = createTRPCReact<AppRouter>();

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        httpBatchStreamLink({
          transformer: SuperJSON,
          url: getBaseUrl() + "/api/trpc",
          headers: () => {
            const headers = new Headers();
            headers.set("x-trpc-source", "nextjs-react");
            return headers;
          },
        }),
      ],
    }),
  );

  // Memoize the provider value to prevent unnecessary re-renders
  const providerValue = useMemo(() => ({
    client: trpcClient,
    queryClient,
  }), [trpcClient, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={providerValue.client} queryClient={providerValue.queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  );
}

function getBaseUrl() {
  // Browser: use window location
  if (typeof window !== "undefined") return window.location.origin;
  
  // Vercel: use VERCEL_URL environment variable
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Development: use localhost
  const port = process.env.PORT ?? 3000;
  return `http://localhost:${port}`;
}

// Export helper for getting the base URL outside of React components
export function getServerBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  const port = process.env.PORT ?? 3000;
  return `http://localhost:${port}`;
}

// Export helper for client-side base URL
export function getClientBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return getServerBaseUrl();
}

// Export a hook for using the TRPC client with proper typing
export function useTRPC() {
  return api.useContext();
}

// Export a helper for creating a mock TRPC client for testing
export function createMockTRPCClient() {
  return api.createClient({
    links: [
      httpBatchStreamLink({
        transformer: SuperJSON,
        url: "http://localhost:3000/api/trpc",
        headers: () => {
          const headers = new Headers();
          headers.set("x-trpc-source", "mock");
          return headers;
        },
      }),
    ],
  });
}