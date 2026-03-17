# AutoSEO Engine

> Keyword collection → AI content generation → Auto deployment → Backlink building → Analytics — fully automated.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  GitHub Actions                  │
│            (Daily Cron Scheduler)                │
└──────────────────────┬──────────────────────────┘
                       │ triggers
                       ▼
┌─────────────────────────────────────────────────┐
│           Cloudflare Workers (Backend)           │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Keyword   │  │ Content  │  │  Backlink    │  │
│  │ Collector │→ │ Generator│→ │  Engine      │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
│       ↑              │              │            │
│       │         Workers AI     KV Storage        │
│       │        (Llama 3.1)                       │
└───────┼──────────────┼──────────────────────────┘
        │              │
        │              ▼
┌───────┴─────────────────────────────────────────┐
│           GitHub Pages (Frontend)                │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ SEO Blog │  │Dashboard │  │  Analytics   │  │
│  │ (Jekyll) │  │   (SPA)  │  │   Tracking   │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
└─────────────────────────────────────────────────┘
```

## Features

### Core Pipeline
- **Keyword Collection** — Google Autocomplete + Reddit + AI-powered long-tail generation
- **AI Content Generation** — SEO-optimized articles using Workers AI (Llama 3.1)
- **Internal Link Building** — Auto cross-references related posts
- **Auto Deployment** — GitHub Actions → GitHub Pages
- **Backlink Network** — Multi-tier strategy with content variations
- **Analytics & Optimization** — Track, analyze, auto-rewrite low performers

### Content Strategy
- **Tier 1 (Main)** — Long-form articles on GitHub Pages
- **Tier 2 (High Quality)** — Variations on Medium, Blogger, WordPress
- **Tier 3 (Volume)** — Summaries on Dev.to, Hashnode, Velog
- **Tier 4 (Documents)** — Link hubs on Notion, GitBook

### Safety
- Unique content per platform (no duplicate content)
- Rate-limited daily posting (max 3-5 per day)
- Account distribution support
- Natural keyword placement (1-2% density)

## Quick Start

### 1. Clone & Setup

```bash
git clone https://github.com/YOUR_USERNAME/AUTO-SEO.git
cd AUTO-SEO
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 2. Configure Backend

```bash
cd backend

# Login to Cloudflare
wrangler login

# Set your API key (choose a strong random string)
wrangler secret put API_KEY

# Deploy
npm run deploy
```

Your worker will be live at `https://autoseo-engine.YOUR_ACCOUNT.workers.dev`

### 3. Create Your First Site

```bash
curl -X POST https://autoseo-engine.rukkit.workers.dev/api/sites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "name": "My AI Blog",
    "domain": "YOUR_USERNAME.github.io",
    "niche": "AI & Technology",
    "repoUrl": "https://github.com/YOUR_USERNAME/AUTO-SEO",
    "tier": "main"
  }'
```

Save the returned `id` — this is your `SITE_ID`.

### 4. Configure GitHub Actions

Add these secrets to your GitHub repo (Settings → Secrets → Actions):

| Secret | Value |
|--------|-------|
| `WORKER_URL` | `https://autoseo-engine.YOUR_ACCOUNT.workers.dev` |
| `API_KEY` | Your API key |
| `SITE_ID` | Site ID from step 3 |

### 5. Run Pipeline

**Manual trigger:**
Go to Actions → "AutoSEO Daily Pipeline" → Run workflow

**API trigger:**
```bash
curl -X POST https://autoseo-engine.YOUR_ACCOUNT.workers.dev/api/pipeline/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "siteId": "YOUR_SITE_ID",
    "seeds": ["best ai tools 2026", "make money online"],
    "maxPosts": 3
  }'
```

**Dashboard:**
Open `https://YOUR_USERNAME.github.io/dashboard.html`

## API Reference

### Health
```
GET /api/health
```

### Keywords
```
POST /api/keywords/collect     { seeds: string[], subreddits?: string[] }
GET  /api/keywords              ?unused=true&limit=50
POST /api/keywords/longtail     { keyword: string }
```

### Content
```
POST /api/content/generate      { keyword, siteId, tier? }
GET  /api/content               ?siteId=...
GET  /api/content/:id
POST /api/content/vary          { contentId, variations: [{type, platform}] }
POST /api/content/rewrite       { contentId }
POST /api/content/publish       { contentId }
POST /api/content/refresh-links { siteId }
```

