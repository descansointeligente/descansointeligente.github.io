/**
 * migrate-blog-cards.js
 * 
 * Replaces old `product-card` blocks in blog posts with new `product-rank-card` blocks.
 * Handles: badge, image, title, price text, and CTA link.
 * Blog posts are 2 levels deep so use ../../assets/img/amazon-logo.svg
 */
const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'blog');

// Get all blog post index.html files (not the main blog/index.html)
const blogPosts = fs.readdirSync(BLOG_DIR)
    .filter(d => fs.statSync(path.join(BLOG_DIR, d)).isDirectory())
    .map(d => path.join(BLOG_DIR, d, 'index.html'))
    .filter(f => fs.existsSync(f));

console.log(`Found ${blogPosts.length} blog posts to process.`);

// Badge counter per file to assign top-1, top-2, etc.
const rankClasses = ['top-1', 'top-2', 'top-3', 'top-4', 'top-5'];

// Regex to match old product-card blocks (handles multiline)
// Matches: <div class="product-card" ...> ... </div> (up to the closing div)
function extractProductCards(html) {
    const results = [];
    // Find all product-card divs
    const startRegex = /<div class="product-card"[^>]*>/g;
    let match;
    while ((match = startRegex.exec(html)) !== null) {
        const start = match.index;
        // Find the matching closing </div> accounting for nesting
        let depth = 0;
        let i = start;
        while (i < html.length) {
            if (html.startsWith('<div', i)) depth++;
            else if (html.startsWith('</div>', i)) {
                depth--;
                if (depth === 0) {
                    const end = i + 6; // </div>
                    results.push({ start, end, html: html.slice(start, end) });
                    break;
                }
            }
            i++;
        }
    }
    return results;
}

function extractField(cardHtml, selector, attr = null) {
    if (attr) {
        const re = new RegExp(`<${selector}[^>]*${attr}="([^"]*)"`, 'i');
        const m = cardHtml.match(re);
        return m ? m[1].trim() : '';
    }
    const re = new RegExp(`<${selector}[^>]*>([\\s\\S]*?)</${selector}>`, 'i');
    const m = cardHtml.match(re);
    return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
}

function extractHref(cardHtml) {
    const m = cardHtml.match(/href="([^"]+)"/);
    return m ? m[1] : '#';
}

function extractImgSrc(cardHtml) {
    const m = cardHtml.match(/src="([^"]+)"/);
    return m ? m[1] : '';
}

function extractImgAlt(cardHtml) {
    const m = cardHtml.match(/alt="([^"]+)"/);
    return m ? m[1] : '';
}

function buildNewCard(badge, imgSrc, imgAlt, title, priceText, href, rankClass) {
    // Determine if priceText looks like a real price (contains € or numbers)
    const isPriceNumeric = /[\d€]/.test(priceText);
    const priceDisplay = isPriceNumeric ? priceText : ''; // if it's a description, skip

    return `<div class="product-rank-card ${rankClass}" style="max-width:480px; margin:2rem auto;">
        <div class="product-rank-badge">${badge}</div>
        <div class="product-rank-image">
            <img src="${imgSrc}" alt="${imgAlt}" loading="lazy">
        </div>
        <div class="product-rank-body">
            <h3 class="product-rank-title">${title}</h3>
        </div>
        <div class="product-rank-interaction">
            <div class="product-rank-price">
                <span class="price-current">${priceDisplay}</span>
                <span class="prime-badge">✓ Prime</span>
            </div>
            <div class="product-rank-ctas">
                <a href="${href}" class="btn-primary" target="_blank" rel="nofollow sponsored noopener">
                    Ver oferta
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </a>
                <a href="${href}#customerReviews" class="btn-secondary" target="_blank" rel="nofollow sponsored noopener">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Leer opiniones
                </a>
            </div>
            <div class="amazon-logo-container">
                <img src="../../assets/img/amazon-logo.svg" alt="Disponible en Amazon" height="24">
            </div>
        </div>
    </div>`;
}

let totalUpdated = 0;

for (const file of blogPosts) {
    let html = fs.readFileSync(file, 'utf8');
    const cards = extractProductCards(html);

    if (cards.length === 0) continue;

    console.log(`\n${path.relative(process.cwd(), file)}: ${cards.length} cards found`);

    // Replace from end to start to preserve indices
    let modified = html;
    let rankIdx = 0;

    // Process in reverse order
    for (let i = cards.length - 1; i >= 0; i--) {
        const card = cards[i];
        const cardHtml = card.html;

        const badge = extractField(cardHtml, 'span');
        const imgSrc = extractImgSrc(cardHtml);
        const imgAlt = extractImgAlt(cardHtml);
        const title = extractField(cardHtml, 'h3');
        const priceText = extractField(cardHtml, 'p');
        const href = extractHref(cardHtml.match(/class="cta-button"[^>]*href="([^"]+)"/)?.[0] || cardHtml);

        // Extract href differently
        const ctaMatch = cardHtml.match(/class="cta-button"[^>]*href="([^"]+)"|href="([^"]+)"[^>]*class="cta-button"/);
        const ctaHref = ctaMatch ? (ctaMatch[1] || ctaMatch[2]) : extractHref(cardHtml);

        const rankClass = rankClasses[cards.length - 1 - i] || 'top-1';
        const newCard = buildNewCard(badge, imgSrc, imgAlt, title, priceText, ctaHref, rankClass);

        modified = modified.slice(0, card.start) + newCard + modified.slice(card.end);
        console.log(`  [${rankClass}] "${badge}" → "${title}" (${ctaHref})`);
    }

    if (modified !== html) {
        fs.writeFileSync(file, modified, 'utf8');
        totalUpdated++;
    }
}

console.log(`\n✅ Done. Updated ${totalUpdated} blog posts.`);
