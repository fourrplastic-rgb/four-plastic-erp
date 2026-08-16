import pdfplumber
import os

pdf_dir = "backend/uploads/attachments"
files = [f for f in os.listdir(pdf_dir) if f.startswith("tally_") and f.endswith(".pdf")]
if not files:
    print("No tally files found!")
    exit(1)

sample_pdf = os.path.join(pdf_dir, files[0])
print(f"Inspecting layout coordinates of: {sample_pdf}")

with pdfplumber.open(sample_pdf) as pdf:
    page = pdf.pages[0]
    print(f"Page dimensions: width={page.width}, height={page.height}")
    
    print("\n--- Horizontal Lines (y coordinates from top of page) ---")
    # In pdfplumber, y coordinates start from the top of the page.
    # To convert to ReportLab (y from bottom), we do: height - y
    h_lines = page.horizontal_edges
    for line in sorted(h_lines, key=lambda l: l['top'])[:15]:
        top = line['top']
        bottom = line['bottom']
        x0 = line['x0']
        x1 = line['x1']
        rl_y = page.height - top
        print(f"y_from_top={top:.2f} (ReportLab y={rl_y:.2f}) | x0={x0:.2f}, x1={x1:.2f} | width={x1-x0:.2f}")

    print("\n--- Vertical Lines (x coordinates) ---")
    v_lines = page.vertical_edges
    for line in sorted(v_lines, key=lambda l: l['x0'])[:15]:
        x0 = line['x0']
        x1 = line['x1']
        top = line['top']
        bottom = line['bottom']
        rl_top = page.height - top
        rl_bottom = page.height - bottom
        print(f"x={x0:.2f} | y_from_top: {top:.2f} to {bottom:.2f} (ReportLab y: {rl_bottom:.2f} to {rl_top:.2f}) | height={bottom-top:.2f}")
