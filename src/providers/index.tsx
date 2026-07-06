import { Toaster } from "@/components/ui/sonner";

import { AuthProvider } from "./auth-provider";
import { MswProvider } from "./msw-provider";
import { QueryClientProvider } from "./query-client-provider";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <MswProvider>
      <QueryClientProvider>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster richColors closeButton />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </MswProvider>
  );
}

export { useAuth } from "./auth-provider";
