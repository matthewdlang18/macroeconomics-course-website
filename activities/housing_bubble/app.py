from flask import Flask, render_template, request, jsonify, session
from flask_socketio import SocketIO, emit, join_room, leave_room
import random
import string
import json
from datetime import datetime
import secrets

app = Flask(__name__)
app.config['SECRET_KEY'] = secrets.token_hex(16)
socketio = SocketIO(app, cors_allowed_origins="*")

# Game state storage
games = {}
ROLES = ['homebuyer', 'developer', 'speculator', 'mortgage_lender', 'banker']
MAX_PLAYERS = 50
ROUNDS_AFTER_POP = 5

class Game:
    def __init__(self, game_id, ta_password):
        self.id = game_id
        self.ta_password = ta_password
        self.players = {}
        self.market_price = 100  # Starting house price
        self.round = 0
        self.is_active = False
        self.bubble_popped = False
        self.rounds_since_pop = 0
        self.available_roles = ROLES * (MAX_PLAYERS // len(ROLES))
        self.waiting_for_actions = set()  # Track players who haven't acted this round
        self.interest_rates = {
            'mortgage': 5.0,  # Base mortgage rate
            'bank': 3.0,      # Base bank-to-bank lending rate
        }
        self.properties = []  # List of all properties in the game
        self.loans = []       # List of all active loans
        random.shuffle(self.available_roles)

    def add_player(self, player_id, name, is_ta=False):
        if is_ta:
            self.players[player_id] = {
                'name': name,
                'role': 'ta',
                'money': 0,
            }
            return True, 'ta'
            
        if len(self.players) >= MAX_PLAYERS:
            return False, "Game is full"
        if not self.available_roles:
            return False, "No roles available"
        
        role = self.available_roles.pop()
        self.players[player_id] = {
            'name': name,
            'role': role,
            'money': 1000,
            'properties': [] if role in ['homebuyer', 'speculator', 'developer'] else [],
            'loans': [] if role in ['mortgage_lender', 'banker'] else [],
            'debt': 0,
            'credit_score': 700,  # Starting credit score
            'actions_taken': 0
        }
        self.waiting_for_actions.add(player_id)
        return True, role

    def create_property(self, location, quality):
        """Create a new property with given attributes"""
        base_value = 100 * (1 + (quality / 10))  # Quality from 1-10
        location_multiplier = {
            'suburban': 1.0,
            'urban': 1.5,
            'prime': 2.0
        }.get(location, 1.0)
        
        property_id = len(self.properties)
        new_property = {
            'id': property_id,
            'location': location,
            'quality': quality,
            'base_value': base_value * location_multiplier,
            'current_value': base_value * location_multiplier * (self.market_price / 100),
            'owner': None,
            'mortgage': None
        }
        self.properties.append(new_property)
        return property_id

    def create_loan(self, lender_id, borrower_id, amount, interest_rate, term):
        """Create a new loan with given terms"""
        loan_id = len(self.loans)
        new_loan = {
            'id': loan_id,
            'lender_id': lender_id,
            'borrower_id': borrower_id,
            'original_amount': amount,
            'remaining_amount': amount,
            'interest_rate': interest_rate,
            'term': term,
            'payments_made': 0,
            'status': 'active'
        }
        self.loans.append(new_loan)
        return loan_id

    def process_round(self):
        """Process the end of a round and update game state"""
        # Calculate market forces
        avg_mortgage_rate = self.interest_rates['mortgage']
        num_speculators = len([p for p in self.players.values() if p['role'] == 'speculator'])
        num_properties = len(self.properties)
        total_debt = sum(loan['remaining_amount'] for loan in self.loans)
        
        # Market pressure factors
        rate_pressure = (avg_mortgage_rate - 5) * -2  # Higher rates decrease prices
        speculation_pressure = (num_speculators / len(self.players)) * 10
        supply_demand = ((len(self.players) - num_properties) / len(self.players)) * 5
        debt_pressure = (total_debt / (1000 * len(self.players))) * 3
        
        # Random market shock
        shock = random.uniform(-5, 5)
        
        # Calculate price change
        price_change = (rate_pressure + speculation_pressure + supply_demand + debt_pressure + shock)
        self.market_price *= (1 + (price_change / 100))
        
        # Update property values
        for prop in self.properties:
            prop['current_value'] = prop['base_value'] * (self.market_price / 100)
        
        # Check for bubble pop
        if not self.bubble_popped and self.market_price > 300:
            if random.random() < 0.2:  # 20% chance of pop once threshold is reached
                self.bubble_popped = True
                self.market_price *= 0.5  # Price crashes by 50%
                
        if self.bubble_popped:
            self.rounds_since_pop += 1
            
        # Reset waiting list for next round
        self.waiting_for_actions = set(player_id for player_id, player in self.players.items() 
                                     if player['role'] != 'ta')
        self.round += 1

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/ta')
def ta_interface():
    return render_template('ta.html')

@app.route('/create_game', methods=['POST'])
def create_game():
    password = request.json.get('password', '')
    game_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    games[game_id] = Game(game_id, password)
    return jsonify({'game_id': game_id})

@app.route('/join_game/<game_id>')
def join_game(game_id):
    if game_id not in games:
        return "Game not found", 404
    return render_template('game.html', game_id=game_id)

@socketio.on('join')
def on_join(data):
    game_id = data['game_id']
    player_id = request.sid
    name = data['name']
    is_ta = data.get('is_ta', False)
    password = data.get('password', '')
    
    if game_id not in games:
        emit('error', {'message': 'Game not found'})
        return
    
    game = games[game_id]
    
    if is_ta and password != game.ta_password:
        emit('error', {'message': 'Invalid TA password'})
        return
    
    success, result = game.add_player(player_id, name, is_ta)
    
    if success:
        join_room(game_id)
        emit('game_joined', {
            'role': result,
            'initial_state': {
                'market_price': game.market_price,
                'players': len(game.players),
                'interest_rates': game.interest_rates,
                'properties': game.properties,
                'loans': game.loans if result in ['ta', 'banker', 'mortgage_lender'] else []
            }
        })
        emit('player_joined', {'name': name, 'role': result}, room=game_id)
    else:
        emit('error', {'message': result})

@socketio.on('ta_action')
def on_ta_action(data):
    game_id = data['game_id']
    action = data['action']
    password = data['password']
    
    if game_id not in games:
        emit('error', {'message': 'Game not found'})
        return
        
    game = games[game_id]
    if password != game.ta_password:
        emit('error', {'message': 'Invalid TA password'})
        return
        
    if action == 'start_round':
        game.process_round()
        emit('round_update', {
            'round': game.round,
            'market_price': game.market_price,
            'waiting_for': list(game.waiting_for_actions)
        }, room=game_id)
    elif action == 'end_game':
        scores = [(p['name'], p['money']) for p in game.players.values()]
        scores.sort(key=lambda x: x[1], reverse=True)
        emit('game_over', {'scores': scores}, room=game_id)

@socketio.on('player_action')
def on_player_action(data):
    game_id = data['game_id']
    player_id = request.sid
    action_type = data['action_type']
    action_data = data['action_data']
    
    if game_id not in games:
        emit('error', {'message': 'Game not found'})
        return
    
    game = games[game_id]
    player = game.players.get(player_id)
    
    if not player:
        emit('error', {'message': 'Player not found'})
        return
        
    if player_id not in game.waiting_for_actions:
        emit('error', {'message': 'Already acted this round'})
        return
    
    # Process different actions based on role
    success = False
    message = "Invalid action"
    
    if player['role'] == 'banker':
        if action_type == 'set_bank_rate':
            rate = float(action_data['rate'])
            if 0 <= rate <= 15:  # Limit reasonable rate range
                game.interest_rates['bank'] = rate
                success = True
                message = f"Bank-to-bank rate set to {rate}%"
        elif action_type == 'lend_to_bank':
            target_bank = action_data['target_bank']
            amount = float(action_data['amount'])
            if amount <= player['money']:
                loan_id = game.create_loan(player_id, target_bank, amount, 
                                         game.interest_rates['bank'], 12)
                player['money'] -= amount
                game.players[target_bank]['money'] += amount
                success = True
                message = f"Lent ${amount} to bank at {game.interest_rates['bank']}% interest"
    
    elif player['role'] == 'mortgage_lender':
        if action_type == 'offer_mortgage':
            borrower_id = action_data['borrower_id']
            amount = float(action_data['amount'])
            rate = float(action_data['rate'])
            if amount <= player['money'] and 0 <= rate <= 20:
                loan_id = game.create_loan(player_id, borrower_id, amount, rate, 30)
                player['money'] -= amount
                game.players[borrower_id]['money'] += amount
                success = True
                message = f"Offered ${amount} mortgage at {rate}% interest"
    
    elif player['role'] == 'developer':
        if action_type == 'build_house':
            location = action_data['location']
            quality = int(action_data['quality'])
            cost = quality * 50  # Base cost to build
            if cost <= player['money']:
                property_id = game.create_property(location, quality)
                player['money'] -= cost
                game.properties[property_id]['owner'] = player_id
                success = True
                message = f"Built new {quality}-quality house in {location}"
    
    elif player['role'] in ['homebuyer', 'speculator']:
        if action_type == 'buy_property':
            property_id = action_data['property_id']
            if property_id < len(game.properties):
                prop = game.properties[property_id]
                if prop['owner'] is None and prop['current_value'] <= player['money']:
                    player['money'] -= prop['current_value']
                    prop['owner'] = player_id
                    player['properties'].append(property_id)
                    success = True
                    message = f"Bought property for ${prop['current_value']}"
        elif action_type == 'sell_property':
            property_id = action_data['property_id']
            if property_id in player['properties']:
                prop = game.properties[property_id]
                player['money'] += prop['current_value']
                prop['owner'] = None
                player['properties'].remove(property_id)
                success = True
                message = f"Sold property for ${prop['current_value']}"
    
    if success:
        game.waiting_for_actions.remove(player_id)
        emit('action_result', {
            'success': True,
            'message': message,
            'new_balance': player['money']
        })
        emit('player_acted', {
            'player_id': player_id,
            'action': message,
            'waiting_for': list(game.waiting_for_actions)
        }, room=game_id)
    else:
        emit('action_result', {
            'success': False,
            'message': message
        })

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=5004)
    args = parser.parse_args()
    socketio.run(app, debug=True, port=args.port)
