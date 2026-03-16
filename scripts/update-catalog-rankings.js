/**
 * update-catalog-rankings.js
 * 
 * Fetches the top-selling products from Amazon for each catalog category
 * using the Creators API searchItems endpoint with BrowseNodeId filtering.
 * Updates the product-rank-card blocks in each catalog page.
 * 
 * Usage:
 *   node scripts/update-catalog-rankings.js [--dry-run] [--strict]
 * 
 * Environment variables (same as update-prices.js):
 *   AMAZON_CREATOR_CLIENT_ID
 *   AMAZON_CREATOR_CLIENT_SECRET
 *   AMAZON_CREATOR_VERSION (default: 3.2)
 *   AMAZON_PARTNER_TAG
 *   AMAZON_MARKETPLACE (default: www.amazon.es)
 *   AMAZON_LANG (default: es_ES)
 *   AMAZON_CURRENCY (default: EUR)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

// ── Console colors ──────────────────────────────────────────────────────────
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    dim: "\x1b[2m"
};

// ── Amazon Creators API Configuration ───────────────────────────────────────
const AMAZON_CREATOR_CLIENT_ID = process.env.AMAZON_CREATOR_CLIENT_ID;
const AMAZON_CREATOR_CLIENT_SECRET = process.env.AMAZON_CREATOR_CLIENT_SECRET;
const AMAZON_CREATOR_VERSION = process.env.AMAZON_CREATOR_VERSION || '3.2';
const AMAZON_PARTNER_TAG = process.env.AMAZON_PARTNER_TAG;
const AMAZON_MARKETPLACE = process.env.AMAZON_MARKETPLACE || 'www.amazon.es';
const AMAZON_LANG = process.env.AMAZON_LANG || 'es_ES';
const AMAZON_CURRENCY = process.env.AMAZON_CURRENCY || 'EUR';
const AMAZON_API_BASE_URL = 'https://creatorsapi.amazon';
const REQUEST_TIMEOUT_MS = Number(process.env.AMAZON_REQUEST_TIMEOUT_MS || 20000);

const ROOT_DIR = path.join(__dirname, '..');
const CONFIG_PATH = path.join(__dirname, 'catalog-config.json');

const MARKER_START = '<!-- CATALOG-RANKINGS-START -->';
const MARKER_END = '<!-- CATALOG-RANKINGS-END -->';

let accessTokenCache = null;

// ── CLI Args ────────────────────────────────────────────────────────────────
function parseCliArgs(argv) {
    return {
        dryRun: argv.includes('--dry-run'),
        strict: argv.includes('--strict')
    };
}

// ── Credentials ─────────────────────────────────────────────────────────────
function hasCreatorsCredentials() {
    return Boolean(
        AMAZON_CREATOR_CLIENT_ID &&
        AMAZON_CREATOR_CLIENT_SECRET &&
        AMAZON_PARTNER_TAG
    );
}

// ── HTTP helpers (same pattern as update-prices.js) ─────────────────────────
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
                    try { parsedBody = JSON.parse(rawBody); } catch (_) { /* keep raw */ }
                }
                if (res.statusCode >= 400) {
                    const msg = typeof parsedBody === 'object' ? JSON.stringify(parsedBody) : String(parsedBody).slice(0, 300);
                    reject(new Error(`HTTP ${res.statusCode}: ${msg}`));
                    return;
                }
                resolve(parsedBody);
            });
        });

        req.on('error', reject);
        req.setTimeout(REQUEST_TIMEOUT_MS, () => {
            req.destroy(new Error(`Request timeout after ${REQUEST_TIMEOUT_MS}ms`));
        });

        if (body) req.write(body);
        req.end();
    });
}

async function requestJsonWithRetry(urlString, options = {}, body = null, maxRetries = 3) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await requestJson(urlString, options, body);
        } catch (error) {
            const is429 = error.message && error.message.includes('HTTP 429');
            const isTimeout = error.message && error.message.includes('timeout');
            if ((is429 || isTimeout) && attempt < maxRetries) {
                const backoffMs = Math.min(2000 * Math.pow(2, attempt), 15000);
                console.warn(`${colors.yellow}[RETRY ${attempt + 1}/${maxRetries}] Rate limited or timeout. Waiting ${backoffMs}ms...${colors.reset}`);
                await delay(backoffMs);
                continue;
            }
            throw error;
        }
    }
}

// ── OAuth2 Token ────────────────────────────────────────────────────────────
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

