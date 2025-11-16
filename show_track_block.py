from pathlib import Path
lines = Path('src/pages/Track.js').read_text(encoding='utf-8').splitlines()
for idx,line in enumerate(lines,1):
    if 'order.products' in line:
        start = max(0, idx-4)
        end = min(len(lines), idx+12)
        for i in range(start, end):
            print(f'{i+1}: {lines[i]}')
        break
