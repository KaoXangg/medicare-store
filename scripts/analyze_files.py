import json
from collections import Counter

def analyze():
    with open("scripts/candidate_files.json", "r", encoding="utf-8") as f:
        files = json.load(f)
    
    counts = Counter(ext for path, ext in files)
    print("Extension counts:")
    for ext, count in counts.most_common():
        print(f"  {ext}: {count}")

if __name__ == "__main__":
    analyze()
