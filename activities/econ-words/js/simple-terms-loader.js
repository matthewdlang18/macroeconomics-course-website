/**
 * Simple Terms Loader for Econ Words
 * This file loads terms from the CSV file without using ES modules
 */

// Game types
const GAME_TYPES = {
    ECON: 'econ'
};

// Cache for loaded terms
let loadedTerms = null;
let isLoading = false;

/**
 * Parse CSV data into an array of objects
 * @param {string} csvText - The CSV text to parse
 * @returns {Array} - Array of objects with headers as keys
 */
function parseCSV(csvText) {
    // Split by lines
    const lines = csvText.split(/\r?\n/).filter(line => line.trim());

    // Parse header row
    const headers = lines[0].split(',').map(header => header.trim());

    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        // Skip empty lines
        if (!lines[i].trim()) continue;

        // Handle quoted values with commas inside them
        const values = [];
        let currentValue = '';
        let inQuotes = false;

        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }

        // Add the last value
        values.push(currentValue.trim());

        // Create object from headers and values
        const obj = {};
        headers.forEach((header, index) => {
            // Remove quotes from values
            let value = values[index] || '';
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
            }
            obj[header] = value;
        });

        data.push(obj);
    }

    return data;
}

/**
 * Get fallback terms in case CSV loading fails
 * @returns {Array} - Array of fallback term objects
 */
function getFallbackTerms() {
    return [
        {
            term: 'DEMAND',
            definition: 'The willingness and ability to purchase goods and services at various prices during a given period of time.',
            hint: 'What consumers want to buy',
            category: 'concept',
            chapter: 'Chapter 2',
            difficulty: 1
        },
        {
            term: 'SUPPLY',
            definition: 'The willingness and ability of producers to offer goods and services for sale at various prices during a given period of time.',
            hint: 'What producers want to sell',
            category: 'concept',
            chapter: 'Chapter 2',
            difficulty: 1
        },
        {
            term: 'INFLATION',
            definition: 'A general increase in prices and fall in the purchasing value of money.',
            hint: 'When prices rise over time',
            category: 'variable',
            chapter: 'Chapter 3',
            difficulty: 1
        },
        {
            term: 'GDP',
            definition: 'The total value of goods and services produced within a country in a specific time period.',
            hint: 'Measures a country\'s economic output',
            category: 'variable',
            chapter: 'Chapter 3',
            difficulty: 1
        },
        {
            term: 'RECESSION',
            definition: 'A period of temporary economic decline during which trade and industrial activity are reduced.',
            hint: 'Economic downturn',
            category: 'concept',
            chapter: 'Chapter 4',
            difficulty: 2
        }
    ];
}

/**
 * Load terms from the CSV file
 * @param {Function} callback - Callback function to receive the terms
 */
function loadTerms(callback) {
    // If we're already loading terms, wait for it to complete
    if (isLoading) {
        setTimeout(() => loadTerms(callback), 100);
        return;
    }

    // If we already have loaded terms, return them
    if (loadedTerms) {
        callback(loadedTerms);
        return;
    }

    // Otherwise, load terms from CSV
    isLoading = true;

    // Show loading message
    const loadingElement = document.getElementById('loading-message');
    if (loadingElement) {
        loadingElement.textContent = 'Loading terms from spreadsheet...';
        loadingElement.style.display = 'block';
    }

    // Fetch the CSV file
    fetch('data/econ-terms.csv')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load CSV: ${response.status} ${response.statusText}`);
            }
            return response.text();
        })
        .then(csvText => {
            // Parse the CSV
            const terms = parseCSV(csvText);

            // Process the terms
            loadedTerms = terms.map(term => {
                // Keep the original term with spaces
                const processedTerm = term.Word ? term.Word.toUpperCase().trim() : '';

                return {
                    term: processedTerm,
                    // Start with the general hint, not the definition
                    definition: term['Hint 1 (General Related Word)'] || '',
                    // Store all hints for progressive revealing
                    hint1: term['Hint 1 (General Related Word)'] || '',
                    hint2: term['Hint 2 (Chapter)'] || '',
                    hint3: term['Hint 3 (Stronger Hint)'] || '',
                    category: term.Topic || 'term',
                    chapter: term.Chapter || '',
                    difficulty: 1,
                    type: GAME_TYPES.ECON
                };
            }).filter(term => term.term && term.hint1);

            // Log the first few terms for debugging
            console.log('Loaded terms:', loadedTerms.slice(0, 3));

            // Hide loading message
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }

            // Call the callback with the loaded terms
            callback(loadedTerms);
        })
        .catch(error => {
            console.error('Error loading terms from CSV:', error);

            // Use fallback terms in case of error
            loadedTerms = getFallbackTerms();

            // Hide loading message
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }

            // Call the callback with the fallback terms
            callback(loadedTerms);
        })
        .finally(() => {
            isLoading = false;
        });
}

/**
 * Get a random term
 * @param {Function} callback - Callback function to receive the term
 */
function getRandomTerm(callback) {
    loadTerms(terms => {
        const randomIndex = Math.floor(Math.random() * terms.length);
        callback(terms[randomIndex]);
    });
}

/**
 * Get a daily term
 * @param {Function} callback - Callback function to receive the term
 */
function getDailyTerm(callback) {
    loadTerms(terms => {
        // Get today's date as a string (YYYY-MM-DD)
        const today = new Date().toISOString().split('T')[0];

        // Use the date to deterministically select a term
        const dateHash = today.split('-').reduce((sum, part) => sum + parseInt(part, 10), 0);
        const termIndex = dateHash % terms.length;

        callback(terms[termIndex]);
    });
}
