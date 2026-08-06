import os
import re

def dump_cases():
    workspace = r"c:\thietbiyte_shop"
    exclude_dirs = {'.git', 'node_modules', '.expo', '.gemini'}
    pattern = re.compile(r'\{\s*/\*.*?\*/\s*\}')
    
    out_lines = []
    for root, dirs, files in os.walk(workspace):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for f in files:
            if f.endswith('.js') or f.endswith('.jsx'):
                path = os.path.join(root, f)
                with open(path, 'r', encoding='utf-8', errors='ignore') as file:
                    content = file.read()
                    for m in pattern.finditer(content):
                        start = max(0, m.start() - 30)
                        end = min(len(content), m.end() + 30)
                        context = content[start:end].replace('\n', '\\n').replace('\r', '')
                        out_lines.append(f"File: {os.path.relpath(path, workspace)}: Match: '{m.group(0)}' in context: '...{context}...'")
                        
    with open("scripts/jsx_cases_utf8.txt", "w", encoding="utf-8") as out:
        out.write("\n".join(out_lines))

if __name__ == "__main__":
    dump_cases()
