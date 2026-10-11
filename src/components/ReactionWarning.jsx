export default function ReactionWarning({ result }) {
  if (!result?.hazard) return null
  return <div role="note" data-testid="reaction-warning" className="my-2 rounded-lg border-2 border-rose-400/60 bg-rose-950/80 p-3 text-rose-100">
    <p className="text-xs font-bold">⚠ DO NOT TRY THIS — VIRTUAL EXPERIMENT ONLY</p>
    <p className="mt-1 text-[11px] leading-relaxed">{result.hazard}</p>
  </div>
}
