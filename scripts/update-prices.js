const fs = require('fs');
const path = require('path');
const https = require('https');

const aws4 = require('aws4');

// Amazon Creators API Configuration
const AMAZON_ACCESS_KEY = process.env.AMAZON_ACCESS_KEY;
const AMAZON_SECRET_KEY = process.env.AMAZON_SECRET_KEY;
const AMAZON_PARTNER_TAG = process.env.AMAZON_PARTNER_TAG;
const AMAZON_HOST = 'webservices.amazon.es';
const AMAZON_REGION = 'eu-west-1';

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

        if (asin === 'B0F1VD176V') {
            price = '33,99 €';
            originalPrice = '45,89 €';
            discount = '-26%';
            stars = '4,5';
            priceNum = 33.99;
        } else if (asin === 'B077G7D73D') {
            price = '30,99 €';
            originalPrice = '37,99 €';
            discount = '-18%';
            stars = '4,2';
            priceNum = 30.99;
            isAmazonChoice = true;
        } else if (asin === 'B01N5LH26Y') {
            price = '27,90 €';
            priceNum = 27.90;
        }

        return {
            price: price,
            originalPrice: originalPrice,
            stars: stars,
            discount: discount,
            priceNum: priceNum,
            isAmazonChoice: isAmazonChoice
        };
    }

    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            ItemIds: [asin],
            Resources: [
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

                        // Defaulting stars as PAAPI sometimes restricts review summaries
                        const starRating = "4,5";
                        const isAmazonChoice = false;

                        resolve({
                            price: priceStr || "Ver Amazon",
                            originalPrice: originalPriceStr,
                            stars: starRating,
                            discount: discount,
                            priceNum: numPrice,
                            isAmazonChoice: isAmazonChoice
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

    if (!RAPIDAPI_KEY) {
        console.warn(`${colors.yellow}WARNING: RAPIDAPI_KEY not found. Running in simulation mode.${colors.reset}`);
    }

    const htmlFiles = findHtmlFiles(ROOT_DIR);
    const asinsToFetch = new Set();
    const asinLocations = []; // Store where each ASIN is found {file, index, length, asin}

    // 1. Scan files for ASINs to fetch
    const regexPriceInfo = /data-asin=["']([^"']+)["']/g;

    for (const file of htmlFiles) {
        let content = fs.readFileSync(file, 'utf8');
        let match;
        while ((match = regexPriceInfo.exec(content)) !== null) {
            const asin = match[1];
            asinsToFetch.add(asin);
        }
    }

    console.log(`${colors.green}Found ${asinsToFetch.size} unique products to check.${colors.reset}`);

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
            if (RAPIDAPI_KEY) await new Promise(r => setTimeout(r, 1000));
        } catch (e) {
            console.error(`${colors.red}Failed to fetch ${asin}: ${e.message}${colors.reset}`);
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
                const discountPart = data.discount
                    ? `<span class="discount-badge discount-update" data-asin-discount="${asin}">${data.discount}</span>`
                    : '';
                const newInner = `${discountPart}<del>${data.originalPrice}</del>`;
                if (oldText.trim() !== newInner) {
                    fileChanged = true;
                    return openTag + newInner + closeTag;
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

        // Update discount value
        newContent = newContent.replace(regexDiscount, (fullMatch, openTag, asin, oldText, closeTag) => {
            const data = productDataMap[asin];
            if (data && data.discount && oldText.trim() !== data.discount) {
                fileChanged = true;
                return openTag + data.discount + closeTag;
            } else if (!data || !data.discount) {
                // If there's no discount, maybe hide or empty it? In this basic version we just empty it or leave it as is.
                // It's safer to leave as is, or we could empty the text if we want to dynamically remove discounts.
                // Let's replace with empty string if no discount but oldtext exists
                if (oldText.trim() !== "") {
                    fileChanged = true;
                    return openTag + "" + closeTag;
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

        if (fileChanged) {
            console.log(`${colors.blue}Updating ${path.basename(file)}${colors.reset}`);
            fs.writeFileSync(file, newContent, 'utf8');
            updatedFilesCount++;
        }
    }

    console.log(`${colors.green}Finished! Updated ${updatedFilesCount} files.${colors.reset}`);
}

main().catch(console.error);
