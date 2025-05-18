/**
 * Simplified Economics Terms Data Module
 */

const EconTermsData = {
    terms: [
        {
            term: "INFLATION",
            hint: "A general increase in prices and fall in the purchasing value of money"
        },
        {
            term: "GDP",
            hint: "The total value of goods and services produced by a country"
        },
        {
            term: "SUPPLY",
            hint: "The amount of something that is available to buy or use"
        },
        {
            term: "DEMAND",
            hint: "The amount of a good or service that consumers want to buy"
        },
        {
            term: "RECESSION",
            hint: "A period of temporary economic decline"
        },
        {
            term: "MONOPOLY",
            hint: "When a single company has complete control over a market"
        },
        {
            term: "FISCAL POLICY",
            hint: "Government spending and taxation decisions"
        },
        {
            term: "TRADE DEFICIT",
            hint: "When a country imports more than it exports"
        },
        {
            term: "INTEREST RATE",
            hint: "The cost of borrowing money"
        },
        {
            term: "UNEMPLOYMENT",
            hint: "The state of being without a paid job"
        }
    ],

    getRandomTerm() {
        return this.terms[Math.floor(Math.random() * this.terms.length)];
    },

    getAllTerms() {
        return this.terms;
    },

    getTermByText(text) {
        return this.terms.find(term => term.term.toUpperCase() === text.toUpperCase()) || null;
    }
};

// Make available globally
window.EconTermsData = EconTermsData;