async function getAccessToken() {
    if (!hasCreatorsCredentials()) return null;
    if (accessTokenCache && accessTokenCache.expiresAt > Date.now() + 60_000) {
        return accessTokenCache.token;
    }

    const version = AMAZON_CREATOR_VERSION;
    const tokenEndpoint = getTokenEndpoint(version);
    const isV3 = String(version).startsWith('3.');

    let headers, body;
    if (isV3) {
        headers = { 'Content-Type': 'application/json' };
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

    const response = await requestJson(tokenEndpoint, { method: 'POST', headers }, body);
    if (!response.access_token) {
        throw new Error('Creators API token response missing access_token');
    }
    const expiresInMs = (response.expires_in || 3600) * 1000;
    accessTokenCache = { token: response.access_token, expiresAt: Date.now() + expiresInMs };
    return accessTokenCache.token;
}

async function creatorsApiPost(endpointPath, payload) {
    const token = await getAccessToken();
    if (!token) throw new Error('Creators API access token unavailable');
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-marketplace': AMAZON_MARKETPLACE
    };
    if (String(AMAZON_CREATOR_VERSION).startsWith('2.')) {
        headers.Version = AMAZON_CREATOR_VERSION;
    }
    return requestJsonWithRetry(
        `${AMAZON_API_BASE_URL}${endpointPath}`,
        { method: 'POST', headers },
        JSON.stringify(payload)
    );
}

// ── Money formatting ────────────────────────────────────────────────────────
function formatMoney(amount, currency) {
    if (typeof amount !== 'number') return null;
    try {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency', currency: currency || AMAZON_CURRENCY
        }).format(amount).replace(/\u00a0/g, ' ');
    } catch (_) {
        return `${amount.toFixed(2).replace('.', ',')} ${currency || AMAZON_CURRENCY}`;
    }
}

function normalizeDisplayAmount(money) {
    if (!money) return null;
    if (typeof money.amount === 'number') return formatMoney(money.amount, money.currency);
    return money.displayAmount || null;
}

// ── HTML escaping ───────────────────────────────────────────────────────────
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ── Image collection ────────────────────────────────────────────────────────
function collectGalleryImages(images) {
    const primaryCandidates = [
        images?.primary?.large?.url,
        images?.primary?.medium?.url,
        images?.primary?.small?.url
    ];
    const variants = Array.isArray(images?.variants) ? images.variants : [];
    const variantCandidates = variants.flatMap((v) => [
        v?.large?.url, v?.medium?.url, v?.small?.url
    ]);
    return [...primaryCandidates, ...variantCandidates]
        .filter(Boolean)
        .filter((val, idx, arr) => arr.indexOf(val) === idx);
}

// ── Parse API item into product data ────────────────────────────────────────
function parseOfferListing(listing) {
    if (!listing) {
        return { price: null, priceNum: null, originalPrice: null, originalPriceNum: null, discount: null, savingsAmount: null, isBuyBoxWinner: false, availability: null };
    }
    const priceMoney = listing.price?.money || null;
    const savingBasisMoney = listing.savingBasis?.money || null;
    const savingsMoney = listing.savings?.money || null;

    let discount = null;
    if (typeof listing.savings?.percentage === 'number') {
        discount = `-${Math.round(listing.savings.percentage)}%`;
    } else if (savingBasisMoney && typeof savingBasisMoney.amount === 'number' &&
               priceMoney && typeof priceMoney.amount === 'number' &&
               savingBasisMoney.amount > priceMoney.amount) {
        const pct = Math.round(((savingBasisMoney.amount - priceMoney.amount) / savingBasisMoney.amount) * 100);
        discount = `-${pct}%`;
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
        dealDetails: listing.dealDetails || null
    };
}

