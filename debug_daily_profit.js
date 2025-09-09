// Daily Profit Screen Debug Script
// Run this in the app console or as a standalone script to debug the daily profit calculation

import { SupabaseAPI, supabase } from './supabase';

const debugDailyProfit = async () => {
  console.log('🔍 DEBUGGING DAILY PROFIT SCREEN DATA...');
  
  try {
    // Check if we have any orders
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .order('order_date', { ascending: false });
    
    console.log('📋 ORDERS FOUND:', orders?.length || 0);
    if (orders && orders.length > 0) {
      console.log('📋 Sample orders:', orders.slice(0, 3));
      
      // Check payment statuses
      const statusCounts = {};
      orders.forEach(order => {
        const status = order.payment_status || 'null';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      console.log('💳 Payment status breakdown:', statusCounts);
    }
    
    // Check if we have any bills
    const { data: bills } = await supabase
      .from('bills')
      .select('*')
      .order('date_issue', { ascending: false });
    
    console.log('🧾 BILLS FOUND:', bills?.length || 0);
    if (bills && bills.length > 0) {
      console.log('🧾 Sample bills:', bills.slice(0, 3));
    }
    
    // Check paid orders specifically
    const { data: paidOrders } = await supabase
      .from('orders')
      .select('*')
      .ilike('payment_status', 'paid');
    
    console.log('💰 PAID ORDERS FOUND:', paidOrders?.length || 0);
    if (paidOrders && paidOrders.length > 0) {
      console.log('💰 Sample paid orders:', paidOrders.slice(0, 3));
      
      // Get bill IDs from paid orders
      const billIds = [...new Set(paidOrders.map(o => o.bill_id).filter(id => id))];
      console.log('🏷️ Bill IDs from paid orders:', billIds);
      
      if (billIds.length > 0) {
        // Get bills for paid orders
        const { data: paidBills } = await supabase
          .from('bills')
          .select('*')
          .in('id', billIds);
        
        console.log('💸 BILLS WITH PAID ORDERS:', paidBills?.length || 0);
        if (paidBills && paidBills.length > 0) {
          console.log('💸 Sample paid bills:', paidBills.slice(0, 3));
          
          // Calculate total revenue
          const totalRevenue = paidBills.reduce((sum, bill) => {
            const amount = parseFloat(bill.total_amt) || 0;
            return sum + amount;
          }, 0);
          
          console.log('📊 TOTAL REVENUE FROM PAID BILLS:', totalRevenue);
        }
      }
    }
    
    // Check daily expenses
    const { data: dailyExpenses } = await supabase
      .from('Daily_Expenses')
      .select('*');
    
    console.log('💸 DAILY EXPENSES FOUND:', dailyExpenses?.length || 0);
    if (dailyExpenses && dailyExpenses.length > 0) {
      console.log('💸 Sample daily expenses:', dailyExpenses.slice(0, 3));
    }
    
    // Check worker expenses
    const { data: workerExpenses } = await supabase
      .from('Worker_Expense')
      .select('*');
    
    console.log('👷 WORKER EXPENSES FOUND:', workerExpenses?.length || 0);
    if (workerExpenses && workerExpenses.length > 0) {
      console.log('👷 Sample worker expenses:', workerExpenses.slice(0, 3));
    }
    
    // Test the IST date conversion
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    const todayIST = istDate.toISOString().split('T')[0];
    
    console.log('🇮🇳 IST DATE INFO:');
    console.log('  Current UTC:', now.toISOString());
    console.log('  Current IST:', istDate.toISOString());
    console.log('  Today IST string:', todayIST);
    
    // Check if there are any bills for today
    if (bills && bills.length > 0) {
      const todayBills = bills.filter(bill => {
        const billDate = bill.today_date || bill.date_issue || bill.due_date;
        if (!billDate) return false;
        
        // Normalize the bill date to YYYY-MM-DD format
        const normalizedBillDate = new Date(billDate).toISOString().split('T')[0];
        return normalizedBillDate === todayIST;
      });
      
      console.log('📅 BILLS FOR TODAY (IST):', todayBills.length);
      if (todayBills.length > 0) {
        console.log('📅 Today bills:', todayBills);
      }
    }
    
  } catch (error) {
    console.error('❌ DEBUG ERROR:', error);
  }
};

export { debugDailyProfit };

// If running directly in browser console:
// debugDailyProfit();
