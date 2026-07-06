"use client";

import { useEffect, useState } from "react";

export function MswProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(
    process.env.NODE_ENV !== "development" ||
      process.env.NEXT_PUBLIC_API_MSW !== "true",
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    if (process.env.NEXT_PUBLIC_API_MSW !== "true") {
      return;
    }

    void import("@/lib/mocks/browser").then(({ startMockServiceWorker }) =>
      startMockServiceWorker().then(() => setReady(true)),
    );
  }, []);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
