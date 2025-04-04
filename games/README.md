# Games Migration Plan

This document outlines the plan for migrating the economics games from the activities directory to the dedicated games directory.

## Directory Structure

```
games/
├── fiscal-balance/       # Previously activities/activity4
│   ├── css/
│   ├── js/
│   ├── data/
│   ├── index.html
│   └── ta-dashboard.html
│
├── investment-odyssey/   # Previously activities/activity4a
│   ├── css/
│   ├── js/
│   ├── templates/
│   ├── front-page.html
│   ├── index.html
│   ├── single-player.html
│   ├── leaderboard.html
│   └── ta-dashboard.html
│
├── js/                   # Shared JavaScript files
│   ├── firebase-config.js
│   └── student-auth.js
│
└── index.html            # Games hub page
```

## Migration Steps

### 1. Copy Files

```bash
# Copy Fiscal Balance Game
cp -r activities/activity4/* games/fiscal-balance/

# Copy Investment Odyssey
cp -r activities/activity4a/* games/investment-odyssey/

# Copy shared JavaScript files
cp activities/js/firebase-config.js games/js/
cp activities/js/student-auth.js games/js/
```

### 2. Update References

After copying the files, you'll need to update all internal references:

1. Update all relative paths in HTML files
   - Change `../index.html` to `../../index.html`
   - Change `../js/firebase-config.js` to `../js/firebase-config.js`
   - Change links between games

2. Update JavaScript imports
   - Update paths to shared JavaScript files
   - Update Firebase collection references if needed

3. Update image references
   - Ensure all image paths are correct

### 3. Testing

After migration, thoroughly test:

1. Navigation between pages
2. Authentication flow
3. Game functionality
4. Leaderboard functionality
5. TA dashboard functionality

### 4. Cleanup

Once everything is working correctly:

1. Update the main index.html to point to the new games location
2. Consider adding redirects from the old locations to the new ones
3. Eventually, you can remove the game files from the activities directory

## Notes

- This migration should be done incrementally, testing each game after migration
- Keep the original files until testing is complete
- Consider using symbolic links during transition to maintain backward compatibility
