// Script to read Excel file structure
const XLSX = require('xlsx');
const path = require('path');

// Path to the Excel file
const filePath = path.join(__dirname, 'class_sample.xlsx');

// Read the Excel file
const workbook = XLSX.readFile(filePath);

// Get the first sheet
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

// Print sheet names
console.log('Sheet Names:', workbook.SheetNames);

// Print the first few rows to understand structure
console.log('\nFirst 5 rows:');
for (let i = 0; i < Math.min(5, data.length); i++) {
    console.log(data[i]);
}

// If there are headers, print them
if (data.length > 0) {
    console.log('\nHeaders (assuming first row contains headers):');
    console.log(data[0]);
}

// Convert to JSON with headers
const jsonData = XLSX.utils.sheet_to_json(worksheet);

// Print the first object to see the structure
if (jsonData.length > 0) {
    console.log('\nFirst row as JSON object:');
    console.log(jsonData[0]);
}
