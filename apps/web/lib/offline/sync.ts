import { createBrowserClient } from "@supabase/ssr";
import { env } from "../env";
import {
  getQueuedItems,
  removeFromQueue,
  markFailed,
  getQueueSize,
} from "./outbox";

const MAX_RETRIES = 3;

export async function flushOutbox(): Promise<{
  synced: number;
  failed: number;
  remaining: number;
}> {
  const items = await getQueuedItems();
  if (items.length === 0) return { synced: 0, failed: 0, remaining: 0 };

  const supabase = createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let synced = 0;
  let failed = 0;

  for (const item of items) {
    if (item.attempts >= MAX_RETRIES) continue;

    try {
      let result;
      if (item.method === "INSERT") {
        result = await supabase.from(item.table).insert(item.payload);
      } else {
        const { client_key, id, ...rest } = item.payload as Record<
          string,
          unknown
        >;
        result = await supabase
          .from(item.table)
          .update(rest)
          .eq("client_key", client_key as string);
      }

      if (result.error) {
        // Unique constraint violation = idempotent success
        if (result.error.code === "23505") {
          await removeFromQueue(item.id);
          synced++;
        } else {
          await markFailed(item.id, result.error.message);
          failed++;
        }
      } else {
        await removeFromQueue(item.id);
        synced++;
      }
    } catch (err) {
      await markFailed(item.id, String(err));
      failed++;
    }
  }

  const remaining = await getQueueSize();

  return { synced, failed, remaining };
}

export function startAutoFlush(intervalMs = 30000): () => void {
  let timeout: ReturnType<typeof setInterval>;

  const check = async () => {
    const size = await getQueueSize();
    if (size > 0) {
      await flushOutbox();
    }
  };

  // Run immediately if online
  if (navigator.onLine) check();

  // Periodic flush
  const interval = setInterval(() => {
    if (navigator.onLine) check();
  }, intervalMs);

  // Flush when coming back online
  const onOnline = () => check();
  window.addEventListener("online", onOnline);

  return () => {
    clearInterval(interval);
    window.removeEventListener("online", onOnline);
  };
}
