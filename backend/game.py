"""
Enhanced Stock Management Game with full game mechanics.
Includes unlockable products, daily events, and comprehensive tracking.
"""

import math
import random
from typing import List, Dict, Any, Optional
from copy import deepcopy
from game_data import BaseProduct, StoreItem, DailyEvent, GameCatalog, EventType


class StockGame:
    """
    Advanced stock management game with unlockable products, 
    daily events, and comprehensive game mechanics.
    """
    
    def __init__(self):
        """Initialize the game with default settings."""
        # Core game state
        self.day = 1
        self.budget = random.randint(120, 300)
        self.initial_budget = self.budget
        
        # Products and store
        self.unlocked_products: List[BaseProduct] = GameCatalog.get_base_products()
        self.store_items: List[StoreItem] = GameCatalog.get_store_items()
        
        # Events
        self.current_event: Optional[DailyEvent] = None
        self.event_history: List[DailyEvent] = []
        
        # Game statistics
        self.total_revenue = 0.0
        self.total_storage_costs = 0.0
        self.total_restock_costs = 0.0
        self.total_unlock_costs = 0.0
        self.total_sales = 0
        self.total_stockouts = 0
        
        # History tracking for charts
        self.budget_history = [self.budget]
        self.day_history = [self.day]
        self.stock_history: Dict[str, List[int]] = {}
        
        # Initialize stock history
        for product in self.unlocked_products:
            self.stock_history[product.name] = [product.stock]
        
        # Daily reports
        self.daily_reports = []
        
        # New unlocks tracking
        self.newly_unlocked_items = []
    
    def next_day(self) -> Dict[str, Any]:
        """
        Simulate one day of operations with full game mechanics.
        
        Steps:
        1. Apply daily event (10% chance)
        2. Reduce stock by demand
        3. Compute sales revenue
        4. Compute storage costs
        5. Update budget
        6. Calculate recommendations
        7. Generate alerts
        8. Update history
        
        Returns:
            Dictionary containing day summary and all game state changes
        """
        day_report = {
            'day': self.day,
            'event': None,
            'sales': [],
            'revenue': 0.0,
            'storage_cost': 0.0,
            'net_change': 0.0,
            'alerts': [],
            'recommendations': [],
            'new_unlocks': []
        }
        
        # === STEP 1: Apply Daily Event (50% chance) ===
        self.current_event = GameCatalog.generate_random_event(self.unlocked_products)
        if self.current_event:
            self.event_history.append(self.current_event)
            day_report['event'] = self.current_event.to_dict()
        
        # Get event multipliers
        demand_multiplier = 1.0
        restock_multiplier = 1.0
        
        if self.current_event:
            if self.current_event.event_type == EventType.DEMAND_SPIKE:
                demand_multiplier = self.current_event.impact_multiplier
            elif self.current_event.event_type == EventType.CALM_DAY:
                demand_multiplier = self.current_event.impact_multiplier
            elif self.current_event.event_type == EventType.SUPPLIER_DISCOUNT:
                restock_multiplier = self.current_event.impact_multiplier
        
        # === STEP 2 & 3: Process Sales for Each Product ===
        day_revenue = 0.0
        
        for product in self.unlocked_products:
            # Apply event-based demand modifier
            effective_demand = product.daily_demand * demand_multiplier
            
            # Handle spoilage event
            if (self.current_event and 
                self.current_event.event_type == EventType.SPOILAGE and
                self.current_event.affected_product == product.name):
                spoilage_amount = int(self.current_event.impact_multiplier)
                product.stock = max(0, product.stock - spoilage_amount)
                day_report['alerts'].append({
                    'type': 'spoilage',
                    'severity': 'high',
                    'product': product.name,
                    'message': f"⚠️ SPOILAGE: {product.name} lost {spoilage_amount} units due to quality issues!",
                    'units_lost': spoilage_amount
                })
            
            # Calculate actual sold (limited by stock)
            actual_sold = min(product.stock, int(effective_demand))
            
            # Calculate revenue
            revenue = actual_sold * product.sale_price
            day_revenue += revenue
            
            # Track statistics
            self.total_sales += actual_sold
            
            # Check for stockout
            if actual_sold < effective_demand:
                lost_sales = effective_demand - actual_sold
                self.total_stockouts += 1
                day_report['alerts'].append({
                    'type': 'stockout',
                    'severity': 'critical',
                    'product': product.name,
                    'message': f"🔴 STOCKOUT: {product.name} - Could not fulfill {lost_sales:.1f} units of demand!",
                    'lost_sales': lost_sales,
                    'lost_revenue': lost_sales * product.sale_price
                })
            
            # Reduce stock
            product.stock -= actual_sold
            
            # Record sale
            day_report['sales'].append({
                'product': product.name,
                'demand': round(effective_demand, 1),
                'sold': actual_sold,
                'revenue': round(revenue, 2),
                'remaining_stock': product.stock
            })
        
        # === STEP 4: Compute Storage Costs ===
        day_storage_cost = sum(p.stock * p.cost_storage for p in self.unlocked_products)
        
        # === STEP 5: Update Budget ===
        self.budget += day_revenue - day_storage_cost
        self.total_revenue += day_revenue
        self.total_storage_costs += day_storage_cost
        
        day_report['revenue'] = round(day_revenue, 2)
        day_report['storage_cost'] = round(day_storage_cost, 2)
        day_report['net_change'] = round(day_revenue - day_storage_cost, 2)
        day_report['budget_after'] = round(self.budget, 2)
        
        # === STEP 6: Update Reorder Recommendations ===
        for product in self.unlocked_products:
            # Calculate Reorder Point (lead time = 3 days)
            reorder_point = product.daily_demand * 3
            
            # Calculate EOQ
            if product.cost_storage > 0 and product.daily_demand > 0:
                eoq = math.sqrt(
                    (2 * product.daily_demand * product.cost_restock) / product.cost_storage
                )
            else:
                eoq = 0
            
            recommendation = {
                'product': product.name,
                'current_stock': product.stock,
                'reorder_point': round(reorder_point, 2),
                'eoq': round(eoq, 2),
                'daily_demand': product.daily_demand,
                'days_of_stock': round(product.stock / product.daily_demand, 1) if product.daily_demand > 0 else float('inf'),
                'status': 'ok'
            }
            
            # === STEP 7: Generate Alerts ===
            # Critical: At or below reorder point
            if product.stock <= reorder_point:
                recommendation['status'] = 'critical'
                day_report['alerts'].append({
                    'type': 'low_stock',
                    'severity': 'critical',
                    'product': product.name,
                    'message': f"🔴 CRITICAL: {product.name} stock ({product.stock}) at reorder point! Order {eoq:.0f} units immediately.",
                    'current_stock': product.stock,
                    'reorder_point': reorder_point,
                    'recommended_order': round(eoq, 0)
                })
            # Warning: Below EOQ
            elif product.stock < eoq:
                recommendation['status'] = 'warning'
                day_report['alerts'].append({
                    'type': 'low_stock',
                    'severity': 'medium',
                    'product': product.name,
                    'message': f"🟡 WARNING: {product.name} stock below optimal level. Consider ordering {eoq:.0f} units.",
                    'current_stock': product.stock,
                    'recommended_order': round(eoq, 0)
                })
            
            day_report['recommendations'].append(recommendation)
        
        # Budget alert
        if self.budget < 0:
            day_report['alerts'].append({
                'type': 'negative_budget',
                'severity': 'high',
                'message': f"💰 BUDGET ALERT: Operating at a loss! Budget: ${self.budget:.2f}",
                'budget': round(self.budget, 2)
            })
        
        # === STEP 8: Check for New Unlockable Items ===
        affordable_items = [
            item for item in self.store_items
            if not item.unlocked and item.unlock_price <= self.budget
        ]
        
        # Notify about newly affordable items
        self.newly_unlocked_items = affordable_items
        if affordable_items:
            day_report['new_unlocks'] = [
                {
                    'name': item.name,
                    'unlock_price': item.unlock_price,
                    'category': item.category,
                    'description': item.description
                }
                for item in affordable_items[:3]  # Show top 3
            ]
        
        # === STEP 9: Update History ===
        self.day += 1
        self.budget_history.append(self.budget)
        self.day_history.append(self.day)
        
        for product in self.unlocked_products:
            if product.name not in self.stock_history:
                self.stock_history[product.name] = []
            self.stock_history[product.name].append(product.stock)
        
        # Store daily report
        self.daily_reports.append(day_report)
        
        return day_report
    
    def restock(self, product_name: str, quantity: int) -> Dict[str, Any]:
        """
        Restock a product by purchasing inventory.
        
        Args:
            product_name: Name of the product to restock
            quantity: Number of units to order
            
        Returns:
            Dictionary with restock details and updated status
        """
        # Find the product
        product = None
        for p in self.unlocked_products:
            if p.name == product_name:
                product = p
                break
        
        if product is None:
            return {
                'success': False,
                'error': f"Product '{product_name}' not found or not unlocked"
            }
        
        if quantity <= 0:
            return {
                'success': False,
                'error': "Quantity must be greater than 0"
            }
        
        # Calculate total cost (fixed restock cost per order)
        total_cost = product.cost_restock
        
        # Apply supplier discount if active
        if (self.current_event and 
            self.current_event.event_type == EventType.SUPPLIER_DISCOUNT):
            total_cost *= self.current_event.impact_multiplier
            discount_applied = True
            discount_saved = product.cost_restock * (1 - self.current_event.impact_multiplier)
        else:
            discount_applied = False
            discount_saved = 0
        
        # Budget warning (but don't block)
        budget_warning = None
        if self.budget < total_cost:
            budget_warning = f"Warning: This will make your budget negative (${self.budget - total_cost:.2f})"
        
        # Deduct cost from budget
        self.budget -= total_cost
        self.total_restock_costs += total_cost
        
        # Increase stock
        old_stock = product.stock
        product.stock += quantity
        
        return {
            'success': True,
            'product': product_name,
            'quantity': quantity,
            'cost': round(total_cost, 2),
            'discount_applied': discount_applied,
            'discount_saved': round(discount_saved, 2) if discount_applied else 0,
            'old_stock': old_stock,
            'new_stock': product.stock,
            'budget': round(self.budget, 2),
            'warning': budget_warning
        }
    
    def unlock_item(self, item_name: str) -> Dict[str, Any]:
        """
        Unlock a store item and add it to the product catalog.
        
        Args:
            item_name: Name of the item to unlock
            
        Returns:
            Dictionary with unlock details and new product info
        """
        # Find the store item
        store_item = None
        for item in self.store_items:
            if item.name == item_name:
                store_item = item
                break
        
        if store_item is None:
            return {
                'success': False,
                'error': f"Item '{item_name}' not found in store"
            }
        
        if store_item.unlocked:
            return {
                'success': False,
                'error': f"'{item_name}' is already unlocked"
            }
        
        if self.budget < store_item.unlock_price:
            return {
                'success': False,
                'error': f"Insufficient funds. Need ${store_item.unlock_price:.2f}, have ${self.budget:.2f}"
            }
        
        # Deduct unlock price from budget
        self.budget -= store_item.unlock_price
        self.total_unlock_costs += store_item.unlock_price
        
        # Unlock the item and convert to BaseProduct
        new_product = store_item.unlock()
        
        # Add to unlocked products
        self.unlocked_products.append(new_product)
        
        # Initialize stock history for new product
        self.stock_history[new_product.name] = [new_product.stock]
        
        return {
            'success': True,
            'item': item_name,
            'unlock_price': store_item.unlock_price,
            'starting_stock': new_product.stock,
            'budget': round(self.budget, 2),
            'message': f"🎉 Successfully unlocked {item_name}! Added to your inventory with {new_product.stock} units."
        }
    
    def get_state(self) -> Dict[str, Any]:
        """
        Get current complete game state.
        
        Returns:
            Dictionary containing all game data including:
            - Day, budget, statistics
            - All unlocked products with recommendations
            - Available store items
            - Current event
            - Alerts and recommendations
            - History data for charts
        """
        # Calculate recommendations for all products
        recommendations = []
        alerts = []
        
        for product in self.unlocked_products:
            # Reorder Point
            reorder_point = product.daily_demand * 3
            
            # EOQ
            if product.cost_storage > 0 and product.daily_demand > 0:
                eoq = math.sqrt(
                    (2 * product.daily_demand * product.cost_restock) / product.cost_storage
                )
            else:
                eoq = 0
            
            # Days of stock remaining
            days_of_stock = product.stock / product.daily_demand if product.daily_demand > 0 else float('inf')
            
            recommendation = {
                'product': product.name,
                'current_stock': product.stock,
                'reorder_point': round(reorder_point, 2),
                'eoq': round(eoq, 2),
                'daily_demand': product.daily_demand,
                'days_of_stock': round(days_of_stock, 1)
            }
            
            # Status and alerts
            if product.stock == 0:
                recommendation['status'] = 'critical'
                alerts.append({
                    'type': 'critical',
                    'product': product.name,
                    'message': f"🔴 {product.name}: OUT OF STOCK! Restock immediately!"
                })
            elif product.stock <= reorder_point:
                recommendation['status'] = 'critical'
                alerts.append({
                    'type': 'critical',
                    'product': product.name,
                    'message': f"🔴 {product.name}: Stock critical ({product.stock}). Restock {eoq:.0f} units now."
                })
            elif product.stock < eoq:
                recommendation['status'] = 'warning'
                alerts.append({
                    'type': 'warning',
                    'product': product.name,
                    'message': f"🟡 {product.name}: Stock low ({product.stock}). Consider restocking."
                })
            else:
                recommendation['status'] = 'ok'
            
            recommendations.append(recommendation)
        
        # Budget alerts
        if self.budget < 0:
            alerts.append({
                'type': 'budget',
                'message': f"💰 Budget is negative: ${self.budget:.2f}"
            })
        elif self.budget < 50:
            alerts.append({
                'type': 'budget',
                'message': f"💰 Budget is low: ${self.budget:.2f}"
            })
        
        # Available store items
        available_store_items = [
            {
                'name': item.name,
                'unlock_price': item.unlock_price,
                'starting_stock': item.starting_stock,
                'daily_demand': item.daily_demand,
                'sale_price': item.sale_price,
                'category': item.category,
                'description': item.description,
                'unlocked': item.unlocked,
                'affordable': self.budget >= item.unlock_price
            }
            for item in self.store_items
        ]
        
        # Calculate profit
        profit = (self.total_revenue - self.total_storage_costs - 
                 self.total_restock_costs - self.total_unlock_costs)
        
        # Calculate ROI
        total_investment = self.initial_budget + self.total_restock_costs + self.total_unlock_costs
        roi = ((self.budget - self.initial_budget) / self.initial_budget * 100) if self.initial_budget > 0 else 0
        
        return {
            'day': self.day,
            'budget': round(self.budget, 2),
            'initial_budget': self.initial_budget,
            'products': [
                {
                    'name': p.name,
                    'stock': p.stock,
                    'demand_rate': p.daily_demand,
                    'cost_storage': p.cost_storage,
                    'cost_restock': p.cost_restock,
                    'sale_price': p.sale_price
                }
                for p in self.unlocked_products
            ],
            'store_items': available_store_items,
            'current_event': self.current_event.to_dict() if self.current_event else None,
            'alerts': alerts,
            'recommendations': recommendations,
            'statistics': {
                'total_revenue': round(self.total_revenue, 2),
                'total_storage_costs': round(self.total_storage_costs, 2),
                'total_restock_costs': round(self.total_restock_costs, 2),
                'total_unlock_costs': round(self.total_unlock_costs, 2),
                'total_sales': self.total_sales,
                'total_stockouts': self.total_stockouts,
                'profit': round(profit, 2),
                'roi': round(roi, 2)
            },
            'history': {
                'budget': self.budget_history,
                'days': self.day_history,
                'stock': self.stock_history
            }
        }
    
    def get_daily_report(self) -> Dict[str, Any]:
        """
        Get the most recent daily report.
        
        Returns:
            Dictionary containing the last day's activity summary
        """
        if not self.daily_reports:
            return {
                'message': 'No daily reports available yet. Run next_day() to generate reports.'
            }
        
        return self.daily_reports[-1]
    
    def apply_multipliers(self, demand_factor: float = 1.0, 
                         storage_factor: float = 1.0,
                         restock_factor: float = 1.0) -> Dict[str, Any]:
        """
        Apply temporary multipliers to simulate scenarios.
        Useful for testing or special game modes.
        
        Args:
            demand_factor: Multiplier for demand (1.5 = +50%)
            storage_factor: Multiplier for storage costs
            restock_factor: Multiplier for restock costs
            
        Returns:
            Dictionary with modified product states
        """
        modified_products = []
        
        for product in self.unlocked_products:
            modified = {
                'name': product.name,
                'original_demand': product.daily_demand,
                'modified_demand': product.daily_demand * demand_factor,
                'original_storage_cost': product.cost_storage,
                'modified_storage_cost': product.cost_storage * storage_factor,
                'original_restock_cost': product.cost_restock,
                'modified_restock_cost': product.cost_restock * restock_factor
            }
            modified_products.append(modified)
        
        return {
            'demand_factor': demand_factor,
            'storage_factor': storage_factor,
            'restock_factor': restock_factor,
            'modified_products': modified_products,
            'note': 'These are preview multipliers. They do not affect actual game state.'
        }


