/**
 * Economics terms data for the Econ Words game
 * This file contains the terms, definitions, and categories for the game
 *
 * These terms are based on the textbook content from chapters 1-7 and problem sets
 */

// Initialize global arrays for math terms
if (typeof window.MATH_TERMS === 'undefined') {
    window.MATH_TERMS = [];
}
if (typeof window.ADVANCED_MATH_TERMS === 'undefined') {
    window.ADVANCED_MATH_TERMS = [];
}

// In Node.js environment, try to import math terms
if (typeof require !== 'undefined') {
    try {
        const mathTerms = require('./math-terms.js');
        const advancedMathTerms = require('./advanced-math-terms.js');
    } catch (e) {
        console.warn('Math terms modules not available in Node.js:', e);
    }
}

// Define the game types
const GAME_TYPES = {
    ECON: 'econ',
    MATH: 'math'
};

// Define the terms data
const TERMS_DATA = [
    // Economics terms (consolidated from all previous categories)
    {
        term: 'DEMAND',
        definition: 'The willingness and ability to purchase goods and services at various prices during a given period of time.',
        chapter: 'Chapter 1: Supply and Demand',
        page: 42,
        type: GAME_TYPES.ECON,
        difficulty: 1
    },
    {
        term: 'UTILITY',
        definition: 'The satisfaction or pleasure that consumers derive from consuming a good or service.',
        chapter: 'Chapter 2: Consumer Theory',
        page: 58,
        type: GAME_TYPES.ECON,
        difficulty: 2
    },
    {
        term: 'CAPITAL',
        definition: 'Manufactured resources such as buildings, machinery, and equipment that are used to produce goods and services.',
        chapter: 'Chapter 3: Production',
        page: 76,
        type: GAME_TYPES.ECON,
        difficulty: 1
    },
    {
        term: 'SUPPLY',
        definition: 'The quantity of a good or service that producers are willing and able to offer for sale at various prices during a given period of time.',
        chapter: 'Supply and Demand',
        page: 45,
        type: GAME_TYPES.ECON,
        difficulty: 1
    },
    {
        term: 'MARKET',
        definition: 'A place where buyers and sellers interact to determine the price and quantity of goods and services.',
        chapter: 'Supply and Demand',
        page: 25,
        type: GAME_TYPES.ECON,
        difficulty: 1
    },
    {
        term: 'SCARCITY',
        definition: 'The fundamental economic problem of having unlimited wants but limited resources to satisfy those wants.',
        chapter: 'Introduction to Economics',
        page: 5,
        type: GAME_TYPES.ECON,
        difficulty: 2
    },
    {
        term: 'ELASTICITY',
        definition: 'A measure of how responsive quantity is to a change in price or other determinants.',
        chapter: 'Elasticity',
        page: 42,
        type: GAME_TYPES.ECON,
        difficulty: 2
    },
    {
        term: 'SURPLUS',
        definition: 'A situation where the quantity supplied exceeds the quantity demanded at the current price.',
        chapter: 'Market Equilibrium',
        page: 65,
        type: GAME_TYPES.ECON,
        difficulty: 2
    },
    {
        term: 'SHORTAGE',
        definition: 'A situation where the quantity demanded exceeds the quantity supplied at the current price.',
        chapter: 'Market Equilibrium',
        page: 67,
        type: GAME_TYPES.ECON,
        difficulty: 2
    },
    {
        term: 'TRADE',
        definition: 'The exchange of goods and services between countries.',
        chapter: 'International Trade',
        page: 182,
        type: GAME_TYPES.ECON,
        difficulty: 1
    },
    {
        term: 'GDP',
        definition: 'Gross Domestic Product - the total value of goods produced and services provided in a country during one year.',
        chapter: 'Chapter 4: National Income',
        page: 78,
        type: GAME_TYPES.ECON,
        difficulty: 1
    },
    {
        term: 'PPP',
        definition: 'Purchasing Power Parity - a measurement that adjusts exchange rates to compare the purchasing power of different currencies.',
        chapter: 'Chapter 5: International Economics',
        page: 92,
        type: GAME_TYPES.ECON,
        difficulty: 2
    },
    {
        term: 'GINI',
        definition: 'A coefficient measuring income inequality within a nation, ranging from 0 (perfect equality) to 1 (perfect inequality).',
        chapter: 'Chapter 6: Income Distribution',
        page: 105,
        type: GAME_TYPES.ECON,
        difficulty: 3
    },
    {
        term: 'CPI',
        definition: 'Consumer Price Index - a measure that examines the weighted average of prices of a basket of consumer goods and services.',
        chapter: 'Inflation',
        page: 152,
        type: GAME_TYPES.ECON,
        difficulty: 1
    },
    {
        term: 'MICRO',
        definition: 'The study of individual economic units such as households, firms, and industries.',
        chapter: 'Introduction to Economics',
        page: 8,
        type: GAME_TYPES.ECON,
        difficulty: 1
    },
    {
        term: 'MACRO',
        definition: 'The study of the economy as a whole, including topics such as inflation, unemployment, and economic growth.',
        chapter: 'Introduction to Economics',
        page: 9,
        type: GAME_TYPES.ECON,
        difficulty: 1
    },
    {
        term: 'MPC',
        definition: 'Marginal Propensity to Consume - the proportion of an increase in income that is spent on consumption.',
        chapter: 'Consumption and Saving',
        page: 112,
        type: GAME_TYPES.ECON,
        difficulty: 2
    },
    {
        term: 'FISCAL',
        definition: 'Relating to government revenue, especially taxes or public spending.',
        chapter: 'Chapter 4: Fiscal Policy',
        page: 145,
        type: GAME_TYPES.ECON,
        difficulty: 2
    },
    {
        term: 'AUSTER',
        definition: 'A set of economic policies aimed at reducing government budget deficits through spending cuts, tax increases, or a combination of both.',
        chapter: 'Chapter 5: Fiscal Policy',
        page: 152,
        type: GAME_TYPES.ECON,
        difficulty: 3
    },
    {
        term: 'SUBSIDY',
        definition: 'A sum of money granted by the government to assist an industry or business so that the price of a commodity or service may remain low or competitive.',
        chapter: 'Chapter 3: Market Intervention',
        page: 95,
        type: GAME_TYPES.ECON,
        difficulty: 2
    },
    {
        term: 'MONETARY',
        definition: 'Policy that manages the money supply and interest rates to achieve macroeconomic objectives.',
        chapter: 'Monetary Policy',
        page: 142,
        type: GAME_TYPES.ECON,
        difficulty: 2
    },
    {
        term: 'TARIFF',
        definition: 'A tax imposed on imported goods and services.',
        chapter: 'International Trade',
        page: 89,
        type: GAME_TYPES.ECON,
        difficulty: 2
    },
    {
        term: 'QUOTA',
        definition: 'A government-imposed limit on the quantity of a good that may be imported.',
        chapter: 'International Trade',
        page: 92,
        type: GAME_TYPES.ECON,
        difficulty: 2
    },
    {
        term: 'STIMULUS',
        definition: 'Government actions to encourage economic activity, typically during a recession.',
        chapter: 'Fiscal Policy',
        page: 118,
        type: GAME_TYPES.ECON,
        difficulty: 2
    },
    {
        term: 'TAXATION',
        definition: 'The system by which a government collects money from people and businesses to pay for public services.',
        chapter: 'Fiscal Policy',
        page: 148,
        type: GAME_TYPES.ECON,
        difficulty: 3
    },
    {
        term: 'INFLATION',
        definition: 'A sustained increase in the general price level of goods and services in an economy over a period of time.',
        chapter: 'Chapter 3: Inflation',
        page: 123,
        type: GAME_TYPES.ECON,
        difficulty: 2
    },
    {
        term: 'STAGFLATION',
        definition: 'A situation in which the inflation rate is high, the economic growth rate slows, and unemployment remains steadily high.',
        chapter: 'Chapter 5: Macroeconomic Problems',
        page: 167,
        type: GAME_TYPES.ECON,
        difficulty: 3
    },
    {
        term: 'LIQUIDITY',
        definition: 'The ease with which an asset can be converted into cash without affecting its market price.',
        chapter: 'Chapter 6: Financial Markets',
        page: 189,
        type: GAME_TYPES.ECON,
        difficulty: 3
    },
    {
        term: 'UNEMPLOYMENT',
        definition: 'The state of being without a job despite being available to work.',
        chapter: 'Labor Markets',
        page: 175,
        type: GAME_TYPES.ECON,
        difficulty: 3
    },
    {
        term: 'INTEREST',
        definition: 'The cost of borrowing money, typically expressed as an annual percentage rate.',
        chapter: 'Monetary Policy',
        page: 145,
        type: GAME_TYPES.ECON,
        difficulty: 2
    },
    {
        term: 'EXCHANGE',
        definition: 'The rate at which one currency can be exchanged for another.',
        chapter: 'International Finance',
        page: 178,
        type: GAME_TYPES.ECON,
        difficulty: 2
    },
    {
        term: 'RECESSION',
        definition: 'A period of temporary economic decline during which trade and industrial activity are reduced.',
        chapter: 'Business Cycles',
        page: 112,
        type: GAME_TYPES.ECON,
        difficulty: 2
    },
    {
        term: 'GROWTH',
        definition: 'An increase in the amount of goods and services produced per head of the population over a period of time.',
        chapter: 'Economic Growth',
        page: 135,
        type: GAME_TYPES.ECON,
        difficulty: 1
    },
    {
        term: 'INVESTMENT',
        definition: 'The purchase of goods that are not consumed today but are used in the future to create wealth.',
        chapter: 'Investment',
        page: 98,
        type: GAME_TYPES.ECON,
        difficulty: 3
    },
    {
        term: 'CONSUMPTION',
        definition: 'The use of goods and services by households.',
        chapter: 'Consumption and Saving',
        page: 110,
        type: GAME_TYPES.ECON,
        difficulty: 3
    },

    // Mathematical Economics terms
    {
        term: 'MR',
        definition: 'Marginal Revenue - the additional revenue gained from selling one more unit of a good or service.',
        chapter: 'Chapter 7: Firm Behavior',
        page: 203,
        type: GAME_TYPES.MATH,
        difficulty: 2,
        formula: 'MR = d(TR)/dQ'
    },
    {
        term: 'MC',
        definition: 'Marginal Cost - the additional cost incurred from producing one more unit of a good or service.',
        chapter: 'Chapter 7: Firm Behavior',
        page: 205,
        type: GAME_TYPES.MATH,
        difficulty: 2,
        formula: 'MC = d(TC)/dQ'
    },
    {
        term: 'MPL',
        definition: 'Marginal Product of Labor - the additional output gained from employing one more unit of labor.',
        chapter: 'Chapter 3: Production',
        page: 82,
        type: GAME_TYPES.MATH,
        difficulty: 2,
        formula: 'MPL = d(Q)/dL'
    },
    {
        term: 'PED',
        definition: 'Price Elasticity of Demand - a measure of how responsive quantity demanded is to a change in price.',
        chapter: 'Chapter 4: Elasticity',
        page: 95,
        type: GAME_TYPES.MATH,
        difficulty: 3,
        formula: 'PED = (dQ/Q)/(dP/P)'
    },
    {
        term: 'YED',
        definition: 'Income Elasticity of Demand - a measure of how responsive quantity demanded is to a change in income.',
        chapter: 'Chapter 4: Elasticity',
        page: 98,
        type: GAME_TYPES.MATH,
        difficulty: 3,
        formula: 'YED = (dQ/Q)/(dY/Y)'
    },
    {
        term: 'GINI',
        definition: 'A coefficient measuring income inequality within a nation, ranging from 0 (perfect equality) to 1 (perfect inequality).',
        chapter: 'Chapter 6: Income Distribution',
        page: 105,
        type: GAME_TYPES.MATH,
        difficulty: 3,
        formula: 'G = A/(A+B)'
    },
    {
        term: 'COBB',
        definition: 'Cobb-Douglas Production Function - a function that represents the relationship between inputs and outputs in production.',
        chapter: 'Chapter 3: Production',
        page: 85,
        type: GAME_TYPES.MATH,
        difficulty: 3,
        formula: 'Q = A * L^α * K^β'
    },
    {
        term: 'MULTIPLIER',
        definition: 'The factor by which an initial change in spending creates a larger final change in GDP.',
        chapter: 'Chapter 8: Fiscal Policy',
        page: 220,
        type: GAME_TYPES.MATH,
        difficulty: 2,
        formula: '1/(1-MPC)'
    },
    {
        term: 'PHILLIPS',
        definition: 'Phillips Curve - a curve showing the inverse relationship between the rate of unemployment and the rate of inflation.',
        chapter: 'Chapter 9: Inflation and Unemployment',
        page: 245,
        type: GAME_TYPES.MATH,
        difficulty: 3,
        formula: 'π = π_e - β(u-u_n)'
    },
    {
        term: 'OKUN',
        definition: 'Okun\'s Law - the relationship between unemployment and GDP growth.',
        chapter: 'Chapter 10: Economic Growth',
        page: 267,
        type: GAME_TYPES.MATH,
        difficulty: 3,
        formula: 'ΔU = -β(g-g*)'
    },
    {
        term: 'FISHER',
        definition: 'Fisher Equation - the relationship between nominal interest rate, real interest rate, and inflation.',
        chapter: 'Chapter 11: Money and Banking',
        page: 290,
        type: GAME_TYPES.MATH,
        difficulty: 2,
        formula: 'i = r + π'
    },
    {
        term: 'QUANTITY',
        definition: 'Quantity Theory of Money - the relationship between money supply, velocity, price level, and output.',
        chapter: 'Chapter 11: Money and Banking',
        page: 295,
        type: GAME_TYPES.MATH,
        difficulty: 2,
        formula: 'M*V = P*Y'
    },
    {
        term: 'SOLOW',
        definition: 'Solow Growth Model - a model explaining long-run economic growth through capital accumulation, labor growth, and technological progress.',
        chapter: 'Chapter 10: Economic Growth',
        page: 270,
        type: GAME_TYPES.MATH,
        difficulty: 3,
        formula: 'Y = F(K,L,A)'
    },
    {
        term: 'TAYLOR',
        definition: 'Taylor Rule - a formula that suggests how central banks should set interest rates based on inflation and output gaps.',
        chapter: 'Chapter 12: Monetary Policy',
        page: 315,
        type: GAME_TYPES.MATH,
        difficulty: 3,
        formula: 'i = r* + π + a(π-π*) + b(y-y*)'
    },
    {
        term: 'LAFFER',
        definition: 'Laffer Curve - a curve showing the relationship between tax rates and tax revenue.',
        chapter: 'Chapter 8: Fiscal Policy',
        page: 225,
        type: GAME_TYPES.MATH,
        difficulty: 2,
        formula: 'T = t*Y(t)'
    },
    {
        term: 'NASH',
        definition: 'Nash Equilibrium - a solution concept in game theory where no player has an incentive to deviate from their chosen strategy.',
        chapter: 'Chapter 13: Game Theory',
        page: 340,
        type: GAME_TYPES.MATH,
        difficulty: 3,
        formula: 'u_i(s_i*,s_-i*) ≥ u_i(s_i,s_-i*)'
    }
];

