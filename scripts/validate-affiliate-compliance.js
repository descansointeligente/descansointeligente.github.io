const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const DISCLAIMER_SNIPPETS = [
    'afiliado de amazon',
    'participamos en el programa de afiliados de amazon',
    'obtengo ingresos por las compras adscritas',
    'compras que cumplen los requisitos aplicables',
    'we participate in the amazon eu associates programme',
    'as amazon associates, we may earn income from qualifying purchases',
    "nous participons au programme partenaires d'amazon eu",
    'in qualita di affiliati amazon',
    'in quanto affiliati amazon',
    'partecipiamo al programma affiliazione amazon eu',
    'aderente al programma affiliazione amazon internazionale'
];

function getHtmlFiles(dir, files = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            getHtmlFiles(fullPath, files);
            continue;
        }

        if (entry.isFile() && entry.name.endsWith('.html')) {
            files.push(fullPath);
        }
    }

    return files;
}

function parseArgs(argv) {
    const parsed = {
        targetPath: null,
        json: false
    };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--path' && argv[i + 1]) {
            parsed.targetPath = argv[i + 1];
            i++;
            continue;
        }

        if (arg === '--json') {
            parsed.json = true;
        }
    }

    return parsed;
}

function resolveTargetFiles(targetPath) {
    if (!targetPath) return getHtmlFiles(ROOT_DIR);

    const absolutePath = path.resolve(ROOT_DIR, targetPath);
    if (!fs.existsSync(absolutePath)) {
        throw new Error(`Ruta no encontrada: ${targetPath}`);
    }

    const stat = fs.statSync(absolutePath);
    if (stat.isDirectory()) {
        return getHtmlFiles(absolutePath);
    }

    if (stat.isFile() && absolutePath.endsWith('.html')) {
        return [absolutePath];
    }

    throw new Error(`La ruta debe ser un archivo HTML o un directorio: ${targetPath}`);
}

function hasAffiliateDisclaimer(content) {
    const normalized = content.toLowerCase();
    return DISCLAIMER_SNIPPETS.some((snippet) => normalized.includes(snippet));
}

function containsDynamicPriceLayer(content) {
    return content.includes('data-asin=') || content.includes('price-update');
}

function extractJsonLdBlocks(content) {
    const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    const blocks = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
        const raw = match[1].trim();
        if (!raw) continue;

        try {
            blocks.push(JSON.parse(raw));
        } catch (_) {
            blocks.push({ __invalidJsonLd: true, raw });
        }
    }

    return blocks;
}

function flattenJsonLd(input) {
    const items = [];

    function visit(node) {
        if (!node) return;
        if (Array.isArray(node)) {
            node.forEach(visit);
            return;
        }
        if (typeof node !== 'object') return;

        if (Array.isArray(node['@graph'])) {
            node['@graph'].forEach(visit);
        }

        items.push(node);
    }

    visit(input);
    return items;
}

function isAmazonUrl(value) {
    return typeof value === 'string' && /(amazon\.[a-z.]+|amzn\.to)/i.test(value);
}

function auditJsonLd(content) {
    const issues = [];
    const warnings = [];
    const blocks = extractJsonLdBlocks(content);
    let productSchemaCount = 0;

    for (const block of blocks) {
        if (block.__invalidJsonLd) {
            warnings.push('Hay un bloque JSON-LD invalido que no se pudo parsear.');
            continue;
        }

        const nodes = flattenJsonLd(block);
        for (const node of nodes) {
            const typeValue = node['@type'];
            const types = Array.isArray(typeValue) ? typeValue : [typeValue];
            const isProduct = types.filter(Boolean).some((type) => String(type).toLowerCase() === 'product');
            if (!isProduct) continue;

            productSchemaCount++;
            const offers = Array.isArray(node.offers) ? node.offers : node.offers ? [node.offers] : [];
            const aggregateRating = node.aggregateRating || null;

            for (const offer of offers) {
                if (!offer || typeof offer !== 'object') continue;

                if (offer.price !== undefined && offer.price !== null && offer.price !== '') {
                    issues.push(`Schema Product con precio estatico detectado${node.name ? `: ${node.name}` : ''}.`);
                }

                if (offer.priceSpecification && offer.priceSpecification.price !== undefined) {
                    issues.push(`Schema Product con priceSpecification estatico detectado${node.name ? `: ${node.name}` : ''}.`);
                }

                if (isAmazonUrl(offer.url) && !containsDynamicPriceLayer(content) && offer.price !== undefined) {
                    warnings.push(`Schema Product enlaza a Amazon y expone precio sin capa dinamica visible${node.name ? `: ${node.name}` : ''}.`);
                }
            }

            if (aggregateRating && (aggregateRating.ratingValue !== undefined || aggregateRating.reviewCount !== undefined)) {
                warnings.push(`Schema Product con rating/reviews estaticos detectado${node.name ? `: ${node.name}` : ''}. Revisar si estan verificados por API.`);
            }
        }
    }

    return { issues, warnings, productSchemaCount };
}

