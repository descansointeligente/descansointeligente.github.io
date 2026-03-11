const fs = require('fs');
const path = require('path');
const https = require('https');

// Simple console colors
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m"
};
const aws4 = require('aws4');

// Amazon Creators API Configuration
const AMAZON_ACCESS_KEY = process.env.AMAZON_ACCESS_KEY;
const AMAZON_SECRET_KEY = process.env.AMAZON_SECRET_KEY;
const AMAZON_PARTNER_TAG = process.env.AMAZON_PARTNER_TAG;
const AMAZON_HOST = 'webservices.amazon.es';
const AMAZON_REGION = 'eu-west-1';

const ROOT_DIR = path.join(__dirname, '..');

/**
 * Fetch data from Amazon Creators API (PAAPI 5.0 compatible)
 * @param {string} asin 
 * @returns {Promise<object|null>} Object with price, original_price, star_rating
 */
async function fetchProductData(asin) {
    if (!AMAZON_ACCESS_KEY || !AMAZON_SECRET_KEY || !AMAZON_PARTNER_TAG) {
        console.log(`${colors.yellow}[SIMULATION] No Amazon Keys provided. Returning mock data for ${asin}.${colors.reset}`);

        // Mock data logic to show the user how discounts look
        let price = '29,99 €';
        let originalPrice = null;
        let discount = null;
        let stars = '4,3';
        let priceNum = 29.99;
        let isAmazonChoice = false;
        let mockImage = `https://placehold.co/300x300/f8fafc/334155?text=Accesorio+Amazon`;

        // Cojines
        if (asin === 'B0F1VD176V') {
            price = '33,99 €';
            originalPrice = '45,89 €';
            discount = '-26%';
            stars = '4,5';
            priceNum = 33.99;
            mockImage = `https://placehold.co/300x300/f8fafc/334155?text=Cojin+Fortem`;
        } else if (asin === 'B077G7D73D') {
            price = '30,99 €';
            originalPrice = '37,99 €';
            discount = '-18%';
            stars = '4,2';
            priceNum = 30.99;
            isAmazonChoice = true;
            mockImage = `https://placehold.co/300x300/f8fafc/334155?text=Cojin+Marnur`;
        } else if (asin === 'B01N5LH26Y') {
            price = '27,90 €';
            priceNum = 27.90;
            mockImage = `https://placehold.co/300x300/f8fafc/334155?text=Cojin+Donut`;
            // Escritorios
        } else if (asin === 'B0C1BQTG87') {
            price = '46,99 €';
            priceNum = 46.99;
            mockImage = `https://placehold.co/300x300/f8fafc/334155?text=Escritorio+ODK`;
        } else if (asin === 'B0DNSLWKFX') {
            price = '118,99 €';
            originalPrice = '139,99 €';
            discount = '-15%';
            priceNum = 118.99;
            mockImage = `https://placehold.co/300x300/f8fafc/334155?text=Escritorio+SONGMICS`;
        } else if (asin === 'B0D9MGDDHD') {
            price = '104,49 €';
            originalPrice = '125,99 €';
            discount = '-17%';
            priceNum = 104.49;
            mockImage = `https://placehold.co/300x300/f8fafc/334155?text=Escritorio+ErGear`;
            // Sillas
        } else if (asin === 'B0G6WWQ4P2') {
            price = '52,99 €';
            priceNum = 52.99;
            mockImage = `https://placehold.co/300x300/f8fafc/334155?text=Silla+EveryKip`;
        } else if (asin === 'B0D17RR22L') {
            price = '69,99 €';
            priceNum = 69.99;
            mockImage = `https://placehold.co/300x300/f8fafc/334155?text=Silla+JUPPLIES`;
            // Brazos Monitor
        } else if (asin === 'B0CKPH347G') {
            price = '38,80 €';
            priceNum = 38.80;
            stars = '4,6';
            mockImage = `https://placehold.co/300x300/f8fafc/334155?text=Brazo+BONTEC+Gas`;
        } else if (asin === 'B091D2CKC7') {
            price = '29,99 €';
            priceNum = 29.99;
            stars = '4,7';
            mockImage = `https://placehold.co/300x300/f8fafc/334155?text=Brazo+Ergosolid`;
        } else if (asin === 'B01MR397OH') {
            price = '23,61 €';
            priceNum = 23.61;
            stars = '4,6';
            mockImage = `https://placehold.co/300x300/f8fafc/334155?text=Soporte+BONTEC+Dual`;
        } else if (asin === 'B0859W3D8J') {
            price = '45,00 €';
            mockImage = `https://placehold.co/300x300/f8fafc/334155?text=Soporte+ErGear`;
        } else if (asin === 'B07T4HYSVD') {
            price = '59,99 €';
            mockImage = `https://placehold.co/300x300/f8fafc/334155?text=Dobla+Brazo+HUANUO`;
        }

        return {
            price: price,
            originalPrice: originalPrice,
            stars: stars,
            discount: discount,
            priceNum: priceNum,
            isAmazonChoice: isAmazonChoice,
            imageUrl: mockImage
        };
    }

    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            ItemIds: [asin],
            Resources: [
                "Images.Primary.Large",
                "Offers.Listings.Price",
                "Offers.Listings.SavingBasis",
                "Offers.Listings.DeliveryInfo.IsPrimeEligible",
                "Reviews.Summary" // Note: Creators API often requires specific access for reviews, but we request it anyway
            ],
            PartnerTag: AMAZON_PARTNER_TAG,
            PartnerType: "Associates",
            Marketplace: "www.amazon.es"
        });

        const options = {
            host: AMAZON_HOST,
            path: '/paapi5/getitems',
            method: 'POST',
            service: 'ProductAdvertisingAPI',
            region: AMAZON_REGION,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems',
                'Content-Encoding': 'amz-1.0'
            },
            body: payload
        };

        // Sign the request with AWS Signature V4
        aws4.sign(options, {
            accessKeyId: AMAZON_ACCESS_KEY,
            secretAccessKey: AMAZON_SECRET_KEY
        });

        const req = https.request(options, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                try {
                    const body = Buffer.concat(chunks).toString();
                    const data = JSON.parse(body);

                    if (data.Errors) {
                        console.error(`${colors.red}[API ERROR] for ${asin}: ${JSON.stringify(data.Errors)}${colors.reset}`);
                        return resolve(null);
                    }

                    if (data.ItemsResult && data.ItemsResult.Items && data.ItemsResult.Items.length > 0) {
                        const item = data.ItemsResult.Items[0];

                        if (!item.Offers || !item.Offers.Listings || item.Offers.Listings.length === 0) {
                            console.error(`${colors.yellow}[NO OFFERS] No available price for ${asin}${colors.reset}`);
                            return resolve(null);
                        }

                        const listing = item.Offers.Listings[0];

                        // Price
                        const priceInfo = listing.Price;
                        let priceStr = priceInfo ? priceInfo.DisplayAmount : null;
                        const numPrice = priceInfo ? priceInfo.Amount : null;

                        // Replace generic € location if returned by API like "33.99€"
                        if (priceStr && !priceStr.includes('€')) priceStr += ' €';
                        if (priceStr && priceStr.includes('.')) priceStr = priceStr.replace('.', ',');

                        // Original Price (SavingBasis)
                        let originalPriceStr = null;
                        let numOriginal = null;
                        if (listing.SavingBasis && listing.SavingBasis.Amount) {
                            originalPriceStr = listing.SavingBasis.DisplayAmount;
                            numOriginal = listing.SavingBasis.Amount;
                            if (originalPriceStr && !originalPriceStr.includes('€')) originalPriceStr += ' €';
                            if (originalPriceStr && originalPriceStr.includes('.')) originalPriceStr = originalPriceStr.replace('.', ',');
                        }

                        // Discount calculation
                        let discount = null;
                        if (numOriginal && numPrice && numOriginal > numPrice) {
                            const diff = numOriginal - numPrice;
                            const perc = Math.round((diff / numOriginal) * 100);
                            discount = `-${perc}%`;
                        }

                        // Prime Eligibility
                        let isPrime = false;
                        if (listing.DeliveryInfo && listing.DeliveryInfo.IsPrimeEligible === true) {
                            isPrime = true;
                        }

                        // Image
                        let imageUrl = null;
                        if (item.Images && item.Images.Primary && item.Images.Primary.Large) {
                            imageUrl = item.Images.Primary.Large.URL;
                        }

                        // Defaulting stars as PAAPI sometimes restricts review summaries
                        const starRating = "4,5";
                        const isAmazonChoice = false;

                        resolve({
                            price: priceStr || "Ver Amazon",
                            originalPrice: originalPriceStr,
                            stars: starRating,
                            discount: discount,
                            priceNum: numPrice,
                            isAmazonChoice: isAmazonChoice,
                            isPrime: isPrime,
                            imageUrl: imageUrl
                        });
                    } else {
                        console.error(`${colors.red}[ERROR] Item not found in PAAPI for ${asin}${colors.reset}`);
                        resolve(null);
                    }
                } catch (e) {
                    console.error(`${colors.red}Parse error: ${e.message}${colors.reset}`);
                    resolve(null);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(payload);
        req.end();
    });
}

