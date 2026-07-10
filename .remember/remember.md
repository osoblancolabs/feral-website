# Handoff

## State
All shipped LIVE to stayferal.net (repo `~/Cursor Projects/FERAL Website`, main, latest commits through "copy: sub-hero on 5 exact lines; ui: heart cursor halved to 11px"): July-2026 audit fixes (pixel topology, organic→/book-call route, privacy/terms for Feral Media LLC, animation overhaul, vocab scrub), full-bleed 154s video hero (assets/hero-reel.mp4, 12MB x264) + splash + parallax + liquid-glass cards + true-black bg + heart cursor (11px), hero copy "Unleash Your Untamed Side" + 5-line sub-hero. All verified headless + on prod.

## Next
1. Kiefer to obtain FormSubmit alias hash (activation email at Kiefer@feralagency.net) → one-line swap of the exposed action URL in apply.html:~577.
2. Optional: align meta/OG descriptions with new on-page claims ("40 6-figure earners"; still say $750K+/1.2B); attorney review of privacy.html/terms.html ($100 liability cap is a judgment call).
3. Out-of-scope remnants if ever pulled in: careers.html + creative-team.html (old vocab, seal logo, no styles.css); book.css/ascension still use #a3a3a3.

## Context
Kiefer explicitly chose "Full-service management" in the new sub-hero — overrides the old never-say-management brand rule for this string; don't "fix" it. Cards must stay liquid-glass (he rejected flat #0d0b10 AND #101010 as cheap). Background must stay pure #000 — never reintroduce the pearl-overlay wash. Hero reel must render uncropped (container tracks 2.39:1; no parallax on the video itself). `.reveal-delay-*` delays are scoped `:not(.revealed)` — that's what keeps card hovers instant. Deploys: `npx vercel deploy --prod --yes` (authed osoblancolabs-3823). Full project facts in global memory: project_feral_website.md.
