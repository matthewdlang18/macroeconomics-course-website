/**
 * Command-line test runner for Investment Odyssey class game
 * 
 * This script uses Puppeteer to open the test-class-game.html page
 * and run the tests in a headless browser.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('Starting Investment Odyssey class game tests...');
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless mode
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    // Open new page
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Get file path
    const filePath = path.join(__dirname, 'test-class-game.html');
    const fileUrl = `file://${filePath}`;
    
    console.log(`Opening ${fileUrl}`);
    
    // Navigate to test page
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    
    // Wait for page to load
    await page.waitForSelector('#run-tests');
    
    // Capture console logs
    page.on('console', msg => {
      const text = msg.text();
      
      if (text.includes('✅')) {
        console.log('\x1b[32m%s\x1b[0m', text); // Green
      } else if (text.includes('❌')) {
        console.log('\x1b[31m%s\x1b[0m', text); // Red
      } else if (text.includes('⚠️')) {
        console.log('\x1b[33m%s\x1b[0m', text); // Yellow
      } else {
        console.log(text);
      }
    });
    
    // Click run tests button
    await page.click('#run-tests');
    
    // Wait for tests to complete (adjust timeout as needed)
    await page.waitForFunction(() => {
      const output = document.getElementById('test-output');
      return output.textContent.includes('TEST RESULTS SUMMARY');
    }, { timeout: 30000 });
    
    // Get test results
    const testResults = await page.evaluate(() => {
      const output = document.getElementById('test-output');
      return output.textContent;
    });
    
    // Extract summary
    const summaryMatch = testResults.match(/TEST RESULTS SUMMARY:[\s\S]+?Overall: (\d+)\/(\d+) tests passed/);
    
    if (summaryMatch) {
      const passedTests = parseInt(summaryMatch[1]);
      const totalTests = parseInt(summaryMatch[2]);
      
      console.log('\n===========================================');
      console.log(`SUMMARY: ${passedTests}/${totalTests} tests passed`);
      
      if (passedTests === totalTests) {
        console.log('\x1b[32m%s\x1b[0m', '🎉 All tests passed! The class game should work correctly.');
      } else {
        console.log('\x1b[33m%s\x1b[0m', '⚠️ Some tests failed. There may still be issues with the class game.');
      }
      console.log('===========================================\n');
    }
    
    // Keep browser open for manual inspection
    console.log('Browser will remain open for manual inspection.');
    console.log('Press Ctrl+C to exit.');
  } catch (error) {
    console.error('Error running tests:', error);
    await browser.close();
  }
}

// Run tests
runTests();
