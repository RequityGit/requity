"use client";

import { useEffect } from "react";
import { clearChunkErrorFlag } from "@/lib/chunk-error";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Clear chunk error reload flag on successful page load
    clearChunkErrorFlag();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          // Check for SW updates periodically (every 60 minutes)
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
        })
        .catch(() => {
          // Service worker registration failed
        });

      // Reload when a new service worker takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    }
  }, []);

  return null;
}
