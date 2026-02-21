const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';
const ROOT_DIR = path.join(__dirname, '..');

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    blue: "\x1b[34m"
};

/**
 * Fetch data from RapidAPI (Real-Time Amazon Data)
 * @param {string} asin 
 * @returns {Promise<object|null>} Object with price, original_price, star_rating
 */
async function fetchProductData(asin) {
    if (!RAPIDAPI_KEY) {
        console.log(`${colors.yellow}[SIMULATION] No API Key provided. Skipping fetch for ${asin}.${colors.reset}`);
        return null;
    }

    return new Promise((resolve, reject) => {
        const options = {
            method: 'GET',
            hostname: RAPIDAPI_HOST,
            port: null,
            path: `/product-details?asin=${asin}&country=ES`,
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': RAPIDAPI_HOST
            }
        };

        const req = https.request(options, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                try {
                    const body = Buffer.concat(chunks).toString();
                    const data = JSON.parse(body);

                    if (data.data && data.data.product_price) {
                        // Format: "33.99" -> "33,99 €"
                        let price = data.data.product_price.replace('.', ',');
                        if (!price.includes('€')) price += ' €';

                        let originalPrice = data.data.product_original_price;
                        if (originalPrice) {
                            originalPrice = originalPrice.replace('.', ',');
                            if (!originalPrice.includes('€')) originalPrice += ' €';
                        }

                        let starRating = data.data.product_star_rating ? data.data.product_star_rating.replace('.', ',') : null;

                        let discount = null;
                        // Calculate percentage if both exist
                        const numPrice = parseFloat(data.data.product_price.replace(/[^\d.]/g, ''));
                        let numOriginal = null;
                        if (data.data.product_original_price) {
                            numOriginal = parseFloat(data.data.product_original_price.replace(/[^\d.]/g, ''));
                        }

                        if (numOriginal && numPrice && numOriginal > numPrice) {
                            const diff = numOriginal - numPrice;
                            const perc = Math.round((diff / numOriginal) * 100);
                            discount = `-${perc}%`;
                        }

                        resolve({
                            price: price,
                            originalPrice: originalPrice,
                            stars: starRating,
                            discount: discount
                        });
                    } else {
                        console.error(`${colors.red}[ERROR] No price found for ${asin}${colors.reset}`);
                        resolve(null);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (e) => reject(e));
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
    const regexPrice = /(<[^>]+data-asin=["']([^"']+)["'][^>]*>)([^<]*)(<\/[^>]+>)/g;
    const regexOriginal = /(<[^>]+data-asin-original=["']([^"']+)["'][^>]*>)(.*?)(<\/[^>]+>)/g;
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

        // Update original price (keep <del> wrapper logic simplified by letting inner HTML be updated)
        newContent = newContent.replace(regexOriginal, (fullMatch, openTag, asin, oldText, closeTag) => {
            const data = productDataMap[asin];
            if (data && data.originalPrice) {
                // Format: <del>45,89 €</del>
                const newReplacement = `<del>${data.originalPrice}</del>`;
                if (oldText.trim() !== newReplacement) {
                    fileChanged = true;
                    return openTag + newReplacement + closeTag;
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

        // Update date
        newContent = newContent.replace(regexDate, (fullMatch, openTag, oldText, closeTag) => {
            if (oldText.trim() !== formattedDate) {
                fileChanged = true;
                return openTag + formattedDate + closeTag;
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