# ========== EXAMPLE USAGE ==========

if __name__ == "__main__":
    print("=" * 70)
    print("ENHANCED STOCK MANAGEMENT GAME - DEMO")
    print("=" * 70)
    
    # Initialize game
    game = StockGame()
    state = game.get_state()
    
    print(f"\n🎮 GAME STARTED!")
    print(f"Day: {state['day']}")
    print(f"Starting Budget: ${state['budget']:.2f}")
    print(f"Products: {len(state['products'])}")
    print(f"Store Items Available: {len([i for i in state['store_items'] if not i['unlocked']])}")
    
    # Simulate 3 days
    for day in range(3):
        print(f"\n{'='*70}")
        print(f"📅 DAY {game.day}")
        print(f"{'='*70}")
        
        # Run the day
        report = game.next_day()
        
        print(f"\n💰 Financial Summary:")
        print(f"  Revenue: ${report['revenue']:.2f}")
        print(f"  Storage Cost: ${report['storage_cost']:.2f}")
        print(f"  Net Change: ${report['net_change']:.2f}")
        print(f"  Budget: ${report['budget_after']:.2f}")
        
        if report['event']:
            print(f"\n🎲 Event: {report['event']['name']}")
            print(f"  {report['event']['description']}")
        
        if report['alerts']:
            print(f"\n⚠️  Alerts:")
            for alert in report['alerts'][:3]:  # Show first 3
                print(f"  - {alert['message']}")
        
        # Auto-restock critical items
        for rec in report['recommendations']:
            if rec['status'] == 'critical' and rec['current_stock'] < 10:
                restock_result = game.restock(rec['product'], int(rec['eoq']))
                if restock_result['success']:
                    print(f"\n🔄 Auto-restocked {rec['product']}: +{restock_result['quantity']} units")
    
    # Try to unlock a store item
    print(f"\n{'='*70}")
    print("🏪 TRYING TO UNLOCK STORE ITEM")
    print(f"{'='*70}")
    
    final_state = game.get_state()
    affordable = [item for item in final_state['store_items'] if item['affordable'] and not item['unlocked']]
    
    if affordable:
        item_to_unlock = affordable[0]
        print(f"\nAttempting to unlock: {item_to_unlock['name']}")
        print(f"Cost: ${item_to_unlock['unlock_price']:.2f}")
        print(f"Current Budget: ${final_state['budget']:.2f}")
        
        unlock_result = game.unlock_item(item_to_unlock['name'])
        if unlock_result['success']:
            print(f"✅ {unlock_result['message']}")
            print(f"New Budget: ${unlock_result['budget']:.2f}")
    
    # Final summary
    print(f"\n{'='*70}")
    print("📊 FINAL STATISTICS")
    print(f"{'='*70}")
    stats = game.get_state()['statistics']
    print(f"Total Revenue: ${stats['total_revenue']:.2f}")
    print(f"Total Profit: ${stats['profit']:.2f}")
    print(f"ROI: {stats['roi']:.1f}%")
    print(f"Total Sales: {stats['total_sales']} units")
    print(f"Stockouts: {stats['total_stockouts']}")
    print(f"\n{'='*70}")
