import io
import os
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

def generate_background_pdf(company, format_preset, opacity, logo_size, watermark_style):
    packet = io.BytesIO()
    c = canvas.Canvas(packet, pagesize=A4)
    width, height = A4
    
    logo_path = f"frontend/public/logo_{company}.png"
    
    # 1. Draw Watermark if enabled
    if format_preset in ('watermark_letterhead', 'watermark_only'):
        c.saveState()
        c.setFillAlpha(opacity)
        
        if watermark_style == 'center':
            w = logo_size
            aspect_ratio = 0.45 if company == 'four_plastic' else 0.7
            h = w * aspect_ratio
            x = (width - w) / 2
            y = (height - h) / 2
            c.drawImage(logo_path, x, y, width=w, height=h, mask='auto')
        else:
            w = 100
            aspect_ratio = 0.45 if company == 'four_plastic' else 0.7
            h = w * aspect_ratio
            for row in range(4):
                for col in range(3):
                    c.saveState()
                    x = 50 + col * 180
                    y = 100 + row * 180
                    c.translate(x + w/2, y + h/2)
                    c.rotate(-25)
                    c.drawImage(logo_path, -w/2, -h/2, width=w, height=h, mask='auto')
                    c.restoreState()
        c.restoreState()
        
    # 2. Draw Letterhead/Logo if enabled
    if format_preset in ('watermark_letterhead', 'letterhead_only'):
        # Color strip at top right
        c.saveState()
        strip_w = width * 0.45
        strip_h = 8
        strip_x = width - strip_w
        strip_y = height - strip_h
        
        blue_color = '#004aad' if company == 'four_plastic' else '#1b8a5a'
        red_color = '#c8102e' if company == 'four_plastic' else '#f57c00'
        
        c.setFillColor(blue_color)
        c.rect(strip_x, strip_y, strip_w * 0.65, strip_h, stroke=0, fill=1)
        c.setFillColor(red_color)
        c.rect(strip_x + strip_w * 0.65, strip_y, strip_w * 0.35, strip_h, stroke=0, fill=1)
        c.restoreState()
        
        # Logo at top left
        logo_w = 180 if company == 'four_plastic' else 80
        logo_h = logo_w * (0.45 if company == 'four_plastic' else 0.7)
        logo_x = 40
        logo_y = height - logo_h - 20
        c.drawImage(logo_path, logo_x, logo_y, width=logo_w, height=logo_h, mask='auto')
        
    c.showPage()
    c.save()
    packet.seek(0)
    return packet

def merge_pdf_watermark(tally_pdf_path, output_pdf_path, company, format_preset, opacity, logo_size, watermark_style):
    bg_packet = generate_background_pdf(company, format_preset, opacity, logo_size, watermark_style)
    bg_reader = PdfReader(bg_packet)
    bg_page = bg_reader.pages[0]
    
    reader = PdfReader(tally_pdf_path)
    writer = PdfWriter()
    
    for page in reader.pages:
        page.merge_page(bg_page, over=False)
        writer.add_page(page)
        
    with open(output_pdf_path, 'wb') as f:
        writer.write(f)

# Run test
tally_pdf = 'backend/uploads/attachments/tally_3377193a91314c31a7394d04a1f57c79.pdf'
output_pdf = 'backend/uploads/test_merged.pdf'
merge_pdf_watermark(tally_pdf, output_pdf, 'four_plastic', 'watermark_letterhead', 0.08, 300, 'center')
print("Successfully generated merged PDF!")
