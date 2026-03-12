const requiredEnvVars = [
    'AMAZON_CREATOR_CLIENT_ID',
    'AMAZON_CREATOR_CLIENT_SECRET',
    'AMAZON_PARTNER_TAG'
];

const optionalEnvVars = [
    ['AMAZON_CREATOR_VERSION', '3.2'],
    ['AMAZON_MARKETPLACE', 'www.amazon.es'],
    ['AMAZON_LANG', 'es_ES'],
    ['AMAZON_CURRENCY', 'EUR']
];

let missing = 0;

console.log('--- CREATORS API CONFIG CHECK ---');

for (const envName of requiredEnvVars) {
    if (!process.env[envName]) {
        missing++;
        console.log(`ERROR: Falta ${envName}`);
    } else {
        console.log(`OK: ${envName}`);
    }
}

for (const [envName, fallback] of optionalEnvVars) {
    if (!process.env[envName]) {
        console.log(`WARN: ${envName} no definido. Se usara el valor por defecto: ${fallback}`);
    } else {
        console.log(`OK: ${envName}=${process.env[envName]}`);
    }
}

if (missing > 0) {
    console.log('Result: FAIL');
    process.exitCode = 1;
} else {
    console.log('Result: PASS');
}
