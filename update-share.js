const fs = require('fs');
const path = require('path');

// 1. Fix script.js bug
const jsPath = path.join(__dirname, 'assets', 'js', 'script.js');
let jsContent = fs.readFileSync(jsPath, 'utf8');

// The bug is that social sharing code is AFTER an early return.
// Let's extract it and move it BEFORE the scroll reveal.
const scrollRevealMatch = jsContent.match(/\/\* --- Scroll reveal with stagger ---\s*\*\//);
const socialSharingMatch = jsContent.match(/\/\* --- Social Sharing ---\s*\*\//);

if (scrollRevealMatch && socialSharingMatch && socialSharingMatch.index > scrollRevealMatch.index) {
  // Extract social sharing block
  const startIdx = socialSharingMatch.index;
  const endIdx = jsContent.indexOf('  };\n\n  if (document.readyState === \'loading\')');
  const sharingBlock = jsContent.slice(startIdx, endIdx);
  
  // Remove sharing block from end
  jsContent = jsContent.slice(0, startIdx) + jsContent.slice(endIdx);
  
  // Insert before scroll reveal
  const insertIdx = jsContent.indexOf('/* --- Scroll reveal with stagger ---');
  jsContent = jsContent.slice(0, insertIdx) + sharingBlock + '\n    ' + jsContent.slice(insertIdx);
  
  fs.writeFileSync(jsPath, jsContent);
  console.log('Fixed script.js early return issue');
}

// 2. Update style.css to add gap
const cssPath = path.join(__dirname, 'assets', 'css', 'style.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');
if (!cssContent.includes('gap: 0.5rem; /* SVG GAP */')) {
  cssContent = cssContent.replace(
    /\.share-btn \{\n\s+display: inline-flex;/g, 
    '.share-btn {\n  display: inline-flex;\n  gap: 0.5rem; /* SVG GAP */'
  );
  fs.writeFileSync(cssPath, cssContent);
  console.log('Updated style.css with gap');
}

// 3. Update HTML Files with SVGs
const htmlFiles = [
  'blog/article-template.html',
  'blog/cojin-gel-vs-viscoelastico/index.html',
  'blog/como-sentarse-correctamente/index.html',
  'blog/dolor-espalda-teletrabajo/index.html',
  'blog/lesiones-esfuerzo-repetitivo-rsi/index.html',
  'blog/peligro-cruzar-piernas/index.html',
  'blog/regla-20-20-20-vista-cuello/index.html',
  'blog/setup-minimalista-ergonomico/index.html',
  'blog/silla-gaming-vs-ergonomica/index.html',
  'blog/sindrome-tunel-carpiano-ejercicios/index.html',
  'blog/standing-desk-mitos-verdades/index.html'
];

const newHtmlSnippet = `
                <!-- SOCIAL SHARE WIDGET -->
                <div class="social-share-container">
                    <h3 class="share-title">¿Te ha resultado útil? ¡Compártelo!</h3>
                    <div class="share-buttons">
                        <button class="share-btn share-btn-x" data-network="x" aria-label="Compartir en X (Twitter)">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865l8.875 11.633Z"/></svg>
                            X
                        </button>
                        <button class="share-btn share-btn-fb" data-network="facebook" aria-label="Compartir en Facebook">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/></svg>
                            Facebook
                        </button>
                        <button class="share-btn share-btn-wa" data-network="whatsapp" aria-label="Compartir en WhatsApp">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/></svg>
                            WhatsApp
                        </button>
                        <button class="share-btn share-btn-in" data-network="linkedin" aria-label="Compartir en LinkedIn">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/></svg>
                            LinkedIn
                        </button>
                        <button class="share-btn share-btn-copy" data-network="copy" aria-label="Copiar Enlace">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>
                            Copiar Enlace
                        </button>
                    </div>
                </div>`;

for (const file of htmlFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Use regex to replace the entire sharing widget including the comments
    content = content.replace(/<!-- SOCIAL SHARE WIDGET -->[\s\S]*?<\/div>\s*<\/div>/, newHtmlSnippet.trim());
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated HTML in ${file}`);
  }
}

