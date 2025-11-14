"""
Game data structures for stock management game.
Contains product definitions, store items, and daily events.
"""

from dataclasses import dataclass
from typing import List, Dict, Optional
from enum import Enum
import random


# ========== ENUMS ==========

class EventType(Enum):
    """Types of daily events that can occur"""
    DEMAND_SPIKE = "demand_spike"
    SUPPLIER_DISCOUNT = "supplier_discount"
    SPOILAGE = "spoilage"
    CALM_DAY = "calm_day"


# ========== DATA CLASSES ==========

@dataclass
class BaseProduct:
    """
    Base product available from the start.
    These are the initial inventory items the player manages.
    """
    name: str
    stock: int
    cost_storage: float  # Cost per unit per day
    cost_restock: float  # Fixed cost per restock order
    sale_price: float    # Revenue per unit sold
    daily_demand: float  # Average units demanded per day
    unlocked: bool = True  # Base products are always unlocked
    
    def to_dict(self) -> Dict:
        """Convert to dictionary representation"""
        return {
            'name': self.name,
            'stock': self.stock,
            'cost_storage': self.cost_storage,
            'cost_restock': self.cost_restock,
            'sale_price': self.sale_price,
            'daily_demand': self.daily_demand,
            'unlocked': self.unlocked
        }


@dataclass
class StoreItem:
    """
    Store items that can be unlocked/purchased.
    These expand the player's product catalog.
    """
    name: str
    unlock_price: float      # One-time cost to unlock this product
    starting_stock: int      # Initial stock when unlocked
    cost_storage: float      # Cost per unit per day
    cost_restock: float      # Fixed cost per restock order
    sale_price: float        # Revenue per unit sold
    daily_demand: float      # Average units demanded per day
    unlocked: bool = False   # Starts locked
    description: str = ""    # Description shown in store
    category: str = "General"  # Category for organization
    
    def to_dict(self) -> Dict:
        """Convert to dictionary representation"""
        return {
            'name': self.name,
            'unlock_price': self.unlock_price,
            'starting_stock': self.starting_stock,
            'cost_storage': self.cost_storage,
            'cost_restock': self.cost_restock,
            'sale_price': self.sale_price,
            'daily_demand': self.daily_demand,
            'unlocked': self.unlocked,
            'description': self.description,
            'category': self.category
        }
    
    def unlock(self) -> BaseProduct:
        """
        Unlock this item and convert to a BaseProduct.
        Returns the newly created product.
        """
        self.unlocked = True
        return BaseProduct(
            name=self.name,
            stock=self.starting_stock,
            cost_storage=self.cost_storage,
            cost_restock=self.cost_restock,
            sale_price=self.sale_price,
            daily_demand=self.daily_demand,
            unlocked=True
        )


@dataclass
class DailyEvent:
    """
    Random events that can occur during gameplay.
    Each event affects game mechanics in different ways.
    """
    event_type: EventType
    name: str
    description: str
    impact_multiplier: float = 1.0  # Multiplier for the effect
    affected_product: Optional[str] = None  # Specific product affected (for spoilage)
    duration_days: int = 1  # How many days the event lasts
    
    def to_dict(self) -> Dict:
        """Convert to dictionary representation"""
        return {
            'event_type': self.event_type.value,
            'name': self.name,
            'description': self.description,
            'impact_multiplier': self.impact_multiplier,
            'affected_product': self.affected_product,
            'duration_days': self.duration_days
        }


# ========== GAME DATA CATALOG ==========

