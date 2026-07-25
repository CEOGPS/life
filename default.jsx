import { AuthProvider } from "./auth.jsx";
import { ConvexProvider } from "./convex.jsx";
import { QueryClientProvider } from "./query-client.jsx";
import { ThemeProvider } from "./theme.jsx";
import { Toaster } from "../ui/sonner.jsx";
import { TooltipProvider } from "../ui/tooltip.jsx";

export function DefaultProviders({ children }) {
  return (
    <AuthProvider>
      <ConvexProvider>
        <QueryClientProvider>
          <TooltipProvider>
            <ThemeProvider>
              <Toaster />
              {children}
            </ThemeProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </ConvexProvider>
    </AuthProvider>
  );
}
