/**
 * Cash Injection Manager
 * Handles cash injections for the Investment Odyssey game
 */
class CashInjectionManager {
  /**
   * Generate a cash injection for the specified round and game
   * @param {number} roundNumber - The current round number
   * @param {string} gameId - The game ID
   * @returns {Promise<number>} - The amount of the cash injection
   */
  static async generateCashInjection(roundNumber, gameId) {
    console.log(`Generating cash injection for game ${gameId}, round ${roundNumber}`);

    try {
      // Check if we've already processed this round
      const alreadyProcessed = await this.checkIfAlreadyProcessed(gameId, roundNumber);
      if (alreadyProcessed) {
        console.warn(`Cash injection already applied for game ${gameId}, round ${roundNumber}`);
        return 0;
      }

      // Calculate cash injection amount
      const baseAmount = 5000 + (roundNumber * 500); // Starts at 5000, increases by 500 each round
      const variability = 1000; // Higher variability for more dynamic gameplay
      const cashInjection = baseAmount + (Math.random() * 2 - 1) * variability;

      console.log(`Cash injection amount: $${cashInjection.toFixed(2)}`);

      // Apply the cash injection to the database
      const success = await this.applyCashInjection(gameId, roundNumber, cashInjection);
      
      if (success) {
        console.log(`Successfully applied cash injection of $${cashInjection.toFixed(2)}`);
        
        // Update the player state
        await this.updatePlayerState(gameId, cashInjection);
        
        // Show notification to the user
        this.showCashInjectionNotification(cashInjection);
        
        return cashInjection;
      } else {
        console.error(`Failed to apply cash injection for round ${roundNumber}`);
        return 0;
      }
    } catch (error) {
      console.error('Error generating cash injection:', error);
      return 0;
    }
  }

  /**
   * Check if a cash injection has already been processed for this round
   * @param {string} gameId - The game ID
   * @param {number} roundNumber - The round number
   * @returns {Promise<boolean>} - True if already processed, false otherwise
   */
  static async checkIfAlreadyProcessed(gameId, roundNumber) {
    try {
      // Check if there's an entry in the cash_injections table
      const { data, error } = await SupabaseConnector.supabase
        .from('cash_injections')
        .select('id')
        .eq('game_id', gameId)
        .eq('round_number', roundNumber)
        .eq('student_id', await this.getCurrentUserId())
        .maybeSingle();

      if (error) {
        console.warn('Error checking if cash injection already processed:', error);
        return false;
      }

      return !!data; // Return true if data exists
    } catch (error) {
      console.error('Exception checking if cash injection already processed:', error);
      return false;
    }
  }

  /**
   * Apply a cash injection to the database
   * @param {string} gameId - The game ID
   * @param {number} roundNumber - The round number
   * @param {number} amount - The amount of the cash injection
   * @returns {Promise<boolean>} - True if successful, false otherwise
   */
  static async applyCashInjection(gameId, roundNumber, amount) {
    try {
      const userId = await this.getCurrentUserId();
      
      // First try to use the apply_cash_injection function
      try {
        const { data, error } = await SupabaseConnector.supabase.rpc(
          'apply_cash_injection',
          {
            p_game_id: gameId,
            p_student_id: userId,
            p_round_number: roundNumber,
            p_amount: amount
          }
        );

        if (error) {
          console.warn('Error using apply_cash_injection function:', error);
        } else {
          console.log('Successfully applied cash injection using function:', data);
          return true;
        }
      } catch (rpcError) {
        console.warn('Exception using apply_cash_injection function:', rpcError);
      }

      // If the function call failed, do it manually
      console.log('Falling back to manual cash injection');
      
      // 1. Insert into cash_injections table
      const { error: insertError } = await SupabaseConnector.supabase
        .from('cash_injections')
        .upsert({
          game_id: gameId,
          student_id: userId,
          round_number: roundNumber,
          amount: amount
        });

      if (insertError) {
        console.error('Error inserting into cash_injections table:', insertError);
        return false;
      }

      // 2. Get current values from game_participants
      const { data: participant, error: getError } = await SupabaseConnector.supabase
        .from('game_participants')
        .select('id, cash, total_value, total_cash_injected')
        .eq('game_id', gameId)
        .eq('student_id', userId)
        .maybeSingle();

      if (getError || !participant) {
        console.error('Error getting participant record:', getError);
        return false;
      }

      // 3. Calculate new values
      const currentCash = participant.cash || 10000;
      const currentTotalValue = participant.total_value || 10000;
      const currentTotalCashInjected = participant.total_cash_injected || 0;

      const newCash = currentCash + amount;
      const newTotalValue = currentTotalValue + amount;
      const newTotalCashInjected = currentTotalCashInjected + amount;

      // 4. Update game_participants
      const { error: updateError } = await SupabaseConnector.supabase
        .from('game_participants')
        .update({
          cash: newCash,
          total_value: newTotalValue,
          total_cash_injected: newTotalCashInjected,
          last_updated: new Date().toISOString()
        })
        .eq('id', participant.id);

      if (updateError) {
        console.error('Error updating game_participants:', updateError);
        return false;
      }

      console.log('Successfully applied cash injection manually');
      return true;
    } catch (error) {
      console.error('Exception applying cash injection:', error);
      return false;
    }
  }

