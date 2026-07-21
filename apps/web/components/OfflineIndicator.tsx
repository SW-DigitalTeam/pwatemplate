"use client";
import { useEffect, useState } from "react";

/** Visible offline status; facilitators must always know if data is syncing. */
export function OfflineIndicator() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  if (online) return null;
  return (
    <div role="status" aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-50 bg-accent px-4 py-3 text-center text-sm font-medium text-primary-contrast">
      You&rsquo;re offline. Anything you record is saved on this device and will sync when you reconnect.
    </div>
  );
}
