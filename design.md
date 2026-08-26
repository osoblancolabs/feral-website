# FERAL site design system — carousel-ad DNA

Locked 2026-08-26. Source of truth: the acquisition carousel ads (`~/feral-ads/carousel-ads.html`).
Every page on stayferal.net follows this system. `styles.css` implements it; page-local styles
must consume its tokens, never invent values.

## Ground rules

- Paper is pure black `#000` (`--ink` / `--bg`). No grey page backgrounds.
- Structure is drawn with hairlines: `--line` rgba(184,169,201,.16). Panels get
  `border: 1px solid var(--line)` + `background: var(--panel-wash)`. No glassmorphism,
  no `backdrop-filter` cards, no white-alpha borders, no big box shadows.
- Corner radius is 2px (`--radius`) everywhere. No pills, no 18px rounded cards.
- Gradients are the brand's richness and are encouraged: `--grad` (120° pearl→pink→champagne)
  on key display phrases via background-clip text (class `.g`), `--bloom` radial washes on
  section corners, pearl-gradient button fills. Use them deliberately, not on body text.
- Type: DM Sans (`--font-heading`) weight 500 for all display, letter-spacing -0.03em.
  Inter (`--font-sans`) for body. Headings are never italic and never bold-700.
- The kicker is the signature: DM Sans 500, ~0.72rem, uppercase, letter-spacing 0.2–0.24em,
  color `--pearl`. Class `.kicker`. Section frames use `.section-head` (kicker left,
  `NN / NN` index right in `--dim` tabular nums, hairline top border).
- Numbers are design objects: tabular-nums, gradient fill for hero stats
  (`--stats-row-gradient`), pearl-deep `01` counters on lists and panels.
- Text contrast floor: body text `--text` #F5F5F5 or `--muted` #C9C5CE. `--dim` #8B8792
  only for fine print and labels. Never ship text under 4.5:1 on black.
- Buttons: uppercase DM Sans 600 ~0.8rem, letter-spacing 0.16em, 2px radius.
  Primary = pearl gradient fill (`--btn-pearl`), ink text. Secondary = transparent,
  `--line-strong` hairline border, champagne text. Focus ring = 2px `--pearl` offset 3px.
  Labels never wrap to two lines.
- Reveal-on-scroll dimming must be gated under `.js` so no-JS renders full contrast.
- Mobile floors: `overflow-x: clip` on html+body, grid tracks `minmax(0,1fr)`,
  full-screen ink overlay for the mobile menu with 1rem+ uppercase links and hairline rows.
- Keep: heart cursor, splash, hero reel, bilingual `t-en`/`t-es` spans, Meta pixel,
  all copy and routes. Never edit `playbook.html` or `assets/feral-30-day-playbook.html`
  (generated from `~/feral-30day-blueprint`).

## Reference implementation

`index.html` + `styles.css`. Section rhythm: `.section-head` frame → `.section-title`
(one gradient phrase max) → `.section-intro` → content in flat hairline panels or
numbered rows (`.avatar-list` pattern: `01` counter left, hairline row separators).
