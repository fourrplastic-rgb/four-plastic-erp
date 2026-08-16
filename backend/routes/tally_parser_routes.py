import os
import uuid
import re
from datetime import datetime
import pdfplumber
from flask import Blueprint, request, jsonify
from database_config import get_db

tally_parser_bp = Blueprint('tally_parser_bp', __name__)

# Directory where uploaded Tally PDFs are archived
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'attachments')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@tally_parser_bp.route('/parse-tally-pdf', methods=['POST'])
def parse_tally_pdf():
    """
    POST /api/upload/parse-tally-pdf
    Uploads a Tally PDF invoice, parses its values, performs database lookups,
    and returns the structured data along with DB matches.
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
        
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if not file or not allowed_file(file.filename):
        return jsonify({'error': 'Only PDF files are allowed'}), 400
        
    try:
        # Save PDF to uploads/attachments
        ext = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"tally_{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(filepath)
        
        # Relative attachment path for database storing
        relative_path = f"/uploads/attachments/{unique_filename}"
        
        # 1. Extract raw text and tables from PDF using pdfplumber
        text_content = []
        tables = []
        
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    text_content.append(text)
                page_tables = page.extract_tables()
                if page_tables:
                    tables.extend(page_tables)
                    
        full_text = "\n".join(text_content)
        
        # Print first 200 chars for logging/debugging
        print("📄 Parsed PDF Text Sample:")
        print(full_text[:500])
        print("="*60)
        
        # 2. Parse Invoice No & Date
        invoice_no = None
        invoice_date = None
        
        # Method A: Scan table cells for "Invoice No." (Tally standard layout)
        for table in tables:
            for row in table:
                for cell in row:
                    if cell and "Invoice No." in str(cell):
                        cell_str = str(cell).strip()
                        lines = cell_str.split('\n')
                        if len(lines) > 1 and "Invoice No." in lines[0]:
                            invoice_no = lines[1].strip()
                            
        # Method B: Scan text for "Invoice No. Dated" pattern
        lines = full_text.split('\n')
        for idx, line in enumerate(lines):
            if "Invoice No." in line and "Dated" in line:
                if idx + 1 < len(lines):
                    val_line = lines[idx+1]
                    words = [w.strip() for w in val_line.split() if w.strip()]
                    if len(words) >= 2:
                        date_word = words[-1]
                        inv_word = words[-2]
                        # Verify date format
                        if re.search(r"\b\d{1,2}[-/\.](?:[a-zA-Z]{3,9}|\d{2,4})[-/\.]\d{2,4}\b", date_word):
                            if not invoice_date:
                                invoice_date = date_word
                            if not invoice_no:
                                invoice_no = inv_word

        # Fallback date search
        if not invoice_date:
            date_match = re.search(r"\b\d{1,2}[-/\.](?:[a-zA-Z]{3,9}|\d{2,4})[-/\.]\d{2,4}\b", full_text)
            if date_match:
                invoice_date = date_match.group(0).strip()
                
        # Fallback invoice no regexes
        if not invoice_no:
            invoice_no_patterns = [
                r"Invoice No\.\s*:\s*(\S+)",
                r"Invoice No\.\s+(\S+)",
                r"Voucher No\.\s*:\s*(\S+)",
                r"Voucher No\.\s+(\S+)",
            ]
            for pattern in invoice_no_patterns:
                match = re.search(pattern, full_text, re.IGNORECASE)
                if match:
                    invoice_no = match.group(1).strip()
                    break
                    
        if not invoice_no:
            invoice_no = f"TY{datetime.now().strftime('%y%m%d%H%M')}"
            
        invoice_no = invoice_no.strip('., :;')

        # Normalize date to YYYY-MM-DD
        normalized_date = None
        if invoice_date:
            clean_date_str = invoice_date.replace('.', '-').replace('/', '-')
            for fmt in ('%d-%b-%y', '%d-%b-%Y', '%d-%m-%Y', '%d-%m-%y', '%Y-%m-%d'):
                try:
                    dt = datetime.strptime(clean_date_str, fmt)
                    normalized_date = dt.strftime('%Y-%m-%d')
                    break
                except ValueError:
                    continue
        if not normalized_date:
            normalized_date = datetime.now().strftime('%Y-%m-%d')

        # 3. Extract GSTINs
        gstin_pattern = r"\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b"
        gstins = re.findall(gstin_pattern, full_text)
        
        # 4. Determine Invoice Type (Sales vs Purchase)
        our_gstin = "27ABTPV9432F1ZX"
        is_sales = True
        supplier_gst = None
        buyer_gst = None
        
        current_section = None
        for line in lines:
            if any(x in line.lower() for x in ["supplier", "consignor", "seller", "bill from", "from"]):
                current_section = "supplier"
            elif any(x in line.lower() for x in ["buyer", "consignee", "bill to", "ship to", "to"]):
                current_section = "buyer"
                
            gst_match = re.search(gstin_pattern, line)
            if gst_match:
                gst_val = gst_match.group(0)
                if current_section == "supplier" and not supplier_gst:
                    supplier_gst = gst_val
                elif current_section == "buyer" and not buyer_gst:
                    buyer_gst = gst_val
                    
        if len(gstins) >= 2:
            if not supplier_gst: supplier_gst = gstins[0]
            if not buyer_gst: buyer_gst = gstins[1]
        elif len(gstins) == 1:
            if gstins[0] == our_gstin:
                supplier_gst = our_gstin
            else:
                buyer_gst = gstins[0]
                
        if supplier_gst == our_gstin or "FOUR (R) PLASTIC" in full_text.upper() or "FOUR R PLASTIC" in full_text.upper() or "RAJ PLASTIC" in full_text.upper() or "RAJ PLASTICS" in full_text.upper():
            is_sales = True
        elif buyer_gst == our_gstin:
            is_sales = False
        else:
            # Fallback based on Buyer name search
            buyer_block = re.search(r"Buyer\s*(?:\(Bill to\))?\s*\n\s*([^\n]+)", full_text, re.IGNORECASE)
            if buyer_block and any(x in buyer_block.group(1).upper() for x in ["FOUR", "RAJ", "PLASTIC"]):
                is_sales = False
            else:
                is_sales = True

        # Extract party names (Consignee vs Buyer)
        consignee_name = ""
        buyer_name = ""
        
        consignee_match = re.search(r"(?:Consignee|Ship to)\s*\n\s*([^\n]+)", full_text, re.IGNORECASE)
        if consignee_match:
            consignee_name = consignee_match.group(1).strip()
            
        buyer_match = re.search(r"(?:Buyer|Bill to)\s*(?:\(Bill to\))?\s*\n\s*([^\n]+)", full_text, re.IGNORECASE)
        if buyer_match:
            buyer_name = buyer_match.group(1).strip()
            
        def clean_party_name(p_name):
            if not p_name: return ""
            return re.sub(r"(GSTIN/UIN|State Name|Code|Contact|Phone|Address|e-way|Date).*", "", p_name, flags=re.IGNORECASE).strip('., :;-')
            
        consignee_name = clean_party_name(consignee_name)
        buyer_name = clean_party_name(buyer_name)
        
        partner_name = buyer_name or consignee_name
        partner_gst = buyer_gst or supplier_gst if is_sales else supplier_gst

        # 5. Extract Items
        parsed_items = []
        for table in tables:
            if not table or len(table) < 2:
                continue
                
            header_row_idx = -1
            desc_col_idx = -1
            qty_col_idx = -1
            rate_col_idx = -1
            amount_col_idx = -1
            hsn_col_idx = -1
            
            # Scan table rows to locate header row
            for r_idx, row in enumerate(table):
                for c_idx, cell in enumerate(row):
                    if cell:
                        c_str = str(cell).lower()
                        if any(x in c_str for x in ["description", "particulars", "goods", "item"]):
                            desc_col_idx = c_idx
                        elif any(x in c_str for x in ["qty", "quantity"]):
                            qty_col_idx = c_idx
                        elif "rate" in c_str:
                            rate_col_idx = c_idx
                        elif any(x in c_str for x in ["amount", "value"]):
                            amount_col_idx = c_idx
                        elif any(x in c_str for x in ["hsn", "sac"]):
                            hsn_col_idx = c_idx
                            
                if desc_col_idx != -1 and (qty_col_idx != -1 or amount_col_idx != -1):
                    header_row_idx = r_idx
                    break
                    
            if header_row_idx != -1:
                for row in table[header_row_idx + 1:]:
                    if len(row) <= desc_col_idx or not row[desc_col_idx]:
                        continue
                        
                    item_desc = str(row[desc_col_idx]).strip()
                    desc_lines = [l.strip() for l in item_desc.split('\n') if l.strip()]
                    if not desc_lines:
                        continue
                        
                    item_name = desc_lines[0]
                    if any(x in item_name.lower() for x in ["total", "round off", "delivery", "freight"]):
                        continue
                        
                    hsn_code = ""
                    if hsn_col_idx != -1 and len(row) > hsn_col_idx and row[hsn_col_idx]:
                        hsn_code = str(row[hsn_col_idx]).split('\n')[0].strip()
                        
                    qty_val = 0.0
                    qty_unit = "KG"
                    if qty_col_idx != -1 and len(row) > qty_col_idx and row[qty_col_idx]:
                        qty_line = str(row[qty_col_idx]).split('\n')[0].strip()
                        qty_match = re.search(r"([\d,.]+)\s*([a-zA-Z]*)", qty_line)
                        if qty_match:
                            qty_val = float(qty_match.group(1).replace(",", ""))
                            if qty_match.group(2):
                                qty_unit = qty_match.group(2).strip().upper()
                                
                    rate_val = 0.0
                    if rate_col_idx != -1 and len(row) > rate_col_idx and row[rate_col_idx]:
                        rate_line = str(row[rate_col_idx]).split('\n')[0].strip()
                        rate_match = re.search(r"([\d,.]+)", rate_line)
                        if rate_match:
                            rate_val = float(rate_match.group(1).replace(",", ""))
                            
                    amt_val = 0.0
                    if amount_col_idx != -1 and len(row) > amount_col_idx and row[amount_col_idx]:
                        amt_line = str(row[amount_col_idx]).split('\n')[0].strip()
                        amt_match = re.search(r"([\d,.]+)", amt_line)
                        if amt_match:
                            amt_val = float(amt_match.group(1).replace(",", ""))
                            
                    # Parse CGST/SGST rates from multiline cell lines
                    gst_rate = 18
                    tax_rates = []
                    for line in desc_lines[1:]:
                        tax_match = re.search(r"@\s*([\d.]+)%", line)
                        if tax_match:
                            tax_rates.append(float(tax_match.group(1)))
                    if tax_rates:
                        gst_rate = int(sum(tax_rates))
                        
                    if item_name and not item_name.isdigit() and len(item_name) > 2:
                        parsed_items.append({
                            "item_name": item_name,
                            "hsn_code": hsn_code,
                            "quantity": qty_val,
                            "rate": rate_val if rate_val > 0 else (amt_val / qty_val if qty_val > 0 else 0.0),
                            "amount": amt_val if amt_val > 0 else (qty_val * rate_val),
                            "unit": qty_unit,
                            "gst_rate": gst_rate
                        })
                        
        # Fallback to Text Regex
        if not parsed_items:
            lines = full_text.split('\n')
            for line in lines:
                if any(x in line.lower() for x in ["total", "cgst", "sgst", "igst", "tax", "gst", "round off"]):
                    continue
                match = re.search(r"^(\d+\.?\s+)?([a-zA-Z0-9\s\-\(\)\/]+?)\s+(\d{4,8}\s+)?([\d,.]+)\s*(KG|PCS|BAGS|NOS)?\s+([\d,.]+)\s+[\w/]*\s*([\d,.]+)$", line, re.IGNORECASE)
                if match:
                    item_name = match.group(2).strip()
                    hsn_code = match.group(3).strip() if match.group(3) else ""
                    qty_val = float(match.group(4).replace(",", ""))
                    qty_unit = match.group(5).strip().upper() if match.group(5) else "KG"
                    rate_val = float(match.group(6).replace(",", ""))
                    amt_val = float(match.group(7).replace(",", ""))
                    
                    parsed_items.append({
                        "item_name": item_name,
                        "hsn_code": hsn_code,
                        "quantity": qty_val,
                        "rate": rate_val,
                        "amount": amt_val,
                        "unit": qty_unit,
                        "gst_rate": 18
                    })

        # 6. Parse Totals
        cgst_total = 0.0
        sgst_total = 0.0
        igst_total = 0.0
        grand_total = 0.0
        
        cgst_matches = re.findall(r"(?:CGST|Central Tax|Central GST)\s*(?:@\s*[\d.]+\s*%)?\s*([\d,.]+)", full_text, re.IGNORECASE)
        if cgst_matches:
            cgst_total = sum(float(x.replace(",", "")) for x in cgst_matches)
            
        sgst_matches = re.findall(r"(?:SGST|State Tax|State GST)\s*(?:@\s*[\d.]+\s*%)?\s*([\d,.]+)", full_text, re.IGNORECASE)
        if sgst_matches:
            sgst_total = sum(float(x.replace(",", "")) for x in sgst_matches)
            
        igst_matches = re.findall(r"(?:IGST|Integrated Tax|Integrated GST)\s*(?:@\s*[\d.]+\s*%)?\s*([\d,.]+)", full_text, re.IGNORECASE)
        if igst_matches:
            igst_total = sum(float(x.replace(",", "")) for x in igst_matches)
            
        # Parse grand total
        grand_total_match = re.search(r"(?:Grand Total|Total|Total\s*Amount|Balance|Amount\s*Payable)\s*(?:Value)?\s*(?:[Rs\.\:]+)?\s*([\d,.]+)(?:\s*Only)?$", full_text, re.MULTILINE | re.IGNORECASE)
        if grand_total_match:
            grand_total = float(grand_total_match.group(1).replace(",", ""))
        else:
            for line in reversed(full_text.split('\n')):
                if "total" in line.lower():
                    amt_match = re.search(r"([\d,.]+)\s*$", line)
                    if amt_match:
                        grand_total = float(amt_match.group(1).replace(",", ""))
                        break

        if parsed_items:
            subtotal = sum(item["amount"] for item in parsed_items)
        else:
            subtotal = grand_total - (cgst_total + sgst_total + igst_total)

        if grand_total == 0.0:
            grand_total = subtotal + cgst_total + sgst_total + igst_total
            
        parsed_data = {
            "invoice_no": invoice_no,
            "invoice_date": normalized_date,
            "is_sales": is_sales,
            "party_name": partner_name,
            "party_gst": partner_gst,
            "items": parsed_items,
            "subtotal": subtotal,
            "cgst_total": cgst_total,
            "sgst_total": sgst_total,
            "igst_total": igst_total,
            "grand_total": grand_total,
            "attachment_path": relative_path
        }
        
        # 7. Perform Database Matching Lookups
        db = get_db()
        matched_party_id = None
        matched_party_name = None
        party_suggestions = []
        
        party_table = "customers" if is_sales else "vendors"
        
        # Try matching by GST first
        for gst in [buyer_gst, supplier_gst, partner_gst]:
            if gst:
                row = db.execute(f"SELECT id, name FROM {party_table} WHERE UPPER(gst) = ?", (gst.upper(),)).fetchone()
                if row:
                    matched_party_id = row["id"]
                    matched_party_name = row["name"]
                    break
                    
        # Try matching by name
        for name in [buyer_name, consignee_name, partner_name]:
            if not matched_party_id and name:
                row = db.execute(f"SELECT id, name FROM {party_table} WHERE UPPER(name) = ?", (name.upper(),)).fetchone()
                if row:
                    matched_party_id = row["id"]
                    matched_party_name = row["name"]
                    break
                else:
                    rows = db.execute(f"SELECT id, name FROM {party_table} WHERE name LIKE ? OR ? LIKE '%' || name || '%'", (f"%{name}%", name)).fetchall()
                    if rows:
                        matched_party_id = rows[0]["id"]
                        matched_party_name = rows[0]["name"]
                        party_suggestions = [{"id": r["id"], "name": r["name"]} for r in rows]
                        break
                        
        # List of all parties for search/dropdown selection
        all_parties = db.execute(f"SELECT id, name FROM {party_table} ORDER BY name").fetchall()
        party_list = [{"id": r["id"], "name": r["name"]} for r in all_parties]
        
        # if not matched_party_id and party_list:
        #     matched_party_id = party_list[0]["id"]
        #     matched_party_name = party_list[0]["name"]
            
        # Match Items
        item_table = "finished_goods" if is_sales else "raw_materials"
        all_db_items = db.execute(f"SELECT id, name, code, gst_rate FROM {item_table} WHERE is_active = 1").fetchall()
        db_items_list = [{"id": r["id"], "name": r["name"], "code": r["code"], "gst_rate": r["gst_rate"]} for r in all_db_items]
        
        matched_items = []
        for item in parsed_items:
            p_name = item["item_name"].strip().upper()
            best_match_id = None
            best_match_name = None
            best_match_code = None
            best_match_gst = 18
            
            # Substring matching
            for db_item in db_items_list:
                db_name = db_item["name"].upper()
                if p_name == db_name or db_name in p_name or p_name in db_name:
                    best_match_id = db_item["id"]
                    best_match_name = db_item["name"]
                    best_match_code = db_item["code"]
                    best_match_gst = db_item["gst_rate"]
                    break
                    
            # Overlap matching
            if not best_match_id:
                p_words = set(p_name.split())
                max_overlap = 0
                for db_item in db_items_list:
                    db_words = set(db_item["name"].upper().split())
                    overlap = len(p_words.intersection(db_words))
                    if overlap > max_overlap:
                        max_overlap = overlap
                        best_match_id = db_item["id"]
                        best_match_name = db_item["name"]
                        best_match_code = db_item["code"]
                        best_match_gst = db_item["gst_rate"]
                        
            # if not best_match_id and db_items_list:
            #     best_match_id = db_items_list[0]["id"]
            #     best_match_name = db_items_list[0]["name"]
            #     best_match_code = db_items_list[0]["code"]
            #     best_match_gst = db_items_list[0]["gst_rate"]
                
            matched_items.append({
                "parsed_name": item["item_name"],
                "quantity": item["quantity"],
                "rate": item["rate"],
                "amount": item["amount"],
                "hsn_code": item["hsn_code"] or (best_match_code if best_match_id else ""),
                "matched_item_id": best_match_id,
                "matched_item_name": best_match_name,
                "gst_rate": item.get("gst_rate") or best_match_gst,
                "unit": item["unit"]
            })
            
        return jsonify({
            "parsed_data": parsed_data,
            "matched_party_id": matched_party_id,
            "matched_party_name": matched_party_name,
            "party_suggestions": party_suggestions if party_suggestions else party_list[:5],
            "all_parties": party_list,
            "matched_items": matched_items,
            "all_db_items": db_items_list
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to parse PDF: {str(e)}"}), 500

@tally_parser_bp.route('/generate-overlay-pdf', methods=['POST'])
def generate_overlay_pdf():
    """
    POST /api/upload/generate-overlay-pdf
    Generates a background PDF containing the company logo and watermark,
    merges it underneath/overlayed on pages of the Tally PDF, and returns the merged PDF path.
    """
    import io
    from pypdf import PdfReader, PdfWriter
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A4

    data = request.json or {}
    attachment_path = data.get('attachment_path')
    company = data.get('company', 'four_plastic')
    format_preset = data.get('format', 'watermark_letterhead')
    opacity = float(data.get('opacity', 6)) / 100.0  # Convert percentage to float
    logo_size = float(data.get('logo_size', 320))
    watermark_style = data.get('watermark_style', 'center')
    cover_header = data.get('cover_header', True)
    cover_signatory = data.get('cover_signatory', True)
    
    # Custom letterhead details passed from frontend
    header_text = data.get('header_text', 'FOUR (R) PLASTIC' if company == 'four_plastic' else 'RAJ PLASTIC')
    sub_header_text = data.get('sub_header_text', 'Manufacturers of Premium Plastic Raw Materials' if company == 'four_plastic' else 'Premium Quality Recycled Granules & Plastic Products')
    address = data.get('address', '')
    phone = data.get('phone', '')
    email = data.get('email', '')
    gst_no = data.get('gst_no', '')
    
    if not gst_no:
        gst_no = "27ABTPV9432F1ZX" if company == 'four_plastic' else "27DEFAULTGST"

    if not attachment_path:
        return jsonify({'error': 'attachment_path is required'}), 400
        
    try:
        filename = os.path.basename(attachment_path)
        tally_pdf_path = os.path.join(UPLOAD_FOLDER, filename)
        
        if not os.path.exists(tally_pdf_path):
            return jsonify({'error': 'Tally PDF file not found'}), 404
            
        unique_filename = f"merged_{uuid.uuid4().hex}.pdf"
        output_pdf_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        # Relative path for the frontend
        relative_path = f"/uploads/attachments/{unique_filename}"
        width, height = A4
        
        # Construct absolute path to logo image
        backend_dir = os.path.dirname(os.path.dirname(__file__))
        logo_path = os.path.join(os.path.dirname(backend_dir), 'frontend', 'public', f"logo_{company}.png")
        if not os.path.exists(logo_path):
            logo_path = os.path.join(backend_dir, f"logo_{company}.png")

        # 1. Open PDF with pdfplumber to extract coordinates dynamically
        supplier_box = {
            'x0': 28.5,
            'x1': 355.5,
            'y0': 743.5,
            'y1': 815.5
        }
        signatory_coords = {
            'x0': 450.0,
            'y0': 128.0,
            'w': 112.0,
            'h': 10.0,
            'text_x': 556.19,
            'text_y': 131.0
        }
        
        try:
            with pdfplumber.open(tally_pdf_path) as pdf:
                if pdf.pages:
                    # First page: find supplier details box grid lines
                    first_page = pdf.pages[0]
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
                            
                    # Last page: find signatory line text coordinates
                    last_page = pdf.pages[-1]
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
        except Exception as e:
            print(f"⚠️ Error extracting coordinates dynamically: {e}")

        # 2. Merge pages dynamically
        with open(tally_pdf_path, 'rb') as f:
            pdf_bytes = f.read()
            
        # Clean null bytes in ProcSet list to prevent font dictionary corruption
        import re
        pattern = re.compile(b'ProcSet\\s*\\[[^\\]]*\\]')
        def replace_procset(match):
            return match.group(0).replace(b'\x00', b' ')
        repaired_bytes = pattern.sub(replace_procset, pdf_bytes)
        
        reader = PdfReader(io.BytesIO(repaired_bytes))
        writer = PdfWriter()
        num_pages = len(reader.pages)
        
        for i in range(num_pages):
            orig_page = reader.pages[i]
            
            # Generate underlay (watermark)
            packet_underlay = io.BytesIO()
            c_under = canvas.Canvas(packet_underlay, pagesize=A4)
            if format_preset in ('watermark_letterhead', 'watermark_only'):
                c_under.saveState()
                c_under.setFillAlpha(opacity)
                if watermark_style == 'center':
                    w = logo_size
                    aspect_ratio = 0.45 if company == 'four_plastic' else 0.7
                    h = w * aspect_ratio
                    x = (width - w) / 2
                    y = (height - h) / 2
                    c_under.drawImage(logo_path, x, y, width=w, height=h, mask='auto')
                else:
                    w = 100
                    aspect_ratio = 0.45 if company == 'four_plastic' else 0.7
                    h = w * aspect_ratio
                    for row in range(4):
                        for col in range(3):
                            c_under.saveState()
                            x = 50 + col * 180
                            y = 100 + row * 180
                            c_under.translate(x + w/2, y + h/2)
                            c_under.rotate(-25)
                            c_under.drawImage(logo_path, -w/2, -h/2, width=w, height=h, mask='auto')
                            c_under.restoreState()
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
                if i == 0 and cover_header:
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
                    blue_color = '#004aad' if company == 'four_plastic' else '#1b8a5a'
                    red_color = '#c8102e' if company == 'four_plastic' else '#f57c00'
                    
                    c_over.setFillColor(blue_color)
                    c_over.rect(strip_x, strip_y, strip_w * 0.65, strip_h, stroke=0, fill=1)
                    c_over.setFillColor(red_color)
                    c_over.rect(strip_x + strip_w * 0.65, strip_y, strip_w * 0.35, strip_h, stroke=0, fill=1)
                    c_over.restoreState()
                    
                    logo_w = 120 if company == 'four_plastic' else 65
                    logo_h = logo_w * (0.45 if company == 'four_plastic' else 0.7)
                    logo_x = supplier_box['x0'] + 5.5
                    logo_y = supplier_box['y0'] + ((supplier_box['y1'] - supplier_box['y0']) - logo_h) / 2
                    c_over.drawImage(logo_path, logo_x, logo_y, width=logo_w, height=logo_h, mask='auto')
                    
                    x_text = logo_x + logo_w + 8
                    box_w = supplier_box['x1'] - x_text
                    max_chars = int(box_w / 4.0)
                    
                    c_over.saveState()
                    c_over.setFillColor(blue_color)
                    
                    # Company Name
                    c_over.setFont("Helvetica-Bold", 9.5)
                    c_over.drawString(x_text, supplier_box['y1'] - 11.5, header_text)
                    
                    # Subtitle
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
                    
                    c_over.setFont("Helvetica-Bold", 7.0)
                    addr_lines = wrap_text(address, max_chars)
                    curr_y = supplier_box['y1'] - 27.5
                    for line in addr_lines[:2]:
                        c_over.drawString(x_text, curr_y, line)
                        curr_y -= 8.5
                    
                    contact_str = f"Mob: {phone}"
                    if email:
                        contact_str += f" | Email: {email}"
                    c_over.drawString(x_text, curr_y, contact_str)
                    
                    if gst_no:
                        c_over.drawString(x_text, curr_y - 8.5, f"GSTIN/UIN: {gst_no}")
                    c_over.restoreState()
                
                # Draw letterhead footer on all pages
                has_overlay = True
                c_over.saveState()
                
                # Draw full width colored line at bottom (y = 48)
                line_y = 48
                line_h = 2.5
                x_start = 28.5
                x_end = 566.8
                total_w = x_end - x_start
                w_primary = total_w * 0.65
                w_secondary = total_w * 0.35
                
                blue_color = '#004aad' if company == 'four_plastic' else '#1b8a5a'
                red_color = '#c8102e' if company == 'four_plastic' else '#f57c00'
                
                c_over.setFillColor(blue_color)
                c_over.rect(x_start, line_y, w_primary, line_h, stroke=0, fill=1)
                c_over.setFillColor(red_color)
                c_over.rect(x_start + w_primary, line_y, w_secondary, line_h, stroke=0, fill=1)
                
                # Draw footer details
                c_over.setFillColorRGB(0.2, 0.25, 0.33)
                c_over.setStrokeColor(blue_color)
                c_over.setLineWidth(0.8)
                
                # Address circle
                circle_x = x_start + 8
                circle_y = 26
                c_over.circle(circle_x, circle_y, 7, stroke=1, fill=0)
                c_over.setFillColor(blue_color)
                c_over.circle(circle_x, circle_y, 1.5, stroke=0, fill=1)
                c_over.setFillColorRGB(0.2, 0.25, 0.33)
                
                addr_text_x = x_start + 20
                c_over.setFont("Helvetica-Bold", 7.5)
                
                # Split and wrap address text
                def wrap_address_text(text, max_w, canvas_obj):
                    words = text.split()
                    lines = []
                    current_line = []
                    for word in words:
                        test_line = " ".join(current_line + [word])
                        if canvas_obj.stringWidth(test_line, "Helvetica-Bold", 7.5) <= max_w:
                            current_line.append(word)
                        else:
                            lines.append(" ".join(current_line))
                            current_line = [word]
                    if current_line:
                        lines.append(" ".join(current_line))
                    return lines
                
                addr_lines = wrap_address_text(address, 240, c_over)
                addr_y = 34
                for line in addr_lines[:3]:
                    c_over.drawString(addr_text_x, addr_y, line.upper())
                    addr_y -= 9
                
                # Phone circle & text
                phone_start_x = 325
                c_over.setFillColorRGB(0.2, 0.25, 0.33)
                c_over.setStrokeColor(blue_color)
                circle_phone_x = phone_start_x + 8
                c_over.circle(circle_phone_x, circle_y, 7, stroke=1, fill=0)
                c_over.setFont("Helvetica-Bold", 5)
                c_over.drawCentredString(circle_phone_x, circle_y - 1.5, "P")
                
                c_over.setFont("Helvetica-Bold", 6)
                c_over.drawString(phone_start_x + 20, 24, phone)
                
                # Email circle & text
                email_start_x = 445
                c_over.setStrokeColor(blue_color)
                circle_email_x = email_start_x + 8
                c_over.circle(circle_email_x, circle_y, 7, stroke=1, fill=0)
                c_over.setFont("Helvetica-Bold", 5)
                c_over.drawCentredString(circle_email_x, circle_y - 1.5, "E")
                
                c_over.setFont("Helvetica-Bold", 6)
                c_over.drawString(email_start_x + 20, 24, email)
                
                # Draw GSTIN if present
                if gst_no:
                    c_over.setFont("Helvetica-Bold", 5.5)
                    c_over.drawCentredString((x_start + x_end) / 2, 10, f"GSTIN/UIN: {gst_no}")
                
                c_over.restoreState()
                
                # Last page signatory overlay
                if i == num_pages - 1 and cover_signatory:
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
            
        return jsonify({'pdf_url': relative_path}), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f"Failed to generate overlay PDF: {str(e)}"}), 500
