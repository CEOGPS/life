import { ConvexProvider as ConvexProviderBase } from "convex/react";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

export function ConvexProvider({ children }) {
  return (
    <ConvexProviderBase client={convex}>
      {children}
    </ConvexProviderBase>
  );
}