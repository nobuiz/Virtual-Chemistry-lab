/** Unclipped overlay above the classic beaker's rim. */
export default function ReactionPlume({ effects }) {
  if (!effects?.gas && !effects?.explosion) return null
  return <div className="reaction-plume pointer-events-none absolute inset-0 z-20" aria-hidden="true">
    {effects.gas && Array.from({ length: 18 }, (_, i) => <span key={`gas-${i}`} className="escaping-gas" style={{ left: `${41 + (i % 6) * 3}%`, animationDelay: `${-i * 0.19}s`, animationDuration: `${2.1 + (i % 3) * 0.3}s` }} />)}
    {effects.explosion && <div className="reaction-burst" data-testid="reaction-explosion">
      {Array.from({ length: 18 }, (_, i) => <span key={i} style={{ '--dx': `${Math.cos(i * 2.4) * (60 + i * 3)}px`, '--dy': `${Math.sin(i * 2.4) * 65 - 25}px` }} />)}
    </div>}
  </div>
}
