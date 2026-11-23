# Siobhan Herne Portfolio

A single holding page for [siobhanherne.com](https://siobhanherne.com), built
with Astro and deployed to GitHub Pages.

## Routes

- `/` — holding page with the name and a LinkedIn link
- `/404.html` — the same holding page, served for every other path

## Local setup

Requirements: Node.js 24 and npm.

```bash
npm ci
npm run dev
```

The dev server runs at `http://localhost:4321/`.

## Commands

```bash
npm run build
npm run validate
```

`npm run validate` builds the site and runs the Playwright suite against the
production preview. Stop `npm run dev` first: locally, Playwright reuses any
server already on port 4321.

The suite fails if the build publishes anything beyond the holding page,
`robots.txt`, the favicon, and the page stylesheet.

## Configuration

| Variable | Purpose | Default |
|---|---|---|
| `SITE_URL` | Deployment origin | `https://siobhanherne.com` |
| `SITE_BASE` | Deployment path | `/` |

## Search visibility

The page includes a `noindex` directive, and `robots.txt` allows crawlers to
read it. No sitemap is generated.

## Deployment

Pull requests run the validation workflow. Pushes to `main` run the same
validation, then build and deploy to GitHub Pages through GitHub Actions.
