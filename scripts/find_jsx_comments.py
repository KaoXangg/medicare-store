import os
import re

def search():
    workspace = r"c:\thietbiyte_shop"
    exclude_dirs = {'.git', 'node_modules', '.expo', '.gemini'}
    pattern = re.compile(r'\{\s*/\*')
    matches = []
    
    for root, dirs, files in os.walk(workspace):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for f in files:
            if f.endswith('.js') or f.endswith('.jsx'):
                path = os.path.join(root, f)
                with open(path, 'r', encoding='utf-8', errors='ignore') as file:
                    for i, line in enumerate(file, 1):
                        if pattern.search(line):
                            matches.append((os.path.relpath(path, workspace), i, line.strip()))
                            
    print(f"Found {len(matches)} matches:")
    for m in matches[:20]:
        print(f"{m[0]}:{m[1]}: {m[2]}")
    if len(matches) > 20:
        print("...")

if __name__ == "__main__":
    search()