// Function to get terms by type
function getTermsByType(type) {
    return TERMS_DATA.filter(term => term.type === type);
}

// Function to get a random term by type
function getRandomTerm(type) {
    // If it's a math term and we have math terms available, use those
    if (type === GAME_TYPES.MATH) {
        // Increase difficulty early by using advanced terms more frequently
        // Get the current streak from localStorage
        const streak = parseInt(localStorage.getItem('econWordsStreak') || '0', 10);

        // As streak increases, increase chance of advanced terms
        let advancedProbability = 0.3; // Base 30% chance for advanced terms

        // Increase probability based on streak (max 80% at streak 10)
        if (streak > 0) {
            advancedProbability = Math.min(0.3 + (streak * 0.05), 0.8);
        }

        // Randomly decide whether to use advanced terms
        const useAdvanced = Math.random() < advancedProbability;

        if (useAdvanced && window.ADVANCED_MATH_TERMS.length > 0) {
            // Use advanced math terms
            if (typeof window.getRandomAdvancedMathTerm === 'function') {
                return window.getRandomAdvancedMathTerm();
            }

            const randomIndex = Math.floor(Math.random() * window.ADVANCED_MATH_TERMS.length);
            return {
                ...window.ADVANCED_MATH_TERMS[randomIndex],
                type: GAME_TYPES.MATH
            };
        } else if (window.MATH_TERMS.length > 0) {
            // Use regular math terms
            if (typeof window.getRandomMathTerm === 'function') {
                return window.getRandomMathTerm();
            }

            const randomIndex = Math.floor(Math.random() * window.MATH_TERMS.length);
            return {
                ...window.MATH_TERMS[randomIndex],
                type: GAME_TYPES.MATH
            };
        }
    }

    // For other types, use the standard approach
    const terms = getTermsByType(type);
    const randomIndex = Math.floor(Math.random() * terms.length);
    return terms[randomIndex];
}

