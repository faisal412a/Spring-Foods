"use client";

import { useEffect, useRef } from "react";

const INACTIVITY_MS = 15 * 60 * 1000;
const REFRESH_THROTTLE_MS = 60 * 1000;

export function SessionActivityGuard() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRefreshRef = useRef(0);

  useEffect(() => {
    function scheduleLogout() {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        window.location.href = "/login?error=Session%20expired";
      }, INACTIVITY_MS);
    }

    async function handleActivity() {
      scheduleLogout();

      const now = Date.now();
      if (now - lastRefreshRef.current < REFRESH_THROTTLE_MS) {
        return;
      }

      lastRefreshRef.current = now;

      try {
        const response = await fetch("/api/session/refresh", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store"
        });

        if (response.status === 401) {
          window.location.href = "/login?error=Session%20expired";
        }
      } catch {
        // Ignore transient network issues; next activity or navigation will retry.
      }
    }

    const events: Array<keyof WindowEventMap> = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    scheduleLogout();
    void handleActivity();

    for (const eventName of events) {
      window.addEventListener(eventName, handleActivity, { passive: true });
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      for (const eventName of events) {
        window.removeEventListener(eventName, handleActivity);
      }
    };
  }, []);

  return null;
}
