type TranscriptTurn = {
  role?: string;
  message?: string;
  content?: unknown;
};

function normalizeTurns(transcript: unknown): TranscriptTurn[] {
  if (!Array.isArray(transcript)) {
    return [];
  }
  return transcript.filter((t) => t && typeof t === "object") as TranscriptTurn[];
}

/**
 * Read-only rendering of a Vapi transcript (array of turns or JSON fallback).
 */
export function CallTranscript({ transcript }: { transcript: unknown }) {
  const turns = normalizeTurns(transcript);

  if (!turns.length) {
    return (
      <pre className="max-h-[28rem] overflow-auto rounded-lg border border-soft-text/10 bg-muted/30 p-4 text-xs leading-relaxed text-soft-text/90">
        {JSON.stringify(transcript ?? null, null, 2)}
      </pre>
    );
  }

  return (
    <div className="max-h-[28rem] space-y-3 overflow-y-auto rounded-lg border border-soft-text/10 bg-white/80 p-4">
      {turns.map((turn, i) => {
        const role = String(turn.role ?? "unknown");
        const text =
          typeof turn.message === "string"
            ? turn.message
            : typeof turn.content === "string"
              ? turn.content
              : JSON.stringify(turn.content ?? "");
        return (
          <div
            key={i}
            className="rounded-md border border-soft-text/5 bg-warm-off-white/80 px-3 py-2"
          >
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-teal-primary">
              {role}
            </div>
            <p className="whitespace-pre-wrap text-sm text-soft-text">{text}</p>
          </div>
        );
      })}
    </div>
  );
}
