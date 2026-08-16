from flask import Flask
from routes.advance_routes import advance_bp

app = Flask(__name__)
app.register_blueprint(advance_bp)

print("\n" + "="*60)
print("REGISTERED ADVANCE ROUTES")
print("="*60)

routes_found = False
for rule in app.url_map.iter_rules():
    rule_str = str(rule)
    if 'advances' in rule_str:
        routes_found = True
        methods = ','.join(list(rule.methods - {'HEAD', 'OPTIONS'}))
        print(f"✅ {rule_str} - Methods: {methods}")

if not routes_found:
    print("❌ No advance routes found!")

print("="*60 + "\n")