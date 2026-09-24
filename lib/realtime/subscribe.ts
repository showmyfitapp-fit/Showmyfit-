import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export function subscribeTable(params: {
  channel: string;
  table: string;
  filter?: string;
  onChange: () => void;
}): () => void {
  const client = getSupabaseBrowserClient();
  const channel = client
    .channel(params.channel)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: params.table,
        ...(params.filter ? { filter: params.filter } : {}),
      },
      () => params.onChange()
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
