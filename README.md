# FERAL. — Landing Page

A dark, modern, minimalist landing page for the FERAL. Influencer Management Agency.

## Run locally

Open `index.html` in a browser, or use a simple server:

```bash
# Python 3
python3 -m http.server 8080

# Node (npx)
npx serve .
```

Then visit `http://localhost:8080` (or the port shown).

## Structure

- **index.html** — Structure and content (hero, stats, services, talent, about, testimonials, contact, footer)
- **styles.css** — Dark theme, FERAL branding (black, white, light blue accent), responsive layout
- **script.js** — Scroll reveal animations, stat counters, form handling, header scroll state
- **assets/** — Logo and banner images. For a sharper hero banner on large or high-DPI screens, replace the banner image with an AI-upscaled 2x version (e.g. via Topaz, Real-ESRGAN, or an online upscaler) using the same filename.
- **assets/about-reels-bg.mp4** — Optional. Video background for the About section (e.g. a montage of Instagram Reels). If missing, the section still shows with the dark overlay only. Add a file named `about-reels-bg.mp4` in `assets/` to enable the video.

## Customization

- Update copy in `index.html` for your real stats, testimonials, and links.
- Connect the contact form to your backend or a service (e.g. Formspree, Netlify Forms).
- Add your real navigation links and footer links.
