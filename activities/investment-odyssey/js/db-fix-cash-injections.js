/**
 * DB Fix for Cash Injections
 * This script ensures the total_cash_injected column is properly updated
 * but only runs when appropriate conditions are met
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DB fix for cash injections loaded, waiting for authentication...');

    // Only run on class-game.html page with a gameId
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('gameId');
    const isClassGamePage = window.location.pathname.includes('class-game.html');

    if (!isClassGamePage || !gameId) {
        console.log('Not on class game page or no gameId, skipping cash injection fix');
        return;
    }

    // Check if Supabase is available
    if (!window.supabase) {
        console.log('Supabase not available yet, will check again later');
        // Try again in 2 seconds
        setTimeout(checkAndFixCashInjections, 2000);
        return;
    }

    // Set up auth state change listener
    const authListener = window.supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            console.log('User signed in, running cash injection fix');
            checkAndFixCashInjections();
        }
    });

    // Also try to run now in case user is already authenticated
    checkAndFixCashInjections();

    // Function to check and fix cash injections
    async function checkAndFixCashInjections() {
        try {
            // Check if we're authenticated
            const { data: { user }, error: authError } = await window.supabase.auth.getUser();

            if (authError || !user) {
                console.log('Not authenticated yet, will try again when user signs in');
                return;
            }

            console.log('Authenticated as:', user.id);
            console.log('Running cash injection fix for game:', gameId);

            // Check if the participant record exists
            try {
                const { data: participant, error: participantError } = await window.supabase
                    .from('game_participants')
                    .select('*')
                    .eq('game_id', gameId)
                    .eq('student_id', user.id)
                    .single();

                if (participantError) {
                    console.log('Participant record not found yet, may be created later:', participantError.message);
                    return;
                }

                if (!participant) {
                    console.log('No participant record found yet, nothing to fix');
                    return;
                }

                console.log('Found participant record:', participant);

                // Check if total_cash_injected is null or undefined
                if (participant.total_cash_injected === null || participant.total_cash_injected === undefined) {
                    console.log('total_cash_injected is null or undefined, updating to 0');

                    try {
                        // Update the record with total_cash_injected = 0
                        const { error: updateError } = await window.supabase
                            .from('game_participants')
                            .update({ total_cash_injected: 0 })
                            .eq('id', participant.id);

                        if (updateError) {
                            console.log('Error updating total_cash_injected:', updateError.message);
                        } else {
                            console.log('Successfully updated total_cash_injected to 0');
                        }
                    } catch (e) {
                        console.log('Exception updating total_cash_injected:', e.message);
                    }
                } else {
                    console.log('total_cash_injected already exists with value:', participant.total_cash_injected);
                }

                // Check if we have cash injections in localStorage
                try {
                    const localStorageKey = `cashInjections_${user.id}_${gameId}`;
                    const storedInjections = localStorage.getItem(localStorageKey);

                    if (storedInjections) {
                        const cashInjections = parseFloat(storedInjections) || 0;
                        console.log('Found cash injections in localStorage:', cashInjections);

                        // If localStorage value is different from database, update the database
                        if (cashInjections !== participant.total_cash_injected) {
                            console.log('Updating total_cash_injected from localStorage value');

                            try {
                                const { error: updateError } = await window.supabase
                                    .from('game_participants')
                                    .update({
                                        total_cash_injected: cashInjections,
                                        // Also update the total value to ensure it's correct
                                        total_value: participant.cash + participant.portfolio_value
                                    })
                                    .eq('id', participant.id);

                                if (updateError) {
                                    console.log('Error updating from localStorage:', updateError.message);
                                } else {
                                    console.log('Successfully updated total_cash_injected from localStorage');
                                }
                            } catch (e) {
                                console.log('Exception updating from localStorage:', e.message);
                            }
                        }
                    }
                } catch (localStorageError) {
                    console.log('Error checking localStorage:', localStorageError.message);
                }
            } catch (participantError) {
                console.log('Error checking participant record:', participantError.message);
            }
        } catch (error) {
            console.log('Exception running DB fix:', error.message);
        }
    }
});