  /**
   * Update the player state with the cash injection
   * @param {string} gameId - The game ID
   * @param {number} amount - The amount of the cash injection
   * @returns {Promise<void>}
   */
  static async updatePlayerState(gameId, amount) {
    try {
      // Get the current player state
      const playerState = PortfolioManager.getPlayerState();
      if (!playerState) {
        console.warn('No player state available to update');
        return;
      }

      // Update the player state
      playerState.cash += amount;
      playerState.totalValue += amount;
      
      // Initialize totalCashInjected if not already there
      if (!playerState.totalCashInjected) {
        playerState.totalCashInjected = 0;
      }
      
      // Add the current injection to the player state
      playerState.totalCashInjected += amount;

      console.log(`Updated player state: cash=${playerState.cash}, totalValue=${playerState.totalValue}, totalCashInjected=${playerState.totalCashInjected}`);

      // Save to localStorage as a backup
      try {
        localStorage.setItem(`total_cash_injected_${gameId}`, playerState.totalCashInjected.toString());
        localStorage.setItem(`player_cash_${gameId}`, playerState.cash.toString());
      } catch (storageError) {
        console.warn('Error saving to localStorage:', storageError);
      }

      // Force a UI update
      UIController.updatePortfolioDisplay();
    } catch (error) {
      console.error('Error updating player state:', error);
    }
  }

  /**
   * Show a notification to the user about the cash injection
   * @param {number} amount - The amount of the cash injection
   */
  static showCashInjectionNotification(amount) {
    try {
      // Show cash injection alert
      const cashInjectionAlert = document.getElementById('cash-injection-alert');
      const cashInjectionAmount = document.getElementById('cash-injection-amount');

      if (cashInjectionAlert && cashInjectionAmount) {
        cashInjectionAmount.textContent = amount.toFixed(2);
        cashInjectionAlert.style.display = 'block';

        // Hide alert after 5 seconds
        setTimeout(() => {
          cashInjectionAlert.style.display = 'none';
        }, 5000);
      }
    } catch (error) {
      console.error('Error showing cash injection notification:', error);
    }
  }

  /**
   * Get the current user ID
   * @returns {Promise<string>} - The user ID
   */
  static async getCurrentUserId() {
    try {
      // Try to get from Supabase auth
      const { data: { user } } = await SupabaseConnector.supabase.auth.getUser();
      if (user) {
        return user.id;
      }

      // Try to get from localStorage
      const storedAuth = localStorage.getItem('investmentOdysseyAuth');
      if (storedAuth) {
        const parsedAuth = JSON.parse(storedAuth);
        if (parsedAuth && parsedAuth.studentId) {
          return parsedAuth.studentId;
        }
      }

      // Try older format
      const userId = localStorage.getItem('student_id');
      if (userId) {
        return userId;
      }

      // Default to debug ID
      return '00000000-0000-0000-0000-000000000000';
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return '00000000-0000-0000-0000-000000000000';
    }
  }
}
