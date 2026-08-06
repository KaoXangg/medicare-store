import os
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

exclude_dirs = {'.git', 'node_modules', '.expo', '.gemini'}
exclude_files = {'BAO-CAO-MEDICARE-STORE.docx', 'package-lock.json'}
allowed_extensions = {'.js', '.jsx', '.py', '.sql', '.ps1', '.bat', '.css', '.html', '.md', '.txt', '.json', '.env'}

def scan():
    workspace = r"c:\thietbiyte_shop"
    file_list = []
    for root, dirs, files in os.walk(workspace):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for f in files:
            if f in exclude_files:
                continue
            ext = os.path.splitext(f)[1].lower()
            if ext in allowed_extensions or f.startswith('.env'):
                full_path = os.path.join(root, f)
                file_list.append((os.path.relpath(full_path, workspace), ext))
    
    print(f"Total candidate files: {len(file_list)}")
    with open("scripts/candidate_files.json", "w", encoding="utf-8") as out:
        json.dump(file_list, out, ensure_ascii=False, indent=2)
    print("Saved to scripts/candidate_files.json")

if __name__ == "__main__":
    scan()