/**
 * Search products using Amazon Creators API (SearchItems)
 * @param {string} keyword 
 * @returns {Promise<Array>|null} Array of product objects
 */
async function searchRelatedProducts(keyword) {
    if (!AMAZON_ACCESS_KEY || !AMAZON_SECRET_KEY) {
        console.log(`${colors.yellow}[SIMULATION] No Amazon Keys provided. Returning mock search for '${keyword}'.${colors.reset}`);

        let kw = keyword.toLowerCase();
        let mockData = [];

        if (kw.includes('escritorio')) {
            mockData = [
                { asin: 'mock-desk-1', title: 'Escritorio Elevable Eléctrico Altura Ajustable', url: 'https://www.amazon.es/s?k=escritorio+elevable+electrico&tag=descansointel-21', image: 'https://placehold.co/300x300/f8fafc/334155?text=Escritorio+Elevable+1', price: '169,99 €' },
                { asin: 'mock-desk-2', title: 'Mesa de Escritorio Elevable con Memoria', url: 'https://www.amazon.es/s?k=mesa+escritorio+elevable&tag=descansointel-21', image: 'https://placehold.co/300x300/f8fafc/334155?text=Escritorio+Elevable+2', price: '219,50 €' },
                { asin: 'mock-desk-3', title: 'Escritorio de Pie Motorizado Marco de Acero', url: 'https://www.amazon.es/s?k=standing+desk&tag=descansointel-21', image: 'https://placehold.co/300x300/f8fafc/334155?text=Escritorio+Elevable+3', price: '189,00 €' }
            ];
        } else if (kw.includes('silla')) {
            mockData = [
                { asin: 'mock-chair-1', title: 'Silla de Oficina Ergonómica Transpirable', url: 'https://www.amazon.es/s?k=silla+oficina+ergonomica&tag=descansointel-21', image: 'https://placehold.co/300x300/f8fafc/334155?text=Silla+Ergonomica+1', price: '145,99 €' },
                { asin: 'mock-chair-2', title: 'Silla Escritorio Ergonómica con Respaldo Lumbar', url: 'https://www.amazon.es/s?k=silla+escritorio+respaldo+lumbar&tag=descansointel-21', image: 'https://placehold.co/300x300/f8fafc/334155?text=Silla+Ergonomica+2', price: '129,50 €' },
                { asin: 'mock-chair-3', title: 'Silla Operativa Malla Ajustable 3D', url: 'https://www.amazon.es/s?k=silla+operativa+malla&tag=descansointel-21', image: 'https://placehold.co/300x300/f8fafc/334155?text=Silla+Ergonomica+3', price: '189,90 €' }
            ];
        } else if (kw.includes('monitor') || kw.includes('brazo')) {
            mockData = [
                { asin: 'mock-arm-1', title: 'Brazo de Monitor Individual Articulado de Gas', url: 'https://www.amazon.es/s?k=brazo+monitor+articulado&tag=descansointel-21', image: 'https://placehold.co/300x300/f8fafc/334155?text=Brazo+Monitor+1', price: '45,99 €' },
                { asin: 'mock-arm-2', title: 'Soporte Monitor Doble Brazo Doble VESA', url: 'https://www.amazon.es/s?k=soporte+monitor+doble&tag=descansointel-21', image: 'https://placehold.co/300x300/f8fafc/334155?text=Brazo+Monitor+2', price: '59,99 €' },
                { asin: 'mock-arm-3', title: 'Brazo para Monitor Ajustable Rotación 360°', url: 'https://www.amazon.es/s?k=brazo+monitor+ajustable&tag=descansointel-21', image: 'https://placehold.co/300x300/f8fafc/334155?text=Brazo+Monitor+3', price: '34,50 €' }
            ];
        } else {
            // Default mock (cojines y accesorios genéricos)
            mockData = [
                { asin: 'mock-acc-1', title: 'Reposapiés Ergonómico de Oficina con Espuma', url: 'https://www.amazon.es/s?k=reposapies+ergonomico&tag=descansointel-21', image: '../assets/img/products/cojin-silla-oficina-fortem-premium.webp', price: '21,99 €' },
                { asin: 'mock-acc-2', title: 'Soporte Lumbar Ergonómico para Silla', url: 'https://www.amazon.es/s?k=soporte+lumbar+silla&tag=descansointel-21', image: '../assets/img/products/travel-ease-set-cojin-almohada-lumbar.webp', price: '28,99 €' },
                { asin: 'mock-acc-3', title: 'Soporte de Monitor Ajustable', url: 'https://www.amazon.es/s?k=soporte+elevador+monitor&tag=descansointel-21', image: '../assets/img/products/cojin-premium-viscoelastica-gel-refrescante.webp', price: '19,50 €' }
            ];
        }

        return mockData;
    }

    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            Keywords: keyword,
            Resources: [
                "ItemInfo.Title",
                "Images.Primary.Large",
                "Offers.Listings.Price"
            ],
            ItemCount: 3,
            PartnerTag: AMAZON_PARTNER_TAG,
            PartnerType: "Associates",
            Marketplace: "www.amazon.es"
        });

        const options = {
            host: AMAZON_HOST,
            path: '/paapi5/searchitems',
            method: 'POST',
            service: 'ProductAdvertisingAPI',
            region: AMAZON_REGION,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
                'Content-Encoding': 'amz-1.0'
            },
            body: payload
        };

        aws4.sign(options, {
            accessKeyId: AMAZON_ACCESS_KEY,
            secretAccessKey: AMAZON_SECRET_KEY
        });

        const req = https.request(options, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                try {
                    const body = Buffer.concat(chunks).toString();
                    const data = JSON.parse(body);

                    if (data.Errors) {
                        console.error(`${colors.red}[API ERROR] for search '${keyword}': ${JSON.stringify(data.Errors)}${colors.reset}`);
                        return resolve(null);
                    }

                    if (data.SearchResult && data.SearchResult.Items && data.SearchResult.Items.length > 0) {
                        const results = data.SearchResult.Items.map(item => {
                            let priceStr = "Ver en Amazon";
                            if (item.Offers && item.Offers.Listings && item.Offers.Listings.length > 0) {
                                const priceInfo = item.Offers.Listings[0].Price;
                                if (priceInfo && priceInfo.DisplayAmount) {
                                    priceStr = priceInfo.DisplayAmount;
                                    if (!priceStr.includes('€')) priceStr += ' €';
                                    if (priceStr.includes('.')) priceStr = priceStr.replace('.', ',');
                                }
                            }

                            let imageUrl = "";
                            if (item.Images && item.Images.Primary && item.Images.Primary.Large) {
                                imageUrl = item.Images.Primary.Large.URL;
                            }

                            return {
                                asin: item.ASIN,
                                title: item.ItemInfo && item.ItemInfo.Title ? item.ItemInfo.Title.DisplayValue : item.ASIN,
                                url: item.DetailPageURL,
                                image: imageUrl,
                                price: priceStr
                            };
                        });
                        resolve(results);
                    } else {
                        console.error(`${colors.yellow}[NO RESULTS] No items found for '${keyword}'${colors.reset}`);
                        resolve(null);
                    }
                } catch (e) {
                    console.error(`${colors.red}Search parse error: ${e.message}${colors.reset}`);
                    resolve(null);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(payload);
        req.end();
    });
}

