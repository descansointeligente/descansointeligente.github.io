import os
import re

for folder, dirs, files in os.walk('.'):
    # Ignore node_modules, .git, etc
    if 'node_modules' in folder or '.git' in folder: continue
    
    for f in files:
        if f.endswith('.html'):
            path = os.path.join(folder, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
                
            original_content = content
            
            # This regex looks for product-rank-card block, and extracts the ASIN from price-current
            # Then it finds product-rank-badge inside it and adds data-asin-badge if missing
            
            def replace_card(match):
                card_html = match.group(0)
                asin_match = re.search(r'data-asin="([^"]+)"', card_html)
                if not asin_match: return card_html
                
                asin = asin_match.group(1)
                
                # Check if badge lacks data-asin-badge
                # Can be <span class="product-rank-badge"> or <div class="product-rank-badge">
                # We replace class="product-rank-badge" with class="product-rank-badge" data-asin-badge="ASIN"
                
                if 'data-asin-badge' not in card_html:
                    card_html = re.sub(r'(class="product-rank-badge"[^>]*)>', r'\1 data-asin-badge="' + asin + '">', card_html)
                    
                    # Also replace <span class="product-rank-badge"...> with <div class="product-rank-badge"...> to unify
                    card_html = re.sub(r'<span (class="product-rank-badge".*?)>(.*?)</span>', r'<div \1>\2</div>', card_html)
                    
                else:
                    # Just unify to div if it's currently span
                    card_html = re.sub(r'<span (class="product-rank-badge".*?)>(.*?)</span>', r'<div \1>\2</div>', card_html)
                
                return card_html
            
            content = re.sub(r'<div class="product-rank-card.*?(?=</section>|<div class="product-rank-card)', replace_card, content, flags=re.DOTALL)
            
            if content != original_content:
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(content)
                print(f"Fixed {path}")
