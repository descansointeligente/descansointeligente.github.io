const fs = require('fs');
const path = require('path');
const { runAudit, ROOT_DIR } = require('./validate-affiliate-compliance');

const SKILLS_DIR = path.join(ROOT_DIR, 'docs', 'skills');
const SKILLS = {
    'seo-article': {
        file: path.join(SKILLS_DIR, 'seo-article.md'),
        description: 'Genera el brief operativo para crear o reescribir un articulo SEO.'
    },
    'prepublish-audit': {
        file: path.join(SKILLS_DIR, 'prepublish-audit.md'),
        description: 'Revisa una pagina antes de publicar.'
    },
    'amazon-compliance': {
        file: path.join(SKILLS_DIR, 'amazon-compliance.md'),
        description: 'Audita cumplimiento basico de Amazon Associates.'
    },
    'freshness-update': {
        file: path.join(SKILLS_DIR, 'freshness-update.md'),
        description: 'Repasa refresh comercial y señales de vigencia.'
    }
};

function printUsage() {
    console.log('Uso:');
    console.log('  npm run skill:list');
    console.log('  npm run skill:show -- <skill>');
    console.log('  npm run skill:prepublish -- <ruta-html>');
    console.log('  npm run skill:compliance -- <ruta-html-o-directorio>');
}

function listSkills() {
    console.log('Skills disponibles:\n');
    for (const [name, config] of Object.entries(SKILLS)) {
        console.log(`- ${name}: ${config.description}`);
    }
}

function showSkill(name) {
    const skill = SKILLS[name];
    if (!skill) {
        throw new Error(`Skill desconocida: ${name}`);
    }

    console.log(fs.readFileSync(skill.file, 'utf8'));
}

function extractTag(content, tagName) {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, 'i');
    const match = content.match(regex);
    return match ? match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : null;
}

function extractMetaDescription(content) {
    const match = content.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
    return match ? match[1].trim() : null;
}

function extractCanonical(content) {
    const match = content.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i);
    return match ? match[1].trim() : null;
}

function prepublishAudit(targetPath) {
    if (!targetPath) {
        throw new Error('Debes indicar una ruta HTML.');
    }

    const absolutePath = path.resolve(ROOT_DIR, targetPath);
    if (!fs.existsSync(absolutePath)) {
        throw new Error(`Ruta no encontrada: ${targetPath}`);
    }

    const content = fs.readFileSync(absolutePath, 'utf8');
    const issues = [];
    const warnings = [];

    const title = extractTag(content, 'title');
    const h1Matches = [...content.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
    const metaDescription = extractMetaDescription(content);
    const canonical = extractCanonical(content);

    if (!title) issues.push('Falta <title>.');
    if (!metaDescription) issues.push('Falta meta description.');
    if (!canonical) warnings.push('Falta canonical.');
    if (h1Matches.length === 0) issues.push('Falta H1.');
    if (h1Matches.length > 1) issues.push(`Hay ${h1Matches.length} H1 en la pagina.`);
    if (title && title.length > 65) warnings.push(`El title es largo (${title.length} caracteres).`);
    if (metaDescription && metaDescription.length > 160) warnings.push(`La meta description es larga (${metaDescription.length} caracteres).`);
    if (!/<nav[^>]+aria-label=["']Principal["']/i.test(content)) warnings.push('No se detecta navegacion principal con aria-label.');
    if (!/<script[^>]+application\/ld\+json/i.test(content)) warnings.push('No se detecta JSON-LD.');
    if (!/href=["'][^"']+blog\//i.test(content) && !/href=["'][^"']+mejor/i.test(content)) warnings.push('No se detectan enlaces internos evidentes hacia cluster o money pages.');

    const compliance = runAudit(targetPath);
    const complianceResult = compliance.results[0] || null;
    if (complianceResult) {
        issues.push(...complianceResult.issues);
        warnings.push(...complianceResult.warnings);
    }

    console.log(`Archivo: ${path.relative(ROOT_DIR, absolutePath)}`);
    console.log(`Title: ${title || 'N/D'}`);
    console.log(`Meta description: ${metaDescription || 'N/D'}`);
    console.log(`Canonical: ${canonical || 'N/D'}`);
    console.log(`H1 count: ${h1Matches.length}`);

    if (issues.length === 0 && warnings.length === 0) {
        console.log('\nResultado: OK');
        return;
    }

    console.log('\nResultado: REVISION NECESARIA');

    for (const issue of issues) {
        console.log(`ERROR: ${issue}`);
    }

    for (const warning of warnings) {
        console.log(`WARN: ${warning}`);
    }

    if (issues.length > 0) {
        process.exitCode = 1;
    }
}

function main() {
    const [command, ...args] = process.argv.slice(2);

    try {
        switch (command) {
            case 'list':
                listSkills();
                break;
            case 'show':
                showSkill(args[0]);
                break;
            case 'prepublish':
                prepublishAudit(args[0]);
                break;
            case 'compliance': {
                const summary = runAudit(args[0] || null);
                for (const result of summary.results) {
                    if (result.issues.length === 0 && result.warnings.length === 0) continue;
                    console.log(`\n${result.relativePath}`);
                    for (const issue of result.issues) console.log(`ERROR: ${issue}`);
                    for (const warning of result.warnings) console.log(`WARN: ${warning}`);
                }
                console.log(`\nResultado: ${summary.passed ? 'PASS' : 'FAIL'} (${summary.errors} errores, ${summary.warnings} warnings)`);
                if (!summary.passed) process.exitCode = 1;
                break;
            }
            default:
                printUsage();
                if (command) process.exitCode = 1;
        }
    } catch (error) {
        console.error(`ERROR: ${error.message}`);
        process.exitCode = 1;
    }
}

if (require.main === module) {
    main();
}
