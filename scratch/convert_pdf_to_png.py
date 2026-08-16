import os
from pdf2image import convert_from_path

pdf_path = "/Users/rajeshkumarvarma/Desktop/FOUR_ (R)_PLASTIC/backend/uploads/attachments/test_merged_signatory.pdf"
output_dir = "/Users/rajeshkumarvarma/.gemini/antigravity/brain/b5131289-a72a-4370-9cae-83fe86efcbd0"
output_file = os.path.join(output_dir, "test_signatory_preview.png")

try:
    print(f"Converting {pdf_path} to image...")
    images = convert_from_path(pdf_path, first_page=1, last_page=1)
    if images:
        images[0].save(output_file, 'PNG')
        print(f"Successfully saved first page as PNG: {output_file}")
    else:
        print("No pages converted.")
except Exception as e:
    print(f"Error during conversion: {str(e)}")