function mapItemToProductData(item) {
    const listing = item?.offersV2?.listings?.[0] || null;
    const parsed = parseOfferListing(listing);
    const galleryImages = collectGalleryImages(item?.images);

    // Extract features
    const features = [];
    if (item?.itemInfo?.features?.displayValues && Array.isArray(item.itemInfo.features.displayValues)) {
        for (const feat of item.itemInfo.features.displayValues) {
            if (feat && features.length < 3) {
                // Truncate very long features
                const clean = String(feat).replace(/<[^>]+>/g, '').trim();
                if (clean.length > 0) {
                    features.push(clean.length > 120 ? clean.slice(0, 117) + '...' : clean);
                }
            }
        }
    }

    return {
        asin: item?.asin || null,
        title: item?.itemInfo?.title?.displayValue || item?.asin || 'Producto Amazon',
        detailPageURL: item?.detailPageURL || null,
        price: parsed.price || 'Ver en Amazon',
        originalPrice: parsed.originalPrice,
        discount: parsed.discount,
        priceNum: parsed.priceNum,
        originalPriceNum: parsed.originalPriceNum,
        isBuyBoxWinner: parsed.isBuyBoxWinner,
        availability: parsed.availability,
        dealDetails: parsed.dealDetails,
        imageUrl: galleryImages[0] || null,
        galleryImages,
        features,
        parentASIN: item?.parentASIN || null
    };
}

// ── API: Search items by BrowseNodeId ───────────────────────────────────────
async function searchByBrowseNode(category) {
    const payload = {
        keywords: category.keywords,
        browseNodeId: category.browseNodeId,
        itemCount: Math.min(category.itemCount || 5, 10),
        marketplace: AMAZON_MARKETPLACE,
        partnerTag: AMAZON_PARTNER_TAG,
        languagesOfPreference: [AMAZON_LANG],
        currencyOfPreference: AMAZON_CURRENCY,
        availability: 'Available',
        condition: 'New',
        sortBy: 'Featured',
        resources: [
            'images.primary.large',
            'images.primary.medium',
            'images.variants.large',
            'images.variants.medium',
            'itemInfo.title',
            'itemInfo.features',
            'offersV2.listings.price',
            'offersV2.listings.availability',
            'offersV2.listings.dealDetails',
            'offersV2.listings.isBuyBoxWinner'
        ]
    };

    return creatorsApiPost('/catalog/v1/searchItems', payload);
}

