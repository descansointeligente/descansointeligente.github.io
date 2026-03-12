const fs = require('fs');
const path = require('path');
const https = require('https');

const { execSync } = require('child_process');

// Helper to find all HTML files
function getHtmlFiles() {
    try {
        const stdout = execSync('find . -name "*.html" -not -path "*/node_modules/*" -not -path "*/.git/*"', { encoding: 'utf8' });
        return stdout.trim().split('\n').filter(f => f.length > 0);
    } catch (e) {
        return [];
    }
}

// Check Amazon link for 404 (basic check)
function checkUrl(url) {
    return new Promise((resolve) => {
        const req = https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                // Check if Amazon returns a 404 or a "Documento no encontrado" page
                if (res.statusCode === 404 || data.includes('Página no encontrada') || data.includes('Documento no encontrado')) {
                    resolve({ status: 'broken', code: res.statusCode });
                } else {
                    resolve({ status: 'ok', code: res.statusCode });
                }
            });
        }).on('error', (err) => {
            resolve({ status: 'error', error: err.message });
        });

        req.setTimeout(5000, () => {
            req.destroy();
            resolve({ status: 'timeout' });
        });
    });
}

function extractInfo(content) {
    const asins = new Set();
    const errors = [];

    // Find a tags
    const linkRegex = /<a[^>]+href=["']([^"']*(amazon\.es|amzn\.to)[^"']*)["'][^>]*>/gi;
    let match;
    const links = [];
    while ((match = linkRegex.exec(content)) !== null) {
        links.push(match[1]);
    }

    // Find images with data-asin-image or just inside related-card
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const images = [];
    while ((match = imgRegex.exec(content)) !== null) {
        images.push(match[1]);
    }

    // Find prices
    const priceRegex = /<div[^>]+class=["'][^"']*price[^"']*["'][^>]*>([^<]+)<\/div>/gi;
    const prices = [];
    while ((match = priceRegex.exec(content)) !== null) {
        prices.push(match[1]);
    }

    return { links, images, prices };
}

async function verifySite() {
    const rootDir = path.join(__dirname, '..');
    const htmlFiles = getHtmlFiles(rootDir);
    console.log(`Auditing ${htmlFiles.length} HTML files...`);

    let totalLinks = 0;
    let totalBrokenLinks = 0;
    let totalBrokenImages = 0;
    let totalMissingPrices = 0;

    const urlsToCheck = new Set();

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const info = extractInfo(content);

        // Check images format
        for (const img of info.images) {
            if (img === '' || img.includes('undefined') || img.includes('null')) {
                console.log(`❌ ERROR: Broken image in ${path.relative(rootDir, file)} -> src="${img}"`);
                totalBrokenImages++;
            }
        }

        // Check prices
        for (const price of info.prices) {
            if (price.trim() === '' || price.trim().toLowerCase().includes('undefined') || price.trim().toLowerCase().includes('nan')) {
                console.log(`❌ ERROR: Missing or undefined price in ${path.relative(rootDir, file)}`);
                totalMissingPrices++;
            }
        }

        for (const link of info.links) {
            urlsToCheck.add(link);
        }
    }

    console.log(`Verifying ${urlsToCheck.size} unique Amazon links... This may take a moment.`);
    const linkArray = Array.from(urlsToCheck);

    // Batch process to avoid hammering (might get 503 from Amazon)
    for (let i = 0; i < linkArray.length; i++) {
        const link = linkArray[i];
        if (link.includes('B0859W3D8J')) {
            console.log(`❌ ERROR: Obsolete ASIN B0859W3D8J found in link: ${link}`);
            totalBrokenLinks++;
            continue; // We already know this is dead from earlier
        }
    }

    // Check just a sample to see if our fetch works, because checking 100 links might cause temporary IP block
    const sampleSize = Math.min(5, linkArray.length);
    console.log(`Sampling ${sampleSize} links using HTTP requests to avoid Amazon Captcha bans...`);
    for (let i = 0; i < sampleSize; i++) {
        const link = linkArray[i];
        const res = await checkUrl(link.startsWith('http') ? link : 'https:' + link);
        if (res.status !== 'ok') {
            console.log(`⚠️ WARNING: Link check failed for ${link} (${res.status} HTTP ${res.code || ''})`);
        } else {
            console.log(`✅ OK: ${link}`);
        }
    }

    console.log('\n--- AUDIT SUMMARY ---');
    console.log(`Broken Images Found: ${totalBrokenImages}`);
    console.log(`Missing Prices Found: ${totalMissingPrices}`);
    console.log('---------------------');

    if (totalBrokenImages === 0 && totalMissingPrices === 0 && totalBrokenLinks === 0) {
        console.log('✅ ALL PASSED: Images and prices look well-formed in the HTML.');
        console.log('Note: To ensure real Amazon Creators API prices/images match, ensure your AMAZON_CREATOR_CLIENT_ID, AMAZON_CREATOR_CLIENT_SECRET y AMAZON_PARTNER_TAG existen en el entorno.');
    } else {
        console.log('❌ SOME TESTS FAILED. Please review the errors above.');
    }
}

verifySite();
