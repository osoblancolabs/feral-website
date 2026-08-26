# Handoff

## State
All shipped LIVE to stayferal.net (`~/Cursor Projects/FERAL Website`, main, latest commit f953bbd). This session: (1) apply.html model form — added OnlyFans-account gate (already/want_start/dont_start) + conditional "Current OnlyFans Monthly Earnings" step; REMOVED "management/representation" Q (+ its conditional child) and the final "impact at FERAL" Q → 6 steps, Inspiration is now final w/ Submit+consent. (2) careers.html — conditional portfolio step for creative-director/editor/of-creative-director roles. (3) CD-ads Meta Pixel 1624529662588157: PageView on /creative-team (landing), SubmitApplication on NEW /creative-team-received (form redirects there on submit). Prod-verified via curl; 3+ commits pushed.

## Next
1. Nothing pending on these features (dead `#ct-success` block already stripped in f953bbd).
2. Still-open older items: Kiefer's FormSubmit alias hash → swap the exposed action URL in apply.html; attorney review of privacy.html/terms.html.

## Context
- Wizard conditional steps use `data-conditional` + `stepIsHidden()`; hidden steps' inputs are DISABLED via `syncConditionalInputs()` so required fields stay out of native HTML5 validation (forms have NO novalidate) AND out of FormData. Reuse this pattern.
- Model-form qualification: dont_start→not-qualified.html (ads+organic); want_start→skips earnings, qualifies on US/Canada+valid IG; already→needs OF earnings ≥$1k. `onlyfans_status` streams to Aria (lead-capture APPLY_FIELDS).
- TWO pixels: site `1686…` (most pages) vs CD-ads `1624…` (ONLY /creative-team + /creative-team-received). /creative-team = paid standalone CD landing (unlinked, /creative-team rewrite); careers.html = organic path (linked from index).
- jsdom test harness (58 tests, both forms) lives at session scratchpad `test-forms.mjs` (needs `npm i jsdom`; NOT in repo). Deploy: `npx vercel deploy --prod --yes` (authed osoblancolabs-3823). Commits: conventional style, NO Co-Authored-By. Full facts: global memory project_feral_website.md.
