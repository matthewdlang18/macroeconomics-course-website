/**
 * Economic Terms Data Backup Module
 * This file provides a fallback source of terms data in case the CSV file cannot be loaded.
 */

// Create a global object for the data
const EconomicTermsData = {
    // Raw CSV data as a string for direct parsing
    rawCSV: `Word,Hint 1 (Chapter Title),Hint 2 (General Related Word),Hint 3 (Stronger Hint)
ECONOMICS,Introduction to Economics,Decisions,The study of how choices are made given that decision makers face constraints.
SCARCITY,Introduction to Economics,Limited,Wants and needs of decision makers are greater than the limited resources available.
OPPORTUNITY COST,Introduction to Economics,Forgone,What is given up when a choice is made.
MICROECONOMICS,Introduction to Economics,Individual,Studies how specific individuals and firms interact and make decisions.
MACROECONOMICS,Introduction to Economics,Aggregate,Examines the economy as a whole.
POSITIVE STATEMENT,Introduction to Economics,Objective,A statement about how things objectively are.
NORMATIVE STATEMENT,Introduction to Economics,Subjective,A statement about how we think things should be.
MARGINAL ANALYSIS,Introduction to Economics,Additional,Comparing the marginal benefit and marginal cost of a decision.
RATIONAL DECISION MAKERS,Introduction to Economics,Information,Individuals who use all available information to achieve their goals.
EXPLICIT COST,Introduction to Economics,Payment,A direct monetary payment associated with a choice.
IMPLICIT COST,Introduction to Economics,Non-financial,"A non-monetary cost of a decision, often the value of the next best option forgone."
SLOPE,Introduction to Economics (Appendix),Steepness,Change in the Y-variable divided by the change in the X-variable on a graph.
Y INTERCEPT,Introduction to Economics (Appendix),Starting Point,The value of the Y-variable when the X-variable is zero.
DEMAND,Supply and Demand,Consumer,The amount of a good or service that consumers purchase at a particular price.
SUPPLY,Supply and Demand,Producer,The amount of a good that a firm is willing and able to produce at a given price.
EQUILIBRIUM,Supply and Demand,Balance,The point where quantity demanded equals quantity supplied.
LAW OF DEMAND,Supply and Demand,Inverse,Price and quantity demanded of a good or service move in the opposite direction.
LAW OF SUPPLY,Supply and Demand,Direct,"When the price of a good increases, the quantity supplied increases."
COMPLEMENT GOODS,Supply and Demand,Together,"When the price of one good decreases, it causes an increase in demand for another."
SUBSTITUTE GOODS,Supply and Demand,Alternative,"When the price of one good decreases, the demand for the other good also decreases."`,

    // Function to get the raw CSV data
    getRawCSV: function() {
        return this.rawCSV;
    },
    
    // Minimum set of terms as objects that can be used directly if parsing fails
    getMinimalTerms: function() {
        return [
            {
                term: 'DEMAND',
                definition: 'The amount of a good or service that consumers purchase at a particular price.',
                hint1: 'Supply and Demand',
                hint2: 'Consumer',
                hint3: 'The amount of a good or service that consumers purchase at a particular price.',
                category: 'concept',
                chapter: 'Chapter 2',
                chapterTitle: 'Supply and Demand',
                difficulty: 1
            },
            {
                term: 'SUPPLY',
                definition: 'The amount of a good that a firm is willing and able to produce at a given price.',
                hint1: 'Supply and Demand',
                hint2: 'Producer',
                hint3: 'The amount of a good that a firm is willing and able to produce at a given price.',
                category: 'concept',
                chapter: 'Chapter 2',
                chapterTitle: 'Supply and Demand',
                difficulty: 1
            },
            {
                term: 'INFLATION',
                definition: 'The rate at which the general level of prices for goods and services is rising.',
                hint1: 'Measuring the Macroeconomy',
                hint2: 'Prices',
                hint3: 'The rate at which the general level of prices for goods and services is rising.',
                category: 'variable',
                chapter: 'Chapter 3',
                chapterTitle: 'Measuring the Macroeconomy',
                difficulty: 1
            },
            {
                term: 'GDP',
                definition: 'Gross Domestic Product; The total value of all final goods and services produced within a country\'s borders.',
                hint1: 'Measuring the Macroeconomy',
                hint2: 'Production',
                hint3: 'Gross Domestic Product; The total value of all final goods and services produced within a country\'s borders.',
                category: 'variable',
                chapter: 'Chapter 3',
                chapterTitle: 'Measuring the Macroeconomy',
                difficulty: 1
            },
            {
                term: 'RECESSION',
                definition: 'A significant decline in economic activity spread across the economy, lasting months.',
                hint1: 'Short-Run Macroeconomic Equilibrium',
                hint2: 'Decline',
                hint3: 'A significant decline in economic activity spread across the economy, lasting months.',
                category: 'concept',
                chapter: 'Chapter 4',
                chapterTitle: 'Short-Run Macroeconomic Equilibrium',
                difficulty: 2
            }
        ];
    }
};

// Make the data available globally
window.EconomicTermsData = EconomicTermsData;
