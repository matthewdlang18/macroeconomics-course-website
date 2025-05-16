/**
 * Test utility for verifying the security of guest ID generation
 * This file demonstrates how the secure ID generation works and allows
 * for testing potential collisions with a large sample size
 */

document.addEventListener('DOMContentLoaded', function() {
    // Create a button for testing
    const testButton = document.createElement('button');
    testButton.textContent = 'Test Secure ID Generation';
    testButton.style.cssText = 'padding: 10px; margin: 20px; background: #4CAF50; color: white; border: none; border-radius: 4px;';
    
    // Create output area
    const outputDiv = document.createElement('div');
    outputDiv.style.cssText = 'padding: 20px; margin: 20px; border: 1px solid #ddd; max-height: 300px; overflow-y: auto;';
    
    document.body.appendChild(testButton);
    document.body.appendChild(outputDiv);
    
    // Add click handler for the test button
    testButton.addEventListener('click', function() {
        runSecureIdTest(outputDiv);
    });
    
    // Function to run the ID generation test
    function runSecureIdTest(output) {
        // Clear previous output
        output.innerHTML = '<h3>Testing Secure ID Generation</h3>';
        
        // Check if EconWordsAuth is available
        if (typeof EconWordsAuth === 'undefined' || typeof EconWordsAuth._generateSecureId !== 'function') {
            output.innerHTML += '<p style="color: red;">Error: EconWordsAuth not available or missing _generateSecureId method</p>';
            return;
        }
        
        // Generate a number of IDs to test for collisions
        const testCount = 1000;
        const ids = new Set();
        const generatedIds = [];
        
        output.innerHTML += `<p>Generating ${testCount} secure IDs to check for collisions...</p>`;
        
        // Generate the IDs
        for (let i = 0; i < testCount; i++) {
            const id = EconWordsAuth._generateSecureId(16);
            generatedIds.push(id);
            ids.add(id);
        }
        
        // Check for collisions
        const collisions = testCount - ids.size;
        
        if (collisions > 0) {
            output.innerHTML += `<p style="color: red;">Warning: ${collisions} collisions detected!</p>`;
        } else {
            output.innerHTML += `<p style="color: green;">Success: No collisions detected in ${testCount} IDs</p>`;
        }
        
        // Show some sample IDs
        output.innerHTML += '<h4>Sample IDs:</h4><ul>';
        for (let i = 0; i < 10; i++) {
            output.innerHTML += `<li>guest-${generatedIds[i]}</li>`;
        }
        output.innerHTML += '</ul>';
        
        // Add entropy analysis
        const entropyAnalysis = analyzeEntropy(generatedIds);
        output.innerHTML += '<h4>Entropy Analysis:</h4>';
        output.innerHTML += `<p>Character distribution entropy: ${entropyAnalysis.entropy.toFixed(4)} bits/char</p>`;
        output.innerHTML += `<p>ID length: ${entropyAnalysis.length} characters</p>`;
        output.innerHTML += `<p>Estimated bits of entropy per ID: ${(entropyAnalysis.entropy * entropyAnalysis.length).toFixed(1)} bits</p>`;
    }
    
    // Function to analyze the entropy of generated IDs
    function analyzeEntropy(ids) {
        if (ids.length === 0) return { entropy: 0, length: 0 };
        
        // Count character frequency
        const charCount = {};
        let totalChars = 0;
        
        ids.forEach(id => {
            for (let i = 0; i < id.length; i++) {
                const char = id[i];
                charCount[char] = (charCount[char] || 0) + 1;
                totalChars++;
            }
        });
        
        // Calculate Shannon entropy
        let entropy = 0;
        for (const char in charCount) {
            const probability = charCount[char] / totalChars;
            entropy -= probability * Math.log2(probability);
        }
        
        return {
            entropy: entropy,
            length: ids[0].length
        };
    }
});
