import os
import io
import json
import tempfile
import pandas as pd
import pdfplumber
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

# Load environment variables (API Keys)
load_dotenv()

bank_statement_bp = Blueprint('bank_statement_bp', __name__)

@bank_statement_bp.route('/convert', methods=['POST'])
def convert_bank_statement():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
        
    file = request.files['file']
    password = request.form.get('password', '')
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Only PDF files are supported"}), 400

    try:
        all_tables = []
        
        # Read file into memory so we can use it multiple times
        file_bytes = file.read()
        file_io = io.BytesIO(file_bytes)
        
        # Open the PDF with pdfplumber
        with pdfplumber.open(file_io, password=password if password else None) as pdf:
            for page in pdf.pages:
                # Extract tables from the page
                tables = page.extract_tables()
                for table in tables:
                    # Clean up rows, removing empty rows entirely
                    cleaned_table = []
                    for row in table:
                        if any(cell is not None and str(cell).strip() != '' for cell in row):
                            # Replace None with empty string
                            cleaned_row = [str(cell).strip() if cell is not None else '' for cell in row]
                            cleaned_table.append(cleaned_row)
                    
                    if cleaned_table:
                        all_tables.extend(cleaned_table)

        if not all_tables:
            print("No digital tables found. Activating Top OCR (Gemini Vision)...")
            api_key = os.environ.get("GEMINI_API_KEY")
            
            if not api_key:
                return jsonify({"error": "Top OCR requires an API Key. Please insert your GEMINI_API_KEY into the backend/.env file."}), 400
                
            try:
                from google import genai
                client = genai.Client(api_key=api_key)
                
                # Write to temp file for Gemini upload
                with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                    tmp.write(file_bytes)
                    tmp_path = tmp.name
                    
                print("Uploading PDF to Gemini AI...")
                gemini_file = client.files.upload(file=tmp_path)
                
                prompt = """
                You are an expert financial accountant. 
                Extract all the transaction rows from the tables in this bank statement.
                Return ONLY a JSON array of arrays. Do not include any markdown formatting, backticks, or other text.
                Format: [["Date", "Description", "Debit", "Credit", "Balance"], ["01/01/2023", "Example", "100", "", "500"]]
                Make sure you extract every single transaction row exactly as it appears.
                """
                
                print("Extracting tables using Gemini Vision...")
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=[gemini_file, prompt]
                )
                
                # Cleanup
                client.files.delete(name=gemini_file.name)
                os.remove(tmp_path)
                
                # Parse JSON
                response_text = response.text.strip()
                if response_text.startswith('```json'):
                    response_text = response_text[7:-3].strip()
                elif response_text.startswith('```'):
                    response_text = response_text[3:-3].strip()
                    
                all_tables = json.loads(response_text)
                print("Top OCR extraction complete.")
                
            except json.JSONDecodeError:
                return jsonify({"error": "Top OCR failed to format the response correctly. Please try again."}), 500
            except Exception as ocr_e:
                print(f"Top OCR Error: {ocr_e}")
                return jsonify({"error": "Top OCR failed to process the document. Check backend logs."}), 500

        # Convert to Pandas DataFrame
        df = pd.DataFrame(all_tables)
        
        # Create an in-memory Excel file
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, header=False, sheet_name='Bank Statement')
            
        output.seek(0)
        
        original_name = os.path.splitext(secure_filename(file.filename))[0]
        excel_filename = f"{original_name}_converted.xlsx"

        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=excel_filename
        )

    except pdfplumber.pdfminer.pdfdocument.PDFPasswordIncorrect:
        return jsonify({"error": "Incorrect password or password required for this PDF."}), 401
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to process PDF: {str(e)}"}), 500
