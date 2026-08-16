import os
import pypdfium2 as pdfium

pdf_path = 'backend/uploads/attachments/tally_3377193a91314c31a7394d04a1f57c79.pdf'
doc = pdfium.PdfDocument(pdf_path)

output_dir = 'backend/uploads'
os.makedirs(output_dir, exist_ok=True)

# Try to find images inside the PDF objects
import pypdfium2._helpers as helpers

page = doc[0]
image_count = 0

# We can also just render the page to an image to see the whole page layout with DSC Sign
bitmap = page.render(
    scale=2,  # Render at double resolution (approx 150 DPI)
)
pil_img = bitmap.to_pil()
pil_img.save(os.path.join(output_dir, 'rendered_page.png'))
print("Saved rendered page to backend/uploads/rendered_page.png")
doc.close()