// ── Mock data for simulation mode ───────────────────────────────────────────
function getMockProducts(category) {
    const mocks = {
        'escritorios-elevables': [
            { asin: 'B0MOCK0001', title: 'Escritorio Elevable Electrico con Memoria', price: '169,99 EUR', features: ['Motor eléctrico silencioso con 4 memorias de altura', 'Tablero de 120x60cm resistente y anti-arañazos', 'Estructura de acero con capacidad de 80kg'] },
            { asin: 'B0MOCK0002', title: 'Mesa Standing Desk Ajustable 140cm', price: '219,50 EUR', features: ['Panel de control táctil con indicador LED', 'Ajuste de altura de 72 a 120cm', 'Sistema anti-colisión integrado'] },
            { asin: 'B0MOCK0003', title: 'Escritorio Motorizado Blanco Minimalista', price: '189,00 EUR', features: ['Diseño nórdico minimalista en blanco mate', 'Velocidad de elevación: 25mm/s', 'Bandeja para cables incluida'] },
            { asin: 'B0MOCK0004', title: 'Standing Desk Pro con Tablero Bambú', price: '249,99 EUR', features: ['Tablero de bambú ecológico 140x70cm', 'Doble motor para máxima estabilidad', 'App móvil para control remoto'] },
            { asin: 'B0MOCK0005', title: 'Escritorio Elevable Compacto 100cm', price: '139,99 EUR', features: ['Ideal para espacios reducidos: 100x60cm', 'Montaje en 20 minutos sin herramientas', 'Patas ajustables para suelo irregular'] }
        ],
        'sillas-ergonomicas': [
            { asin: 'B0MOCK0101', title: 'Silla Ergonómica Oficina Malla Transpirable', price: '189,99 EUR', features: ['Respaldo de malla transpirable con soporte lumbar', 'Reposabrazos 4D ajustables en altura y ángulo', 'Base de aluminio con ruedas silenciosas'] },
            { asin: 'B0MOCK0102', title: 'Silla de Escritorio con Soporte Lumbar Adaptable', price: '159,50 EUR', features: ['Soporte lumbar autoajustable por presión', 'Mecanismo de balanceo con bloqueo', 'Asiento con espuma de alta densidad'] },
            { asin: 'B0MOCK0103', title: 'Silla Gaming Ergonómica con Reposapiés', price: '199,90 EUR', features: ['Reclinación de 90° a 155° con reposapiés retráctil', 'Cojín lumbar y cervical incluidos', 'Tapizado en piel sintética transpirable'] },
            { asin: 'B0MOCK0104', title: 'Silla Operativa Profesional con Cabezal', price: '229,99 EUR', features: ['Cabezal ajustable en altura e inclinación', 'Certificación BIFMA para uso intensivo', 'Asiento deslizante para ajuste de profundidad'] },
            { asin: 'B0MOCK0105', title: 'Silla Oficina Sin Reposabrazos Compacta', price: '119,99 EUR', features: ['Diseño compacto sin brazos para escritorios pequeños', 'Respaldo ergonómico en S con soporte lumbar', 'Altura regulable con pistón de gas clase 4'] }
        ],
        'cojin-coxis': [
            { asin: 'B0MOCK0201', title: 'Cojín Coxis Viscoelástico Ergonómico', price: '29,99 EUR', features: ['Espuma viscoelástica de alta densidad 60kg/m³', 'Canal central para alivio de presión en coxis', 'Funda lavable con cremallera y antideslizante'] },
            { asin: 'B0MOCK0202', title: 'Cojín para Coxis con Gel Refrescante', price: '34,99 EUR', features: ['Capa de gel refrescante para uso prolongado', 'Forma ergonómica en U para máximo alivio', 'Compatible con sillas de oficina y coche'] },
            { asin: 'B0MOCK0203', title: 'Cojín Ortopédico Coxis y Ciática Premium', price: '39,50 EUR', features: ['Diseñado con fisioterapeutas para dolor de ciática', 'Memory foam con efecto rebote lento', 'Base antideslizante de silicona'] },
            { asin: 'B0MOCK0204', title: 'Cojín Coxis Donut para Hemorroides', price: '24,99 EUR', features: ['Forma de donut para alivio de hemorroides y coxis', 'Espuma de alta resiliencia que no se aplana', 'Portátil con asa de transporte integrada'] },
            { asin: 'B0MOCK0205', title: 'Set Cojín Coxis + Soporte Lumbar', price: '44,99 EUR', features: ['Pack completo: cojín asiento + soporte lumbar', 'Correa ajustable para fijar a cualquier silla', 'Certificado OEKO-TEX libre de sustancias nocivas'] }
        ],
        'soporte-lumbar': [
            { asin: 'B0MOCK0301', title: 'Soporte Lumbar Viscoelástico para Silla', price: '26,99 EUR', features: ['Espuma viscoelástica que se adapta a tu espalda', 'Correas elásticas ajustables universales', 'Funda de malla transpirable lavable'] },
            { asin: 'B0MOCK0302', title: 'Cojín Lumbar Ergonómico con Gel', price: '32,50 EUR', features: ['Núcleo de gel fresco + memory foam', 'Contorno anatómico para zona lumbar L3-L5', 'Compatible con silla oficina, coche y sofá'] },
            { asin: 'B0MOCK0303', title: 'Soporte Espalda Oficina Ajustable', price: '28,99 EUR', features: ['Altura del soporte regulable según necesidad', 'Doble capa: firme + suave para máximo confort', 'Diseño slim que no ocupa excesivo espacio'] },
            { asin: 'B0MOCK0304', title: 'Respaldo Lumbar de Malla Transpirable', price: '19,99 EUR', features: ['Estructura de malla elástica ultra-transpirable', 'Se adapta a la curvatura de cualquier silla', 'Ultraligero: solo 200g, ideal para oficina'] },
            { asin: 'B0MOCK0305', title: 'Almohada Lumbar Premium Terciopelo', price: '35,99 EUR', features: ['Funda de terciopelo premium extra suave', 'Firmeza media-alta recomendada por fisioterapeutas', 'Memory foam de celda abierta: no acumula calor'] }
        ],
        'brazos-monitor': [
            { asin: 'B0MOCK0401', title: 'Brazo Monitor Articulado Gas Spring', price: '34,99 EUR', features: ['Muelle de gas para ajuste sin esfuerzo', 'Compatible con monitores de 17 a 32 pulgadas', 'Rotación 360° y giro ±90° vertical'] },
            { asin: 'B0MOCK0402', title: 'Soporte Monitor Doble Brazo VESA', price: '54,99 EUR', features: ['Para 2 monitores de hasta 27 pulgadas cada uno', 'Montaje VESA 75x75 y 100x100mm', 'Gestión de cables integrada con clips'] },
            { asin: 'B0MOCK0403', title: 'Brazo Monitor Ultrawide hasta 49"', price: '69,90 EUR', features: ['Soporta monitores ultrawide de hasta 49 pulgadas', 'Capacidad de carga: 15kg', 'Brazo extra largo con alcance de 60cm'] },
            { asin: 'B0MOCK0404', title: 'Brazo Monitor con USB Hub Integrado', price: '45,99 EUR', features: ['Hub USB 3.0 con 2 puertos en la base', 'Pistón de gas clase 3 para 3-9kg', 'Instalación con pinza o pasacables'] },
            { asin: 'B0MOCK0405', title: 'Soporte Monitor Ajustable Económico', price: '22,99 EUR', features: ['Altura ajustable de 20 a 45cm sobre escritorio', 'VESA estándar 75x75 y 100x100', 'Ideal para primer brazo: montaje en 10 minutos'] }
        ]
    };

    const products = mocks[category.id] || mocks['escritorios-elevables'];
    return products.slice(0, category.itemCount || 5).map((p, i) => ({
        ...p,
        imageUrl: `https://placehold.co/500x500/f8fafc/334155?text=${encodeURIComponent(category.label)}+${i + 1}`,
        galleryImages: [`https://placehold.co/500x500/f8fafc/334155?text=${encodeURIComponent(category.label)}+${i + 1}`],
        detailPageURL: `https://www.amazon.es/dp/${p.asin}?tag=${AMAZON_PARTNER_TAG || 'descansointel-21'}`
    }));
}

