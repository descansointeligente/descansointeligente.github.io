/**
 * generate-catalog-page.js
 *
 * Generates a catalog page HTML from a JSON configuration file.
 * Uses a consistent template that matches the existing catalog pages.
 *
 * Usage:
 *   node scripts/generate-catalog-page.js <config-id>
 *   node scripts/generate-catalog-page.js --all
 *   node scripts/generate-catalog-page.js --list
 *
 * Examples:
 *   node scripts/generate-catalog-page.js escritorios-elevables
 *   node scripts/generate-catalog-page.js ratones-ergonomicos
 *   node scripts/generate-catalog-page.js --all
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const CATALOG_PAGES_DIR = path.join(__dirname, 'catalog-pages');

// ── Helpers ─────────────────────────────────────────────────────────────────
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function loadConfig(configId) {
    const configPath = path.join(CATALOG_PAGES_DIR, `${configId}.json`);
    if (!fs.existsSync(configPath)) {
        throw new Error(`Config not found: ${configPath}`);
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function listConfigs() {
    if (!fs.existsSync(CATALOG_PAGES_DIR)) return [];
    return fs.readdirSync(CATALOG_PAGES_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
}

// ── Template sections ───────────────────────────────────────────────────────

function renderHead(config) {
    const canonicalUrl = `https://descansointeligente.es/${config.slug}/`;
    const ogImage = config.ogImage || '/assets/img/og-default.jpg';
    const titleTag = config.title.includes('|')
        ? config.title
        : `${config.title} | Descanso Inteligente`;

    return `<!doctype html>
<html lang="es">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(titleTag)}</title>
    <link rel="icon" type="image/png" href="/assets/img/logo.png">
    <meta name="description"
        content="${escapeHtml(config.metaDescription)}">
    <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1">
    <link rel="canonical" href="${canonicalUrl}">

    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(titleTag)}">
    <meta property="og:description" content="${escapeHtml(config.metaDescription)}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:image" content="https://descansointeligente.es${ogImage}">
    <meta property="og:site_name" content="Descanso Inteligente">
    <meta property="og:locale" content="es_ES">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(titleTag)}">
    <meta name="twitter:description" content="${escapeHtml(config.metaDescription)}">
    <meta name="twitter:image" content="https://descansointeligente.es${ogImage}">

    <link rel="stylesheet" href="../assets/css/style.css">

    <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "${config.schemaName}",
    "description": "${config.schemaDescription}",
    "url": "${canonicalUrl}"
  }
  </script>
</head>`;
}

function renderHeader() {
    return `
<body>
    <header class="site-header">
        <div class="container header-inner">
            <a class="logo" href="/">
                <img src="../assets/img/logo.png" alt="Descanso Inteligente Logo" width="36" height="36">
                <span>Descanso Inteligente</span>
            </a>

            <!-- Mobile Toggle -->
            <button class="menu-toggle" aria-label="Abrir menu" aria-expanded="false">
                <span class="hamburger-box">
                    <span class="hamburger-inner"></span>
                </span>
            </button>

            <!-- Navigation -->
                                    <nav class="main-nav-container" aria-label="Principal">
                <div class="mobile-menu-header">
                    <span class="logo-text">Menu</span>
                    <button class="close-menu" aria-label="Cerrar menu">x</button>
                </div>
                <ul class="main-nav">
                    <li><a href="/" class="nav-link">Inicio</a></li>
                    <li><a href="/blog/" class="nav-link">Blog</a></li>

                    <li class="nav-item-has-children">
                        <button class="nav-link dropdown-toggle" aria-expanded="false">
                            Catalogo <span class="arrow">&#9660;</span>
                        </button>
                        <ul class="dropdown-menu">
                            <li><a href="/mejores-escritorios-elevables/">&#9889; Escritorios Elevables</a></li>
                            <li><a href="/mejores-sillas-ergonomicas/">&#129681; Sillas Ergonomicas</a></li>
                            <li><a href="/mejor-cojin-coxis-teletrabajo/">&#129495;&#127995;&#8205;&#9792;&#65039; Cojin para Coxis</a></li>
                            <li><a href="/cojin-ortopedico-silla-oficina/">&#128737;&#65039; Soporte Lumbar</a></li>
                            <div class="dropdown-divider"></div>
                            <li><a href="/mejores-brazos-monitor/">&#128421;&#65039; Brazos de Monitor</a></li>
                        </ul>
                    </li>

                    <li class="nav-item-has-children">
                        <button class="nav-link dropdown-toggle" aria-expanded="false">
                            Guias <span class="arrow">&#9660;</span>
                        </button>
                        <ul class="dropdown-menu">
                            <li><a href="/blog/como-elegir-escritorio-elevable/">Guia de Escritorios</a></li>
                            <li><a href="/blog/como-elegir-silla-ergonomica/">Guia de Sillas</a></li>
                            <li><a href="/blog/como-elegir-soportes-lumbares/">Soportes y Cojines</a></li>
                            <li><a href="/blog/como-elegir-raton-ergonomico/">Ratones y Teclados</a></li>
                            <div class="dropdown-divider"></div>
                            <li><a href="/calculadora-ergonomia/">&#128208; Calculadora Ergonomia</a></li>
                            <li><a href="/blog/">&#128218; Ver todas las guias</a></li>
                        </ul>
                    </li>
                    <li><a href="/contacto/" class="nav-link">Contacto</a></li>
                </ul>
            </nav>

            <div class="menu-backdrop"></div>
        </div>
    </header>`;
}

function renderBreadcrumbs(config) {
    return `
    <main class="container">
        <div class="breadcrumbs">
            <a href="/">Inicio</a> <span>&#8250;</span> <a href="/otros-accesorios-ergonomicos/">Accesorios Ergonomicos</a>
            <span>&#8250;</span> ${escapeHtml(config.breadcrumb)}
        </div>`;
}

function renderHero(config) {
    return `
        <header class="page-header" style="text-align: center; margin: 3rem 0;">
            <h1 class="page-title">${escapeHtml(config.h1)}</h1>
            <p style="font-size: 1.1rem; color: var(--text-secondary); max-width: 800px; margin: 0 auto;">
                ${config.heroText}
            </p>
        </header>`;
}

function renderProductsSection(config) {
    // The actual products are injected by update-catalog-rankings.js
    // We just set up the skeleton with markers
    return `
        <section class="api-products-section" data-sidebar-results='[]'>
            <h2 style="display: none;">Ranking</h2>

        <!-- CATALOG-RANKINGS-START -->
        <!-- Products will be automatically populated by the update-catalog-rankings workflow -->
        <div class="product-rank-card top-1 reveal-on-scroll" style="text-align:center; padding: 3rem;">
            <p style="color: var(--text-secondary);">Los productos se cargan automaticamente mediante el workflow semanal.<br>
            Ejecuta <code>npm run update:catalog</code> o lanza el workflow desde GitHub Actions.</p>
        </div>
        <!-- CATALOG-RANKINGS-END -->`;
}

function renderInfoBox(config) {
    if (!config.infoBox) return '';
    return `
            <!-- Info Box -->
            <div style="background: rgba(13, 148, 136, 0.05); border-left: 4px solid var(--primary); padding: 1rem 1.5rem; margin: 2rem 0; border-radius: 0 var(--radius-md) var(--radius-md) 0;">
                ${config.infoBox}
            </div>`;
}

function renderProductsSectionClose() {
    return `
        </section>`;
}

function renderBuyingGuide(config) {
    if (!config.buyingGuide) return '';
    const sections = config.buyingGuide.sections.map((s, i) =>
        `            <h3>${i + 1}. ${s.title}</h3>
            <p>${s.text}</p>`
    ).join('\n\n');

    return `
        <section class="content-section" style="margin-top: 3rem;">
            <h2>Guia de Compra</h2>
            <p>${config.buyingGuide.intro}</p>

${sections}
        </section>`;
}

function renderBenefits(config) {
    if (!config.benefits) return '';

    const items = config.benefits.items.map(item =>
        `                <div>
                    <h4 style="color: var(--primary-dark);">${escapeHtml(item.title)}</h4>
                    <p>${item.text}</p>
                </div>`
    ).join('\n');

    return `
        <section class="content-section reveal-on-scroll">
            <h2>&#128300; ${escapeHtml(config.benefits.title)}</h2>
            <p>${config.benefits.intro}</p>
            <div
                style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
${items}
            </div>
        </section>`;
}

function renderFaq(config) {
    if (!config.faq || !Array.isArray(config.faq) || config.faq.length === 0) return '';

    const faqItems = config.faq.map(item =>
        `            <details class="faq-item">
                <summary class="faq-question">${escapeHtml(item.question)}</summary>
                <div class="faq-answer">
                    <p>${item.answer}</p>
                </div>
            </details>`
    ).join('\n');

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": config.faq.map(item => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer.replace(/<[^>]+>/g, '')
            }
        }))
    };

    return `
        <section class="content-section reveal-on-scroll">
            <h2>&#10067; Preguntas frecuentes</h2>
            <div class="faq-container">
${faqItems}
            </div>
        </section>

    <script type="application/ld+json">
    ${JSON.stringify(faqSchema, null, 2)}
    </script>`;
}

function renderRelatedProducts(config) {
    if (!config.relatedProducts) return '';

    return `
        <section class="content-section reveal-on-scroll">
            <h2>&#127919; Tambien te puede interesar</h2>
            <p>${config.relatedProducts.intro}</p>
            <div class="related-products-container"
                data-search-keywords="${escapeHtml(config.relatedProducts.keywords)}"
                data-search-count="4">
                <div class="related-products-grid">
                    <!-- Related products loaded dynamically by script.js -->
                </div>
            </div><!-- related-end -->
        </section>`;
}

function renderFooter() {
    return `
    </main>


    <footer class="site-footer" style="margin-top: 5rem;">
        <div class="container footer-grid">
            <div>
                <span class="logo footer-logo">Descanso Inteligente</span>
                <p>Especialistas en ergonomia y descanso para el teletrabajo. Porque pasar 8 horas sentado no deberia
                    doler.</p>
            </div>
            <div>
                <p class="footer-heading">Guias Principales</p>
                <ul class="footer-links">
                    <li><a href="/blog/">Blog (Ultimos articulos)</a></li>
                    <li><a href="/mejor-cojin-coxis-teletrabajo/">Mejor cojin coxis</a></li>
                    <li><a href="/cojin-ortopedico-silla-oficina/">Cojin silla oficina</a></li>
                    <li><a href="/como-elegir-cojin-coxis/">Como elegir</a></li>
                </ul>
            </div>
            <div>
                <p class="footer-heading">Especiales</p>
                <ul class="footer-links">
                    <li><a href="/calculadora-ergonomia/">Calculadora Ergonomia</a></li>
                    <li><a href="/otros-accesorios-ergonomicos/">Otros Accesorios</a></li>
                    <li><a href="/sobre-nosotros/">Sobre nosotros</a></li>
                    <li><a href="/contacto/">Contacto</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2026 Descanso Inteligente. Todos los derechos reservados.</p>
            <p>Participamos en el Programa de Afiliados de Amazon EU.</p>
        </div>
    </footer>

    <script src="../assets/js/script.js"></script>
</body>

</html>
`;
}

// ── Main template assembly ──────────────────────────────────────────────────

function generatePage(config) {
    const parts = [
        renderHead(config),
        renderHeader(),
        renderBreadcrumbs(config),
        renderHero(config),
        renderProductsSection(config),
        renderInfoBox(config),
        renderProductsSectionClose(),
        renderBuyingGuide(config),
        renderBenefits(config),
        renderFaq(config),
        renderRelatedProducts(config),
        renderFooter()
    ];

    return parts.join('\n');
}

// ── CLI ─────────────────────────────────────────────────────────────────────

function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log(`
Usage:
  node scripts/generate-catalog-page.js <config-id>   Generate one page
  node scripts/generate-catalog-page.js --all          Generate all pages
  node scripts/generate-catalog-page.js --list         List available configs

Config files are stored in scripts/catalog-pages/*.json
`);
        process.exit(0);
    }

    if (args.includes('--list')) {
        const configs = listConfigs();
        if (configs.length === 0) {
            console.log('No configs found in scripts/catalog-pages/');
        } else {
            console.log(`\nAvailable catalog page configs (${configs.length}):\n`);
            for (const id of configs) {
                const config = loadConfig(id);
                console.log(`  ${id.padEnd(30)} -> ${config.slug}/`);
            }
            console.log('');
        }
        process.exit(0);
    }

    const generateAll = args.includes('--all');
    const configIds = generateAll ? listConfigs() : args.filter(a => !a.startsWith('--'));

    if (configIds.length === 0) {
        console.error('Error: No config IDs specified and no configs found.');
        process.exit(1);
    }

    let generated = 0;

    for (const configId of configIds) {
        try {
            const config = loadConfig(configId);
            const html = generatePage(config);
            const outputDir = path.join(ROOT_DIR, config.slug);
            const outputFile = path.join(outputDir, 'index.html');

            // Create directory if needed
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
                console.log(`  Created directory: ${config.slug}/`);
            }

            fs.writeFileSync(outputFile, html, 'utf8');
            console.log(`  Generated: ${config.slug}/index.html (${html.length} bytes)`);
            generated++;
        } catch (error) {
            console.error(`  Error generating ${configId}: ${error.message}`);
        }
    }

    console.log(`\nDone: ${generated}/${configIds.length} pages generated.`);

    if (generated > 0) {
        console.log(`\nNext steps:`);
        console.log(`  1. Add the category to scripts/catalog-config.json (for ranking updates)`);
        console.log(`  2. Run: npm run update:catalog (to populate products)`);
        console.log(`  3. Run: npm run update:catalog:dry (to verify without writing)`);
        console.log(`  4. Add the page to the navigation menu if needed`);
    }
}

main();
