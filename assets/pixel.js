/* ============================================================================
   FERAL Meta Pixel loader — 2026-08-27

   One copy of the pixel snippet, shared by every funnel page, with one rule:

     THE ORGANIC FUNNEL NEVER LOADS THE PIXEL AT ALL.

   Organic traffic is served from /o/..., and on those paths this script returns
   before it fetches fbevents.js. No PageView, no network call to Facebook, no
   fbq on the page.

   Why the pixel had to move out of the pages: an organic conversion never bills
   a campaign, but every conversion event still TRAINS Meta's delivery model and
   seeds any audience built from that event. Organic converters firing the same
   event name teach the algorithm to chase the wrong people. The page-level
   branching already handled the conversion events; the base PageView sat in
   <head> and fired for everyone, before any branching could run.

   Every caller must guard on `window.fbq` before firing an event, because on
   the organic funnel it does not exist. This script deliberately does NOT
   install a no-op stub: a silent stub would make a missing guard look like it
   worked.

   Load it in <head>, AFTER assets/attribution.js.
   ========================================================================= */
(function (w, d) {
  "use strict";

  var PIXEL_ID = "1686435738851819";

  // Feral Acquisition Pixel, added 2026-09-15. Initialised beside the original on
  // the four booking-funnel pages only: /book (VSL), /apply (form), /book-call
  // (booking), /booked (thank-you). Every fbq("track") on those pages then reaches
  // both pixels. /not-qualified loads this file and keeps the original alone, and
  // /o/... still returns above before anything loads.
  var BOOKING_PIXEL_ID = "2313904392737421";
  var BOOKING_PATHS = ["/book", "/apply", "/book-call", "/booked"];
  function onBookingPage() {
    try {
      var path = String(w.location.pathname || "")
        .replace(/\.html$/, "")
        .replace(/\/$/, "");
      for (var i = 0; i < BOOKING_PATHS.length; i++) {
        if (path === BOOKING_PATHS[i]) return true;
      }
    } catch (e) {}
    return false;
  }

  // Organic: nothing loads. Checked from the path directly rather than from
  // attribution.js's flag, so a page that forgot to load that script still
  // fails closed on /o/ instead of quietly pixeling organic traffic.
  var organic = false;
  try {
    organic = String(w.location.pathname || "").indexOf("/o/") === 0;
  } catch (e) {
    organic = false;
  }
  if (organic) return;

  /* Meta Pixel Code — verbatim from the snippet that used to sit inline. */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(w, d, "script", "https://connect.facebook.net/en_US/fbevents.js");

  w.fbq("init", PIXEL_ID);
  if (onBookingPage()) w.fbq("init", BOOKING_PIXEL_ID);
  w.fbq("track", "PageView");

  // The <noscript> tracking pixel has to be in the markup to work at all, so it
  // cannot live here. It is gated the same way in each page's own <noscript>.
})(window, document);
