import os
import glob

routes_dir = 'backend/routes/'
for filepath in glob.glob(routes_dir + '*.py'):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Replace @bp.route('/') with @bp.route('')
    # Handle different quotes and spacing if necessary
    new_content = content.replace(".route('/')", ".route('')")
    new_content = new_content.replace(".route(\"/\")", ".route(\"\")")
    new_content = new_content.replace(".route('/', methods=", ".route('', methods=")
    
    if content != new_content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")
