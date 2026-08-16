/**
 * Converts an array of objects into a CSV string and triggers a download.
 * 
 * @param {Array} data - Array of objects to convert to CSV
 * @param {String} filename - Name of the downloaded file (e.g. "report.csv")
 * @param {Array} columnHeaders - Optional array of strings for custom column headers. If not provided, object keys are used.
 */
export const exportToCSV = (data, filename = 'export.csv', columnHeaders = null) => {
  if (!data || !data.length) {
    console.warn('No data provided to exportToCSV');
    return;
  }

  // Create headers row
  const headers = columnHeaders || Object.keys(data[0]);
  const headerRow = headers.map(header => `"${String(header).replace(/"/g, '""')}"`).join(',');

  // Create data rows
  const rows = data.map(item => {
    // If columnHeaders are provided, we should ideally map based on keys, 
    // but if not provided, we just use the object's keys.
    const keys = Object.keys(data[0]);
    return keys.map(key => {
      let val = item[key];
      if (val === null || val === undefined) val = '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
  });

  // Combine into a single CSV string
  const csvContent = [headerRow, ...rows].join('\n');

  // Create a Blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
