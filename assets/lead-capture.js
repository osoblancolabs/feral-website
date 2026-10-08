/* FERAL lead capture — streams applicant leads to Aria's ingest endpoint.
 *
 * Fire-and-forget: never blocks or breaks the existing FormSubmit submit or the
 * qualify -> book routing. Partial submits use navigator.sendBeacon; complete
 * submits use fetch(keepalive). Requests are CORS-simple (text/plain, no custom
 * headers, token in the JSON body) so no preflight is needed cross-origin.
 *
 * The only embedded credential is a low-value public gate that matches Aria's
 * Vercel env. NEVER put the GHL / Private-Integration key in this repo.
 */
(function () {
  "use strict";

  var ARIA_INGEST_URL = "https://app.stayferal.net/api/webhooks/feral-lead";
  var FERAL_LEAD_INGEST_TOKEN = "feral_lead_10dd5ca10fcdbc037b9c6bff"; // public gate; matches Aria env

  /* Ad attribution captured by assets/attribution.js on first touch: utm_*,
   * fbclid, campaign_id, adset_id, ad_id, landing_variant.
   *
   * Merged in HERE rather than at each call site, so the partial beacon, the
   * completed submit and the DQ page's backstop repost all carry it without
   * three separate changes. Aria's ingest fills attribution only when the row
   * has none, so whichever of those lands first sets it and the rest are no-ops.
   *
   * Returns a fresh object every time; never mutates window.FERAL_ATTR.
   */
  function attribution() {
    var out = {};
    try {
      var a = window.FERAL_ATTR;
      if (!a) return out;
      var keys = [
        "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
        "fbclid", "campaign_id", "adset_id", "ad_id", "landing_variant"
      ];
      for (var i = 0; i < keys.length; i++) {
        if (a[keys[i]]) out[keys[i]] = a[keys[i]];
      }
    } catch (e) { /* attribution is best-effort; the lead still submits */ }
    return out;
  }

  /* Meta match keys (2026-10-07). The pixel's own first-party cookies and the
   * page the applicant is on. Aria sends them back to Meta with the
   * qualified-call event so Meta can match it to the ad click. Organic /o/
   * pages load no pixel, so these cookies never get set there. */
  function cookie(name) {
    try {
      var m = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
      return m ? m[1] : null;
    } catch (e) { return null; }
  }

  function metaMatch() {
    var out = {};
    var fbp = cookie("_fbp");
    if (fbp) out.fbp = fbp;
    var fbc = cookie("_fbc");
    if (fbc) out.fbc = fbc;
    try { out.page_url = location.origin + location.pathname; } catch (e) { /* best-effort */ }
    return out;
  }

  // Low-level dispatch. useBeacon=true for partials (survives page unload),
  // fetch(keepalive) otherwise. Every failure is swallowed on purpose.
  //
  // Key order matters: an explicit payload field beats the captured attribution,
  // so a caller that computed its own landing_variant still wins.
  function post(payload, useBeacon) {
    try {
      var body = JSON.stringify(
        Object.assign({ token: FERAL_LEAD_INGEST_TOKEN }, attribution(), metaMatch(), payload)
      );
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(ARIA_INGEST_URL, new Blob([body], { type: "text/plain" }));
      } else {
        fetch(ARIA_INGEST_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: body,
          keepalive: true,
          mode: "cors"
        }).catch(function () {});
      }
    } catch (e) { /* fire-and-forget */ }
  }

  // Public: send any lead payload. Callers set source / submit_status / fields.
  // Defaults to fetch(keepalive); pass useBeacon=true to use sendBeacon instead.
  function capture(payload, useBeacon) {
    post(payload || {}, !!useBeacon);
  }

  // Fields we read off the apply form, by input name.
  // `tiktok` / `twitter` / `youtube` / `start_timing` were added 2026-08-24 with
  // the four-social step; `inspiration` was retired in the same change.
  var APPLY_FIELDS = [
    "name", "email", "phone", "instagram", "tiktok", "twitter", "youtube",
    "country", "onlyfans_status", "earnings", "start_timing", "_honey"
  ];

  function readForm(formEl) {
    var out = {};
    if (!formEl) return out;
    for (var i = 0; i < APPLY_FIELDS.length; i++) {
      var name = APPLY_FIELDS[i];
      var el = formEl.elements ? formEl.elements[name] : null;
      if (el && typeof el.value === "string") {
        var v = el.value.trim();
        if (v) out[name] = v;
      }
    }
    return out;
  }

  // Wire an apply-style form. Returns { sendPartial, sendComplete } and also
  // installs a pagehide / visibilitychange safety net for the partial.
  function attachToApplyForm(formEl) {
    var partialSent = false;

    function hasCore(fields) {
      return !!(fields.name && fields.email);
    }

    // Partial: name + email are enough. Beacon so it survives navigation. Once only.
    function sendPartial() {
      if (partialSent) return;
      var fields = readForm(formEl);
      if (!hasCore(fields)) return;
      partialSent = true;
      fields.source = "apply";
      fields.submit_status = "partial";
      post(fields, true);
    }

    // Complete: full form. fetch(keepalive) so it fires even as we redirect away.
    // `extra` carries anything the form computed rather than collected — the
    // qualification verdict (disqualified / dq_reason) and the funnel variant.
    function sendComplete(extra) {
      var fields = readForm(formEl);
      fields.source = "apply";
      fields.submit_status = "complete";
      if (extra && typeof extra === "object") {
        for (var k in extra) {
          if (Object.prototype.hasOwnProperty.call(extra, k)) fields[k] = extra[k];
        }
      }
      post(fields, false);
    }

    // Safety net: if the visitor leaves mid-application with name + email present,
    // capture the partial before the tab goes away.
    function onLeave() {
      if (!partialSent) sendPartial();
    }
    window.addEventListener("pagehide", onLeave);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") onLeave();
    });

    return { sendPartial: sendPartial, sendComplete: sendComplete };
  }

  window.FeralLead = {
    capture: capture,
    attachToApplyForm: attachToApplyForm
  };
})();
