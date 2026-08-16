import pdfplumber
import os

pdf_dir = "backend/uploads/attachments"
files = [f for f in os.listdir(pdf_dir) if f.startswith("tally_") and f.endswith(".pdf")]
sample_pdf = os.path.join(pdf_dir, files[0])

with pdfplumber.open(sample_pdf) as pdf:
    page = pdf.pages[0]
    print("--- Lines at the bottom of the page (ReportLab y < 200) ---")
    h_lines = page.horizontal_edges
    for line in sorted(h_lines, key=lambda l: l['top'], reverse=True)[:15]:
        top = line['top']
        rl_y = page.height - top
        x0 = line['x0']
        x1 = line['x1']
        print(f"H-Line: y={rl_y:.2f} | x0={x0:.2f}, x1={x1:.2f} | width={x1-x0:.2f}")

    print("\n--- Vertical Lines at the bottom ---")
    v_lines = page.vertical_edges
    for line in sorted(v_lines, key=lambda l: l['top'], reverse=True)[:15]:
        x0 = line['x0']
        top = line['top']
        bottom = line['bottom']
        rl_top = page.height - top
        rl_bottom = page.height - bottom
        print(f"V-Line: x={x0:.2f} | y: {rl_bottom:.2f} to {rl_top:.2f} | height={bottom-top:.2f}")
