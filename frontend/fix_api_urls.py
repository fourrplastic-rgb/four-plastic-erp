import os
import glob

def fix_api_endpoints():
    frontend_dir = os.path.dirname(os.path.abspath(__file__))
    
    # We want to search in app/ and context/ directories
    search_patterns = [
        os.path.join(frontend_dir, 'app', '**', '*.js'),
        os.path.join(frontend_dir, 'app', '**', '*.jsx'),
        os.path.join(frontend_dir, 'context', '**', '*.js'),
        os.path.join(frontend_dir, 'components', '**', '*.js'),
    ]
    
    files_to_process = []
    for pattern in search_patterns:
        files_to_process.extend(glob.glob(pattern, recursive=True))
        
    modified_count = 0
    
    for filepath in files_to_process:
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            if 'http://localhost:5000/api' in content:
                # Replace the hardcoded absolute URL with the relative proxy URL
                new_content = content.replace('http://localhost:5000/api', '/api')
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                modified_count += 1
                print(f"Updated {os.path.relpath(filepath, frontend_dir)}")
        except Exception as e:
            print(f"Error processing {filepath}: {e}")
            
    print(f"Total files updated: {modified_count}")

if __name__ == "__main__":
    fix_api_endpoints()
