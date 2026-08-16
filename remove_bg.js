const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'frontend/app');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else {
            if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walkDir(targetDir);
let changedFiles = 0;

const regex1 = /className="min-h-screen bg-gradient-to-br from-[a-z]+-900 via-[a-z]+-900 to-[a-z]+-900"/g;
const regex2 = /className="min-h-screen bg-gradient-to-br from-[a-z]+-900 via-[a-z]+-900 to-[a-z]+-900 flex items-center justify-center"/g;
const regex3 = /className="min-h-screen bg-gradient-to-br from-[a-z]+-900 via-[a-z]+-900 to-[a-z]+-900 flex flex-col"/g;
// More generic catch-all
const genericRegex = /className="min-h-screen bg-gradient-to-br from-[a-z]+-\d+ via-[a-z]+-\d+ to-[a-z]+-\d+(.*?)"/g;


files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    content = content.replace(genericRegex, 'className="min-h-screen$1"');
    // Also remove the dashboard one just in case it had bg-gradient-to-br from-blue-900
    
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedFiles++;
        console.log(`Updated ${file}`);
    }
});

console.log(`Done. Changed ${changedFiles} files.`);
