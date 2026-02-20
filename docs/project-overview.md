# Project Overview: Descanso Inteligente

## Purpose
**Descanso Inteligente** is a niche content website focused on ergonomics and rest (specifically coccyx cushions and orthopedic seats). 
- **Goal**: Generate affiliate income via **Amazon Associates** and display advertising via **Google AdSense**.
- **Strategy**: Creating high-quality, SEO-optimized content to rank for specific keywords (e.g., "cojín coxis teletrabajo", "mejor cojín ortopédico") and driving topic authority through a comprehensive **Blog** section.

## Technical Architecture
The project is built as a **Static Site** (HTML/CSS/JS) hosted on **GitHub Pages**.

### Why this stack?
- **Performance**: Static HTML loads instantly, which is a key ranking factor for Google (Core Web Vitals).
- **Simplicity**: No build steps, backend servers, or complex dependencies to maintain.
- **Cost**: Free hosting on GitHub Pages.

### Key Components
- **HTML**: Semantic structure optimized for SEO. Uses advanced Schema.org markup (`Product`, `BreadcrumbList`, `BlogPosting`) for rich snippets.
- **CSS**: Custom design system (variables, responsive grid layouts) without heavy frameworks to keep the bundle size small.
- **JS**: Minimal vanilla JavaScript for interactions (mobile menu).
- **Analytics & Ads**: Global integration of Google Analytics 4 (GA4) and Google AdSense auto-ads readiness.

## Monetization & Legal
- **Amazon Associates**: The site includes the required Affiliate Disclaimer on all pages and uses highly-optimized contextual product cards.
- **Google AdSense**: `ads.txt` is served from the root, and the site is configured for auto-ads.
- **Compliance**: Complies with GDPR/RGPD with specific pages for Privacy Policy, Cookies Policy (including third-party ad network clauses), and Legal Notice.

## Development Guidelines
- **Mobile First**: Google indexes the mobile version of the site first. Ensure all features work perfectly on mobile.
- **Speed**: Avoid adding heavy libraries or large unoptimized images.
- **Accessibility**: Use semantic HTML and ARIA labels where necessary (e.g., mobile menu).

## Git Workflow
We follow a standard **Git Flow** strategy:
- `main`: Production-ready code.
- `develop`: Integration branch for ongoing development.
- `feature/*`: Development branches for new features (e.g., `feature/header-refactor`).

**Rules**:
1. Never commit directly to `main`.
2. Create feature branches from `develop`.
3. Merge features into `develop` via Pull Request (or merge locally if solo).
4. Release to `main` by merging `develop`.