class GameCatalog:
    """
    Central catalog containing all base products, store items, and possible events.
    """
    
    @staticmethod
    def get_base_products() -> List[BaseProduct]:
        """
        Returns the starting products available in the game.
        """
        return [
            BaseProduct(
                name="Office Chair",
                stock=50,
                cost_storage=0.5,
                cost_restock=50,
                sale_price=10,
                daily_demand=15
            ),
            BaseProduct(
                name="Desk Lamp",
                stock=30,
                cost_storage=0.3,
                cost_restock=30,
                sale_price=15,
                daily_demand=8
            ),
            BaseProduct(
                name="Water Bottle",
                stock=20,
                cost_storage=0.8,
                cost_restock=40,
                sale_price=20,
                daily_demand=5
            )
        ]
    
    @staticmethod
    def get_store_items() -> List[StoreItem]:
        """
        Returns all unlockable store items.
        Organized by category and difficulty.
        """
        return [
            # === ELECTRONICS CATEGORY ===
            StoreItem(
                name="Smartphone",
                unlock_price=500,
                starting_stock=10,
                cost_storage=2.0,
                cost_restock=200,
                sale_price=150,
                daily_demand=3,
                description="High-value electronics with steady demand",
                category="Electronics"
            ),
            StoreItem(
                name="Laptop",
                unlock_price=1000,
                starting_stock=5,
                cost_storage=3.5,
                cost_restock=400,
                sale_price=300,
                daily_demand=2,
                description="Premium product with high profit margins",
                category="Electronics"
            ),
            StoreItem(
                name="Headphones",
                unlock_price=200,
                starting_stock=25,
                cost_storage=0.4,
                cost_restock=80,
                sale_price=30,
                daily_demand=10,
                description="Popular accessory with high turnover",
                category="Electronics"
            ),
            
            # === FOOD & BEVERAGE CATEGORY ===
            StoreItem(
                name="Energy Drink",
                unlock_price=150,
                starting_stock=100,
                cost_storage=0.2,
                cost_restock=50,
                sale_price=5,
                daily_demand=25,
                description="Fast-moving consumable with high demand",
                category="Food & Beverage"
            ),
            StoreItem(
                name="Snack Box",
                unlock_price=100,
                starting_stock=80,
                cost_storage=0.15,
                cost_restock=40,
                sale_price=4,
                daily_demand=30,
                description="Low-cost, high-volume product",
                category="Food & Beverage"
            ),
            StoreItem(
                name="Premium Coffee",
                unlock_price=300,
                starting_stock=40,
                cost_storage=0.6,
                cost_restock=100,
                sale_price=12,
                daily_demand=15,
                description="Specialty item with loyal customers",
                category="Food & Beverage"
            ),
            
            # === OFFICE SUPPLIES CATEGORY ===
            StoreItem(
                name="Notebook Set",
                unlock_price=80,
                starting_stock=60,
                cost_storage=0.25,
                cost_restock=35,
                sale_price=8,
                daily_demand=12,
                description="Steady seller for students and professionals",
                category="Office Supplies"
            ),
            StoreItem(
                name="Pen Pack",
                unlock_price=50,
                starting_stock=100,
                cost_storage=0.1,
                cost_restock=20,
                sale_price=3,
                daily_demand=20,
                description="Essential item with consistent demand",
                category="Office Supplies"
            ),
            
            # === PREMIUM CATEGORY ===
            StoreItem(
                name="Designer Watch",
                unlock_price=2000,
                starting_stock=3,
                cost_storage=5.0,
                cost_restock=800,
                sale_price=500,
                daily_demand=1,
                description="Luxury item with exceptional profit potential",
                category="Premium"
            ),
            StoreItem(
                name="Gaming Console",
                unlock_price=1500,
                starting_stock=8,
                cost_storage=4.0,
                cost_restock=600,
                sale_price=400,
                daily_demand=2,
                description="High-demand gaming product",
                category="Premium"
            )
        ]
    
    @staticmethod
    def generate_random_event(products: List[BaseProduct]) -> Optional[DailyEvent]:
        """
        Generates a random daily event.
        Returns None for "no event" days (50% chance).
        
        Args:
            products: List of current products for spoilage targeting
            
        Returns:
            DailyEvent or None
        """
        # 50% chance of no event
        if random.random() < 0.5:
            return None
        
        event_type = random.choice(list(EventType))
        
        if event_type == EventType.DEMAND_SPIKE:
            return DailyEvent(
                event_type=EventType.DEMAND_SPIKE,
                name="📈 Demand Surge!",
                description="Market trends boost demand by 20% today!",
                impact_multiplier=1.2
            )
        
        elif event_type == EventType.SUPPLIER_DISCOUNT:
            discount_percent = random.randint(10, 20)
            return DailyEvent(
                event_type=EventType.SUPPLIER_DISCOUNT,
                name="💰 Supplier Sale!",
                description=f"Your suppliers offer a {discount_percent}% discount on restock costs today!",
                impact_multiplier=1.0 - (discount_percent / 100.0)
            )
        
        elif event_type == EventType.SPOILAGE:
            if products:
                affected = random.choice(products)
                spoilage_amount = random.randint(1, max(1, int(affected.stock * 0.15)))  # Up to 15% loss
                return DailyEvent(
                    event_type=EventType.SPOILAGE,
                    name="⚠️ Product Spoilage!",
                    description=f"{affected.name} has quality issues! Lost {spoilage_amount} units.",
                    affected_product=affected.name,
                    impact_multiplier=spoilage_amount  # Using this to store units lost
                )
            else:
                return None
        
        elif event_type == EventType.CALM_DAY:
            return DailyEvent(
                event_type=EventType.CALM_DAY,
                name="😴 Slow Business Day",
                description="Customer traffic is down. Demand reduced by 20% today.",
                impact_multiplier=0.8
            )
        
        return None
    
    @staticmethod
    def get_event_descriptions() -> Dict[str, str]:
        """Returns descriptions of all possible events"""
        return {
            "demand_spike": "Demand increases by 20% - sell more products!",
            "supplier_discount": "Restock costs reduced by 10-20% - good time to stock up!",
            "spoilage": "Random product loses 5-15% of stock - quality issues!",
            "calm_day": "Demand decreases by 20% - slower sales day."
        }


