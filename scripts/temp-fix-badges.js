const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

function findHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (file.startsWith('.') || file === 'node_modules') return;
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            findHtmlFiles(filePath, fileList);
        } else if (file.endsWith('.html')) {
            fileList.push(filePath);
        }
    });
    return fileList;
}

const htmlFiles = findHtmlFiles(ROOT_DIR);

htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // This regex grabs from <div class="product-rank-card... to <div class="product-rank-badge"...
    // and looks forward to data-asin="..." inside the card to pull the ASIN
    // So we match the full card piece until data-asin
    const regex = /<div class="product-rank-card([^>]*)>\s*(<span class="product-badge">([^<]+)<\/span>|<div class="product-rank-badge"([^>]*)>([^<]+)<\/div>)([\s\S]*?)<span class="price-current price-update" data-asin="([^"]+)">/g;

    content = content.replace(regex, (match, cardAttrs, badgeFull, oldBadgeSpan, badgeAttrs, oldBadgeText, between, asin) => {
        // If it's the old <span class="product-badge">
        if (badgeFull.startsWith('<span')) {
            changed = true;
            return `<div class="product-rank-card${cardAttrs}">
          <div class="product-rank-badge" data-asin-badge="${asin}">${oldBadgeSpan}</div>${between}<span class="price-current price-update" data-asin="${asin}">`;
        }

        // If it's <div class="product-rank-badge"...
        if (badgeAttrs && !badgeAttrs.includes('data-asin-badge')) {
            changed = true;
            return `<div class="product-rank-card${cardAttrs}">
          <div class="product-rank-badge" data-asin-badge="${asin}">${oldBadgeText}</div>${between}<span class="price-current price-update" data-asin="${asin}">`;
        }

        return match;
    });

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed badges in: ' + file);
    }
});
