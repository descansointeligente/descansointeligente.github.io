const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

// Simple console colors
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m"
};
// Amazon Creators API Configuration
const AMAZON_CREATOR_CLIENT_ID = process.env.AMAZON_CREATOR_CLIENT_ID;
const AMAZON_CREATOR_CLIENT_SECRET = process.env.AMAZON_CREATOR_CLIENT_SECRET;
const AMAZON_CREATOR_VERSION = process.env.AMAZON_CREATOR_VERSION || '3.2';
const AMAZON_PARTNER_TAG = process.env.AMAZON_PARTNER_TAG;
const AMAZON_MARKETPLACE = process.env.AMAZON_MARKETPLACE || 'www.amazon.es';
const AMAZON_LANG = process.env.AMAZON_LANG || 'es_ES';
const AMAZON_CURRENCY = process.env.AMAZON_CURRENCY || 'EUR';
const AMAZON_API_BASE_URL = 'https://creatorsapi.amazon';
const REQUEST_TIMEOUT_MS = Number(process.env.AMAZON_REQUEST_TIMEOUT_MS || 20000);

let accessTokenCache = null;

function parseCliArgs(argv) {
    return {
        dryRun: argv.includes('--dry-run'),
        strict: argv.includes('--strict')
    };
}

function getCreatorsConfigSummary() {
    return {
        version: AMAZON_CREATOR_VERSION,
        marketplace: AMAZON_MARKETPLACE,
        language: AMAZON_LANG,
        currency: AMAZON_CURRENCY,
        hasClientId: Boolean(AMAZON_CREATOR_CLIENT_ID),
        hasClientSecret: Boolean(AMAZON_CREATOR_CLIENT_SECRET),
        hasPartnerTag: Boolean(AMAZON_PARTNER_TAG),
        requestTimeoutMs: REQUEST_TIMEOUT_MS
    };
}

function validateCreatorsConfiguration() {
    const supportedVersions = new Set(['2.1', '2.2', '2.3', '3.1', '3.2', '3.3']);
    const issues = [];
    const warnings = [];

    if (!Number.isFinite(REQUEST_TIMEOUT_MS) || REQUEST_TIMEOUT_MS < 1000) {
        issues.push(`Invalid AMAZON_REQUEST_TIMEOUT_MS value: ${process.env.AMAZON_REQUEST_TIMEOUT_MS || REQUEST_TIMEOUT_MS}`);
    }

    if (!supportedVersions.has(AMAZON_CREATOR_VERSION)) {
        warnings.push(`Unknown AMAZON_CREATOR_VERSION '${AMAZON_CREATOR_VERSION}'. Expected one of: ${Array.from(supportedVersions).join(', ')}`);
    }

    if (!/^www\.amazon\./.test(AMAZON_MARKETPLACE)) {
        warnings.push(`Unexpected AMAZON_MARKETPLACE '${AMAZON_MARKETPLACE}'.`);
    }

    if (!/^[a-z]{2}_[A-Z]{2}$/.test(AMAZON_LANG)) {
        warnings.push(`Unexpected AMAZON_LANG '${AMAZON_LANG}'.`);
    }

    if (!/^[A-Z]{3}$/.test(AMAZON_CURRENCY)) {
        warnings.push(`Unexpected AMAZON_CURRENCY '${AMAZON_CURRENCY}'.`);
    }

    if ((AMAZON_CREATOR_CLIENT_ID || AMAZON_CREATOR_CLIENT_SECRET || AMAZON_PARTNER_TAG) && !hasCreatorsCredentials()) {
        issues.push('Incomplete Creators API credentials. Define AMAZON_CREATOR_CLIENT_ID, AMAZON_CREATOR_CLIENT_SECRET and AMAZON_PARTNER_TAG together.');
    }

    return { issues, warnings };
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function hasCreatorsCredentials() {
    return Boolean(
        AMAZON_CREATOR_CLIENT_ID &&
        AMAZON_CREATOR_CLIENT_SECRET &&
        AMAZON_PARTNER_TAG
    );
}

function getTokenEndpoint(version) {
    const majorVersion = String(version || '').split('.')[0];

    if (majorVersion === '3') {
        const endpoints = {
            '3.1': 'https://api.amazon.com/auth/o2/token',
            '3.2': 'https://api.amazon.co.uk/auth/o2/token',
            '3.3': 'https://api.amazon.co.jp/auth/o2/token'
        };

        return endpoints[version] || endpoints['3.2'];
    }

    const endpoints = {
        '2.1': 'https://creatorsapi.auth.us-east-1.amazoncognito.com/oauth2/token',
        '2.2': 'https://creatorsapi.auth.eu-south-2.amazoncognito.com/oauth2/token',
        '2.3': 'https://creatorsapi.auth.us-west-2.amazoncognito.com/oauth2/token'
    };

    return endpoints[version] || endpoints['2.2'];
}

function formatMoney(amount, currency) {
    if (typeof amount !== 'number') return null;

    try {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: currency || AMAZON_CURRENCY
        }).format(amount).replace(/\u00a0/g, ' ');
    } catch (_) {
        return `${amount.toFixed(2).replace('.', ',')} ${currency || AMAZON_CURRENCY}`;
    }
}

