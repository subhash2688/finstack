# FinStack Navigator

AI-powered finance tech stack discovery platform for management consultants.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Features

- **Discovery-First Experience**: Browse AI tools for finance functions immediately
- **Accounts Payable Workflow**: 8 workflow steps with 12 quality tools
- **Smart Filtering**: Filter by company size, industry, AI maturity, and search
- **Professional UI**: Client-ready interface with detailed tool information
- **Mobile Responsive**: Works seamlessly on all devices

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS + shadcn/ui
- **Data**: JSON-based (static generation)
- **Deployment**: Vercel-ready

## Project Structure

```
finstack-navigator/
├── app/                    # Next.js app router pages
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Header, Footer
│   ├── workflow/          # Workflow visualization
│   └── tools/             # Tool discovery components
├── lib/                   # Data access and utilities
├── types/                 # TypeScript type definitions
└── data/                  # JSON seed data
```

## Roadmap

### Phase 2 (Post-MVP)
- Add FP&A function
- Add Close Management function
- Expand tool count to 20+ per category

### Phase 3
- AI Advisor with Claude integration
- Context-aware recommendations
- Chat interface

### Phase 4
- PDF export functionality
- Tool comparison view
- Advanced analytics

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.
