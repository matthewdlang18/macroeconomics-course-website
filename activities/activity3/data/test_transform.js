// Script to test the transformation function
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
const rawData = XLSX.utils.sheet_to_json(worksheet);

// Transform the data
const transformedData = transformExcelData(rawData);

// Print the first transformed student object
console.log('First transformed student:');
console.log(JSON.stringify(transformedData[0], null, 2));

// Print the number of students
console.log(`\nTotal students: ${transformedData.length}`);

// Transform Excel data from indicators as rows to students as rows
function transformExcelData(rawData) {
    // Initialize transformed data array
    const transformedData = [];
    
    // Get all student column names (Student 1, Student 2, etc.)
    const firstRow = rawData[0];
    const studentColumns = Object.keys(firstRow).filter(key => key !== 'Indicator');
    
    // Create a student object for each column
    studentColumns.forEach((studentCol, index) => {
        const studentData = {
            studentId: studentCol
        };
        
        // Extract data for each indicator for this student
        rawData.forEach(row => {
            const indicator = row['Indicator'];
            const value = row[studentCol];
            
            // Map indicator names to our expected field names
            switch(indicator) {
                case 'Yield Curve (10Y-2Y)':
                    studentData['10Y2Y_Yield'] = value;
                    break;
                case 'ISM New Orders':
                    studentData['ISM_NewOrders'] = value;
                    break;
                case 'Building Permits':
                    studentData['Building_Permits'] = value;
                    break;
                case 'Consumer Confidence':
                    studentData['Consumer_Confidence'] = value;
                    break;
                case 'Initial Claims':
                    studentData['Initial_Claims'] = value;
                    break;
                case 'S&P 500':
                    studentData['SP500'] = value;
                    break;
                case 'CLI': // Map CLI to Avg_WeeklyHours as a substitute
                    studentData['Avg_WeeklyHours'] = value;
                    break;
                case '12-Month GDP Growth':
                    studentData['GDP_12Month'] = value;
                    break;
                case '24-Month GDP Growth':
                    studentData['GDP_24Month'] = value;
                    break;
                case 'Recession Probability':
                    studentData['Recession_Probability'] = value;
                    break;
                case 'PMI': // Add PMI mapping
                    studentData['PMI'] = value;
                    break;
                default:
                    // Store other indicators with a sanitized name
                    const sanitizedName = indicator.replace(/[^a-zA-Z0-9]/g, '_');
                    studentData[sanitizedName] = value;
            }
        });
        
        transformedData.push(studentData);
    });
    
    return transformedData;
}
