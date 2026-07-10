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
  var FERAL_LEAD_INGEST_TOKEN = "REPLACE_WITH_SHARED_TOKEN"; // public gate; matches Aria env

  // Low-level dispatch. useBeacon=true for partials (survives page unload),
  // fetch(keepalive) otherwise. Every failure is swallowed on purpose.
  function post(payload, useBeacon) {
    try {
      var body = JSON.stringify(Object.assign({ token: FERAL_LEAD_INGEST_TOKEN }, payload));
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
  var APPLY_FIELDS = [
    "name", "email", "phone", "instagram", "country",
    "earnings", "has_management", "current_management",
    "why_switch", "inspiration", "impact", "_honey"
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
    function sendComplete() {
      var fields = readForm(formEl);
      fields.source = "apply";
      fields.submit_status = "complete";
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
