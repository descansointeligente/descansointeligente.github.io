const fs = require('fs');
const files = [
  './cojin-ortopedico-silla-oficina/index.html',
  './cojin-coxis-sofa/index.html'
];
const productCardRegex = /<div class="product-card">[\s\S]*?<span class="product-badge">([^<]+)<\/span>[\s\S]*?<img src="([^"]+)" alt="([^"]+)"[^>]*>[\s\S]*?<h3 class="product-title">([^<]+)<\/h3>[\s\S]*?<p class="product-price">([^<]+)<\/p>\s*<ul class="product-features">([\s\S]*?)<\/ul>[\s\S]*?href="([^"]+)"[^>]*>[\s\S]*?<\/a>[\s\S]*?<\/div>/g;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let cardIndex = 1;

    let newContent = content.replace(productCardRegex, (match, badgeText, imgSrc, imgAlt, title, price, features, href) => {
        const asinMatch = href.match(/\/dp\/([A-Z0-9]{10})/);
        const asin = asinMatch ? asinMatch[1] : '';

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
              <span class="prime-badge">✓ Prime</span>
            </div>
            <div class="price-original price-old-update" data-asin-original="${asin}">
              <span class="discount-badge discount-update" data-asin-discount="${asin}"></span>
              Precio recomendado: <del></del>
            </div>
            <div class="product-rank-stars">
              ★★★★☆ <span class="star-text star-update" data-asin-star="${asin}">4,5 de 5</span>
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
              <img src="../assets/img/amazon-logo.svg" alt="Disponible en Amazon" height="24">
            </div>
          </div>
        </div>`;
    });

    if (newContent !== content) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log('Fixed ' + file);
    } else {
        console.log('Regex failed on ' + file);
    }
});