function auditVisibleRatings(content) {
    const warnings = [];
    const starRegex = /data-asin-star=["']([^"']+)["'][^>]*>([^<]+)</gi;
    const matches = [...content.matchAll(starRegex)];

    if (matches.length > 0) {
        warnings.push(`Se han detectado ${matches.length} ratings visibles con data-asin-star. Asegura que provienen de datos verificados o elimina el bloque.`);
    }

    return { warnings };
}

function auditAffiliateLinks(content) {
    const issues = [];
    const warnings = [];
    const amazonLinkRegex = /<a\b[^>]*href=["']([^"']*(?:amazon\.[a-z.]+|amzn\.to)[^"']*)["'][^>]*>/gi;
    const priceLiteralRegex = /\b\d{1,4}[\.,]\d{2}\s?(?:€|EUR)\b/g;

    const links = [...content.matchAll(amazonLinkRegex)];
    if (links.length === 0) {
        return { issues, warnings, checkedLinks: 0 };
    }

    if (!hasAffiliateDisclaimer(content)) {
        issues.push('Falta disclaimer de afiliado visible en una pagina con enlaces Amazon.');
    }

    for (const match of links) {
        const tag = match[0];
        const href = match[1];
        const relMatch = tag.match(/rel=["']([^"']+)["']/i);
        const targetMatch = tag.match(/target=["']([^"']+)["']/i);
        const relValue = relMatch ? relMatch[1].toLowerCase() : '';

        if (!targetMatch || targetMatch[1] !== '_blank') {
            issues.push(`Enlace Amazon sin target="_blank": ${href}`);
        }

        if (!relValue.includes('nofollow') || !relValue.includes('sponsored')) {
            issues.push(`Enlace Amazon sin rel completo nofollow+sponsored: ${href}`);
        }
    }

    const priceMatches = content.match(priceLiteralRegex) || [];
    if (priceMatches.length > 0 && !containsDynamicPriceLayer(content)) {
        warnings.push(`Se han detectado ${priceMatches.length} precios literales y no aparece capa dinamica data-asin/price-update.`);
    }

    const brokenImageHints = ['src="undefined"', "src='undefined'", 'src="null"', "src='null'"];
    if (brokenImageHints.some((hint) => content.includes(hint))) {
        issues.push('Hay imagenes de producto con src undefined/null.');
    }

    const jsonLdAudit = auditJsonLd(content);
    const visibleRatingsAudit = auditVisibleRatings(content);

    issues.push(...jsonLdAudit.issues);
    warnings.push(...jsonLdAudit.warnings, ...visibleRatingsAudit.warnings);

    return {
        issues,
        warnings,
        checkedLinks: links.length,
        productSchemaCount: jsonLdAudit.productSchemaCount
    };
}

function runAudit(targetPath) {
    const htmlFiles = resolveTargetFiles(targetPath);
    const results = [];
    let totalFilesWithAmazon = 0;
    let totalLinks = 0;
    let issueCount = 0;
    let warningCount = 0;

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const result = auditAffiliateLinks(content);

        if (result.checkedLinks === 0 && result.productSchemaCount === 0) continue;

        totalFilesWithAmazon++;
        totalLinks += result.checkedLinks;
        issueCount += result.issues.length;
        warningCount += result.warnings.length;

        results.push({
            file,
            relativePath: path.relative(ROOT_DIR, file),
            ...result
        });
    }

    return {
        rootDir: ROOT_DIR,
        targetPath: targetPath || '.',
        filesWithAmazon: totalFilesWithAmazon,
        checkedLinks: totalLinks,
        errors: issueCount,
        warnings: warningCount,
        passed: issueCount === 0,
        results
    };
}

function printSummary(summary) {
    for (const result of summary.results) {
        if (result.issues.length === 0 && result.warnings.length === 0) continue;

        console.log(`\n${result.relativePath}`);

        for (const issue of result.issues) {
            console.log(`  ERROR: ${issue}`);
        }

        for (const warning of result.warnings) {
            console.log(`  WARN: ${warning}`);
        }
    }

    console.log('\n--- AFFILIATE AUDIT SUMMARY ---');
    console.log(`Files with Amazon links or Product schema: ${summary.filesWithAmazon}`);
    console.log(`Amazon links checked: ${summary.checkedLinks}`);
    console.log(`Errors: ${summary.errors}`);
    console.log(`Warnings: ${summary.warnings}`);
    console.log(`Result: ${summary.passed ? 'PASS' : 'FAIL'}`);
}

function main() {
    try {
        const args = parseArgs(process.argv.slice(2));
        const summary = runAudit(args.targetPath);

        if (args.json) {
            console.log(JSON.stringify(summary, null, 2));
        } else {
            printSummary(summary);
        }

        if (!summary.passed) {
            process.exitCode = 1;
        }
    } catch (error) {
        console.error(`ERROR: ${error.message}`);
        process.exitCode = 1;
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    ROOT_DIR,
    DISCLAIMER_SNIPPETS,
    parseArgs,
    resolveTargetFiles,
    hasAffiliateDisclaimer,
    containsDynamicPriceLayer,
    extractJsonLdBlocks,
    flattenJsonLd,
    auditJsonLd,
    auditVisibleRatings,
    auditAffiliateLinks,
    runAudit
};
