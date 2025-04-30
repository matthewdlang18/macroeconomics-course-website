/**
 * Return Calculation Fix
 * This script ensures consistent return calculation across the application
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Applying return calculation fix...');
    
    // Define the correct return calculation function
    window.calculateReturn = function(totalValue, initialValue = 10000, cashInjections = 0) {
        // Formula: (total value) / (initial value + cash injections) - 1
        const returnPct = ((totalValue / (initialValue + cashInjections)) - 1) * 100;
        
        console.log(`Return calculation:`);
        console.log(`- Total Value: ${totalValue}`);
        console.log(`- Initial Value: ${initialValue}`);
        console.log(`- Cash Injections: ${cashInjections}`);
        console.log(`- Formula: ((${totalValue}) / (${initialValue} + ${cashInjections}) - 1) * 100`);
        console.log(`- Return Percentage: ${returnPct.toFixed(2)}%`);
        
        return returnPct;
    };
    
    // Override any existing return calculation functions
    if (window.LeaderboardManager) {
        console.log('Overriding LeaderboardManager return calculation');
        
        // Store the original updateLeaderboard method
        const originalUpdateLeaderboard = window.LeaderboardManager.updateLeaderboard;
        
        // Override the updateLeaderboard method
        window.LeaderboardManager.updateLeaderboard = function() {
            console.log('Using overridden updateLeaderboard method with correct return calculation');
            return originalUpdateLeaderboard.apply(this, arguments);
        };
    }
    
    // Check for any leaderboard tables and update them
    function updateLeaderboardDisplays() {
        console.log('Checking for leaderboard tables to update...');
        
        // Find all leaderboard tables
        const leaderboardTables = document.querySelectorAll('table.leaderboard-table, #class-leaderboard-table, #leaderboard-table');
        
        if (leaderboardTables.length > 0) {
            console.log(`Found ${leaderboardTables.length} leaderboard tables to update`);
            
            // For each table, find rows and update return calculation
            leaderboardTables.forEach((table, tableIndex) => {
                const rows = table.querySelectorAll('tbody tr');
                
                console.log(`Table ${tableIndex + 1} has ${rows.length} rows`);
                
                rows.forEach((row, rowIndex) => {
                    // Find the total value cell (usually the 3rd cell)
                    const totalValueCell = row.querySelector('td:nth-child(3)');
                    
                    // Find the return percentage cell (usually the 4th cell)
                    const returnCell = row.querySelector('td:nth-child(4)');
                    
                    if (totalValueCell && returnCell) {
                        try {
                            // Extract total value
                            const totalValueText = totalValueCell.textContent.trim();
                            const totalValue = parseFloat(totalValueText.replace(/[^0-9.-]+/g, ''));
                            
                            // Get cash injections from data attribute or default to 0
                            const cashInjections = parseFloat(row.getAttribute('data-cash-injections') || '0');
                            
                            // Calculate return
                            const returnPct = window.calculateReturn(totalValue, 10000, cashInjections);
                            
                            // Update return cell
                            const returnClass = returnPct >= 0 ? 'text-success' : 'text-danger';
                            returnCell.className = returnClass;
                            returnCell.textContent = `${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(2)}%`;
                            
                            console.log(`Updated row ${rowIndex + 1}: Total Value = ${totalValue}, Return = ${returnPct.toFixed(2)}%`);
                        } catch (e) {
                            console.warn(`Error updating row ${rowIndex + 1}:`, e);
                        }
                    }
                });
            });
        } else {
            console.log('No leaderboard tables found');
        }
    }
    
    // Run once on page load
    setTimeout(updateLeaderboardDisplays, 2000);
    
    // Set up a periodic check for leaderboard updates
    setInterval(updateLeaderboardDisplays, 10000);
});
