/**
 * DB Fix for Cash Injections
 * This script ensures the total_cash_injected column is properly updated
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Running DB fix for cash injections...');

    // Check if Supabase is available
    if (!window.supabase) {
        console.error('Supabase not available');
        return;
    }

    try {
        // First check if we're authenticated
        const { data: { user }, error: authError } = await window.supabase.auth.getUser();

        if (authError || !user) {
            console.error('Not authenticated, cannot fix cash injections:', authError);
            return;
        }

        console.log('Authenticated as:', user.id);

        // Get the current game session
        const urlParams = new URLSearchParams(window.location.search);
        const gameId = urlParams.get('gameId');

        if (!gameId) {
            console.error('No game ID found in URL');
            return;
        }

        console.log('Checking game participant record for game:', gameId);

        // Check if the participant record exists
        const { data: participant, error: participantError } = await window.supabase
            .from('game_participants')
            .select('*')
            .eq('game_id', gameId)
            .eq('student_id', user.id)
            .single();

        if (participantError) {
            console.error('Error fetching participant record:', participantError);
            return;
        }

        if (!participant) {
            console.log('No participant record found, nothing to fix');
            return;
        }

        console.log('Found participant record:', participant);

        // Check if total_cash_injected is null or undefined
        if (participant.total_cash_injected === null || participant.total_cash_injected === undefined) {
            console.log('total_cash_injected is null or undefined, updating to 0');

            // Update the record with total_cash_injected = 0
            const { error: updateError } = await window.supabase
                .from('game_participants')
                .update({ total_cash_injected: 0 })
                .eq('id', participant.id);

            if (updateError) {
                console.error('Error updating total_cash_injected:', updateError);
            } else {
                console.log('Successfully updated total_cash_injected to 0');
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

                    const { error: updateError } = await window.supabase
                        .from('game_participants')
                        .update({
                            total_cash_injected: cashInjections,
                            // Also update the total value to ensure it's correct
                            total_value: participant.cash + participant.portfolio_value
                        })
                        .eq('id', participant.id);

                    if (updateError) {
                        console.error('Error updating from localStorage:', updateError);
                    } else {
                        console.log('Successfully updated total_cash_injected from localStorage');
                    }
                }
            }
        } catch (localStorageError) {
            console.warn('Error checking localStorage:', localStorageError);
        }

    } catch (error) {
        console.error('Exception running DB fix:', error);
    }
});