function normalizeDisplayAmount(money) {
    if (!money) return null;
    if (typeof money.amount === 'number') {
        return formatMoney(money.amount, money.currency);
    }
    return money.displayAmount || null;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function requestJson(urlString, options = {}, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlString);

        const requestOptions = {
            protocol: url.protocol,
            hostname: url.hostname,
            port: url.port || 443,
            path: `${url.pathname}${url.search}`,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = https.request(requestOptions, (res) => {
            const chunks = [];

            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                const rawBody = Buffer.concat(chunks).toString('utf8');
                const isJson = (res.headers['content-type'] || '').includes('application/json');
                let parsedBody = rawBody;

                if (isJson && rawBody) {
                    try {
                        parsedBody = JSON.parse(rawBody);
                    } catch (error) {
                        return reject(new Error(`Invalid JSON response: ${error.message}`));
                    }
                }

                if (res.statusCode < 200 || res.statusCode >= 300) {
                    const message = typeof parsedBody === 'string'
                        ? parsedBody
                        : JSON.stringify(parsedBody);
                    return reject(new Error(`HTTP ${res.statusCode}: ${message}`));
                }

                resolve(parsedBody);
            });
        });

        req.on('error', reject);
        req.setTimeout(REQUEST_TIMEOUT_MS, () => {
            req.destroy(new Error(`Request timeout after ${REQUEST_TIMEOUT_MS}ms`));
        });

        if (body) {
            req.write(body);
        }

        req.end();
    });
}

async function getAccessToken() {
    if (!hasCreatorsCredentials()) return null;

    if (accessTokenCache && accessTokenCache.expiresAt > Date.now() + 60_000) {
        return accessTokenCache.token;
    }

    const version = AMAZON_CREATOR_VERSION;
    const tokenEndpoint = getTokenEndpoint(version);
    const isV3 = String(version).startsWith('3.');

    let headers;
    let body;

    if (isV3) {
        headers = {
            'Content-Type': 'application/json'
        };
        body = JSON.stringify({
            grant_type: 'client_credentials',
            client_id: AMAZON_CREATOR_CLIENT_ID,
            client_secret: AMAZON_CREATOR_CLIENT_SECRET,
            scope: 'creatorsapi::default'
        });
    } else {
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${AMAZON_CREATOR_CLIENT_ID}:${AMAZON_CREATOR_CLIENT_SECRET}`).toString('base64')}`
        };
        body = 'grant_type=client_credentials&scope=creatorsapi%2Fdefault';
    }

    const response = await requestJson(tokenEndpoint, {
        method: 'POST',
        headers
    }, body);

    if (!response.access_token) {
        throw new Error('Creators API token response missing access_token');
    }

    const expiresInMs = (response.expires_in || 3600) * 1000;
    accessTokenCache = {
        token: response.access_token,
        expiresAt: Date.now() + expiresInMs
    };

    return accessTokenCache.token;
}

async function creatorsApiPost(endpointPath, payload) {
    const token = await getAccessToken();
    if (!token) {
        throw new Error('Creators API access token unavailable');
    }
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-marketplace': AMAZON_MARKETPLACE
    };

    if (String(AMAZON_CREATOR_VERSION).startsWith('2.')) {
        headers.Version = AMAZON_CREATOR_VERSION;
    }

    return requestJson(`${AMAZON_API_BASE_URL}${endpointPath}`, {
        method: 'POST',
        headers
    }, JSON.stringify(payload));
}

