/**
 * Economics terms data for the Econ Words game
 * This file contains the terms, definitions, and categories for the game
 *
 * These terms are based on the textbook content from chapters 1-7
 */

// Define the game types
const GAME_TYPES = {
    CONCEPT: 'concept',
    TERM: 'term',
    POLICY: 'policy',
    VARIABLE: 'variable'
};

// Define the terms data
const TERMS_DATA = [
    // Concept terms
    {
        term: 'DEMAND',
        definition: 'The willingness and ability to purchase goods and services at various prices during a given period of time.',
        chapter: 'Chapter 1: Supply and Demand',
        page: 42,
        type: GAME_TYPES.CONCEPT,
        difficulty: 1
    },
    {
        term: 'UTILITY',
        definition: 'The satisfaction or pleasure that consumers derive from consuming a good or service.',
        chapter: 'Chapter 2: Consumer Theory',
        page: 58,
        type: GAME_TYPES.CONCEPT,
        difficulty: 2
    },
    {
        term: 'CAPITAL',
        definition: 'Manufactured resources such as buildings, machinery, and equipment that are used to produce goods and services.',
        chapter: 'Chapter 3: Production',
        page: 76,
        type: GAME_TYPES.CONCEPT,
        difficulty: 1
    },
    {
        term: 'SUPPLY',
        definition: 'The quantity of a good or service that producers are willing and able to offer for sale at various prices during a given period of time.',
        chapter: 'Supply and Demand',
        page: 45,
        type: GAME_TYPES.CONCEPT,
        difficulty: 1
    },
    {
        term: 'MARKET',
        definition: 'A place where buyers and sellers interact to determine the price and quantity of goods and services.',
        chapter: 'Supply and Demand',
        page: 25,
        type: GAME_TYPES.CONCEPT,
        difficulty: 1
    },
    {
        term: 'SCARCITY',
        definition: 'The fundamental economic problem of having unlimited wants but limited resources to satisfy those wants.',
        chapter: 'Introduction to Economics',
        page: 5,
        type: GAME_TYPES.CONCEPT,
        difficulty: 2
    },
    {
        term: 'ELASTICITY',
        definition: 'A measure of how responsive quantity is to a change in price or other determinants.',
        chapter: 'Elasticity',
        page: 42,
        type: GAME_TYPES.CONCEPT,
        difficulty: 2
    },
    {
        term: 'SURPLUS',
        definition: 'A situation where the quantity supplied exceeds the quantity demanded at the current price.',
        chapter: 'Market Equilibrium',
        page: 65,
        type: GAME_TYPES.CONCEPT,
        difficulty: 2
    },
    {
        term: 'SHORTAGE',
        definition: 'A situation where the quantity demanded exceeds the quantity supplied at the current price.',
        chapter: 'Market Equilibrium',
        page: 67,
        type: GAME_TYPES.CONCEPT,
        difficulty: 2
    },
    {
        term: 'TRADE',
        definition: 'The exchange of goods and services between countries.',
        chapter: 'International Trade',
        page: 182,
        type: GAME_TYPES.CONCEPT,
        difficulty: 1
    },

    // Term terms
    {
        term: 'GDP',
        definition: 'Gross Domestic Product - the total value of goods produced and services provided in a country during one year.',
        chapter: 'Chapter 4: National Income',
        page: 78,
        type: GAME_TYPES.TERM,
        difficulty: 1
    },
    {
        term: 'PPP',
        definition: 'Purchasing Power Parity - a measurement that adjusts exchange rates to compare the purchasing power of different currencies.',
        chapter: 'Chapter 5: International Economics',
        page: 92,
        type: GAME_TYPES.TERM,
        difficulty: 2
    },
    {
        term: 'GINI',
        definition: 'A coefficient measuring income inequality within a nation, ranging from 0 (perfect equality) to 1 (perfect inequality).',
        chapter: 'Chapter 6: Income Distribution',
        page: 105,
        type: GAME_TYPES.TERM,
        difficulty: 3
    },
    {
        term: 'CPI',
        definition: 'Consumer Price Index - a measure that examines the weighted average of prices of a basket of consumer goods and services.',
        chapter: 'Inflation',
        page: 152,
        type: GAME_TYPES.TERM,
        difficulty: 1
    },
    {
        term: 'MICRO',
        definition: 'The study of individual economic units such as households, firms, and industries.',
        chapter: 'Introduction to Economics',
        page: 8,
        type: GAME_TYPES.TERM,
        difficulty: 1
    },
    {
        term: 'MACRO',
        definition: 'The study of the economy as a whole, including topics such as inflation, unemployment, and economic growth.',
        chapter: 'Introduction to Economics',
        page: 9,
        type: GAME_TYPES.TERM,
        difficulty: 1
    },
    {
        term: 'MPC',
        definition: 'Marginal Propensity to Consume - the proportion of an increase in income that is spent on consumption.',
        chapter: 'Consumption and Saving',
        page: 112,
        type: GAME_TYPES.TERM,
        difficulty: 2
    },

    // Policy terms
    {
        term: 'FISCAL',
        definition: 'Relating to government revenue, especially taxes or public spending.',
        chapter: 'Chapter 4: Fiscal Policy',
        page: 145,
        type: GAME_TYPES.POLICY,
        difficulty: 2
    },
    {
        term: 'AUSTER',
        definition: 'A set of economic policies aimed at reducing government budget deficits through spending cuts, tax increases, or a combination of both.',
        chapter: 'Chapter 5: Fiscal Policy',
        page: 152,
        type: GAME_TYPES.POLICY,
        difficulty: 3
    },
    {
        term: 'SUBSIDY',
        definition: 'A sum of money granted by the government to assist an industry or business so that the price of a commodity or service may remain low or competitive.',
        chapter: 'Chapter 3: Market Intervention',
        page: 95,
        type: GAME_TYPES.POLICY,
        difficulty: 2
    },
    {
        term: 'MONETARY',
        definition: 'Policy that manages the money supply and interest rates to achieve macroeconomic objectives.',
        chapter: 'Monetary Policy',
        page: 142,
        type: GAME_TYPES.POLICY,
        difficulty: 2
    },
    {
        term: 'TARIFF',
        definition: 'A tax imposed on imported goods and services.',
        chapter: 'International Trade',
        page: 89,
        type: GAME_TYPES.POLICY,
        difficulty: 2
    },
    {
        term: 'QUOTA',
        definition: 'A government-imposed limit on the quantity of a good that may be imported.',
        chapter: 'International Trade',
        page: 92,
        type: GAME_TYPES.POLICY,
        difficulty: 2
    },
    {
        term: 'STIMULUS',
        definition: 'Government actions to encourage economic activity, typically during a recession.',
        chapter: 'Fiscal Policy',
        page: 118,
        type: GAME_TYPES.POLICY,
        difficulty: 2
    },
    {
        term: 'TAXATION',
        definition: 'The system by which a government collects money from people and businesses to pay for public services.',
        chapter: 'Fiscal Policy',
        page: 148,
        type: GAME_TYPES.POLICY,
        difficulty: 3
    },
    {
        term: 'SUBSIDY',
        definition: 'A sum of money granted by the government to assist an industry or business so that the price of a commodity or service may remain low or competitive.',
        chapter: 'Market Intervention',
        page: 95,
        type: GAME_TYPES.POLICY,
        difficulty: 2
    },

    // Variable terms
    {
        term: 'INFLATION',
        definition: 'A sustained increase in the general price level of goods and services in an economy over a period of time.',
        chapter: 'Chapter 3: Inflation',
        page: 123,
        type: GAME_TYPES.VARIABLE,
        difficulty: 2
    },
    {
        term: 'STAGFLATION',
        definition: 'A situation in which the inflation rate is high, the economic growth rate slows, and unemployment remains steadily high.',
        chapter: 'Chapter 5: Macroeconomic Problems',
        page: 167,
        type: GAME_TYPES.VARIABLE,
        difficulty: 3
    },
    {
        term: 'LIQUIDITY',
        definition: 'The ease with which an asset can be converted into cash without affecting its market price.',
        chapter: 'Chapter 6: Financial Markets',
        page: 189,
        type: GAME_TYPES.VARIABLE,
        difficulty: 3
    },
    {
        term: 'UNEMPLOYMENT',
        definition: 'The state of being without a job despite being available to work.',
        chapter: 'Labor Markets',
        page: 175,
        type: GAME_TYPES.VARIABLE,
        difficulty: 3
    },
    {
        term: 'INTEREST',
        definition: 'The cost of borrowing money, typically expressed as an annual percentage rate.',
        chapter: 'Monetary Policy',
        page: 145,
        type: GAME_TYPES.VARIABLE,
        difficulty: 2
    },
    {
        term: 'EXCHANGE',
        definition: 'The rate at which one currency can be exchanged for another.',
        chapter: 'International Finance',
        page: 178,
        type: GAME_TYPES.VARIABLE,
        difficulty: 2
    },
    {
        term: 'RECESSION',
        definition: 'A period of temporary economic decline during which trade and industrial activity are reduced.',
        chapter: 'Business Cycles',
        page: 112,
        type: GAME_TYPES.VARIABLE,
        difficulty: 2
    },
    {
        term: 'GROWTH',
        definition: 'An increase in the amount of goods and services produced per head of the population over a period of time.',
        chapter: 'Economic Growth',
        page: 135,
        type: GAME_TYPES.VARIABLE,
        difficulty: 1
    },
    {
        term: 'INVESTMENT',
        definition: 'The purchase of goods that are not consumed today but are used in the future to create wealth.',
        chapter: 'Investment',
        page: 98,
        type: GAME_TYPES.VARIABLE,
        difficulty: 3
    },
    {
        term: 'CONSUMPTION',
        definition: 'The use of goods and services by households.',
        chapter: 'Consumption and Saving',
        page: 110,
        type: GAME_TYPES.VARIABLE,
        difficulty: 3
    }
];

