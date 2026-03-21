import { createAdminClient } from "@/lib/supabase/admin";

/** Matches client subscriptions in useDealMessages and SecureUploadClient. */
export const DEAL_MESSAGES_BROADCAST_EVENT = "new_message" as const;

export function dealMessagesChannelName(dealId: string) {
  return `deal-messages:${dealId}`;
}

/**
 * Token-based upload pages have no Supabase auth, so postgres_changes does not
 * deliver. Broadcast notifies anon subscribers on the same channel name.
 */
export async function broadcastDealMessageInserted(dealId: string): Promise<void> {
  const supabase = createAdminClient();
  const name = dealMessagesChannelName(dealId);
  const channel = supabase.channel(name, {
    config: { broadcast: { self: true } },
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      supabase.removeChannel(channel);
      reject(new Error("deal message broadcast timed out"));
    }, 10_000);

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel
          .send({
            type: "broadcast",
            event: DEAL_MESSAGES_BROADCAST_EVENT,
            payload: { dealId },
          })
          .then(() => {
            clearTimeout(timeout);
            supabase.removeChannel(channel);
            resolve();
          })
          .catch((e) => {
            clearTimeout(timeout);
            supabase.removeChannel(channel);
            reject(e);
          });
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        clearTimeout(timeout);
        supabase.removeChannel(channel);
        reject(new Error(`deal message broadcast channel ${status}`));
      }
    });
  });
}
