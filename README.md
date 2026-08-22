# Justice for Garima — campaign site

A static, bilingual (नेपाली / English) case brief and petition page for the Garima Chaudhary
case (Jitpur Simara–1, Bara, August 2026). No build step, no framework, no external requests —
fonts are self-hosted, all CSS and JS are plain files.

```
index.html      both language panes + the shared petition / letter / sources sections
styles.css      design tokens, light + dark, Devanagari typography rules
app.js          language switch, petition form, copy buttons
fonts/          self-hosted woff2 (Newsreader, Public Sans, IBM Plex Mono, Mukta, Noto Serif Devanagari)
og.png          social preview image (1200×630)
favicon.svg
robots.txt
vercel.json     clean URLs, cache and security headers
api/sign.js         POST — add a signature
api/signatures.js   GET  — list signatures
api/_kv.js          tiny zero-dependency Redis REST client
```

## Deploy

### 1. Push and import

```bash
git init && git add -A && git commit -m "Justice for Garima"
gh repo create justice-for-garima --public --source=. --push   # or push to GitHub manually
```

Then at vercel.com → **Add New → Project → Import** the repo.
Framework preset: **Other**. Build command: leave empty. Output directory: leave empty.
It deploys as-is.

Or straight from this folder:

```bash
npx vercel --prod
```

### 2. Turn on signatures (optional, ~3 minutes)

Without a database the site works fine — the petition form tells visitors that signatures
are not being collected and points them at the letter instead. To collect them for real:

1. Vercel dashboard → your project → **Storage** → **Create Database** → pick a Redis
   (Upstash) store and connect it to the project.
2. That automatically adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` to the project's
   environment variables. `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` work too.
3. Redeploy. The counter and the signature list come alive with no code change.

Built-in protections: 5 signatures per IP per hour, one signature per name + district,
a hidden honeypot field, control characters and angle brackets stripped server-side,
and the list capped at the most recent 2,000 entries.

### 3. Before going live

- Replace `justiceforgarima.vercel.app` in the three `og:`/`canonical` tags in `index.html`
  with your real domain, or the social preview will point at the wrong host.
- Check the "Last updated" chip in both language panes and the footer date.

## Editing

The two language versions are two `<main class="lang-pane">` blocks in `index.html`
(`lang="en"` and `lang="ne"`). Long prose lives inside those. Short shared strings — nav
links, form labels, helplines, the footer — use `data-en` / `data-ne` attributes and are
swapped by `app.js`; placeholders use `data-ph-en` / `data-ph-ne`.

Language is chosen in this order: a saved choice in `localStorage`, then `Asia/Kathmandu`
timezone or a Nepali browser language, then English.

## Editorial rules this page follows

- Neither suspect is named. One is a child in conflict with the law, whose identification is
  prohibited under the Act Relating to Children 2075; the adult suspect's name has been
  reported at least three different ways in national media.
- No claim of guilt. Both people in custody are described as suspects throughout.
- No demand for capital punishment. Article 16(2) of the Constitution forbids it and
  Article 22 forecloses corporal alternatives; the five demands are all things a court or a
  ministry can actually deliver.
- Every factual claim traces to a source in the Sources section.

## Licence

Content is compiled from public reporting for civic advocacy. Reuse it freely; keep the
sourcing and the editorial rules above intact if you fork it.
