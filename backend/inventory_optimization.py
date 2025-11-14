import math


def recommend_stock_levels(products):
    """
    Calculate reorder points and Economic Order Quantity (EOQ) for a list of products.
    
    Parameters:
    -----------
    products : list of dict
        Each product should have the following keys:
        - name (str): Product name
        - stock (int/float): Current stock level
        - demand (int/float): Annual demand
        - cost_storage (float): Cost to hold one unit in inventory per year
        - cost_restock (float): Fixed cost per order/restock
    
    Returns:
    --------
    list of dict
        Each dict contains:
        - name: Product name
        - current_stock: Current stock level
        - eoq: Economic Order Quantity
        - reorder_point: Reorder point (assumes lead time of 7 days)
        - annual_demand: Annual demand
        - total_ordering_cost: Annual ordering cost
        - total_holding_cost: Annual holding cost
        - recommendation: Action recommendation
    """
    recommendations = []
    
    for product in products:
        name = product.get('name', 'Unknown')
        stock = product.get('stock', 0)
        demand = product.get('demand', 0)
        cost_storage = product.get('cost_storage', 0)
        cost_restock = product.get('cost_restock', 0)
        
        # Calculate EOQ using the Wilson formula
        # EOQ = sqrt((2 * D * S) / H)
        # where D = annual demand, S = ordering cost, H = holding cost per unit per year
        if cost_storage > 0 and demand > 0:
            eoq = math.sqrt((2 * demand * cost_restock) / cost_storage)
        else:
            eoq = 0
        
        # Calculate reorder point
        # Assuming a lead time of 7 days (1 week)
        # Reorder Point = (Daily Demand * Lead Time)
        lead_time_days = 7
        daily_demand = demand / 365 if demand > 0 else 0
        reorder_point = daily_demand * lead_time_days
        
        # Calculate annual costs
        if eoq > 0:
            # Number of orders per year
            num_orders = demand / eoq
            # Total ordering cost = Number of orders * Cost per order
            total_ordering_cost = num_orders * cost_restock
            # Average inventory = EOQ / 2
            avg_inventory = eoq / 2
            # Total holding cost = Average inventory * Holding cost per unit
            total_holding_cost = avg_inventory * cost_storage
        else:
            total_ordering_cost = 0
            total_holding_cost = 0
        
        # Generate recommendation
        if stock <= reorder_point:
            recommendation = f"ORDER NOW: Stock is at or below reorder point. Order {eoq:.0f} units."
        elif stock < eoq:
            recommendation = f"MONITOR: Stock is below optimal order quantity. Consider ordering {eoq:.0f} units soon."
        else:
            recommendation = "OK: Stock levels are sufficient."
        
        recommendations.append({
            'name': name,
            'current_stock': stock,
            'eoq': round(eoq, 2),
            'reorder_point': round(reorder_point, 2),
            'annual_demand': demand,
            'total_ordering_cost': round(total_ordering_cost, 2),
            'total_holding_cost': round(total_holding_cost, 2),
            'total_inventory_cost': round(total_ordering_cost + total_holding_cost, 2),
            'recommendation': recommendation
        })
    
    return recommendations


# Example usage
if __name__ == "__main__":
    # Sample product data
    sample_products = [
        {
            'name': 'Widget A',
            'stock': 50,
            'demand': 1000,  # annual demand
            'cost_storage': 2.5,  # $ per unit per year
            'cost_restock': 100  # $ per order
        },
        {
            'name': 'Widget B',
            'stock': 200,
            'demand': 5000,
            'cost_storage': 1.5,
            'cost_restock': 150
        },
        {
            'name': 'Widget C',
            'stock': 10,
            'demand': 500,
            'cost_storage': 3.0,
            'cost_restock': 80
        }
    ]
    
    # Get recommendations
    results = recommend_stock_levels(sample_products)
    
    # Display results
    print("=" * 80)
    print("INVENTORY OPTIMIZATION RECOMMENDATIONS")
    print("=" * 80)
    
    for result in results:
        print(f"\nProduct: {result['name']}")
        print(f"  Current Stock: {result['current_stock']}")
        print(f"  Annual Demand: {result['annual_demand']}")
        print(f"  Economic Order Quantity (EOQ): {result['eoq']}")
        print(f"  Reorder Point: {result['reorder_point']}")
        print(f"  Annual Ordering Cost: ${result['total_ordering_cost']}")
        print(f"  Annual Holding Cost: ${result['total_holding_cost']}")
        print(f"  Total Inventory Cost: ${result['total_inventory_cost']}")
        print(f"  RECOMMENDATION: {result['recommendation']}")
        print("-" * 80)
