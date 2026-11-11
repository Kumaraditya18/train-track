"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    /* Old builds registered SW on localhost; it keeps serving stale shell/assets until removed. */
    if (process.env.NODE_ENV !== "production") {
      if ("serviceWorker" in navigator) {
        void navigator.serviceWorker.getRegistrations().then((regs) => {
          void Promise.all(regs.map((r) => r.unregister()));
        });
      }
      return;
    }
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* offline shell is optional */
    });
  }, []);
  return null;
}
