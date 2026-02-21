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

const productCardRegex = /<div class="product-card">[\s\S]*?<span class="product-badge">([^<]+)<\/span>[\s\S]*?<img src="([^"]+)" alt="([^"]+)"[^>]*>[\s\S]*?<h3 class="product-title">([^<]+)<\/h3>[\s\S]*?<p class="product-price">([^<]+)<\/p>\s*<ul class="product-features">([\s\S]*?)<\/ul>[\s\S]*?href="([^"]+)"[^>]*>[\s\S]*?<\/a>[\s\S]*?<\/div>/g;

htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  let cardIndex = 1;

  // First replace old product-card with new product-rank-card structure
  content = content.replace(productCardRegex, (match, badgeText, imgSrc, imgAlt, title, price, features, href) => {
    changed = true;

    // Extract ASIN from href (e.g., /dp/B07BDFP7NZ?tag=...)
    const asinMatch = href.match(/\/dp\/([A-Z0-9]{10})/);
    const asin = asinMatch ? asinMatch[1] : '';

    // Determine language for labels
    let textRec = "Precio recomendado: ";
    let textVer = "Ver oferta";
    let textLeer = "Leer opiniones";
    let textPrime = "✓ Prime";
    let textDe = " de 5";
    let imgLogo = "/assets/img/amazon-logo.svg";

    if (file.includes("/en/")) { textRec = "Recommended price: "; textVer = "View offer"; textLeer = "Read reviews"; textDe = " out of 5"; }
    if (file.includes("/fr/")) { textRec = "Prix recommandé: "; textVer = "Voir l'offre"; textLeer = "Lire les avis"; textDe = " sur 5"; }
    if (file.includes("/it/")) { textRec = "Prezzo consigliato: "; textVer = "Vedi offerta"; textLeer = "Leggi le recensioni"; textDe = " su 5"; }

    // Adjust paths
    // We know images might be relative (like ../assets...)
    // Let's keep imgSrc as is, but for the logo we might need to fix it if it's inside a subfolder
    let depth = file.substring(ROOT_DIR.length).split(path.sep).length - 2;
    let prefix = depth > 0 ? "../".repeat(depth) : "";
    if (imgSrc.startsWith("../")) {
      // It's already relative to subfolder, just keep it, or normalize?
      // Since we use the original imgSrc, it's safer.
    }

    // The logo should be absolute or correct relative
    imgLogo = prefix ? prefix + "assets/img/amazon-logo.svg" : "./assets/img/amazon-logo.svg";
    if (imgLogo.startsWith("..//")) imgLogo = imgLogo.replace("..//", "../");
    if (imgSrc.startsWith("..//")) imgSrc = imgSrc.replace("..//", "../");

    // Ensure index for top-X
    const topClass = `top-${cardIndex}`;
    cardIndex++;

    return `<div class="product-rank-card ${topClass}">
          <div class="product-rank-badge" data-asin-badge="${asin}">${badgeText.trim()}</div>
          <div class="product-rank-image">
            <img src="${imgSrc}" alt="${imgAlt}" loading="lazy">
          </div>
          <div class="product-rank-body">
            <h3 class="product-rank-title">${title.trim()}</h3>
            <ul class="product-features">
              ${features.trim()}
            </ul>
          </div>
          <div class="product-rank-interaction">
            <div class="product-rank-price">
              <span class="price-current price-update" data-asin="${asin}">${price.trim()}</span>
              <span class="prime-badge">${textPrime}</span>
            </div>
            <div class="price-original price-old-update" data-asin-original="${asin}">
              <span class="discount-badge discount-update" data-asin-discount="${asin}"></span>
              ${textRec}<del></del>
            </div>
            <div class="product-rank-stars">
              ★★★★☆ <span class="star-text star-update" data-asin-star="${asin}">4,5${textDe}</span>
            </div>
            <div class="product-rank-ctas">
              <a href="${href}" class="btn-primary" target="_blank" rel="nofollow sponsored noopener">
                ${textVer}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
              <a href="${href}#customerReviews" class="btn-secondary" target="_blank" rel="nofollow sponsored noopener">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                ${textLeer}
              </a>
            </div>
            <div class="amazon-logo-container">
              <img src="/assets/img/amazon-logo.svg" alt="Disponible en Amazon" height="24">
            </div>
          </div>
        </div>`;
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Restructured product cards in: ' + file);
  }
});
