"use client";

import { track } from "@vercel/analytics";

type EventName =
  | "form_open"
  | "form_submit"
  | "form_success"
  | "form_error"
  | "cta_click"
  | "pricing_cta";

type EventData = Record<string, string | number | boolean>;

export function trackEvent(event: EventName, data?: EventData) {
  // Vercel Analytics
  try {
    track(event, data);
  } catch {
    // Vercel Analytics not available
  }

  // Umami
  try {
    if (typeof window !== "undefined" && window.umami) {
      window.umami.track(event, data);
    }
  } catch {
    // Umami not available
  }
}

// Extend Window for Umami
declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: EventData) => void;
    };
  }
}