function parseOfferListing(listing) {
    if (!listing) {
        return {
            price: null,
            priceNum: null,
            originalPrice: null,
            originalPriceNum: null,
            discount: null,
            savingsAmount: null,
            isBuyBoxWinner: false,
            availability: null
        };
    }

    const priceMoney = listing.price && listing.price.money ? listing.price.money : null;
    const savingBasisMoney = listing.savingBasis && listing.savingBasis.money ? listing.savingBasis.money : null;
    const savingsMoney = listing.savings && listing.savings.money ? listing.savings.money : null;

    let discount = null;
    if (typeof listing.savings?.percentage === 'number') {
        discount = `-${Math.round(listing.savings.percentage)}%`;
    } else if (
        savingBasisMoney &&
        typeof savingBasisMoney.amount === 'number' &&
        priceMoney &&
        typeof priceMoney.amount === 'number' &&
        savingBasisMoney.amount > priceMoney.amount
    ) {
        const percentage = Math.round(((savingBasisMoney.amount - priceMoney.amount) / savingBasisMoney.amount) * 100);
        discount = `-${percentage}%`;
    }

    return {
        price: normalizeDisplayAmount(priceMoney),
        priceNum: typeof priceMoney?.amount === 'number' ? priceMoney.amount : null,
        originalPrice: normalizeDisplayAmount(savingBasisMoney),
        originalPriceNum: typeof savingBasisMoney?.amount === 'number' ? savingBasisMoney.amount : null,
        discount,
        savingsAmount: normalizeDisplayAmount(savingsMoney),
        isBuyBoxWinner: listing.isBuyBoxWinner === true,
        availability: listing.availability?.type || null,
        dealDetails: listing.dealDetails || null,
        merchantName: listing.merchantInfo?.name || null
    };
}

function mapItemToProductData(item) {
    const listing = item?.offersV2?.listings?.[0] || null;
    const parsedOffer = parseOfferListing(listing);

    return {
        asin: item?.asin || null,
        title: item?.itemInfo?.title?.displayValue || item?.asin || null,
        detailPageURL: item?.detailPageURL || null,
        price: parsedOffer.price || 'Ver en Amazon',
        originalPrice: parsedOffer.originalPrice,
        discount: parsedOffer.discount,
        priceNum: parsedOffer.priceNum,
        originalPriceNum: parsedOffer.originalPriceNum,
        savingsAmount: parsedOffer.savingsAmount,
        isAmazonChoice: false,
        isBuyBoxWinner: parsedOffer.isBuyBoxWinner,
        availability: parsedOffer.availability,
        dealDetails: parsedOffer.dealDetails,
        merchantName: parsedOffer.merchantName,
        imageUrl: item?.images?.primary?.large?.url || item?.images?.primary?.medium?.url || item?.images?.primary?.small?.url || null,
        parentASIN: item?.parentASIN || null,
        stars: null
    };
}

async function getItemsBatch(asins) {
    const payload = {
        itemIds: asins,
        itemIdType: 'ASIN',
        marketplace: AMAZON_MARKETPLACE,
        partnerTag: AMAZON_PARTNER_TAG,
        languagesOfPreference: [AMAZON_LANG],
        currencyOfPreference: AMAZON_CURRENCY,
        condition: 'New',
        resources: [
            'images.primary.large',
            'itemInfo.title',
            'offersV2.listings.price',
            'offersV2.listings.availability',
            'offersV2.listings.dealDetails',
            'offersV2.listings.isBuyBoxWinner',
            'offersV2.listings.condition',
            'parentASIN'
        ]
    };

    return creatorsApiPost('/catalog/v1/getItems', payload);
}

async function searchItemsRequest(keyword) {
    const payload = {
        keywords: keyword,
        itemCount: 3,
        marketplace: AMAZON_MARKETPLACE,
        partnerTag: AMAZON_PARTNER_TAG,
        languagesOfPreference: [AMAZON_LANG],
        currencyOfPreference: AMAZON_CURRENCY,
        availability: 'Available',
        condition: 'New',
        sortBy: 'Relevance',
        resources: [
            'images.primary.medium',
            'itemInfo.title',
            'offersV2.listings.price',
            'offersV2.listings.availability',
            'offersV2.listings.dealDetails',
            'offersV2.listings.isBuyBoxWinner'
        ]
    };

    return creatorsApiPost('/catalog/v1/searchItems', payload);
}

const ROOT_DIR = path.join(__dirname, '..');

/**
 * Fetch product data from Amazon Creators API
 * @param {string} asin 
 * @returns {Promise<object|null>} Object with price, original_price, star_rating
 */