// ── Fetch rankings for a category ───────────────────────────────────────────
async function fetchCategoryRankings(category) {
    if (!hasCreatorsCredentials()) {
        console.log(`${colors.yellow}[SIMULATION] No API credentials. Using mock data for "${category.label}".${colors.reset}`);
        return getMockProducts(category);
    }

    try {
        const data = await searchByBrowseNode(category);

        if (Array.isArray(data.errors) && data.errors.length > 0) {
            console.error(`${colors.red}[API ERROR] ${category.label}: ${JSON.stringify(data.errors)}${colors.reset}`);
        }

        if (data.searchResult?.items && Array.isArray(data.searchResult.items) && data.searchResult.items.length > 0) {
            const products = data.searchResult.items
                .slice(0, category.itemCount || 5)
                .map(item => mapItemToProductData(item));

            console.log(`${colors.green}[OK] ${category.label}: ${products.length} products fetched from API${colors.reset}`);
            return products;
        }

        console.warn(`${colors.yellow}[NO RESULTS] No items returned for "${category.label}" (BrowseNode: ${category.browseNodeId}). Trying keyword-only fallback...${colors.reset}`);

        // Fallback: search without browseNodeId
        const fallbackPayload = {
            keywords: category.keywords,
            itemCount: Math.min(category.itemCount || 5, 10),
            marketplace: AMAZON_MARKETPLACE,
            partnerTag: AMAZON_PARTNER_TAG,
            languagesOfPreference: [AMAZON_LANG],
            currencyOfPreference: AMAZON_CURRENCY,
            availability: 'Available',
            condition: 'New',
            sortBy: 'Featured',
            resources: [
                'images.primary.large',
                'images.primary.medium',
                'images.variants.large',
                'images.variants.medium',
                'itemInfo.title',
                'itemInfo.features',
                'offersV2.listings.price',
                'offersV2.listings.availability',
                'offersV2.listings.dealDetails',
                'offersV2.listings.isBuyBoxWinner'
            ]
        };

        const fallbackData = await creatorsApiPost('/catalog/v1/searchItems', fallbackPayload);

        if (fallbackData.searchResult?.items && fallbackData.searchResult.items.length > 0) {
            const products = fallbackData.searchResult.items
                .slice(0, category.itemCount || 5)
                .map(item => mapItemToProductData(item));
            console.log(`${colors.green}[OK] ${category.label}: ${products.length} products fetched (keyword fallback)${colors.reset}`);
            return products;
        }

        console.error(`${colors.red}[FAILED] No products found for "${category.label}" even with keyword fallback.${colors.reset}`);
        return null;

    } catch (error) {
        console.error(`${colors.red}[ERROR] ${category.label}: ${error.message}${colors.reset}`);
        return null;
    }
}

// ── HTML Generation ─────────────────────────────────────────────────────────
const RANK_BADGES = ['#1 Mas vendido', '#2 Mas vendido', '#3 Mas vendido', '#4 Popular', '#5 Popular'];

const CTA_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>';

