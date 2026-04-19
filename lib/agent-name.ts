/**
 * Display name for the voice coordinator, configurable per clinic via `AGENT_NAME`.
 * Used in prompts, WhatsApp/SMS copy, and dashboard UI.
 */
export const DEFAULT_AGENT_DISPLAY_NAME = "our care coordinator";

export function getAgentDisplayName(): string {
  const raw = process.env.AGENT_NAME?.trim();
  if (raw) {
    return raw;
  }
  return DEFAULT_AGENT_DISPLAY_NAME;
}

/** First character uppercased (e.g. sentence starts, WhatsApp lines). */
export function getAgentDisplayNameSentenceCase(): string {
  const n = getAgentDisplayName();
  if (!n) {
    return DEFAULT_AGENT_DISPLAY_NAME;
  }
  return n.charAt(0).toUpperCase() + n.slice(1);
}
