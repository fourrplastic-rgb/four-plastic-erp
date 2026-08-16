import pdfplumber
import os

pdf_dir = "backend/uploads/attachments"
files = [f for f in os.listdir(pdf_dir) if f.startswith("tally_") and f.endswith(".pdf")]
sample_pdf = os.path.join(pdf_dir, files[0])

with pdfplumber.open(sample_pdf) as pdf:
    page = pdf.pages[0]
    print("--- Text elements at the bottom of the page (y_from_top > 700) ---")
    # In pdfplumber, y coordinates start from the top of the page.
    # ReportLab y = page.height - top
    for obj in page.extract_words():
        top = obj['top']
        bottom = obj['bottom']
        rl_y = page.height - top
        x0 = obj['x0']
        x1 = obj['x1']
        text = obj['text']
        if top > 700:
            print(f"Text: '{text}' | ReportLab y={rl_y:.2f} | x0={x0:.2f}, x1={x1:.2f}")