// Function to get a term by date and type (for daily puzzles)
function getDailyTerm(type) {
    // If it's a math term, use math terms
    if (type === GAME_TYPES.MATH) {
        // Get the current date
        const today = new Date();
        const dayOfMonth = today.getDate();

        // Use advanced terms on odd days of the month for increased difficulty
        const useAdvanced = dayOfMonth % 2 === 1;

        if (useAdvanced && window.ADVANCED_MATH_TERMS.length > 0) {
            // Use advanced math terms
            if (typeof window.getDailyAdvancedMathTerm === 'function') {
                return window.getDailyAdvancedMathTerm();
            }

            // Otherwise, use a deterministic approach
            const todayStr = today.toISOString().split('T')[0];
            const dateHash = todayStr.split('-').reduce((sum, part) => sum + parseInt(part, 10), 0);
            const termIndex = dateHash % window.ADVANCED_MATH_TERMS.length;

            return {
                ...window.ADVANCED_MATH_TERMS[termIndex],
                type: GAME_TYPES.MATH
            };
        } else if (window.MATH_TERMS.length > 0) {
            // Use regular math terms
            if (typeof window.getDailyMathTerm === 'function') {
                return window.getDailyMathTerm();
            }

            // Otherwise, use a deterministic approach
            const todayStr = today.toISOString().split('T')[0];
            const dateHash = todayStr.split('-').reduce((sum, part) => sum + parseInt(part, 10), 0);
            const termIndex = dateHash % window.MATH_TERMS.length;

            return {
                ...window.MATH_TERMS[termIndex],
                type: GAME_TYPES.MATH
            };
        }
    }

    // For other types, use the standard approach
    const today = new Date().toISOString().split('T')[0];
    const terms = getTermsByType(type);
    const dateHash = today.split('-').reduce((sum, part) => sum + parseInt(part, 10), 0);
    const termIndex = dateHash % terms.length;

    return terms[termIndex];
}