### Backlinks
```
POST /api/backlinks/generate         { contentId, mainSiteUrl }
GET  /api/backlinks                  ?contentId=...
GET  /api/backlinks/stats
POST /api/backlinks/snippets/reddit  { contentId }
POST /api/backlinks/snippets/quora   { contentId }
PUT  /api/backlinks/:id              { status, sourceUrl? }
```

### Analytics
```
GET  /api/analytics/summary          ?siteId=...
GET  /api/analytics/views/:slug      ?days=30
POST /api/analytics/track            { slug }
GET  /api/analytics/top-performers   ?siteId=...&limit=10
GET  /api/analytics/low-performers   ?siteId=...
GET  /api/analytics/pipeline
```

### Sites
```
POST   /api/sites                    { name, domain, niche, repoUrl, tier? }
GET    /api/sites
GET    /api/sites/:id
PUT    /api/sites/:id                { name?, domain?, niche?, active?, tier? }
DELETE /api/sites/:id
```

### Pipeline
```
POST /api/pipeline/run               { siteId, seeds?, maxPosts?, generateBacklinks?, createVariations? }
POST /api/pipeline/rewrite-low       { siteId, limit? }
```

## Project Structure

```
AUTO-SEO/
├── backend/                      # Cloudflare Workers
│   ├── src/
│   │   ├── index.ts              # Main router + auth
│   │   ├── types.ts              # TypeScript types
│   │   ├── routes/               # API route handlers
│   │   │   ├── keywords.ts
│   │   │   ├── content.ts
│   │   │   ├── backlinks.ts
│   │   │   ├── analytics.ts
│   │   │   ├── sites.ts
│   │   │   └── pipeline.ts
│   │   ├── services/             # Business logic
│   │   │   ├── keyword-collector.ts
│   │   │   ├── content-generator.ts
│   │   │   ├── content-variator.ts
│   │   │   ├── internal-linker.ts
│   │   │   ├── backlink-engine.ts
│   │   │   └── analytics-engine.ts
│   │   └── utils/
│   │       ├── helpers.ts
│   │       └── seo.ts
│   ├── wrangler.toml
│   ├── package.json
│   └── tsconfig.json
├── frontend/                     # GitHub Pages (Jekyll)
│   ├── _config.yml
│   ├── _layouts/
│   │   ├── default.html
│   │   └── post.html
│   ├── _posts/                   # Auto-generated posts
│   ├── css/style.css
│   ├── js/
│   │   ├── api.js                # API client
│   │   └── dashboard.js          # Dashboard UI
│   ├── index.html                # Landing page
│   ├── blog/index.html           # Blog listing
│   └── dashboard.html            # Control panel
├── .github/workflows/
│   ├── auto-seo.yml              # Daily automation
│   └── deploy.yml                # Frontend deploy
├── scripts/
│   ├── pipeline.mjs              # Node.js pipeline script
│   └── setup.sh                  # Initial setup
└── README.md
```

## Daily Pipeline Flow

```
1. ⏰ GitHub Actions triggers (08:00 UTC daily)
2. 🔍 Collect keywords from Google/Reddit
3. 🔄 Filter already-used keywords
4. ✍️  Generate SEO articles with Workers AI
5. 🔗 Auto-inject internal links
6. 📁 Save as markdown to _posts/
7. 📤 Git commit & push
8. 🚀 Jekyll builds & deploys to GitHub Pages
9. 🌐 Generate backlink snippets (Reddit/Quora)
10. 📊 Log pipeline results for analytics
11. 🔁 Repeat next day
```

## Multi-Site Support

Run multiple sites across different niches simultaneously:

```bash
# Create additional sites
curl -X POST .../api/sites -d '{"name":"Gaming Blog","niche":"gaming",...,"tier":"tier2"}'
curl -X POST .../api/sites -d '{"name":"Finance Hub","niche":"finance",...,"tier":"tier1"}'

# Run pipeline for specific site
curl -X POST .../api/pipeline/run -d '{"siteId":"GAMING_SITE_ID","seeds":["best games 2026"]}'
```

## License

MIT