function generateProductCard(product, rank, partnerTag) {
    const asin = escapeHtml(product.asin);
    const title = escapeHtml(product.title);
    const imageUrl = product.imageUrl || `https://placehold.co/500x500/f8fafc/334155?text=Amazon+Product`;
    const galleryAttr = product.galleryImages && product.galleryImages.length > 0
        ? ` data-gallery-images="${escapeHtml(product.galleryImages.join('|'))}"`
        : '';
    const price = escapeHtml(product.price || 'Ver en Amazon');
    const productUrl = product.detailPageURL || `https://www.amazon.es/dp/${product.asin}?tag=${partnerTag}`;
    const features = product.features || [];
    const badge = RANK_BADGES[rank - 1] || `#${rank} Popular`;
    const loadingAttr = rank === 1 ? 'fetchpriority="high"' : 'loading="lazy"';

    const featuresHtml = features.length > 0
        ? features.map(f => `                <li>${escapeHtml(f)}</li>`).join('\n')
        : `                <li>Producto destacado en Amazon</li>\n                <li>Envío disponible a España</li>\n                <li>Ver detalles en Amazon</li>`;

    return `        <!-- #${rank} ${product.title ? product.title.slice(0, 40) : asin} -->
        <div class="product-rank-card top-${rank} reveal-on-scroll">
            <div class="product-rank-image">
                <img${galleryAttr}
                     data-asin-image="${asin}"
                     src="${escapeHtml(imageUrl)}"
                     alt="${title}"
                     ${loadingAttr}>
            </div>

            <div class="product-rank-body">
                <div class="product-rank-badge" data-asin-badge="${asin}">${escapeHtml(badge)}</div>
                <h3 class="product-rank-title">${title}</h3>
                <ul class="product-rank-features">
${featuresHtml}
                </ul>
            </div>

            <div class="product-rank-interaction">
                <div class="product-rank-price">
                    <span class="price-current price-update" data-asin="${asin}">${price}</span>
                    <span class="prime-badge" data-asin-prime="${asin}"></span>
                </div>
                <div class="price-original price-old-update" data-asin-original="${asin}"></div>
                <a href="${escapeHtml(productUrl)}"
                   class="product-rank-cta" target="_blank"
                   rel="nofollow sponsored noopener">Ver oferta ${CTA_SVG}</a>
            </div>
        </div>`;
}

function generateRankingBlock(products, partnerTag) {
    const cards = products.map((product, index) =>
        generateProductCard(product, index + 1, partnerTag)
    );

    return `${MARKER_START}\n${cards.join('\n\n')}\n        ${MARKER_END}`;
}

// ── File update logic ───────────────────────────────────────────────────────
function updateHtmlFile(filePath, products, partnerTag, dryRun) {
    const fullPath = path.join(ROOT_DIR, filePath);

    if (!fs.existsSync(fullPath)) {
        console.error(`${colors.red}[ERROR] File not found: ${filePath}${colors.reset}`);
        return false;
    }

    let html = fs.readFileSync(fullPath, 'utf8');
    const newBlock = generateRankingBlock(products, partnerTag);

    // Check if markers exist
    const hasMarkers = html.includes(MARKER_START) && html.includes(MARKER_END);

    if (hasMarkers) {
        // Replace content between markers
        const startIdx = html.indexOf(MARKER_START);
        const endIdx = html.indexOf(MARKER_END) + MARKER_END.length;
        html = html.slice(0, startIdx) + newBlock + html.slice(endIdx);
    } else {
        console.warn(`${colors.yellow}[WARN] No markers found in ${filePath}. Cannot update.${colors.reset}`);
        return false;
    }

    if (dryRun) {
        console.log(`${colors.cyan}[DRY-RUN] Would update ${filePath} with ${products.length} products${colors.reset}`);
        return true;
    }

    fs.writeFileSync(fullPath, html, 'utf8');
    console.log(`${colors.green}[UPDATED] ${filePath} — ${products.length} products written${colors.reset}`);
    return true;
}

