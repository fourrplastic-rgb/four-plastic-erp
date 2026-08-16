import requests
import os
import json

api_key = os.environ.get('GEMINI_API_KEY')
if not api_key:
    # Try to read from .env if it exists
    try:
        with open('.env', 'r') as f:
            for line in f:
                if line.startswith('GEMINI_API_KEY='):
                    api_key = line.strip().split('=', 1)[1]
    except:
        pass

if not api_key:
    print("NO API KEY")
    exit(1)

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
system_instruction = "You are an expert Indian CA. Answer simply."
user_query = "what are the time limits of cancellation of revocation"

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
    print("Status:", response.status_code)
    data = response.json()
    print("Response:")
    print(json.dumps(data, indent=2))
except Exception as e:
    print(e)
