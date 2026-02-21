import os

for folder, dirs, files in os.walk('.'):
    if 'node_modules' in folder or '.git' in folder:
        continue
    for f in files:
        if not f.endswith('.html'):
            continue
        path = os.path.join(folder, f)
        with open(path, 'r', encoding='utf-8') as file:
            content = file.read()
        original = content
        
        # Simple string replacements for each language
        labels = [
            'Precio recomendado: ',
            'Recommended price: ',
            'Prix recommandé: ',
            'Prezzo consigliato: ',
        ]
        for label in labels:
            content = content.replace(label, '')
        
        if content != original:
            with open(path, 'w', encoding='utf-8') as file:
                file.write(content)
            print(f'Cleaned: {path}')
