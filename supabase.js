import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase credentials
const supabaseUrl = 'https://oeqlxurzbdvliuqutqyo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcWx4dXJ6YmR2bGl1cXV0cXlvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTIzMjQ2MywiZXhwIjoyMDY2ODA4NDYzfQ.wC1DH3v10iAHjsIhKyr3heOvNsQAX7DaLxlEM5ySc7Q'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions to replace your Python routes
export const SupabaseAPI = {
  // Debug helper to check available tables
  async getAvailableTables() {
    try {
      // Try to query information_schema to get table names
      const { data, error } = await supabase
        .rpc('get_tables')
        .select('*')
      
      if (error) {
        // If RPC doesn't work, try a simple query to test connection
        return { message: 'Testing connection...', error: error.message }
      }
      
      return data
    } catch (error) {
      return { message: 'Error checking tables', error: error.message }
    }
  },

  // Workers API (replaces route9.py)
  async getWorkers() {
    const { data, error } = await supabase
      .from('workers')
      .select('*')
    
    if (error) throw error
    return data
  },

  async addWorkers(workersData) {
    const { data, error } = await supabase
      .from('workers')
      .insert(workersData)
      .select()
    
    if (error) throw error
    return data
  },

  async deleteWorker(workerId) {
    const { error } = await supabase
      .from('workers')
      .delete()
      .eq('id', workerId)
    
    if (error) throw error
    return true
  },

  async updateWorker(workerId, workerData) {
    const { data, error } = await supabase
      .from('workers')
      .update(workerData)
      .eq('id', workerId)
      .select()
    
    if (error) throw error
    return data
  },

  async getOrdersForWorker(workerId) {
    try {
      // Get order-worker associations for this worker
      const { data: associations, error: associationsError } = await supabase
        .from('order_worker_association')
        .select('order_id')
        .eq('worker_id', workerId)

      if (associationsError) throw associationsError

      if (!associations || associations.length === 0) {
        return []
      }

      // Get the order IDs
      const orderIds = associations.map(assoc => assoc.order_id)

      // Get the actual orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .in('id', orderIds)
        .order('order_date', { ascending: false })

      if (ordersError) throw ordersError

      return orders || []
    } catch (error) {
      console.error('Error getting orders for worker:', error)
      throw error
    }
  },

  // Orders API (replaces route3.py) - Fixed to handle relationships properly
  async getOrders() {
    try {
      // First, get the highest bill number to verify our sorting will be correct
      const highestBillNumber = await this.getHighestBillNumber();
      console.log('🔢 HIGHEST BILL NUMBER DETECTED:', highestBillNumber);
      
      // Get all orders first - ordered by billnumberinput2 descending to ensure highest bills come first
      // Add a reasonable limit to prevent performance issues with massive datasets
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('billnumberinput2', { ascending: false })
        .order('id', { ascending: false }) // Secondary sort by ID descending
        .limit(2000) // Limit to recent 2000 orders to prevent performance issues
      
      if (ordersError) {
        console.error('Orders fetch error:', ordersError)
        throw ordersError
      }

      console.log(`📊 ORDERS LOADED: ${orders?.length || 0} orders`);      
      
      // Verify the highest bill number is first
      if (orders && orders.length > 0) {
        const firstOrderBillNumber = Number(orders[0].billnumberinput2) || 0;
        console.log('🎯 FIRST ORDER BILL NUMBER:', firstOrderBillNumber);
        console.log(`🎯 FIRST ORDER ID: ${orders[0].id}`);
        console.log(`🎯 FIRST ORDER GARMENT: ${orders[0].garment_type}`);
        console.log('✅ VERIFICATION: Highest bill number matches first order?', 
          firstOrderBillNumber === highestBillNumber ? 'YES' : 'NO');
        if (firstOrderBillNumber !== highestBillNumber) {
          console.warn('⚠️ WARNING: First order bill number does not match highest bill number!');
          console.warn(`Expected: ${highestBillNumber}, Got: ${firstOrderBillNumber}`);
        }
        
        // Show first few orders for debugging
        console.log('\n📋 TOP 3 ORDERS FROM SUPABASE:');
        orders.slice(0, 3).forEach((order, index) => {
          console.log(`  ${index + 1}. Bill: ${order.billnumberinput2}, ID: ${order.id}, Garment: ${order.garment_type}`);
        });
      }

      // Get all bills
      const { data: bills, error: billsError } = await supabase
        .from('bills')
        .select('*')
      
      if (billsError) throw billsError

      // Create a map of bills by ID for efficient lookup
      const billsMap = {}
      bills.forEach(bill => {
        billsMap[bill.id] = bill
      })

      // Get all order-worker associations
      const { data: associations, error: associationsError } = await supabase
        .from('order_worker_association')
        .select('*')
      
      if (associationsError) throw associationsError

      // Get all workers
      const { data: workers, error: workersError } = await supabase
        .from('workers')
        .select('*')
      
      if (workersError) throw workersError

      // Create a map of workers by ID
      const workersMap = {}
      workers.forEach(worker => {
        workersMap[worker.id] = worker
      })

      // Create a map of associations by order ID
      const associationsMap = {}
      associations.forEach(association => {
        if (!associationsMap[association.order_id]) {
          associationsMap[association.order_id] = []
        }
        associationsMap[association.order_id].push(association)
      })

      // Process the orders to include customer mobile and worker information
      const ordersWithRelations = orders.map(order => {
        const orderAssociations = associationsMap[order.id] || []
        const bill = billsMap[order.bill_id]
        
        const orderWorkerAssociations = orderAssociations.map(association => ({
          order_id: association.order_id,
          worker_id: association.worker_id,
          workers: workersMap[association.worker_id]
        }))

        const processedOrder = {
          ...order,
          order_worker_association: orderWorkerAssociations,
          bills: bill,
          customer_mobile: bill?.mobile_number || null,  // Get customer mobile from bill
          customer_name: bill?.customer_name || null     // Also include customer name
        }

        return processedOrder
      })

      return ordersWithRelations
    } catch (error) {
      console.error('Error in getOrders:', error)
      throw error
    }
  },

  async searchOrders(billNumber) {
    try {
      console.log(`\n🔍 SUPABASE SEARCH: Looking for bill number "${billNumber}"`);
      let orders = [];

      // Try exact numeric match first (since billnumberinput2 is numeric)
      try {
        const { data: ordersData, error: ordersDataError } = await supabase
        .from('orders')
        .select('*')
          .eq('billnumberinput2', billNumber)
        .order('billnumberinput2', { ascending: false })
        .order('id', { ascending: false })
      
        if (ordersDataError) throw ordersDataError

        if (ordersData && ordersData.length > 0) {
          console.log(`✅ EXACT MATCH: Found ${ordersData.length} orders for bill ${billNumber}`);
          console.log('First 3 exact match results:');
          ordersData.slice(0, 3).forEach((order, index) => {
            console.log(`  ${index + 1}. Bill: ${order.billnumberinput2}, ID: ${order.id}`);
          });
          
          // Get related bills
          const billIds = [...new Set(ordersData.map(order => order.bill_id))]
          const { data: bills, error: billsError } = await supabase
            .from('bills')
            .select('*')
            .in('id', billIds)
          
          if (billsError) throw billsError

          const billsMap = {}
          bills.forEach(bill => {
            billsMap[bill.id] = bill
          })

          orders = ordersData.map(order => ({
            ...order,
            bills: billsMap[order.bill_id],
            customer_mobile: billsMap[order.bill_id]?.mobile_number || null,
            customer_name: billsMap[order.bill_id]?.customer_name || null
          }))
          } else {
          console.log('❌ EXACT MATCH: No orders found, trying partial match...');
        }
        } catch (numericSearchError) {
        // Numeric search failed, continue to cast search
      }

      // If numeric search returned no results, try casting to text and searching
      if (orders.length === 0) {
        try {
          const { data: ordersData, error: ordersDataError } = await supabase
            .from('orders')
            .select('*')
            .ilike('billnumberinput2::text', `%${billNumber}%`)
            .order('billnumberinput2', { ascending: false })
            .order('id', { ascending: false })
          
          if (ordersDataError) throw ordersDataError

          if (ordersData && ordersData.length > 0) {
            console.log(`✅ PARTIAL MATCH: Found ${ordersData.length} orders containing "${billNumber}"`);
            console.log('First 5 partial match results:');
            ordersData.slice(0, 5).forEach((order, index) => {
              console.log(`  ${index + 1}. Bill: ${order.billnumberinput2}, ID: ${order.id}`);
            });
            
            // Get related bills
            const billIds = [...new Set(ordersData.map(order => order.bill_id))]
            const { data: bills, error: billsError } = await supabase
              .from('bills')
              .select('*')
              .in('id', billIds)
            
            if (billsError) throw billsError

            const billsMap = {}
            bills.forEach(bill => {
              billsMap[bill.id] = bill
            })

            orders = ordersData.map(order => ({
              ...order,
              bills: billsMap[order.bill_id],
              customer_mobile: billsMap[order.bill_id]?.mobile_number || null,
              customer_name: billsMap[order.bill_id]?.customer_name || null
            }))
          } else {
            console.log('❌ PARTIAL MATCH: No orders found');
          }
        } catch (castSearchError) {
          throw castSearchError;
        }
      }

      // If no orders found, return empty array
      if (orders.length === 0) {
        return [];
      }

      // Get the order IDs for these orders
      const orderIds = orders.map(order => order.id)

      // Get related associations
      const { data: associations, error: associationsError } = await supabase
        .from('order_worker_association')
        .select('*')
        .in('order_id', orderIds)
      
      if (associationsError) throw associationsError

      // Get related workers
      const workerIds = [...new Set(associations.map(assoc => assoc.worker_id))]
      const { data: workers, error: workersError } = await supabase
        .from('workers')
        .select('*')
        .in('id', workerIds)
      
      if (workersError) throw workersError

      // Create maps for efficient lookup
      const workersMap = {}
      workers.forEach(worker => {
        workersMap[worker.id] = worker
      })

      const associationsMap = {}
      associations.forEach(association => {
        if (!associationsMap[association.order_id]) {
          associationsMap[association.order_id] = []
        }
        associationsMap[association.order_id].push(association)
      })

      // Process the orders to include customer mobile and worker information
      const ordersWithRelations = orders.map(order => {
        const orderAssociations = associationsMap[order.id] || []
        
        const orderWorkerAssociations = orderAssociations.map(association => ({
          order_id: association.order_id,
          worker_id: association.worker_id,
          workers: workersMap[association.worker_id]
        }))

        return {
          ...order,
          order_worker_association: orderWorkerAssociations,
          customer_mobile: order.bills?.mobile_number || null,  // Get customer mobile from joined bill
          customer_name: order.bills?.customer_name || null     // Also include customer name
        }
      })

      console.log(`🏆 FINAL SEARCH RESULTS: ${ordersWithRelations.length} orders processed`);
      if (ordersWithRelations.length > 0) {
        console.log('Final search results (first 5):');
        ordersWithRelations.slice(0, 5).forEach((order, index) => {
          console.log(`  ${index + 1}. Bill: ${order.billnumberinput2}, ID: ${order.id}`);
        });
      }
      console.log('🔍 SUPABASE SEARCH COMPLETED\n');

      return ordersWithRelations
    } catch (error) {
      throw error
    }
  },

  // Customer Info API (replaces route2.py)
  async getCustomerInfo(mobileNumber) {
    try {
      // Get measurements
    const { data: measurements, error: measurementsError } = await supabase
      .from('measurements')
      .select('*')
      .eq('phone_number', mobileNumber)

      // Get bills separately
    const { data: bills, error: billsError } = await supabase
      .from('bills')
        .select('*')
      .eq('mobile_number', mobileNumber)

      // Get orders separately and filter by bill_id
      let order_history = [];
      if (bills && bills.length > 0) {
        const billIds = bills.map(bill => bill.id);
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .in('bill_id', billIds)
          .order('order_date', { ascending: false })
        
        if (orders && !ordersError) {
          order_history = orders;
        }
      }

      // Check if we have any data at all
      const hasBills = bills && bills.length > 0;
      const hasMeasurements = measurements && measurements.length > 0;

      // If no data found at all, return empty result
      if (!hasBills && !hasMeasurements) {
    return {
          measurements: null,
          order_history: [],
          customer_name: null,
      mobile_number: mobileNumber
        };
      }

      return {
        measurements: measurements?.[0] || null,
        order_history: order_history,
        customer_name: bills?.[0]?.customer_name || null,
        mobile_number: mobileNumber
      };
    } catch (error) {
      console.error('Error in getCustomerInfo:', error);
      throw error;
    }
  },

  // Customer Management API (new functions for CustomerInfoScreen)
  async getAllCustomers() {
    try {
      // Try different possible table names
      let data, error;
      
      // First try 'customer_info'
      const result1 = await supabase
        .from('customer_info')
        .select('*')
        .order('name', { ascending: true })
      
      if (!result1.error && result1.data) {
        return result1.data
      }
      
      // Try 'customers'
      const result2 = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true })
      
      if (!result2.error && result2.data) {
        return result2.data
      }
      
      // Try 'customer'
      const result3 = await supabase
        .from('customer')
        .select('*')
        .order('name', { ascending: true })
      
      if (!result3.error && result3.data) {
        return result3.data
      }
      
      // Fallback: Get unique customers from bills table
      const fallbackResult = await supabase
        .from('bills')
        .select('customer_name, mobile_number')
        .not('customer_name', 'is', null)
        .not('mobile_number', 'is', null)
      
      if (!fallbackResult.error && fallbackResult.data) {
        // Convert bills data to customer format
        const uniqueCustomers = fallbackResult.data.reduce((acc, bill) => {
          const existing = acc.find(c => c.phone === bill.mobile_number)
          if (!existing) {
            acc.push({
              id: bill.mobile_number, // Use mobile number as ID
              name: bill.customer_name,
              phone: bill.mobile_number,
              email: '',
              address: '',
              created_at: new Date().toISOString()
            })
          }
          return acc
        }, [])
        
        return uniqueCustomers.sort((a, b) => a.name.localeCompare(b.name))
      }
      
      // If none work, throw the first error
      throw result1.error || result2.error || result3.error || fallbackResult.error || new Error('No customer data found')
      
    } catch (error) {
      throw error
    }
  },

  async addCustomerInfo(customerData) {
    try {
      // Try different possible table names
      let data, error;
      
      // First try 'customer_info'
      const result1 = await supabase
        .from('customer_info')
        .insert(customerData)
        .select()
      
      if (!result1.error && result1.data) {
        return result1.data
      }
      
      // Try 'customers'
      const result2 = await supabase
        .from('customers')
        .insert(customerData)
        .select()
      
      if (!result2.error && result2.data) {
        return result2.data
      }
      
      // Try 'customer'
      const result3 = await supabase
        .from('customer')
        .insert(customerData)
        .select()
      
      if (!result3.error && result3.data) {
        return result3.data
      }
      
      // Fallback: Add to bills table as a placeholder bill
      const fallbackResult = await supabase
        .from('bills')
        .insert({
          customer_name: customerData.name,
          mobile_number: customerData.phone,
          billnumberinput2: `CUST-${Date.now()}`, // Generate a unique bill number
          total_amt: 0,
          payment_amount: 0,
          payment_status: 'pending',
          status: 'pending'
        })
        .select()
      
      if (!fallbackResult.error && fallbackResult.data) {
        // Return in the expected format
        return [{
          id: customerData.phone,
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email || '',
          address: customerData.address || '',
          created_at: new Date().toISOString()
        }]
      }
      
      // If none work, throw the first error
      throw result1.error || result2.error || result3.error || fallbackResult.error || new Error('No customer table found')
      
    } catch (error) {
      throw error
    }
  },

  async deleteCustomerInfo(customerId) {
    try {
      // Try different possible table names
      let error;
      
      // First try 'customer_info'
      const result1 = await supabase
        .from('customer_info')
        .delete()
        .eq('id', customerId)
      
      if (!result1.error) {
        return true
      }
      
      // Try 'customers'
      const result2 = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)
      
      if (!result2.error) {
        return true
      }
      
      // Try 'customer'
      const result3 = await supabase
        .from('customer')
        .delete()
        .eq('id', customerId)
      
      if (!result3.error) {
        return true
      }
      
      // Fallback: Delete from bills table (if customerId is a phone number)
      const fallbackResult = await supabase
        .from('bills')
        .delete()
        .eq('mobile_number', customerId)
      
      if (!fallbackResult.error) {
        return true
      }
      
      // If none work, throw the first error
      throw result1.error || result2.error || result3.error || fallbackResult.error || new Error('No customer table found')
      
    } catch (error) {
      throw error
    }
  },

  async updateCustomerMeasurements(mobileNumber, measurementsData) {
    const { data, error } = await supabase
      .from('measurements')
      .update(measurementsData)
      .eq('phone_number', mobileNumber)
      .select()
    
    if (error) throw error
    return data
  },

  // Upsert measurements for a customer (insert or update by phone_number)
  async upsertMeasurements(measurements, mobile_number) {
    // Validate mobile number
    const phone = (mobile_number ?? '').toString().trim();
    if (!phone) {
      throw new Error('Missing mobile number for measurements upsert');
    }

    // Only include allowed fields and phone_number, never id
    const allowedFields = [
      'pant_length', 'pant_kamar', 'pant_hips', 'pant_waist', 'pant_ghutna', 'pant_bottom', 'pant_seat',
      'SideP_Cross', 'Plates', 'Belt', 'Back_P', 'WP',
      'shirt_length', 'shirt_body', 'shirt_loose', 'shirt_shoulder', 'shirt_astin', 'shirt_collar', 'shirt_aloose',
      'Callar', 'Cuff', 'Pkt', 'LooseShirt', 'DT_TT', 'extra_measurements'
    ];

    const payload = { phone_number: phone };
    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(measurements || {}, key)) {
        payload[key] = measurements[key];
      }
    }

    // Retry wrapper for transient network issues
    const maxAttempts = 3;
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { data, error } = await supabase
          .from('measurements')
          .upsert(payload, { onConflict: 'phone_number' })
          .select();
        if (error) throw error;
        return data;
      } catch (err) {
        lastError = err;
        const isLast = attempt === maxAttempts;
        console.error(`upsertMeasurements attempt ${attempt} failed:`, err?.message || err);
        if (isLast) break;
        // small backoff
        await new Promise(r => setTimeout(r, 400 * attempt));
      }
    }
    // Re-throw with clearer context
    const details = (lastError && (lastError.message || lastError.details || lastError.code)) || 'Unknown error';
    throw new Error(`Failed to upsert measurements: ${details}`);
  },

  // Daily Expenses API (replaces route14.py)
  async getDailyExpenses() {
    const { data, error } = await supabase
      .from('Daily_Expenses')
      .select('*')
      .order('Date', { ascending: false })
    
    if (error) throw error
    return data
  },

  async addDailyExpense(expenseData) {
    const { data, error } = await supabase
      .from('Daily_Expenses')
      .insert(expenseData)
      .select()
    
    if (error) throw error
    return data
  },

  // Update a daily expense by id
  async updateDailyExpense(expenseId, expenseData) {
    const { data, error } = await supabase
      .from('Daily_Expenses')
      .update(expenseData)
      .eq('id', expenseId)
      .select();
    if (error) throw error;
    return data;
  },

  // Worker Expenses API (replaces route17.py)
  async getWorkerExpenses() {
    const { data, error } = await supabase
      .from('Worker_Expense')
      .select('*')
      .order('date', { ascending: false })
    
    if (error) throw error
    return data
  },

  async addWorkerExpense(expenseData) {
    const { data, error } = await supabase
      .from('Worker_Expense')
      .insert(expenseData)
      .select()
    
    if (error) throw error
    return data
  },

  async updateWorkerExpense(expenseId, expenseData) {
    const { data, error } = await supabase
      .from('Worker_Expense')
      .update(expenseData)
      .eq('id', expenseId)
      .select()
    
    if (error) throw error
    return data
  },

  // Weekly Pay API (replaces route12.py)
  async getWorkerWeeklyPay(workerId = null) {
    if (workerId) {
      // Get specific worker's weekly pay - matching /api/weekly-pay/<worker_id> exactly
      const { data: worker, error: workerError } = await supabase
        .from('workers')
        .select('*')
        .eq('id', workerId)
        .single()
      
      if (workerError) throw workerError

      // Get order-worker associations for this worker
      const { data: associations, error: associationsError } = await supabase
        .from('order_worker_association')
        .select('*')
        .eq('worker_id', workerId)

      if (associationsError) throw associationsError

      // Let's also check if there are any associations at all in the table
      const { data: allAssociations, error: allAssociationsError } = await supabase
        .from('order_worker_association')
        .select('*')
        .limit(10)

      // Let's also check if there are any orders in the database
      const { data: sampleOrders, error: ordersSampleError } = await supabase
        .from('orders')
        .select('*')
        .limit(5)

      // Get the order IDs
      const orderIds = associations?.map(assoc => assoc.order_id) || []

      // Get all orders for this worker - matching backend query
      let all_orders = []
      if (orderIds.length > 0) {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .in('id', orderIds)
          .order('order_date', { ascending: false })

        if (ordersError) throw ordersError
        all_orders = ordersData || []
      }

      // Get all expenses for this worker - matching backend query
      const { data: all_expenses, error: expensesError } = await supabase
        .from('Worker_Expense')
        .select('*')
        .eq('worker_id', workerId)
        .order('date', { ascending: false })

      if (expensesError) throw expensesError

      // Remove duplicate expenses (same ID)
      const uniqueExpenses = []
      const seenExpenseIds = new Set()
      for (const expense of all_expenses || []) {
        if (!seenExpenseIds.has(expense.id)) {
          seenExpenseIds.add(expense.id)
          uniqueExpenses.push(expense)
        }
      }

      // Process weekly data - matching backend logic exactly
      const weekly_data = {}
      
      // Process orders - matching backend Sunday-Saturday week calculation
      for (const order of all_orders) {
        if (!order.order_date) {
          continue
        }

        const orderDate = new Date(order.order_date)
        
        // Convert to Python's weekday() equivalent (Monday=0, Sunday=6)
        const jsWeekday = orderDate.getDay() // 0=Sunday, 1=Monday, ..., 6=Saturday
        const pythonWeekday = jsWeekday === 0 ? 6 : jsWeekday - 1 // Convert to Python format (Monday=0, Sunday=6)
        
        // Calculate days since Sunday using backend logic: (current_weekday + 1) % 7
        const daysSinceSunday = (pythonWeekday + 1) % 7
        
        const weekStart = new Date(orderDate)
        weekStart.setDate(orderDate.getDate() - daysSinceSunday)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        
        const weekKey = weekStart.toISOString().split('T')[0]

        if (!weekly_data[weekKey]) {
          weekly_data[weekKey] = {
            start_date: weekStart.toISOString().split('T')[0],
            end_date: weekEnd.toISOString().split('T')[0],
            orders: [],
            total_work_pay: 0,
            total_paid: 0,
            order_count: 0
          }
        }

        weekly_data[weekKey].orders.push({
          order_number: order.billnumberinput2 || order.id,
          work_pay: order.Work_pay || 0
        })
        weekly_data[weekKey].total_work_pay += order.Work_pay || 0
        weekly_data[weekKey].order_count += 1
      }

      // Process expenses - matching backend Sunday-Saturday week calculation
      for (const expense of uniqueExpenses) {
        if (!expense.date) {
          continue
        }

        const expenseDate = new Date(expense.date)
        
        // Convert to Python's weekday() equivalent (Monday=0, Sunday=6)
        const jsWeekday = expenseDate.getDay() // 0=Sunday, 1=Monday, ..., 6=Saturday
        const pythonWeekday = jsWeekday === 0 ? 6 : jsWeekday - 1 // Convert to Python format (Monday=0, Sunday=6)
        
        // Calculate days since Sunday using backend logic: (current_weekday + 1) % 7
        const daysSinceSunday = (pythonWeekday + 1) % 7
        
        const weekStart = new Date(expenseDate)
        weekStart.setDate(expenseDate.getDate() - daysSinceSunday)
        const weekKey = weekStart.toISOString().split('T')[0]

        if (weekly_data[weekKey]) {
          weekly_data[weekKey].total_paid += expense.Amt_Paid || 0
        } else {
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekStart.getDate() + 6)
          weekly_data[weekKey] = {
            start_date: weekStart.toISOString().split('T')[0],
            end_date: weekEnd.toISOString().split('T')[0],
            orders: [],
            total_work_pay: 0,
            total_paid: expense.Amt_Paid || 0,
            order_count: 0
          }
        }
      }

      // Calculate totals and format response - matching backend exactly
      let total_orders = 0
      let total_work_pay = 0
      let total_paid = 0
      const weeks_list = []
      
      for (const [weekKey, data] of Object.entries(weekly_data)) {
        total_orders += data.order_count
        total_work_pay += data.total_work_pay
        total_paid += data.total_paid

        weeks_list.push({
          week_period: `${data.start_date} to ${data.end_date}`,
          order_count: data.order_count,
          total_work_pay: Math.round(data.total_work_pay * 100) / 100,
          total_paid: Math.round(data.total_paid * 100) / 100,
          remaining: Math.round((data.total_work_pay - data.total_paid) * 100) / 100,
          orders: data.orders
        })
      }

      // Sort by week_period in reverse order (newest first) - matching backend
      weeks_list.sort((a, b) => b.week_period.localeCompare(a.week_period))

      const result = {
        worker_name: worker.name,
        total_summary: {
          total_orders: total_orders,
          total_work_pay: Math.round(total_work_pay * 100) / 100,
          total_paid: Math.round(total_paid * 100) / 100,
          total_remaining: Math.round((total_work_pay - total_paid) * 100) / 100
        },
        weekly_data: weeks_list
      }
      
      return result
    } else {
      // Get all workers' weekly pay (original functionality)
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('*')
    
    if (workersError) throw workersError

    const weeklyData = {}
    
    for (const worker of workers) {
        // Get order-worker associations for this worker
      const { data: associations } = await supabase
        .from('order_worker_association')
          .select('order_id')
        .eq('worker_id', worker.id)

        // Get the order IDs
        const orderIds = associations?.map(assoc => assoc.order_id) || []

        // Get the actual orders
        let orders = []
        if (orderIds.length > 0) {
          const { data: ordersData } = await supabase
            .from('orders')
            .select('*')
            .in('id', orderIds)
          
          orders = ordersData || []
        }

      // Get expenses for this worker
      const { data: expenses } = await supabase
        .from('Worker_Expense')
        .select('*')
        .eq('worker_id', worker.id)

      // Process weekly data (simplified version)
      weeklyData[worker.id] = {
        worker: worker,
          orders: orders,
        expenses: expenses || [],
          total_work_pay: orders.reduce((sum, order) => sum + (order.Work_pay || 0), 0),
          total_paid: (expenses || []).reduce((sum, e) => sum + (e.Amt_Paid || 0), 0)
      }
    }

    return weeklyData
    }
  },

  // New Bill API (replaces route1.py)
  async createNewBill(billData) {
    const { data, error } = await supabase
      .from('bills')
      .insert(billData)
      .select()
    
    if (error) throw error
    return data
  },

  // Create Order API (new function for NewBillScreen)
  async createOrder(orderData) {
    try {
      // Create the order directly - multiple orders per bill are allowed for individual garments
      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
      
      if (error) {
        console.error('Error creating order:', error);
        // If it's a duplicate key error, try to get the next available ID
        if (error.code === '23505') {
          console.log('Duplicate key error detected, trying to resolve...');
          // Get the maximum ID and try again
          const { data: maxIdResult } = await supabase
            .from('orders')
            .select('id')
            .order('id', { ascending: false })
            .limit(1)
          
          if (maxIdResult && maxIdResult.length > 0) {
            console.log('Max order ID found:', maxIdResult[0].id);
            // The sequence should be reset, but for now, let's just return an error
            throw new Error('Order creation failed due to ID conflict. Please try again.');
          }
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in createOrder:', error);
      throw error;
    }
  },

  // Order Status Update API (replaces route4.py)
  async updateOrderStatus(orderId, status) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
    
    if (error) throw error
    return data
  },

  // Get all orders for a specific bill
  async getOrdersByBillId(billId) {
    try {
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('bill_id', billId)
        .order('order_date', { ascending: false })
      
      if (ordersError) throw ordersError

      // Get the bill information
      const { data: bill, error: billError } = await supabase
        .from('bills')
        .select('*')
        .eq('id', billId)
        .single()
      
      if (billError) throw billError

      return {
        orders: orders || [],
        bill: bill
      }
    } catch (error) {
      console.error('Error getting orders by bill ID:', error)
      throw error
    }
  },

  // Payment Mode Update API (replaces route6.py)
  async updatePaymentMode(orderId, paymentMode) {
    const { data, error } = await supabase
      .from('orders')
      .update({ payment_mode: paymentMode })
      .eq('id', orderId)
      .select()
    
    if (error) throw error
    return data
  },

  // Payment Status Update API (new function)
  async updatePaymentStatus(orderId, paymentStatus) {
    const { data, error } = await supabase
      .from('orders')
      .update({ payment_status: paymentStatus })
      .eq('id', orderId)
      .select()
    
    if (error) throw error
    return data
  },

  // Update Order Total Amount API (new function)
  async updateOrderTotalAmount(orderId, totalAmount) {
    const { data, error } = await supabase
      .from('orders')
      .update({ total_amt: totalAmount })
      .eq('id', orderId)
      .select()
    
    if (error) throw error
    return data
  },

  // Update Payment Amount API (new function)
  async updatePaymentAmount(orderId, paymentAmount) {
    const { data, error } = await supabase
      .from('orders')
      .update({ payment_amount: paymentAmount })
      .eq('id', orderId)
      .select()
    
    if (error) throw error
    return data
  },

  // Assign Workers to Order API (replaces route10.py)
  async assignWorkersToOrder(orderId, workerIds) {
    // First, remove existing assignments
    await supabase
      .from('order_worker_association')
      .delete()
      .eq('order_id', orderId)

    // Then add new assignments
    const assignments = workerIds.map(workerId => ({
      order_id: orderId,
      worker_id: workerId
    }))

    const { data, error } = await supabase
      .from('order_worker_association')
      .insert(assignments)
      .select()
    
    if (error) throw error

    // Calculate total work pay
    const { data: workers } = await supabase
      .from('workers')
      .select('*')
      .in('id', workerIds)

    const totalWorkPay = workers?.reduce((sum, worker) => sum + (worker.Rate || 0), 0) || 0

    // Update order with work pay
    await supabase
      .from('orders')
      .update({ Work_pay: totalWorkPay })
      .eq('id', orderId)

    return { success: true, work_pay: totalWorkPay }
  },

  // Daily Profit API (replaces route18.py)
  async calculateProfit(date = null) {
    let ordersQuery = supabase.from('orders').select('*')
    let expensesQuery = supabase.from('Daily_Expenses').select('*')
    let workerExpensesQuery = supabase.from('Worker_Expense').select('*')

    if (date) {
      ordersQuery = ordersQuery.eq('updated_at::date', date)
      expensesQuery = expensesQuery.eq('Date', date)
      workerExpensesQuery = workerExpensesQuery.eq('date', date)
    }

    const [orders, expenses, workerExpenses] = await Promise.all([
      ordersQuery,
      expensesQuery,
      workerExpensesQuery
    ])

    const totalRevenue = orders.data?.filter(o => o.payment_status?.toLowerCase() === 'paid')
      .reduce((sum, o) => sum + (o.total_amt || 0), 0) || 0

    const totalDailyExpenses = expenses.data?.reduce((sum, e) => 
      sum + (e.material_cost || 0) + (e.miscellaneous_Cost || 0) + (e.chai_pani_cost || 0), 0) || 0

    const totalWorkerExpenses = workerExpenses.data?.reduce((sum, e) => 
      sum + (e.Amt_Paid || 0), 0) || 0

    return {
      date: date || 'All Time',
      total_revenue: Math.round(totalRevenue * 100) / 100,
      daily_expenses: Math.round(totalDailyExpenses * 100) / 100,
      worker_expenses: Math.round(totalWorkerExpenses * 100) / 100,
      net_profit: Math.round((totalRevenue - (totalDailyExpenses + totalWorkerExpenses)) * 100) / 100
    }
  },

  // Bill Number Management
  async getCurrentBillNumber() {
    const { data, error } = await supabase
      .from('billno')
      .select('billno, id')
      .order('id', { ascending: false })
      .limit(1)
      .single();
    if (error) throw error;
    if (!data) throw new Error('No billno row found');
    return data; // { billno, id }
  },

  async incrementBillNumber(id, currentBillno) {
    const { error } = await supabase
      .from('billno')
      .update({ billno: currentBillno + 1 })
      .eq('id', id);
    if (error) throw error;
  },

  // Get measurements by mobile number
  async getMeasurementsByMobileNumber(mobileNumber) {
    try {
      const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .eq('phone_number', mobileNumber)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }
      
      return data; // Will be null if no measurements found
    } catch (error) {
      console.error('Error fetching measurements by mobile number:', error);
      throw error;
    }
  },

  // Get highest bill number from orders table
  async getHighestBillNumber() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('billnumberinput2')
        .not('billnumberinput2', 'is', null)
        .order('billnumberinput2', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }
      
      return data ? Number(data.billnumberinput2) : 0;
    } catch (error) {
      console.error('Error getting highest bill number:', error);
      return 0; // Return 0 if no bill numbers found or error occurs
    }
  }
}
