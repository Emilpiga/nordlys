/**
 * Locks page scrolling while a drawer, sheet or dialog is open.
 *
 * The lock goes on <html>, not <body>: `overflow: hidden` on <body> turns it
 * into the scroll container for its children, which breaks the sticky header
 * — it snaps back to the top of the document, taking the Shoppa menu with it.
 * Locks are counted so overlapping overlays (quick view over the cart drawer)
 * release in any order.
 */

let locks = 0;
let previousOverflow = "";

/** Returns a release function; calling it more than once is a no-op. */
export function lockPageScroll() {
  if (locks === 0) {
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
  }
  locks += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks -= 1;
    if (locks === 0) document.documentElement.style.overflow = previousOverflow;
  };
}
