import sys
import os
from pypdf import PdfReader, PdfWriter

original_path = "/Users/rajeshkumarvarma/Downloads/Sales_MH_013_22-23 (1).pdf"
if not os.path.exists(original_path):
    print("❌ Original PDF not found in Downloads!")
    sys.exit(1)

reader = PdfReader(original_path)
page = reader.pages[0]
print("--- Original Resources ---")
print(page.get("/Resources", {}).get("/Font", {}).keys())

# Create a temporary output merged PDF using pypdf to reproduce
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import io

packet = io.BytesIO()
can = canvas.Canvas(packet)
can.setFont("Helvetica", 10)
can.drawString(100, 100, "Hello World Overlay")
can.save()
packet.seek(0)
overlay_reader = PdfReader(packet)
overlay_page = overlay_reader.pages[0]

writer = PdfWriter()
page.merge_page(overlay_page, over=True)
writer.add_page(page)

output_path = "/Users/rajeshkumarvarma/Downloads/test_merged.pdf"
with open(output_path, "wb") as f:
    writer.write(f)

print("--- Merged Resources ---")
merged_reader = PdfReader(output_path)
merged_page = merged_reader.pages[0]
print(merged_page.get("/Resources", {}).get("/Font", {}).keys())
print("✅ Done! Created test_merged.pdf")