# ========== HELPER FUNCTIONS ==========

def get_products_by_category(store_items: List[StoreItem]) -> Dict[str, List[StoreItem]]:
    """
    Organize store items by category.
    
    Args:
        store_items: List of store items to organize
        
    Returns:
        Dictionary mapping category names to lists of items
    """
    categories = {}
    for item in store_items:
        if item.category not in categories:
            categories[item.category] = []
        categories[item.category].append(item)
    return categories


def get_unlockable_items(store_items: List[StoreItem], max_budget: float) -> List[StoreItem]:
    """
    Get store items that can be unlocked with the current budget.
    
    Args:
        store_items: List of all store items
        max_budget: Current player budget
        
    Returns:
        List of affordable, locked items
    """
    return [
        item for item in store_items
        if not item.unlocked and item.unlock_price <= max_budget
    ]


# ========== EXAMPLE USAGE ==========

if __name__ == "__main__":
    print("=" * 60)
    print("STOCK MANAGEMENT GAME - DATA CATALOG")
    print("=" * 60)
    
    # Show base products
    print("\n📦 BASE PRODUCTS:")
    print("-" * 60)
    base_products = GameCatalog.get_base_products()
    for product in base_products:
        print(f"\n{product.name}:")
        print(f"  Starting Stock: {product.stock}")
        print(f"  Daily Demand: {product.daily_demand}")
        print(f"  Sale Price: ${product.sale_price}")
        print(f"  Storage Cost: ${product.cost_storage}/day")
        print(f"  Restock Cost: ${product.cost_restock}")
    
    # Show store items by category
    print("\n\n🏪 STORE ITEMS (Unlockable):")
    print("-" * 60)
    store_items = GameCatalog.get_store_items()
    categories = get_products_by_category(store_items)
    
    for category, items in categories.items():
        print(f"\n{category}:")
        for item in items:
            print(f"\n  {item.name} - ${item.unlock_price}")
            print(f"    {item.description}")
            print(f"    Daily Demand: {item.daily_demand} | Sale Price: ${item.sale_price}")
    
    # Show event types
    print("\n\n🎲 DAILY EVENTS:")
    print("-" * 60)
    event_descriptions = GameCatalog.get_event_descriptions()
    for event_type, description in event_descriptions.items():
        print(f"\n{event_type.upper()}")
        print(f"  {description}")
    
    # Generate sample events
    print("\n\n📅 SAMPLE EVENT GENERATION:")
    print("-" * 60)
    products = [BaseProduct(**p.to_dict()) for p in base_products]
    for i in range(5):
        event = GameCatalog.generate_random_event(products)
        if event:
            print(f"\nDay {i+1}: {event.name}")
            print(f"  {event.description}")
        else:
            print(f"\nDay {i+1}: ✅ Normal Day (No Events)")
    
    print("\n" + "=" * 60)
