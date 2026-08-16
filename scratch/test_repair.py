import sys
import os
import re
from pypdf import PdfReader, PdfWriter

original_path = "/Users/rajeshkumarvarma/Downloads/Sales_MH_013_22-23 (1).pdf"
if not os.path.exists(original_path):
    print("❌ Original PDF not found in Downloads!")
    sys.exit(1)

with open(original_path, "rb") as f:
    pdf_bytes = f.read()

print(f"Original file size: {len(pdf_bytes)} bytes")

# Repair the bytes
def repair_pdf_bytes(pdf_bytes):
    pattern = re.compile(b'ProcSet\\s*\\[[^\\]]*\\]')
    def replace_procset(match):
        procset_bytes = match.group(0)
        cleaned = procset_bytes.replace(b'\x00', b' ')
        print(f"Found and cleaned ProcSet: {procset_bytes} -> {cleaned}")
        return cleaned
    return pattern.sub(replace_procset, pdf_bytes)

repaired_bytes = repair_pdf_bytes(pdf_bytes)

# Try reading the repaired bytes
import io
try:
    reader = PdfReader(io.BytesIO(repaired_bytes))
    page = reader.pages[0]
    print("--- Repaired Resources ---")
    print(page.get("/Resources", {}).get("/Font", {}).keys())
    print("✅ Successfully read repaired PDF without PdfReadError!")
except Exception as e:
    print(f"❌ Repair failed: {e}")
