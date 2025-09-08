const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase configuration
const supabaseUrl = 'https://oeqlxurzbdvliuqutqyo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcWx4dXJ6YmR2bGl1cXV0cXlvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTIzMjQ2MywiZXhwIjoyMDY2ODA4NDYzfQ.wC1DH3v10iAHjsIhKyr3heOvNsQAX7DaLxlEM5ySc7Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fetchAllOrdersJSON() {
  try {
    console.log('🔄 Fetching all orders from database...');
    
    // Get all orders with related data
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('order_date', { ascending: false });
    
    if (ordersError) throw ordersError;
    
    // Get all bills
    const { data: bills, error: billsError } = await supabase
      .from('bills')
      .select('*');
    
    if (billsError) throw billsError;
    
    // Get all order-worker associations
    const { data: associations, error: associationsError } = await supabase
      .from('order_worker_association')
      .select('*');
    
    if (associationsError) throw associationsError;
    
    // Get all workers
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('*');
    
    if (workersError) throw workersError;
    
    console.log(`✅ Fetched ${orders.length} orders, ${bills.length} bills, ${workers.length} workers, ${associations.length} associations`);
    
    // Create maps for efficient lookups
    const billsMap = {};
    bills.forEach(bill => {
      billsMap[bill.id] = bill;
    });
    
    const workersMap = {};
    workers.forEach(worker => {
      workersMap[worker.id] = worker;
    });
    
    const associationsMap = {};
    associations.forEach(association => {
      if (!associationsMap[association.order_id]) {
        associationsMap[association.order_id] = [];
      }
      associationsMap[association.order_id].push(association);
    });
    
    // Process orders with related data
    const processedOrders = orders.map(order => {
      const orderAssociations = associationsMap[order.id] || [];
      const bill = billsMap[order.bill_id];
      
      const orderWorkerAssociations = orderAssociations.map(association => ({
        order_id: association.order_id,
        worker_id: association.worker_id,
        workers: workersMap[association.worker_id]
      }));
      
      return {
        ...order,
        order_worker_association: orderWorkerAssociations,
        bills: bill,
        customer_mobile: bill?.mobile_number || null,
        customer_name: bill?.customer_name || null,
        deliveryDate: order.due_date,
        workers: orderWorkerAssociations.map(assoc => assoc.workers).filter(Boolean)
      };
    });
    
    // Create export data structure
    const exportData = {
      export_timestamp: new Date().toISOString(),
      total_orders: processedOrders.length,
      summary: {
        total_bills: bills.length,
        total_workers: workers.length,
        total_associations: associations.length
      },
      orders: processedOrders
    };
    
    // Save to JSON file
    const fileName = `orders-export-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(fileName, JSON.stringify(exportData, null, 2));
    
    console.log(`📁 Orders exported to: ${fileName}`);
    console.log(`📊 Total orders exported: ${processedOrders.length}`);
    
    // Also output first few orders to console
    console.log('\n📋 === SAMPLE ORDERS (First 5) ===');
    console.log(JSON.stringify(processedOrders.slice(0, 5), null, 2));
    console.log('📋 === END SAMPLE ===\n');
    
    // Show bills with highest quantities
    console.log('\n📈 === BILLS WITH HIGHEST QUANTITIES ===');
    const billsWithQuantities = bills
      .map(bill => ({
        id: bill.id,
        bill_number: bill.billnumberinput2,
        total_garments: (parseInt(bill.suit_qty) || 0) + 
                       (parseInt(bill.safari_qty) || 0) + 
                       (parseInt(bill.pant_qty) || 0) + 
                       (parseInt(bill.shirt_qty) || 0) + 
                       (parseInt(bill.sadri_qty) || 0),
        breakdown: {
          suits: parseInt(bill.suit_qty) || 0,
          safari: parseInt(bill.safari_qty) || 0,
          pants: parseInt(bill.pant_qty) || 0,
          shirts: parseInt(bill.shirt_qty) || 0,
          sadri: parseInt(bill.sadri_qty) || 0
        }
      }))
      .filter(bill => bill.total_garments > 0)
      .sort((a, b) => b.total_garments - a.total_garments)
      .slice(0, 10);
    
    billsWithQuantities.forEach((bill, i) => {
      console.log(`${i + 1}. Bill ${bill.bill_number}: ${bill.total_garments} total garments`);
      console.log(`   - Suits: ${bill.breakdown.suits}, Safari: ${bill.breakdown.safari}, Pants: ${bill.breakdown.pants}, Shirts: ${bill.breakdown.shirts}, Sadri: ${bill.breakdown.sadri}`);
    });
    
    console.log('\n✅ Export complete!');
    
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
  }
}

// Run the export
fetchAllOrdersJSON();
