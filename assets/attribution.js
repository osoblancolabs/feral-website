/* ============================================================================
   FERAL attribution capture — 2026-08-27

   Until now the site forwarded NOTHING about where a lead came from. Measured
   on 2026-08-26: 482 leads in Aria, zero carrying a source, a campaign, an ad
   or a click id. lead-capture.js only ever read named form fields; it never
   touched location.search.

   This script runs FIRST on every funnel page, before the pixel loader, and
   does two jobs:

     1. Decides which funnel the visitor is in (paid vs organic).
     2. Captures the ad parameters on FIRST TOUCH and keeps them for the rest
        of the session, so /book -> /apply -> /book-call all report the same
        origin even though only the entry URL carried the tags.

   THE PATH DECIDES THE FUNNEL, not the query string. Organic traffic is served
   from /o/..., and both funnels share the same six HTML files, so book.html's
   CTA reads `apply.html?src=book` for everyone. If `src` outranked the path,
   that one shared link would mark every organic visitor as paid.

   Load it with a plain <script src> in <head>, above the pixel loader.
   ========================================================================= */
(function (w, d) {
  "use strict";

  var KEY = "feral_attr";
  var ORGANIC_PREFIX = "/o/";

  /** Organic when the page is served under /o/. Nothing overrides this. */
  function isOrganicPath() {
    try {
      return String(w.location.pathname || "").indexOf(ORGANIC_PREFIX) === 0;
    } catch (e) {
      return false;
    }
  }

  function readParams() {
    var out = {};
    var qs;
    try {
      qs = new URLSearchParams(w.location.search);
    } catch (e) {
      return out;
    }
    // utm_* land in their own columns in Aria. cid/asid/aid are the short
    // spellings the Meta destination URL uses for the campaign, ad-set and ad
    // ids; the ingest accepts both those and the long names.
    var direct = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"];
    for (var i = 0; i < direct.length; i++) {
      var v = qs.get(direct[i]);
      if (v) out[direct[i]] = v;
    }
    var alias = { cid: "campaign_id", asid: "adset_id", aid: "ad_id" };
    for (var short in alias) {
      if (!Object.prototype.hasOwnProperty.call(alias, short)) continue;
      var long = alias[short];
      var val = qs.get(long) || qs.get(short);
      if (val) out[long] = val;
    }
    return out;
  }

  function load() {
    try {
      var raw = w.sessionStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function save(obj) {
    try {
      w.sessionStorage.setItem(KEY, JSON.stringify(obj));
    } catch (e) {
      /* private mode, quota, or storage disabled — attribution degrades, the
         lead still submits. Never let this throw into the page. */
    }
  }

  var organic = isOrganicPath();
  var params = readParams();

  // Paid only when the page is NOT under /o/ AND something says it came from an
  // ad. `src=book` covers the ads already running that were built before the
  // parameterised link; fbclid covers anything Meta stamped itself.
  var looksPaid = false;
  try {
    var qs2 = new URLSearchParams(w.location.search);
    looksPaid = qs2.get("src") === "book" || !!qs2.get("fbclid") || !!params.ad_id || !!params.campaign_id;
  } catch (e) {
    looksPaid = false;
  }

  var stored = load();

  /* Which funnel is THIS page, judged on its own?
   *   "organic" — served under /o/, which is unambiguous
   *   "book"    — an ad parameter is present on a non-/o/ page
   *   null      — cannot tell (a mid-funnel page carries no parameters, and a
   *               direct visit to /book carries none either)
   */
  var pageVariant = organic ? "organic" : looksPaid ? "book" : null;

  /* FIRST TOUCH WINS WITHIN A FUNNEL RUN, BUT A FUNNEL SWITCH RESETS IT.
   *
   * sessionStorage lives for the whole tab, so without the reset a visitor who
   * browsed the organic funnel and LATER clicked a real ad in the same tab would
   * stay pinned to "organic": the pixel would load (it judges the path) but
   * apply.html would fire the organic custom event instead of
   * CompleteRegistration, and a genuine paid application would never be counted.
   * The mirror image pins "book" onto a later /o/ visit and reports a paid
   * origin to Aria for a lead that came from a bio link.
   *
   * So: keep the stored capture while the page agrees with it or cannot tell,
   * and start fresh the moment a page positively identifies the other funnel.
   */
  var switched = !!stored && !!pageVariant && stored.landing_variant !== pageVariant;

  var attr;
  if (stored && stored.landing_variant && !switched) {
    attr = stored;
  } else {
    attr = params;
    attr.landing_variant = pageVariant || "organic";
    attr.landing_path = w.location.pathname;
    save(attr);
  }

  // The pixel loader and the existing page scripts read this.
  w.FERAL_ATTR = attr;
  w.FERAL_IS_ORGANIC = attr.landing_variant === "organic";

  // Back-compat: book-call.html and not-qualified.html already branch on
  // sessionStorage 'feral_src'. Keep writing it so those pages need no change.
  try {
    w.sessionStorage.setItem("feral_src", attr.landing_variant === "book" ? "book" : "organic");
  } catch (e) {}
})(window, document);
