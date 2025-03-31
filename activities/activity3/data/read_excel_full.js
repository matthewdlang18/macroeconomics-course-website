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
const data = XLSX.utils.sheet_to_json(worksheet);

// Print all rows to see all indicators
console.log('All indicators:');
data.forEach(row => {
    console.log(row.Indicator);
});