async function fetchProductData(asin) {
    if (!hasCreatorsCredentials()) {
        console.log(`${colors.yellow}[SIMULATION] No Amazon Creators credentials provided. Returning mock data for ${asin}.${colors.reset}`);

        // Mock data logic to show the user how discounts look
        let price = '29,99 €';
        let originalPrice = null;
        let discount = null;
        let priceNum = 29.99;
        let mockImage = `https://placehold.co/300x300/f8fafc/334155?text=Accesorio+Amazon`;

        // Cojines
        if (asin === 'B0F1VD176V') {
            price = '33,99 €';
            originalPrice = '45,89 €';
            discount = '-26%';
            priceNum = 33.99;
            mockImage = `https://placehold.co/300x300/f8fafc/334155?text=Cojin+Fortem`;
        } else if (asin === 'B077G7D73D') {
            price = '30,99 €';
            originalPrice = '37,99 €';
            discount = '-18%';
            priceNum = 30.99;
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
            mockImage = `https://placehold.co/300x300/f8fafc/334155?text=Brazo+BONTEC+Gas`;
        } else if (asin === 'B091D2CKC7') {
            price = '29,99 €';
            priceNum = 29.99;
            mockImage = `https://placehold.co/300x300/f8fafc/334155?text=Brazo+Ergosolid`;
        } else if (asin === 'B01MR397OH') {
            price = '23,61 €';
            priceNum = 23.61;
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
            stars: null,
            discount: discount,
            priceNum: priceNum,
            isAmazonChoice: false,
            isBuyBoxWinner: false,
            imageUrl: mockImage
        };
    }

    try {
        const data = await getItemsBatch([asin]);
        if (Array.isArray(data.errors) && data.errors.length > 0) {
            console.error(`${colors.red}[API ERROR] for ${asin}: ${JSON.stringify(data.errors)}${colors.reset}`);
        }

        const items = data.itemResults && Array.isArray(data.itemResults.items)
            ? data.itemResults.items
            : [];
        const item = items.find(entry => entry.asin === asin) || items[0];

        if (!item) {
            console.error(`${colors.red}[ERROR] Item not found in Creators API for ${asin}${colors.reset}`);
            return null;
        }

        return mapItemToProductData(item);
    } catch (e) {
        console.error(`${colors.red}[API ERROR] Failed to fetch ${asin}: ${e.message}${colors.reset}`);
        return null;
    }
}

/**
 * Search products using Amazon Creators API (SearchItems)
 * @param {string} keyword 
 * @returns {Promise<Array>|null} Array of product objects
 */
