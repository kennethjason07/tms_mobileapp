# Demo of Backend Garment Expansion Logic
# This shows how combined garments will be split into individual entries

from datetime import datetime

# Mock Order class to simulate database records
class MockOrder:
    def __init__(self, id, garment_type, bill_id, billnumberinput2, status='pending'):
        self.id = id
        self.garment_type = garment_type
        self.bill_id = bill_id
        self.billnumberinput2 = billnumberinput2
        self.status = status
        self.order_date = datetime(2025, 9, 8)
        self.due_date = datetime(2025, 9, 24)
        self.total_amt = 600
        self.payment_mode = 'UPI'
        self.payment_status = 'pending'
        self.payment_amount = 0
        self.Work_pay = 0
        self.workers = []

def expand_garment_orders(orders):
    """Expand orders with combined garment types into individual garment entries"""
    expanded_orders = []
    
    for order in orders:
        garment_type = order.garment_type or ''
        
        # Check if garment_type contains multiple garments (comma-separated)
        if ',' in garment_type:
            # Split combined garments and create separate entries
            individual_garments = [g.strip() for g in garment_type.split(',') if g.strip()]
            
            for index, garment in enumerate(individual_garments):
                # Create a dictionary representing the expanded order
                expanded_order = {
                    'id': f"{order.id}_{index}",  # Unique ID for each garment
                    'original_id': order.id,  # Keep reference to original
                    'garment_type': garment,
                    'status': order.status,
                    'order_date': order.order_date,
                    'due_date': order.due_date,
                    'total_amt': order.total_amt,
                    'payment_mode': order.payment_mode,
                    'payment_status': order.payment_status,
                    'payment_amount': order.payment_amount,
                    'bill_id': order.bill_id,
                    'billnumberinput2': order.billnumberinput2,
                    'Work_pay': order.Work_pay,
                    'workers': order.workers
                }
                expanded_orders.append(expanded_order)
        else:
            # Single garment - convert to dictionary format for consistency
            single_order = {
                'id': order.id,
                'original_id': order.id,
                'garment_type': garment_type,
                'status': order.status,
                'order_date': order.order_date,
                'due_date': order.due_date,
                'total_amt': order.total_amt,
                'payment_mode': order.payment_mode,
                'payment_status': order.payment_status,
                'payment_amount': order.payment_amount,
                'bill_id': order.bill_id,
                'billnumberinput2': order.billnumberinput2,
                'Work_pay': order.Work_pay,
                'workers': order.workers
            }
            expanded_orders.append(single_order)
    
    return expanded_orders

# Demo data - what your database currently has
print("🗂️  BACKEND EXPANSION DEMO")
print("=" * 50)
print()

mock_orders = [
    MockOrder(5925, "Pant", 101, 8052),                    # Single garment
    MockOrder(5924, "Pant, Shirt", 102, 8051),             # Combined garments
    MockOrder(5923, "Shirt, Sadri", 103, 8050),            # Combined garments  
    MockOrder(5922, "Pant, Shirt", 104, 8049),             # Combined garments
]

print("📥 BEFORE EXPANSION (Database Records):")
print("=" * 40)
for order in mock_orders:
    print(f"ID: {order.id}, Bill: {order.billnumberinput2}, Garment: '{order.garment_type}'")

print()
print("⚙️ APPLYING BACKEND EXPANSION...")
print()

# Apply expansion
expanded_orders = expand_garment_orders(mock_orders)

print("📤 AFTER EXPANSION (API Response):")
print("=" * 35)
for order in expanded_orders:
    original_id = order.get('original_id', 'N/A')
    print(f"ID: {order['id']}, Bill: {order['billnumberinput2']}, Garment: '{order['garment_type']}' (Original: {original_id})")

print()
print("✅ FRONTEND WILL RECEIVE:")
print("=" * 25)
print("Row 1: Bill 8052 - 'Pant'")
print("Row 2: Bill 8051 - 'Pant'")
print("Row 3: Bill 8051 - 'Shirt'")
print("Row 4: Bill 8050 - 'Shirt'") 
print("Row 5: Bill 8050 - 'Sadri'")
print("Row 6: Bill 8049 - 'Pant'")
print("Row 7: Bill 8049 - 'Shirt'")

print()
print("🎯 FRONTEND NUMBERING LOGIC WILL THEN SHOW:")
print("=" * 45)
print("Bill 8052: 'Pant' (single, no number)")
print("Bill 8051: 'Pant 1', 'Shirt 2' (different types, but if same type existed would be numbered)")
print("Bill 8050: 'Shirt 1', 'Sadri 2' (different types)")
print("Bill 8049: 'Pant 1', 'Shirt 2' (different types)")

print()
print("🔄 HOW THIS FIXES YOUR ISSUE:")
print("=" * 30)
print("❌ Before: Combined display 'Pant, Shirt' in one row")
print("✅ After: Individual rows 'Pant' and 'Shirt' with proper numbering")
print("✅ Worker assignment: Each garment gets its own worker assignment")
print("✅ All calculations preserved: Total amounts, payments stay the same")
print("✅ Clean format: 'Pant 1', 'Pant 2' instead of 'Pant (1)', 'Pant (2)'")
