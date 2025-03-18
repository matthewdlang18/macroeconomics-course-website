// ta-dashboard-config.js
// Configuration file for the TA Dashboard

// Set your repository name here if deploying to GitHub Pages
const GITHUB_REPO_NAME = "macroeconomics-course-spring"; // Change to your actual repo name

// GeoJSON file path configuration
const GEOJSON_PATHS = {
    default: [
        './data/us-states.geojson', // Relative to the current HTML file
        '../data/us-states.geojson', // One level up
        '/activities/activity1/data/us-states.geojson' // Absolute path
    ],
    github: [
        'https://your-github-username.github.io/macroeconomics-course-website/activities/activity1/data/us-states.geojson'
    ]
};