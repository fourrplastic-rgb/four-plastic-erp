const fs = require('fs');

const files = [
  'frontend/app/sales-invoices/[id]/page.js',
  'frontend/app/sales-invoices/edit/[id]/page.js',
  'frontend/app/purchase-invoices/[id]/page.js',
  'frontend/app/purchase-invoices/edit/[id]/page.js'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace complex unwrap logic with simple params.id
  content = content.replace(/const \[invoiceId, setInvoiceId\] = useState\(null\)[\s\S]*?unwrapParams\(\)\n  \}, \[params\]\)/g, 'const invoiceId = params?.id');
  
  fs.writeFileSync(file, content);
  console.log('Fixed', file);
});
