/**
 * Page-level aurora field. Fixed behind all content so section boundaries
 * never produce a visible seam.
 */
export function AuroraBackdrop() {
  return (
    <div className="aurora" aria-hidden>
      <div className="aurora__veil aurora__veil--one" />
      <div className="aurora__veil aurora__veil--two" />
      <div className="aurora__veil aurora__veil--three" />
      <div className="aurora__veil aurora__veil--frost" />
      <div className="aurora__beams" />
      <div className="aurora__pattern" />
      <div className="aurora__grain" />
    </div>
  );
}
