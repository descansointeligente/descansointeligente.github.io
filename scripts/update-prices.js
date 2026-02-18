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
 * Fetch price from RapidAPI (Real-Time Amazon Data)
 * @param {string} asin 
 * @returns {Promise<string|null>} Price string (e.g. "33,99 €") or null
 */
async function fetchPrice(asin) {
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
                        resolve(price);
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

    // 1. Scan files for ASINs
    const regex = /(<[^>]+data-asin=["']([^"']+)["'][^>]*>)([^<]*)(<\/[^>]+>)/g;

    for (const file of htmlFiles) {
        let content = fs.readFileSync(file, 'utf8');
        let match;
        while ((match = regex.exec(content)) !== null) {
            const asin = match[2];
            asinsToFetch.add(asin);
            // We don't store exact locations because we replace by string later
        }
    }

    console.log(`${colors.green}Found ${asinsToFetch.size} unique products to check.${colors.reset}`);

    // 2. Fetch Prices
    const priceMap = {};
    for (const asin of asinsToFetch) {
        console.log(`Checking price for ${asin}...`);
        try {
            const newPrice = await fetchPrice(asin);
            if (newPrice) {
                priceMap[asin] = newPrice;
                console.log(`${colors.green}  -> New price: ${newPrice}${colors.reset}`);
            }
            // Artificial delay to respect rate limits
            if (RAPIDAPI_KEY) await new Promise(r => setTimeout(r, 1000));
        } catch (e) {
            console.error(`${colors.red}Failed to fetch ${asin}: ${e.message}${colors.reset}`);
        }
    }

    // 3. Update Files
    let updatedFilesCount = 0;

    if (Object.keys(priceMap).length === 0) {
        console.log("No prices to update.");
        return;
    }

    for (const file of htmlFiles) {
        let content = fs.readFileSync(file, 'utf8');
        let fileChanged = false;

        const newContent = content.replace(regex, (fullMatch, openTag, asin, oldPrice, closeTag) => {
            const newPrice = priceMap[asin];
            if (newPrice && oldPrice.trim() !== newPrice) {
                console.log(`${colors.blue}Updating ${path.basename(file)}: ${asin} (${oldPrice.trim()} -> ${newPrice})${colors.reset}`);
                fileChanged = true;
                return openTag + newPrice + closeTag;
            }
            return fullMatch;
        });

        if (fileChanged) {
            fs.writeFileSync(file, newContent, 'utf8');
            updatedFilesCount++;
        }
    }

    console.log(`${colors.green}Finished! Updated ${updatedFilesCount} files.${colors.reset}`);
}

main().catch(console.error);