// Function to get terms by type
function getTermsByType(type) {
    return TERMS_DATA.filter(term => term.type === type);
}

// Function to get a random term by type
function getRandomTerm(type) {
    const terms = getTermsByType(type);
    const randomIndex = Math.floor(Math.random() * terms.length);
    return terms[randomIndex];
}

// Function to get a term by date and type (for daily puzzles)
function getDailyTerm(type) {
    // Get today's date as a string (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    // Get all terms of the specified type
    const terms = getTermsByType(type);

    // Use the date to deterministically select a term
    // This ensures the same term is shown all day, but changes each day
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
        case GAME_TYPES.CONCEPT:
            return 8; // 3-8 letters
        case GAME_TYPES.TERM:
            return 5; // 2-5 letters
        case GAME_TYPES.POLICY:
            return 7; // 5-7 letters
        case GAME_TYPES.VARIABLE:
            return 12; // 5-12 letters
        default:
            return 8; // Default
    }
}

// Function to validate a term based on type
function isValidTerm(term, type) {
    switch (type) {
        case GAME_TYPES.CONCEPT:
            return /^[A-Z]{3,8}$/.test(term); // 3-8 uppercase letters
        case GAME_TYPES.TERM:
            return /^[A-Z]{2,5}$/.test(term); // 2-5 uppercase letters
        case GAME_TYPES.POLICY:
            return /^[A-Z]{5,7}$/.test(term); // 5-7 uppercase letters
        case GAME_TYPES.VARIABLE:
            return /^[A-Z]{5,12}$/.test(term); // 5-12 uppercase letters
        default:
            return false;
    }
}

// Function to get the game type name for display
function getGameTypeName(type) {
    switch (type) {
        case GAME_TYPES.CONCEPT:
            return 'Economic Concept';
        case GAME_TYPES.TERM:
            return 'Economic Term';
        case GAME_TYPES.POLICY:
            return 'Policy Term';
        case GAME_TYPES.VARIABLE:
            return 'Economic Variable';
        default:
            return 'Economic Term';
    }
}
