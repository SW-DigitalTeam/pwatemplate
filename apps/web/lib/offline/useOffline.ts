"use client";

import { useState, useEffect, useCallback } from "react";
import { enqueue, getQueueSize } from "@/lib/offline/outbox";
import { startAutoFlush, flushOutbox } from "@/lib/offline/sync";

export function useOfflineStatus() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [queueSize, setQueueSize] = useState(0);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    const stop = startAutoFlush(30000);
    return () => stop();
  }, []);

  const refreshQueue = useCallback(async () => {
    const size = await getQueueSize();
    setQueueSize(size);
  }, []);

  useEffect(() => {
    refreshQueue();
    const interval = setInterval(refreshQueue, 10000);
    return () => clearInterval(interval);
  }, [refreshQueue]);

  const syncNow = useCallback(async () => {
    await flushOutbox();
    await refreshQueue();
  }, [refreshQueue]);

  return { online, queueSize, syncNow };
}

export function useOfflineMutation(
  table: "sessions" | "attendance" | "movement_entries" | "survey_responses",
  method: "INSERT" | "UPDATE"
) {
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());

  const save = useCallback(
    async (payload: Record<string, unknown>): Promise<string> => {
      const key = await enqueue(table, method, payload);
      setPendingKeys((prev) => new Set(prev).add(key));
      return key;
    },
    [table, method]
  );

  return { save, pendingKeys };
}
