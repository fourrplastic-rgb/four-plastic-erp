import io
import os
import uuid
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

# Target files
pdf_dir = "backend/uploads/attachments"
files = [f for f in os.listdir(pdf_dir) if f.startswith("tally_") and f.endswith(".pdf")]
if not files:
    print("No tally files found!")
    exit(1)

tally_pdf_path = os.path.join(pdf_dir, files[0])
output_pdf_path = "backend/uploads/attachments/test_merged_signatory.pdf"
company = "four_plastic"
format_preset = "watermark_letterhead"
opacity = 0.08
logo_size = 320
watermark_style = "center"
header_text = "FOUR (R) PLASTIC"
sub_header_text = "Manufacturers of Premium Plastic Raw Materials"
address = "WIRE GALI, KHADI NO.3, L.B.S. NAGAR, 90 FEET ROAD, NEAR NATIONAL CHEMIST, SAKINAKA, MUMBAI - 400072."
phone = "9867976679"
email = "fourrplastic@gmali.com"
gst_no = "27ABTPV9432F1ZX"

try:
    width, height = A4
    logo_path = f"frontend/public/logo_{company}.png"
    
    # 1. Open PDF with pdfplumber to extract coordinates dynamically
    import pdfplumber
    
    supplier_box = {
        'x0': 28.5,
        'x1': 355.5,
        'y0': 743.5,
        'y1': 815.5
    }
    signatory_coords = {
        'x0': 450,
        'y0': 128,
        'w': 112,
        'h': 10,
        'text_x': 556.19,
        'text_y': 131
    }
    
    with pdfplumber.open(tally_pdf_path) as pdf:
        if pdf.pages:
            # First page: find supplier details box grid lines
            first_page = pdf.pages[0]
            try:
                h_lines = first_page.horizontal_edges
                top_h_lines = [l for l in h_lines if l['top'] < 200]
                if top_h_lines:
                    y_top_from_top = min(l['top'] for l in top_h_lines)
                    y_top = float(first_page.height - y_top_from_top)
                    divider_h_lines = [
                        l for l in top_h_lines 
                        if l['top'] > y_top_from_top + 10 
                        and l['x0'] < 50 
                        and l['x1'] < 400
                    ]
                    if divider_h_lines:
                        y_divider_from_top = min(l['top'] for l in divider_h_lines)
                        y_divider = float(first_page.height - y_divider_from_top)
                        x_left = float(min(l['x0'] for l in divider_h_lines))
                        x_right = float(max(l['x1'] for l in divider_h_lines))
                        supplier_box = {
                            'x0': x_left + 0.5,
                            'x1': x_right - 0.5,
                            'y0': y_divider + 0.5,
                            'y1': y_top - 0.5
                        }
                        print(f"Detected supplier box coordinates: {supplier_box}")
            except Exception as e:
                print(f"Error parsing supplier box coordinates: {e}")
                
            # Last page: find signatory line text coordinates
            last_page = pdf.pages[-1]
            try:
                words = last_page.extract_words()
                bottom_words = [w for w in words if w['x0'] > 300 and w['top'] > 650]
                for_words = [w for w in bottom_words if w['text'].lower() == 'for']
                if for_words:
                    for_words.sort(key=lambda w: abs((float(last_page.height - w['top'])) - 135))
                    best_for = for_words[0]
                    line_words = [
                        w for w in bottom_words 
                        if abs(w['top'] - best_for['top']) < 3 
                        and w['x0'] >= best_for['x0']
                    ]
                    line_words.sort(key=lambda w: w['x0'])
                    if line_words:
                        x0 = float(line_words[0]['x0'] - 2)
                        x1 = float(line_words[-1]['x1'] + 2)
                        top = float(min(w['top'] for w in line_words))
                        bottom = float(max(w['bottom'] for w in line_words))
                        
                        rl_y0 = float(last_page.height - bottom - 2)
                        h = float((bottom - top) + 4)
                        w_box = float(x1 - x0)
                        text_y = float(last_page.height - bottom + 1)
                        
                        signatory_coords = {
                            'x0': x0,
                            'y0': rl_y0,
                            'w': w_box,
                            'h': h,
                            'text_x': x1 - 2,
                            'text_y': text_y
                        }
                        print(f"Detected signatory coordinates: {signatory_coords}")
            except Exception as e:
                print(f"Error parsing signatory coordinates: {e}")

    # 2. Merge pages dynamically
    reader = PdfReader(tally_pdf_path)
    writer = PdfWriter()
    num_pages = len(reader.pages)
    
    for i in range(num_pages):
        orig_page = reader.pages[i]
        
        # Generate underlay (watermark)
        packet_underlay = io.BytesIO()
        c_under = canvas.Canvas(packet_underlay, pagesize=A4)
        c_under.saveState()
        c_under.setFillAlpha(opacity)
        w = logo_size
        aspect_ratio = 0.45 if company == 'four_plastic' else 0.7
        h = w * aspect_ratio
        x = (width - w) / 2
        y = (height - h) / 2
        c_under.drawImage(logo_path, x, y, width=w, height=h, mask='auto')
        c_under.restoreState()
        c_under.showPage()
        c_under.save()
        packet_underlay.seek(0)
        under_page = PdfReader(packet_underlay).pages[0]
        
        # Generate overlay
        packet_overlay = io.BytesIO()
        c_over = canvas.Canvas(packet_overlay, pagesize=A4)
        has_overlay = False
        
        if format_preset in ('watermark_letterhead', 'letterhead_only'):
            # First page letterhead overlay
            if i == 0:
                has_overlay = True
                c_over.saveState()
                c_over.setFillColorRGB(1, 1, 1)
                c_over.rect(supplier_box['x0'], supplier_box['y0'], supplier_box['x1'] - supplier_box['x0'], supplier_box['y1'] - supplier_box['y0'], stroke=0, fill=1)
                c_over.restoreState()
                
                c_over.saveState()
                strip_w = width * 0.45
                strip_h = 8
                strip_x = width - strip_w
                strip_y = height - strip_h
                blue_color = '#004aad'
                red_color = '#c8102e'
                c_over.setFillColor(blue_color)
                c_over.rect(strip_x, strip_y, strip_w * 0.65, strip_h, stroke=0, fill=1)
                c_over.setFillColor(red_color)
                c_over.rect(strip_x + strip_w * 0.65, strip_y, strip_w * 0.35, strip_h, stroke=0, fill=1)
                c_over.restoreState()
                
                logo_w = 120
                logo_h = logo_w * 0.45
                logo_x = supplier_box['x0'] + 5.5
                logo_y = supplier_box['y0'] + ((supplier_box['y1'] - supplier_box['y0']) - logo_h) / 2
                c_over.drawImage(logo_path, logo_x, logo_y, width=logo_w, height=logo_h, mask='auto')
                
                x_text = logo_x + logo_w + 8
                box_w = supplier_box['x1'] - x_text
                max_chars = int(box_w / 3.2)
                
                c_over.saveState()
                c_over.setFillColor(blue_color)
                c_over.setFont("Helvetica-Bold", 9.5)
                c_over.drawString(x_text, supplier_box['y1'] - 11.5, header_text)
                c_over.setFont("Helvetica-Bold", 5.5)
                c_over.setFillColorRGB(0.2, 0.2, 0.2)
                c_over.drawString(x_text, supplier_box['y1'] - 19.5, sub_header_text)
                
                # Simple wrapping function
                def wrap_text(text, max_len):
                    if not text:
                        return []
                    words = text.split()
                    wrapped_lines = []
                    current_line = []
                    current_length = 0
                    for word in words:
                        if current_length + len(word) + 1 <= max_len:
                            current_line.append(word)
                            current_length += len(word) + 1
                        else:
                            wrapped_lines.append(" ".join(current_line))
                            current_line = [word]
                            current_length = len(word)
                    if current_line:
                        wrapped_lines.append(" ".join(current_line))
                    return wrapped_lines
                
                c_over.setFont("Helvetica", 5.5)
                addr_lines = wrap_text(address, max_chars)
                curr_y = supplier_box['y1'] - 27.5
                for line in addr_lines[:2]:
                    c_over.drawString(x_text, curr_y, line)
                    curr_y -= 7
                c_over.drawString(x_text, curr_y, f"Mob: {phone} | Email: {email}")
                c_over.drawString(x_text, curr_y - 7, f"GSTIN/UIN: {gst_no}")
                c_over.restoreState()
            
            # Last page signatory overlay
            if i == num_pages - 1:
                has_overlay = True
                c_over.saveState()
                c_over.setFillColorRGB(1, 1, 1)
                c_over.rect(signatory_coords['x0'], signatory_coords['y0'], signatory_coords['w'], signatory_coords['h'], stroke=0, fill=1)
                
                c_over.setFillColorRGB(0, 0, 0)
                c_over.setFont("Helvetica-Bold", 6.5)
                c_over.drawRightString(signatory_coords['text_x'], signatory_coords['text_y'], f"for {header_text}")
                c_over.restoreState()

        c_over.showPage()
        c_over.save()
        packet_overlay.seek(0)
        overlay_page = PdfReader(packet_overlay).pages[0]
        
        # Merge layers
        orig_page.merge_page(under_page, over=False)
        if has_overlay:
            orig_page.merge_page(overlay_page, over=True)
        writer.add_page(orig_page)

    with open(output_pdf_path, 'wb') as f:
        writer.write(f)

    print(f"Successfully generated merged signatory PDF at {output_pdf_path}")
except Exception as e:
    import traceback
    traceback.print_exc()