// ── Extract current ASINs from page (for change detection) ──────────────────
function extractCurrentAsins(filePath) {
    const fullPath = path.join(ROOT_DIR, filePath);
    if (!fs.existsSync(fullPath)) return [];

    const html = fs.readFileSync(fullPath, 'utf8');
    const startIdx = html.indexOf(MARKER_START);
    const endIdx = html.indexOf(MARKER_END);

    if (startIdx === -1 || endIdx === -1) return [];

    const block = html.slice(startIdx, endIdx);
    const asinRegex = /data-asin="([A-Z0-9]+)"/g;
    const asins = [];
    let match;
    while ((match = asinRegex.exec(block)) !== null) {
        if (!asins.includes(match[1])) asins.push(match[1]);
    }
    return asins;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
    const { dryRun, strict } = parseCliArgs(process.argv);

    console.log('\n========================================');
    console.log('  CATALOG RANKINGS UPDATE');
    console.log('========================================\n');

    if (dryRun) {
        console.log(`${colors.cyan}[MODE] Dry-run — no files will be modified${colors.reset}\n`);
    }

    // Load config
    if (!fs.existsSync(CONFIG_PATH)) {
        console.error(`${colors.red}[FATAL] Config file not found: ${CONFIG_PATH}${colors.reset}`);
        process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

    if (!Array.isArray(config.categories) || config.categories.length === 0) {
        console.error(`${colors.red}[FATAL] No categories defined in config${colors.reset}`);
        process.exit(1);
    }

    console.log(`${colors.blue}[CONFIG] ${config.categories.length} categories loaded${colors.reset}`);
    console.log(`${colors.blue}[CONFIG] API credentials: ${hasCreatorsCredentials() ? 'YES' : 'NO (simulation mode)'}${colors.reset}`);
    console.log(`${colors.blue}[CONFIG] Partner tag: ${AMAZON_PARTNER_TAG || 'descansointel-21'}${colors.reset}\n`);

    const partnerTag = AMAZON_PARTNER_TAG || 'descansointel-21';
    const summary = { updated: 0, skipped: 0, failed: 0, changes: [] };

    for (const category of config.categories) {
        console.log(`\n${colors.blue}--- ${category.label} (BrowseNode: ${category.browseNodeId}) ---${colors.reset}`);

        // Extract current ASINs before update
        const currentAsins = extractCurrentAsins(category.targetFile);

        // Fetch new rankings
        const products = await fetchCategoryRankings(category);

        if (!products || products.length === 0) {
            console.warn(`${colors.yellow}[SKIP] No products for "${category.label}". Keeping existing content.${colors.reset}`);
            summary.skipped++;
            continue;
        }

        // Detect changes
        const newAsins = products.map(p => p.asin);
        const added = newAsins.filter(a => !currentAsins.includes(a));
        const removed = currentAsins.filter(a => !newAsins.includes(a));

        if (added.length > 0 || removed.length > 0 || currentAsins.length === 0) {
            console.log(`${colors.dim}  Current ASINs: ${currentAsins.length > 0 ? currentAsins.join(', ') : '(none / no markers)'}${colors.reset}`);
            console.log(`${colors.dim}  New ASINs:     ${newAsins.join(', ')}${colors.reset}`);
            if (added.length > 0) console.log(`${colors.green}  + Added: ${added.join(', ')}${colors.reset}`);
            if (removed.length > 0) console.log(`${colors.yellow}  - Removed: ${removed.join(', ')}${colors.reset}`);
            summary.changes.push({ category: category.label, added, removed });
        } else {
            console.log(`${colors.dim}  No ranking changes detected${colors.reset}`);
        }

        // Update HTML
        const success = updateHtmlFile(category.targetFile, products, partnerTag, dryRun);

        if (success) {
            summary.updated++;
        } else {
            summary.failed++;
        }

        // Rate limit between categories
        if (hasCreatorsCredentials()) {
            await delay(1500);
        }
    }

    // Summary
    console.log('\n========================================');
    console.log('  SUMMARY');
    console.log('========================================');
    console.log(`  Updated:  ${summary.updated}`);
    console.log(`  Skipped:  ${summary.skipped}`);
    console.log(`  Failed:   ${summary.failed}`);

    if (summary.changes.length > 0) {
        console.log('\n  Changes:');
        for (const change of summary.changes) {
            console.log(`    ${change.category}:`);
            if (change.added.length > 0) console.log(`      + ${change.added.join(', ')}`);
            if (change.removed.length > 0) console.log(`      - ${change.removed.join(', ')}`);
        }
    }

    console.log('========================================\n');

    if (strict && summary.failed > 0) {
        console.error(`${colors.red}[STRICT] Exiting with error due to ${summary.failed} failure(s).${colors.reset}`);
        process.exit(1);
    }
}

main().catch(err => {
    console.error(`${colors.red}[FATAL] ${err.message}${colors.reset}`);
    console.error(err.stack);
    process.exit(1);
});
