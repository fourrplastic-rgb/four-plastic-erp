pdf_path = 'backend/uploads/attachments/tally_3377193a91314c31a7394d04a1f57c79.pdf'
with open(pdf_path, 'rb') as f:
    content = f.read()

idx = 0
while True:
    idx = content.find(b'/Sig', idx)
    if idx == -1:
        break
    print(f"Found /Sig at index {idx}:")
    start = max(0, idx - 100)
    end = min(len(content), idx + 200)
    print(content[start:end])
    print("-" * 60)
    idx += 4