async function searchRelatedProducts(keyword) {
    if (!hasCreatorsCredentials()) {
        console.log(`${colors.yellow}[SIMULATION] No Amazon Creators credentials provided. Returning mock search for '${keyword}'.${colors.reset}`);

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

    try {
        const data = await searchItemsRequest(keyword);
        if (Array.isArray(data.errors) && data.errors.length > 0) {
            console.error(`${colors.red}[API ERROR] for search '${keyword}': ${JSON.stringify(data.errors)}${colors.reset}`);
        }

        if (data.searchResult && Array.isArray(data.searchResult.items) && data.searchResult.items.length > 0) {
            return data.searchResult.items.map(item => {
                const parsed = mapItemToProductData(item);
                return {
                    asin: parsed.asin,
                    title: parsed.title,
                    url: parsed.detailPageURL || data.searchResult.searchURL,
                    image: parsed.imageUrl,
                    price: parsed.price || 'Ver en Amazon',
                    discount: parsed.discount,
                    isBuyBoxWinner: parsed.isBuyBoxWinner,
                    availability: parsed.availability
                };
            });
        }

        console.error(`${colors.yellow}[NO RESULTS] No items found for '${keyword}'${colors.reset}`);
        return null;
    } catch (e) {
        console.error(`${colors.red}Search parse error: ${e.message}${colors.reset}`);
        return null;
    }
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
    const cliArgs = parseCliArgs(process.argv.slice(2));
    const configValidation = validateCreatorsConfiguration();

    console.log(`${colors.blue}Starting price update...${colors.reset}`);
    console.log(`${colors.blue}Creators config:${colors.reset} ${JSON.stringify(getCreatorsConfigSummary())}`);

    for (const warning of configValidation.warnings) {
        console.warn(`${colors.yellow}CONFIG WARNING: ${warning}${colors.reset}`);
    }

    if (configValidation.issues.length > 0) {
        for (const issue of configValidation.issues) {
            console.error(`${colors.red}CONFIG ERROR: ${issue}${colors.reset}`);
        }
        process.exitCode = 1;
        return;
    }

    if (!hasCreatorsCredentials()) {
        console.warn(`${colors.yellow}WARNING: Amazon Creators credentials not found. Running in simulation mode.${colors.reset}`);
        if (cliArgs.strict) {
            console.error(`${colors.red}Strict mode enabled and credentials are missing.${colors.reset}`);
            process.exitCode = 1;
            return;
        }
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
    const allAsins = Array.from(asinsToFetch);
    const batchSize = hasCreatorsCredentials() ? 10 : 1;
    const summary = {
        requestedAsins: allAsins.length,
        fetchedAsins: 0,
        missingAsins: 0,
        searchKeywords: keywordsToSearch.size,
        searchHits: 0,
        batchFailures: 0,
        fileUpdates: 0
    };

    for (let i = 0; i < allAsins.length; i += batchSize) {
        const batch = allAsins.slice(i, i + batchSize);
        console.log(`Checking data for ${batch.join(', ')}...`);

        if (!hasCreatorsCredentials()) {
            for (const asin of batch) {
                try {
                    const newProductData = await fetchProductData(asin);
                    if (newProductData) {
                        productDataMap[asin] = newProductData;
                        summary.fetchedAsins++;
                        console.log(`${colors.green}  -> Price: ${newProductData.price}, Original: ${newProductData.originalPrice}, Discount: ${newProductData.discount}${colors.reset}`);
                    } else {
                        summary.missingAsins++;
                    }
                } catch (e) {
                    summary.batchFailures++;
                    console.error(`${colors.red}Failed to fetch ${asin}: ${e.message}${colors.reset}`);
                }
            }
            continue;
        }

        try {
            const data = await getItemsBatch(batch);

            if (Array.isArray(data.errors) && data.errors.length > 0) {
                console.error(`${colors.yellow}[PARTIAL ERRORS] ${JSON.stringify(data.errors)}${colors.reset}`);
            }

            const items = data.itemResults && Array.isArray(data.itemResults.items)
                ? data.itemResults.items
                : [];
            const batchAsinsFound = new Set();
            for (const item of items) {
                const mapped = mapItemToProductData(item);
                if (mapped.asin) {
                    productDataMap[mapped.asin] = mapped;
                    batchAsinsFound.add(mapped.asin);
                    summary.fetchedAsins++;
                    console.log(`${colors.green}  -> ${mapped.asin}: ${mapped.price}, Original: ${mapped.originalPrice}, Discount: ${mapped.discount}${colors.reset}`);
                }
            }

            for (const asin of batch) {
                if (!batchAsinsFound.has(asin)) {
                    summary.missingAsins++;
                    console.warn(`${colors.yellow}[MISSING ITEM] No item payload returned for ${asin}${colors.reset}`);
                }
            }

            await delay(500);
        } catch (e) {
            summary.batchFailures++;
            console.error(`${colors.red}Failed to fetch batch ${batch.join(', ')}: ${e.message}${colors.reset}`);
            console.warn(`${colors.yellow}Falling back to single-item fetch for batch recovery.${colors.reset}`);

            for (const asin of batch) {
                try {
                    const single = await fetchProductData(asin);
                    if (single) {
                        productDataMap[asin] = single;
                        summary.fetchedAsins++;
                        console.log(`${colors.green}  -> recovered ${asin}: ${single.price}${colors.reset}`);
                    } else {
                        summary.missingAsins++;
                    }
                    await delay(250);
                } catch (singleError) {
                    summary.batchFailures++;
                    summary.missingAsins++;
                    console.error(`${colors.red}Failed recovery fetch ${asin}: ${singleError.message}${colors.reset}`);
                }
            }
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
                    summary.searchHits += results.length;
                    console.log(`${colors.green}  -> Found ${results.length} related products.${colors.reset}`);
                }
                if (hasCreatorsCredentials()) await delay(500);
            } catch (e) {
                summary.batchFailures++;
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

        // Remove stale ratings when we do not have verified review data
        const regexStarBlock = /(<div[^>]*class=["'][^"']*product-rank-stars[^"']*["'][^>]*>)([\s\S]*?data-asin-star=["']([^"']+)["'][\s\S]*?)(<\/div>)/g;
        newContent = newContent.replace(regexStarBlock, (fullMatch, openTag, innerContent, asin, closeTag) => {
            const data = productDataMap[asin];
            if (data && data.stars) {
                return fullMatch;
            }
            if (innerContent.trim() !== '') {
                fileChanged = true;
                return openTag + closeTag;
            }
            return fullMatch;
        });

        // Update star text only when verified review data exists
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
            if (data && data.isPrime === true) {
                // Prime SVG Icon (simplified official look)
                const primeSvg = `<svg class="prime-icon" viewBox="0 0 100 30" width="60" height="18" xmlns="http://www.w3.org/2000/svg"><path fill="#00A8E1" d="M12.7 20.4l3.1-4c1-1.3 2.1-1.9 3.6-1.9 1 0 1.9.3 2.6 1L31 24.3l8.6-18.7c.3-.6.6-.9 1.1-.9h4.3c-.6 1.4-1.3 2.8-2 4.1L30.9 29.5c-.3.6-.8 1-1.4 1h-2c-.6 0-1-.3-1.4-.9l-7.2-7.5-3.3 4.2c-.4.5-.9.8-1.5.8h-4.3c.4-.6.9-1.2 1.3-1.7V25c0 1.4-.2 2.7-.6 4-3.7-.8-6.9-2.5-9.3-5L12 23.4l.7-3zM83.4 12c-4.6 0-8.6 3.1-9.7 7.5h-10c.8-5.7 5.7-9.8 11.6-9.8 4 0 7.5 2 9.4 5.2.3.5.3 1 0 1.5l-2.1 3.2c-.3.4-.8.5-1.2.3-1.4-.8-3-1.2-4.7-1.2-3.1 0-5.8 2-6.7 4.9h8.2c0-3.3 2.5-6.2 5.9-6.6.6-.1 1.1.2 1.3.8l1.3 3.6c.1.4 0 .9-.4 1.1L95.5 30h-4l-6.1-10.7c-.5.1-.9.2-1.4.2-4 0-7.8-2.6-9-6.5h-4.6v17h-4V10.1h4v4h7.9c1.4-3.5 5.1-6.2 9.3-6.2 4.3 0 8 2.2 9.9 5.6.3.5.2 1.1-.1 1.5l-2.2 3.2c-.3.4-.8.5-1.2.3-1.5-.9-3.2-1.3-4.9-1.3-3.2 0-6.1 2-7.1 5h8.5c-.1-3.3 2.5-6.1 5.8-6.6.6-.1 1.2.2 1.3.8l1.3 3.5c.2.4 0 .9-.4 1.1l-11.2 5V21h4.6c1.3 3.8 5 6.4 9 6.4 2.8 0 5.4-1.2 7-3.1v2.7h4v-17h-4v3.1c-1.6-1.9-4.2-3.1-7-3.1zM34.7 10.1h4v17h-4v-17zM45.5 10.1h4v2h2.9v4H49.5v11h-4v-17z"/></svg>`;
                if (oldText.trim() !== primeSvg) {
                    fileChanged = true;
                    return openTag + "\n" + primeSvg + "\n" + closeTag;
                }
            } else if (data && data.isPrime === false) {
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
                    const safeTitle = escapeHtml(item.title || 'Producto relacionado');
                    const safeImage = escapeHtml(item.image || '');
                    const safePrice = escapeHtml(item.price || 'Ver en Amazon');
                    const safeUrl = escapeHtml(item.url || '#');
                    gridHtml += `
  <div class="related-card">
    <div class="related-img"><img src="${safeImage}" alt="${safeTitle}" loading="lazy"></div>
    <div class="related-info">
      <h4 class="related-title">${safeTitle}</h4>
      <div class="related-price">${safePrice}</div>
      <a href="${safeUrl}" target="_blank" rel="nofollow sponsored noopener" class="related-cta">Ver en Amazon</a>
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
            const relativeFile = path.relative(ROOT_DIR, file);
            if (!cliArgs.dryRun) {
                console.log(`${colors.blue}Updating ${relativeFile}${colors.reset}`);
                fs.writeFileSync(file, newContent, 'utf8');
            } else {
                console.log(`${colors.blue}[DRY RUN] Would update ${relativeFile}${colors.reset}`);
            }
            updatedFilesCount++;
        }
    }

    summary.fileUpdates = updatedFilesCount;
    console.log(`${colors.green}Finished! Updated ${updatedFilesCount} files.${colors.reset}`);
    console.log(`${colors.blue}Run summary:${colors.reset} ${JSON.stringify(summary)}`);
}

main().catch((error) => {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exitCode = 1;
});
