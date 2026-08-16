import os
import requests
from flask import Blueprint, request, jsonify

tax_advisor_bp = Blueprint('tax_advisor', __name__)

@tax_advisor_bp.route('/tax-advisor/ask', methods=['POST'])
def ask_tax_advisor():
    data = request.json
    user_query = data.get('query')
    
    if not user_query:
        return jsonify({'error': 'Query is required'}), 400
        
    api_key = os.environ.get('GEMINI_API_KEY') or request.headers.get('X-Gemini-Key')
    if not api_key:
        return jsonify({
            'error': 'API key missing',
            'details': 'Please add GEMINI_API_KEY to your environment variables or provide it in the UI.'
        }), 401
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    system_instruction = """
    You are an expert Indian Chartered Accountant (CA) and tax advisor.
    Your role is to explain Indian tax laws (GST, Income Tax, TDS, TCS, etc.) in simple, easy-to-understand terms.
    When a user asks a complex tax question or quotes a section number:
    1. Explain it simply without excessive legal jargon.
    2. Provide practical examples if helpful.
    3. State the current applicable rates (as of the latest financial year you know).
    4. Provide a "Simple Translation" of the law.
    Format your response in Markdown with clear headings.
    Keep the tone professional yet accessible.
    """
    
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": f"{system_instruction}\n\nUser Query: {user_query}"}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 1024
        }
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        result = response.json()
        
        # Extract the text from the response
        generated_text = result.get('candidates', [])[0].get('content', {}).get('parts', [])[0].get('text', '')
        
        return jsonify({'response': generated_text})
        
    except requests.exceptions.HTTPError as e:
        error_msg = str(e)
        try:
            error_details = response.json()
            if 'error' in error_details and 'message' in error_details['error']:
                error_msg = error_details['error']['message']
        except:
            pass
        return jsonify({'error': 'Gemini API Error', 'details': error_msg}), 502
    except Exception as e:
        return jsonify({'error': 'Failed to process request', 'details': str(e)}), 500
