# Daily Profit Calculation Logic - TMS Application

## Overview
The Daily Profit Screen calculates business profitability using a comprehensive approach that tracks revenue, various expense categories, and generates net profit analysis with IST timezone support.

## 📊 **Core Profit Formula**

```
Net Profit = Total Revenue - (Daily Expenses + Worker Expenses)
```

### Where:
- **Total Revenue** = Sum of `total_amt` from bills (only those with paid orders)
- **Daily Expenses** = Material cost + Miscellaneous cost + Chai Pani cost
- **Worker Expenses** = Sum of amounts paid to workers

---

## 🔍 **Revenue Calculation Logic**

### Current Implementation (Frontend - DailyProfitScreen.js)
Uses **"Subquery Approach"** to prevent double-counting:

```javascript
// Step 1: Get only PAID orders
const paidOrders = orders.filter(order => 
  order.payment_status?.toLowerCase() === 'paid'
);

// Step 2: Get unique bill IDs from paid orders
const uniqueBillIds = [...new Set(paidOrders.map(order => order.bill_id))];

// Step 3: Fetch bills that have paid orders
const bills = await supabase.from('bills')
  .select('*')
  .in('id', uniqueBillIds);

// Step 4: Sum total_amt from each bill (counted ONCE per bill)
const totalRevenue = bills.reduce((sum, bill) => sum + bill.total_amt, 0);
```

### Backend Implementation (supabase.js)
```javascript
const totalRevenue = orders.data?.filter(o => o.payment_status?.toLowerCase() === 'paid')
  .reduce((sum, o) => sum + (o.total_amt || 0), 0) || 0
```

### Key Principles:
1. **Only Paid Orders Count**: Revenue only includes orders with `payment_status = "paid"`
2. **No Double Counting**: Each bill counted once, regardless of garment quantity
3. **Bill-Level Revenue**: Revenue calculated at bill level, not individual garment level

---

## 💰 **Expense Categories**

### 1. Daily Expenses (Shop Operations)
```javascript
const totalDailyExpenses = expenses.reduce((sum, expense) => 
  sum + (expense.material_cost || 0) + 
      (expense.miscellaneous_Cost || 0) + 
      (expense.chai_pani_cost || 0), 0
);
```

**Source Table**: `Daily_Expenses`
**Fields**:
- `material_cost` - Raw materials and supplies
- `miscellaneous_Cost` - Other shop expenses  
- `chai_pani_cost` - Tea/refreshments for staff

### 2. Worker Expenses (Labor Costs)
```javascript
const totalWorkerExpenses = workerExpenses.reduce((sum, expense) => 
  sum + (expense.Amt_Paid || 0), 0
);
```

**Source Table**: `Worker_Expense`  
**Fields**:
- `Amt_Paid` - Amount paid to workers

---

## 🌍 **IST Timezone Handling**

### Problem Solved
- Database stores dates in UTC
- Users operate in IST (UTC+5:30)
- Previous logic caused date mismatch issues

### Solution Implemented
```javascript
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30

const convertUTCtoIST = (utcDate) => {
  const date = new Date(utcDate);
  return new Date(date.getTime() + IST_OFFSET_MS);
};

const formatISTDate = (date) => {
  const istDate = convertUTCtoIST(date);
  const yyyy = istDate.getFullYear();
  const mm = String(istDate.getMonth() + 1).padStart(2, '0');
  const dd = String(istDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
```

---

## 📅 **Date Filtering Logic**

### Available Filters:
1. **All Time** - No date filtering
2. **Today** - Current IST date only
3. **This Week** - Last 7 days from current IST date
4. **This Month** - Last 30 days from current IST date

### Implementation:
```javascript
switch (dateFilter) {
  case 'today':
    const todayKey = formatISTDate(new Date());
    result = result.filter(item => item.date === todayKey);
    break;
  case 'week':
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    result = result.filter(item => {
      const itemDate = convertUTCtoIST(new Date(item.date));
      return itemDate >= weekAgo && itemDate <= now;
    });
    break;
  // Similar logic for month
}
```

---

## 📈 **Summary Statistics Calculated**

```javascript
const summary = {
  totalRevenue: // Sum of all revenue
  totalWorkPay: // Sum of Work_pay from orders (grouped by bill)
  totalShopExpenses: // Sum of daily expenses  
  totalWorkerExpenses: // Sum of worker expenses
  totalNetProfit: // Revenue - (Shop + Worker expenses)
  totalOrders: // Count of bills (not individual orders)
  averageDailyProfit: // Net profit / number of days
  bestDay: // Day with highest net profit
  worstDay: // Day with lowest net profit
}
```

---

## 🔄 **Data Processing Flow**

1. **Fetch Data**:
   - Orders from `orders` table
   - Daily expenses from `Daily_Expenses` table  
   - Worker expenses from `Worker_Expense` table
   - Bills from `bills` table (only those with paid orders)

2. **Group by Date** (IST normalized):
   - Convert all dates to IST format (YYYY-MM-DD)
   - Group transactions by date

3. **Calculate Daily Totals**:
   - Revenue: Sum bill amounts for that date
   - Expenses: Sum daily + worker expenses for that date
   - Net Profit: Revenue - Total Expenses

4. **Apply Filters**:
   - Filter by selected date range
   - Apply search query if provided

5. **Generate Summary**:
   - Calculate totals across all filtered dates
   - Find best/worst performing days

---

## 🔧 **Key Implementation Details**

### Revenue Counting Prevention of Double-Counting:
```javascript
// WRONG: Would count each garment separately
// orders.filter(paid).reduce((sum, order) => sum + order.total_amt, 0)

// CORRECT: Count each bill once
const uniqueBillIds = [...new Set(paidOrders.map(o => o.bill_id))];
const bills = await getBills(uniqueBillIds);  
const revenue = bills.reduce((sum, bill) => sum + bill.total_amt, 0);
```

### Work Pay Calculation:
```javascript
// Group orders by bill_id to avoid double counting work pay
const ordersByBill = {};
orders.forEach(order => {
  const billId = order.bill_id || 'no-bill';
  if (!ordersByBill[billId]) ordersByBill[billId] = [];
  ordersByBill[billId].push(order);
});

// Sum work pay per bill (not per garment)
Object.entries(ordersByBill).forEach(([billId, billOrders]) => {
  const totalWorkPay = billOrders.reduce((sum, order) => 
    sum + (order.Work_pay || 0), 0
  );
  profitByDate[date].workPay += totalWorkPay;
});
```

---

## 🎯 **Business Logic Rules**

1. **Revenue Recognition**: Only when orders are marked as "paid"
2. **Bill-Level Accounting**: Revenue tracked per bill, not per garment
3. **Date Attribution**: Uses bill date (today_date > date_issue > due_date precedence)
4. **Expense Matching**: Expenses matched to dates they were incurred
5. **Timezone Consistency**: All dates normalized to IST for user experience

---

## 🚨 **Important Notes**

- **No Double Counting**: System ensures each bill revenue counted exactly once
- **Paid Orders Only**: Unpaid/pending orders don't contribute to revenue
- **IST Alignment**: All date filters use Indian Standard Time
- **Real-time Updates**: Data refreshes when navigating between date filters
- **Comprehensive Tracking**: Includes both operational and labor expenses

This logic provides accurate daily profitability analysis for the tailoring business with proper timezone handling and prevents common accounting errors like double-counting revenue.