// Function to get a term by its value
function getTermByValue(value) {
    return TERMS_DATA.find(term => term.term === value.toUpperCase());
}

// Function to check if a term exists
function termExists(value) {
    return TERMS_DATA.some(term => term.term === value.toUpperCase());
}

// Function to get the maximum length for a term type
function getMaxLength(type) {
    switch (type) {
        case GAME_TYPES.ECON:
            return 12; // 2-12 letters for economics terms
        case GAME_TYPES.MATH:
            return 10; // 2-10 letters for math terms
        default:
            return 12; // Default
    }
}

// Function to validate a term based on type
function isValidTerm(term, type) {
    switch (type) {
        case GAME_TYPES.ECON:
            return /^[A-Z]{2,12}$/.test(term); // 2-12 uppercase letters
        case GAME_TYPES.MATH:
            return /^[A-Z]{2,10}$/.test(term); // 2-10 uppercase letters
        default:
            return false;
    }
}

// Function to get the game type name for display
function getGameTypeName(type) {
    switch (type) {
        case GAME_TYPES.ECON:
            return 'Economics Term';
        case GAME_TYPES.MATH:
            return 'Mathematical Economics';
        default:
            return 'Economics Term';
    }
}

// Function to get formula for a math term
function getFormula(term) {
    const termData = TERMS_DATA.find(t => t.term === term && t.type === GAME_TYPES.MATH);
    return termData && termData.formula ? termData.formula : null;
}
