/** Polls instead of opening a direct Supabase realtime socket. */
export function subscribeTable(params: {
  channel: string;
  table: string;
  filter?: string;
  onChange: () => void;
}): () => void {
  const timer = window.setInterval(() => {
    params.onChange();
  }, 12000);
  return () => window.clearInterval(timer);
}