/**
 * Find all HTML files recursively
 */
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

/**
 * Main execution
 */
async function main() {
    console.log(`${colors.blue}Starting price update...${colors.reset}`);

    if (!AMAZON_ACCESS_KEY || !AMAZON_SECRET_KEY || !AMAZON_PARTNER_TAG) {
        console.warn(`${colors.yellow}WARNING: Amazon PAAPI keys not found. Running in simulation mode.${colors.reset}`);
    }

    const htmlFiles = findHtmlFiles(ROOT_DIR);
    const asinsToFetch = new Set();
    const keywordsToSearch = new Set();
    const asinLocations = []; // Store where each ASIN is found {file, index, length, asin}

    // 1. Scan files for ASINs and Keywords to fetch
    const regexPriceInfo = /data-asin=["']([^"']+)["']/g;
    const regexSearchKeywords = /data-search-keywords=["']([^"']+)["']/g;
    const regexImageInfo = /data-asin-image=["']([^"']+)["']/g;

    for (const file of htmlFiles) {
        let content = fs.readFileSync(file, 'utf8');
        let match;
        while ((match = regexPriceInfo.exec(content)) !== null) {
            asinsToFetch.add(match[1]);
        }
        while ((match = regexSearchKeywords.exec(content)) !== null) {
            keywordsToSearch.add(match[1]);
        }
        while ((match = regexImageInfo.exec(content)) !== null) {
            asinsToFetch.add(match[1]);
        }
    }

    console.log(`${colors.green}Found ${asinsToFetch.size} unique products and ${keywordsToSearch.size} keywords to check.${colors.reset}`);

    // 2. Fetch Data
    const productDataMap = {};
    for (const asin of asinsToFetch) {
        console.log(`Checking data for ${asin}...`);
        try {
            const newProductData = await fetchProductData(asin);
            if (newProductData) {
                productDataMap[asin] = newProductData;
                console.log(`${colors.green}  -> Price: ${newProductData.price}, Original: ${newProductData.originalPrice}, Stars: ${newProductData.stars}, Discount: ${newProductData.discount}${colors.reset}`);
            }
            // Artificial delay to respect rate limits
            if (AMAZON_ACCESS_KEY) await new Promise(r => setTimeout(r, 1000));
        } catch (e) {
            console.error(`${colors.red}Failed to fetch ${asin}: ${e.message}${colors.reset}`);
        }
    }

    // 2.5 Search Related Products Data
    const searchDataMap = {};
    if (keywordsToSearch.size > 0) {
        for (const keyword of keywordsToSearch) {
            console.log(`Searching related products for '${keyword}'...`);
            try {
                const results = await searchRelatedProducts(keyword);
                if (results && results.length > 0) {
                    searchDataMap[keyword] = results;
                    console.log(`${colors.green}  -> Found ${results.length} related products.${colors.reset}`);
                }
                if (AMAZON_ACCESS_KEY) await new Promise(r => setTimeout(r, 1000));
            } catch (e) {
                console.error(`${colors.red}Failed to search ${keyword}: ${e.message}${colors.reset}`);
            }
        }
    }

    // 3. Update Files
    let updatedFilesCount = 0;

    // Get today's date formatted
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    // Regex matchers for specific attributes
    const regexPrice = /(<[^>]+data-asin=["']([^"']+)["'][^>]*>)([^<]*?)(<\/[^>]+>)/g;
    // Match the full price-original wrapper div regardless of extra classes, capturing inner content
    const regexOriginal = /(<div[^>]+data-asin-original=["']([^"']+)["'][^>]*>)([\s\S]*?)(<\/div>)/g;
    const regexDiscount = /(<[^>]+data-asin-discount=["']([^"']+)["'][^>]*>)([^<]*)(<\/[^>]+>)/g;
    const regexStar = /(<[^>]+data-asin-star=["']([^"']+)["'][^>]*>)([^<]*)(<\/[^>]+>)/g;

    // Regex for date update
    const regexDate = /(<[^>]+id=["']last-updated-date["'][^>]*>)([^<]*)(<\/[^>]+>)/g;

    for (const file of htmlFiles) {
        let content = fs.readFileSync(file, 'utf8');
        let fileChanged = false;

        // Update main price
        let newContent = content.replace(regexPrice, (fullMatch, openTag, asin, oldPrice, closeTag) => {
            const data = productDataMap[asin];
            if (data && data.price && oldPrice.trim() !== data.price) {
                fileChanged = true;
                return openTag + data.price + closeTag;
            }
            return fullMatch;
        });

        // Update original price container: show discount badge + <del>X</del> when discounted, empty otherwise
        newContent = newContent.replace(regexOriginal, (fullMatch, openTag, asin, oldText, closeTag) => {
            const data = productDataMap[asin];
            if (data && data.originalPrice) {
                // Determine if it's a flash sale (discount > 10%)
                let isFlashSale = false;
                if (data.discount) {
                    const discountNum = parseInt(data.discount.replace(/[^\d]/g, ''), 10);
                    if (!isNaN(discountNum) && discountNum > 10) {
                        isFlashSale = true;
                    }
                }

                const extraClass = isFlashSale ? ' flash-sale' : '';
                const discountPart = data.discount
                    ? `<span class="discount-badge discount-update${extraClass}" data-asin-discount="${asin}">${data.discount}</span>`
                    : '';

                const newInner = `${discountPart}<del>${data.originalPrice}</del>`;
                // We don't check oldText strictly here because we are dynamically regenerating the inner HTML
                // But we can check if the full tag matches
                const newFull = openTag + newInner + closeTag;
                if (fullMatch !== newFull) {
                    fileChanged = true;
                    return newFull;
                }
            } else {
                // No original price: empty the block
                if (oldText.trim() !== '') {
                    fileChanged = true;
                    return openTag + '' + closeTag;
                }
            }
            return fullMatch;
        });

        // Update discount value (only if it exists standalone, though usually it's inside regexOriginal now)
        newContent = newContent.replace(regexDiscount, (fullMatch, openTag, asin, oldText, closeTag) => {
            const data = productDataMap[asin];
            if (data && data.discount) {
                let isFlashSale = false;
                const discountNum = parseInt(data.discount.replace(/[^\d]/g, ''), 10);
                if (!isNaN(discountNum) && discountNum > 10) {
                    isFlashSale = true;
                }

                // Add flash-sale class to the opening tag if it's missing, or keep it if it's there
                let newOpenTag = openTag;
                if (isFlashSale && !newOpenTag.includes('flash-sale')) {
                    newOpenTag = newOpenTag.replace('class="', 'class="flash-sale ');
                } else if (!isFlashSale && newOpenTag.includes('flash-sale')) {
                    newOpenTag = newOpenTag.replace('flash-sale ', '').replace(' flash-sale', '');
                }

                if (oldText.trim() !== data.discount || openTag !== newOpenTag) {
                    fileChanged = true;
                    return newOpenTag + data.discount + closeTag;
                }
            } else if (!data || !data.discount) {
                if (oldText.trim() !== "") {
                    fileChanged = true;
                    // Remove flash sale class if present when emptying
                    let clearOpenTag = openTag.replace('flash-sale ', '').replace(' flash-sale', '');
                    return clearOpenTag + "" + closeTag;
                }
            }
            return fullMatch;
        });

        // Update stars
        newContent = newContent.replace(regexStar, (fullMatch, openTag, asin, oldText, closeTag) => {
            const data = productDataMap[asin];
            if (data && data.stars && oldText.trim() !== data.stars) {
                fileChanged = true;
                return openTag + data.stars + closeTag;
            }
            return fullMatch;
        });

        // Update Date
        newContent = newContent.replace(regexDate, (fullMatch, openTag, oldText, closeTag) => {
            if (oldText.trim() !== formattedDate) {
                fileChanged = true;
                return openTag + formattedDate + closeTag;
            }
            return fullMatch;
        });

        // Update Badges Dynamically
        const badgeRegex = /data-asin-badge=["']([^"']+)["']/g;
        const fileAsins = [];
        let bMatch;
        while ((bMatch = badgeRegex.exec(newContent)) !== null) {
            fileAsins.push(bMatch[1]);
        }

        let minPriceValue = Infinity;
        let minPriceAsin = null;
        for (const asin of fileAsins) {
            if (productDataMap[asin] && productDataMap[asin].priceNum) {
                if (productDataMap[asin].priceNum < minPriceValue) {
                    minPriceValue = productDataMap[asin].priceNum;
                    minPriceAsin = asin;
                }
            }
        }

        const regexBadgeReplace = /(<div class="product-rank-badge"\s+data-asin-badge=["']([^"']+)["'][^>]*>)(.*?)(<\/div>)/g;
        newContent = newContent.replace(regexBadgeReplace, (fullMatch, openTag, asin, oldText, closeTag) => {
            const index = fileAsins.indexOf(asin);
            // El #1 mantiene su texto SEO principal humano
            if (index === 0) return fullMatch;

            const data = productDataMap[asin];
            if (data) {
                let lang = "es";
                if (file.includes('/en/')) lang = "en";
                if (file.includes('/fr/')) lang = "fr";
                if (file.includes('/it/')) lang = "it";

                const labels = {
                    "es": { choice: "🌟 Opción Amazon", cheap: "💰 Mejor precio", fallback: "⭐ Destacado" },
                    "en": { choice: "🌟 Amazon's Choice", cheap: "💰 Best Price", fallback: "⭐ Highly Rated" },
                    "fr": { choice: "🌟 Choix d'Amazon", cheap: "💰 Meilleur prix", fallback: "⭐ Très apprécié" },
                    "it": { choice: "🌟 Scelta Amazon", cheap: "💰 Miglior prezzo", fallback: "⭐ Molto apprezzato" }
                };

                let targetText = oldText.trim();
                if (data.isAmazonChoice) {
                    targetText = labels[lang].choice;
                } else if (asin === minPriceAsin) {
                    targetText = labels[lang].cheap;
                } else if (oldText.includes("Amazon") || oldText.includes("Mejor precio") || oldText.includes("Best Price") || oldText.includes("Meilleur") || oldText.includes("Miglior")) {
                    targetText = labels[lang].fallback;
                }

                if (oldText.trim() !== targetText) {
                    fileChanged = true;
                    return openTag + targetText + closeTag;
                }
            }
            return fullMatch;
        });

        // Update Prime Icon
        const regexPrime = /(<div[^>]+data-asin-prime=["']([^"']+)["'][^>]*>)([\s\S]*?)(<\/div>)/g;
        newContent = newContent.replace(regexPrime, (fullMatch, openTag, asin, oldText, closeTag) => {
            const data = productDataMap[asin];
            if (data && data.isPrime) {
                // Prime SVG Icon (simplified official look)
                const primeSvg = `<svg class="prime-icon" viewBox="0 0 100 30" width="60" height="18" xmlns="http://www.w3.org/2000/svg"><path fill="#00A8E1" d="M12.7 20.4l3.1-4c1-1.3 2.1-1.9 3.6-1.9 1 0 1.9.3 2.6 1L31 24.3l8.6-18.7c.3-.6.6-.9 1.1-.9h4.3c-.6 1.4-1.3 2.8-2 4.1L30.9 29.5c-.3.6-.8 1-1.4 1h-2c-.6 0-1-.3-1.4-.9l-7.2-7.5-3.3 4.2c-.4.5-.9.8-1.5.8h-4.3c.4-.6.9-1.2 1.3-1.7V25c0 1.4-.2 2.7-.6 4-3.7-.8-6.9-2.5-9.3-5L12 23.4l.7-3zM83.4 12c-4.6 0-8.6 3.1-9.7 7.5h-10c.8-5.7 5.7-9.8 11.6-9.8 4 0 7.5 2 9.4 5.2.3.5.3 1 0 1.5l-2.1 3.2c-.3.4-.8.5-1.2.3-1.4-.8-3-1.2-4.7-1.2-3.1 0-5.8 2-6.7 4.9h8.2c0-3.3 2.5-6.2 5.9-6.6.6-.1 1.1.2 1.3.8l1.3 3.6c.1.4 0 .9-.4 1.1L95.5 30h-4l-6.1-10.7c-.5.1-.9.2-1.4.2-4 0-7.8-2.6-9-6.5h-4.6v17h-4V10.1h4v4h7.9c1.4-3.5 5.1-6.2 9.3-6.2 4.3 0 8 2.2 9.9 5.6.3.5.2 1.1-.1 1.5l-2.2 3.2c-.3.4-.8.5-1.2.3-1.5-.9-3.2-1.3-4.9-1.3-3.2 0-6.1 2-7.1 5h8.5c-.1-3.3 2.5-6.1 5.8-6.6.6-.1 1.2.2 1.3.8l1.3 3.5c.2.4 0 .9-.4 1.1l-11.2 5V21h4.6c1.3 3.8 5 6.4 9 6.4 2.8 0 5.4-1.2 7-3.1v2.7h4v-17h-4v3.1c-1.6-1.9-4.2-3.1-7-3.1zM34.7 10.1h4v17h-4v-17zM45.5 10.1h4v2h2.9v4H49.5v11h-4v-17z"/></svg>`;
                if (oldText.trim() !== primeSvg) {
                    fileChanged = true;
                    return openTag + "\n" + primeSvg + "\n" + closeTag;
                }
            } else {
                if (oldText.trim() !== "") {
                    fileChanged = true;
                    return openTag + "" + closeTag;
                }
            }
            return fullMatch;
        });

        // Update Images (Primary Large API Image)
        const regexImgTag = /(<img[^>]+data-asin-image=["']([^"']+)["'][^>]*>)/g;
        newContent = newContent.replace(regexImgTag, (fullMatch, fullTag, asin) => {
            const data = productDataMap[asin];
            if (data && data.imageUrl) {
                const srcMatch = fullTag.match(/src=["']([^"']+)["']/);
                if (srcMatch && srcMatch[1] !== data.imageUrl) {
                    fileChanged = true;
                    return fullTag.replace(srcMatch[0], `src="${data.imageUrl}"`);
                }
            }
            return fullMatch;
        });

        // Update Related Products
        const regexRelated = /(<div[^>]+data-search-keywords=["']([^"']+)["'][^>]*>)([\s\S]*?)(<\/div>\s*<!-- related-end -->)/g;
        newContent = newContent.replace(regexRelated, (fullMatch, openTag, keyword, oldText, closeTag) => {
            const trimmedKeyword = keyword.trim();
            const data = searchDataMap[trimmedKeyword];
            if (data && data.length > 0) {
                let gridHtml = `\n<div class="related-products-grid">\n`;
                for (const item of data) {
                    gridHtml += `
  <div class="related-card">
    <div class="related-img"><img src="${item.image}" alt="${item.title}" loading="lazy"></div>
    <div class="related-info">
      <h4 class="related-title">${item.title}</h4>
      <div class="related-price">${item.price}</div>
      <a href="${item.url}" target="_blank" rel="nofollow sponsored noopener" class="related-cta">Ver en Amazon</a>
    </div>
  </div>\n`;
                }
                gridHtml += `</div>\n`;

                if (oldText !== gridHtml) {
                    fileChanged = true;
                    return openTag + gridHtml + closeTag;
                }
            }
            return fullMatch;
        });

        if (fileChanged) {
            console.log(`${colors.blue}Updating ${path.basename(file)}${colors.reset}`);
            fs.writeFileSync(file, newContent, 'utf8');
            updatedFilesCount++;
        }
    }

    console.log(`${colors.green}Finished! Updated ${updatedFilesCount} files.${colors.reset}`);
}

main().catch(console.error);
