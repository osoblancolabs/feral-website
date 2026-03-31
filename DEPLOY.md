# Publishing to stayferal.com/home

Your site is a static site (HTML, CSS, JS, images). You can’t “publish” from this editor directly; you need to upload it to a host and point your domain at that host. Below are simple ways to do that so the site is available at **stayferal.com/home** (or at the root **stayferal.com** if you prefer).

---

## Option 1: Netlify (good for stayferal.com/home)

1. **Create a Netlify account**  
   Go to [netlify.com](https://www.netlify.com) and sign up (free).

2. **Add the site**
   - “Add new site” → “Deploy manually” or “Import from Git” if the project is in a repo.
   - If deploying manually: drag and drop the **entire project folder** (the one that contains `index.html`, `styles.css`, `script.js`, and the `assets` folder) into the Netlify deploy area.
   - Wait until the deploy finishes and you get a URL like `random-name.netlify.app`.

3. **Use a subpath (e.g. stayferal.com/home)**
   - If you want the site to live at **stayferal.com/home**:
     - In `index.html`, **uncomment** the line in `<head>` that says:
       ```html
       <base href="https://stayferal.com/home/" />
       ```
     - Redeploy the same folder to Netlify.
   - In Netlify: **Site settings → Domain management → Add custom domain** → add **stayferal.com**.
   - In Netlify: **Domain settings → Add subdomain** (or “Subpath”) is not a built-in option; Netlify usually serves the site from the **root** of the domain. So:
     - To have the site at **stayferal.com** (root): point the domain to Netlify and leave the base tag commented out. The site will be at **https://stayferal.com**.
     - To have it at **https://stayferal.com/home**: you can either:
       - Use Netlify **Redirects** to serve the same files under `/home`, or
       - Host the site in a **subfolder** on a server that supports it (see Option 3).

4. **DNS (for your domain)**
   - Where you bought **stayferal.com** (e.g. Namecheap, Cloudflare, GoDaddy), open DNS settings.
   - Add the records Netlify shows you (usually an A record and/or CNAME for `www`). Netlify will show the exact values after you add the custom domain.

---

## Option 2: Vercel

1. **Create a Vercel account**  
   Go to [vercel.com](https://vercel.com) and sign up.

2. **Deploy**
   - “Add New” → “Project” → import your Git repo or upload the project folder.
   - Leave build settings as default (no build command for a static site).
   - Deploy. You’ll get a URL like `your-project.vercel.app`.

3. **Custom domain**
   - Project → **Settings → Domains** → add **stayferal.com** (and optionally **www.stayferal.com**).
   - In your domain registrar’s DNS, add the A/CNAME records Vercel tells you.

4. **Subpath /home**
   - By default the site is at the root. To serve it at **stayferal.com/home** you’d typically put the built output in a `home` directory or use rewrites; that’s easier with a small build script or by deploying from a repo where the output is already in `home`. Uncommenting the **base** tag in `index.html` (as in Option 1) is required so links and assets work under `/home`.

---

## Option 3: Traditional host (cPanel, FTP, etc.)

If your domain **stayferal.com** is already on a host that gives you FTP or “File Manager”:

1. **Upload the files**
   - Connect via FTP or open File Manager in cPanel.
   - To have the site at **stayferal.com/home**:
     - Create a folder named **home** in the web root (often `public_html`).
     - Upload **all** project files into that **home** folder so that:
       - `public_html/home/index.html`
       - `public_html/home/styles.css`
       - `public_html/home/script.js`
       - `public_html/home/assets/` (with all images)
   - Uncomment the **base** tag in `index.html`:
     ```html
     <base href="https://stayferal.com/home/" />
     ```

2. **Result**
   - The site will be at **https://stayferal.com/home** (and **https://stayferal.com/home/index.html**).

If you want the site at the **root** (**https://stayferal.com**):
- Upload the contents of the project **directly** into `public_html` (not in a `home` folder).
- **Leave the base tag commented out.**

---

## Base tag for /home

In `index.html` there is a commented line in the `<head>`:

```html
<!-- When the site is served at stayferal.com/home, uncomment the next line so assets and links work:
  <base href="https://stayferal.com/home/" />
-->
```

- **Serving at stayferal.com/home** → uncomment that line and deploy.
- **Serving at stayferal.com (root)** → leave it commented.

---

## Checklist

- [ ] Hosting chosen (Netlify, Vercel, or your current host).
- [ ] All files uploaded (including the **assets** folder and any video file you use).
- [ ] Domain **stayferal.com** pointed to that host via DNS (A/CNAME as instructed by the host).
- [ ] If using **/home**: base tag in `index.html` uncommented and files in a **home** folder (or equivalent).
- [ ] After DNS propagates (up to 24–48 hours), open **https://stayferal.com** or **https://stayferal.com/home** and test.

If you tell me which option you’re using (Netlify, Vercel, or “my host’s File Manager”), I can give you step-by-step tailored to that and the exact path (root vs /home).
