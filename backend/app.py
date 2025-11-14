from flask import Flask, request, jsonify
from flask_cors import CORS
from inventory_optimization import recommend_stock_levels
from game import StockGame
import copy

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Store for product data (in-memory for simplicity)
product_store = []

# Global game instance
game_instance = None


@app.route('/')
def home():
    """API home endpoint"""
    return jsonify({
        'message': 'Inventory Optimization & Stock Management Game API',
        'version': '3.0',
        'endpoints': {
            'optimization': {
                '/recommend': 'POST - Get stock level recommendations for products',
                '/simulate': 'POST - Simulate scenarios with updated demand/costs'
            },
            'game': {
                '/start_game': 'GET - Start a new stock management game',
                '/next_day': 'POST - Advance to next day in the game',
                '/restock': 'POST - Restock a product (params: product, quantity)',
                '/unlock_item': 'POST - Unlock a store item (params: item_name)',
                '/get_state': 'GET - Get current game state',
                '/get_daily_report': 'GET - Get most recent daily report',
                '/apply_multipliers': 'POST - Preview scenario with multipliers'
            }
        }
    })


@app.route('/recommend', methods=['POST'])
def recommend():
    """
    POST endpoint to get stock level recommendations.
    
    Expected JSON body:
    {
        "products": [
            {
                "name": "Product A",
                "stock": 100,
                "demand": 1000,
                "cost_storage": 2.5,
                "cost_restock": 100
            },
            ...
        ]
    }
    
    Returns:
    {
        "success": true,
        "count": 3,
        "recommendations": [...]
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        products = data.get('products', [])
        
        if not products:
            return jsonify({
                'success': False,
                'error': 'No products provided in request'
            }), 400
        
        # Validate product data
        for i, product in enumerate(products):
            required_fields = ['name', 'stock', 'demand', 'cost_storage', 'cost_restock']
            missing_fields = [field for field in required_fields if field not in product]
            
            if missing_fields:
                return jsonify({
                    'success': False,
                    'error': f'Product {i} missing required fields: {", ".join(missing_fields)}'
                }), 400
        
        # Store products for potential simulation later
        global product_store
        product_store = copy.deepcopy(products)
        
        # Get recommendations
        recommendations = recommend_stock_levels(products)
        
        return jsonify({
            'success': True,
            'count': len(recommendations),
            'recommendations': recommendations
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/simulate', methods=['POST'])
def simulate():
    """
    POST endpoint to simulate scenarios with updated demand/costs.
    
    Expected JSON body:
    {
        "scenarios": [
            {
                "name": "Scenario 1: Increased Demand",
                "modifications": {
                    "demand_multiplier": 1.5,
                    "cost_storage_multiplier": 1.0,
                    "cost_restock_multiplier": 1.0
                }
            },
            {
                "name": "Scenario 2: Higher Storage Costs",
                "modifications": {
                    "demand_multiplier": 1.0,
                    "cost_storage_multiplier": 1.3,
                    "cost_restock_multiplier": 1.0
                }
            }
        ],
        "products": [...]  # Optional: provide new products, or use stored ones
    }
    
    Returns:
    {
        "success": true,
        "scenarios": [
            {
                "name": "Scenario 1",
                "recommendations": [...]
            },
            ...
        ]
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        # Get base products (either from request or stored)
        base_products = data.get('products', product_store)
        
        if not base_products:
            return jsonify({
                'success': False,
                'error': 'No products available. Please provide products or call /recommend first.'
            }), 400
        
        scenarios = data.get('scenarios', [])
        
        if not scenarios:
            return jsonify({
                'success': False,
                'error': 'No scenarios provided'
            }), 400
        
        results = []
        
        for scenario in scenarios:
            scenario_name = scenario.get('name', 'Unnamed Scenario')
            modifications = scenario.get('modifications', {})
            
            # Get multipliers with defaults
            demand_mult = modifications.get('demand_multiplier', 1.0)
            storage_mult = modifications.get('cost_storage_multiplier', 1.0)
            restock_mult = modifications.get('cost_restock_multiplier', 1.0)
            
            # Create modified products
            modified_products = []
            for product in base_products:
                modified_product = copy.deepcopy(product)
                modified_product['demand'] = product['demand'] * demand_mult
                modified_product['cost_storage'] = product['cost_storage'] * storage_mult
                modified_product['cost_restock'] = product['cost_restock'] * restock_mult
                modified_products.append(modified_product)
            
            # Get recommendations for this scenario
            recommendations = recommend_stock_levels(modified_products)
            
            results.append({
                'name': scenario_name,
                'modifications': {
                    'demand_multiplier': demand_mult,
                    'cost_storage_multiplier': storage_mult,
                    'cost_restock_multiplier': restock_mult
                },
                'recommendations': recommendations
            })
        
        return jsonify({
            'success': True,
            'scenario_count': len(results),
            'scenarios': results
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Inventory Optimization & Stock Game API'
    }), 200


# ========== GAME ENDPOINTS ==========

@app.route('/start_game', methods=['GET'])
def start_game():
    """
    Start a new stock management game.
    
    Returns:
    {
        "success": true,
        "message": "New game started!",
        "state": { ... game state ... }
    }
    """
    try:
        global game_instance
        
        # Create new game instance
        game_instance = StockGame()
        
        # Get initial state
        state = game_instance.get_state()
        
        return jsonify({
            'success': True,
            'message': f'New game started! Starting budget: ${state["budget"]:.2f}',
            'state': state
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/next_day', methods=['POST'])
def next_day():
    """
    Advance to the next day in the game.
    
    Returns:
    {
        "success": true,
        "day_summary": { ... day results ... },
        "state": { ... updated game state ... }
    }
    """
    try:
        global game_instance
        
        if game_instance is None:
            return jsonify({
                'success': False,
                'error': 'No active game. Please start a new game first using /start_game'
            }), 400
        
        # Run the next day
        day_summary = game_instance.next_day()
        
        # Get updated state
        state = game_instance.get_state()
        
        return jsonify({
            'success': True,
            'day_summary': day_summary,
            'state': state
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/restock', methods=['POST'])
def restock():
    """
    Restock a product.
    
    Expected JSON body:
    {
        "product": "Widget A",
        "quantity": 50
    }
    
    Returns:
    {
        "success": true,
        "restock_result": { ... restock details ... },
        "state": { ... updated game state ... }
    }
    """
    try:
        global game_instance
        
        if game_instance is None:
            return jsonify({
                'success': False,
                'error': 'No active game. Please start a new game first using /start_game'
            }), 400
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        product_name = data.get('product')
        quantity = data.get('quantity')
        
        if not product_name:
            return jsonify({
                'success': False,
                'error': 'Missing required parameter: product'
            }), 400
        
        if quantity is None:
            return jsonify({
                'success': False,
                'error': 'Missing required parameter: quantity'
            }), 400
        
        try:
            quantity = int(quantity)
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'error': 'Quantity must be a valid number'
            }), 400
        
        # Perform restock
        restock_result = game_instance.restock(product_name, quantity)
        
        if not restock_result['success']:
            return jsonify(restock_result), 400
        
        # Get updated state
        state = game_instance.get_state()
        
        return jsonify({
            'success': True,
            'restock_result': restock_result,
            'state': state
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/get_state', methods=['GET'])
def get_state():
    """
    Get current game state.
    
    Returns:
    {
        "success": true,
        "state": { ... current game state ... }
    }
    """
    try:
        global game_instance
        
        if game_instance is None:
            return jsonify({
                'success': False,
                'error': 'No active game. Please start a new game first using /start_game',
                'state': None
            }), 400
        
        state = game_instance.get_state()
        
        return jsonify({
            'success': True,
            'state': state
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/unlock_item', methods=['POST'])
def unlock_item():
    """
    Unlock a store item and add it to the product catalog.
    
    Expected JSON body:
    {
        "item_name": "Smartphone"
    }
    
    Returns:
    {
        "success": true,
        "unlock_result": { ... unlock details ... },
        "state": { ... updated game state ... }
    }
    """
    try:
        global game_instance
        
        if game_instance is None:
            return jsonify({
                'success': False,
                'error': 'No active game. Please start a new game first using /start_game'
            }), 400
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        item_name = data.get('item_name')
        
        if not item_name:
            return jsonify({
                'success': False,
                'error': 'Missing required parameter: item_name'
            }), 400
        
        # Perform unlock
        unlock_result = game_instance.unlock_item(item_name)
        
        if not unlock_result['success']:
            return jsonify(unlock_result), 400
        
        # Get updated state
        state = game_instance.get_state()
        
        return jsonify({
            'success': True,
            'unlock_result': unlock_result,
            'state': state
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/get_daily_report', methods=['GET'])
def get_daily_report():
    """
    Get the most recent daily report.
    
    Returns:
    {
        "success": true,
        "report": { ... daily report ... }
    }
    """
    try:
        global game_instance
        
        if game_instance is None:
            return jsonify({
                'success': False,
                'error': 'No active game. Please start a new game first using /start_game'
            }), 400
        
        report = game_instance.get_daily_report()
        
        return jsonify({
            'success': True,
            'report': report
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/apply_multipliers', methods=['POST'])
def apply_multipliers():
    """
    Preview a scenario with temporary multipliers.
    
    Expected JSON body:
    {
        "demand_factor": 1.5,
        "storage_factor": 1.2,
        "restock_factor": 0.9
    }
    
    Returns:
    {
        "success": true,
        "preview": { ... modified product states ... }
    }
    """
    try:
        global game_instance
        
        if game_instance is None:
            return jsonify({
                'success': False,
                'error': 'No active game. Please start a new game first using /start_game'
            }), 400
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        demand_factor = data.get('demand_factor', 1.0)
        storage_factor = data.get('storage_factor', 1.0)
        restock_factor = data.get('restock_factor', 1.0)
        
        # Get preview
        preview = game_instance.apply_multipliers(
            demand_factor=demand_factor,
            storage_factor=storage_factor,
            restock_factor=restock_factor
        )
        
        return jsonify({
            'success': True,
            'preview': preview
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
