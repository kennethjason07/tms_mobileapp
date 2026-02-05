const { SupabaseAPI, supabase } = require('./supabase');

async function verifyProfitLogic() {
  console.log('🚀 STARTING PROFIT LOGIC VERIFICATION...');

  try {
    // 1. Create a test bill with an advance
    console.log('\nStep 1: Creating test bill with ₹500 advance...');
    const testBillId = 999999; 
    const testOrderNumber = 'TEST-' + Date.now();
    
    // Create a dummy order for testing
    const orderData = {
      bill_id: testBillId,
      billnumberinput2: testOrderNumber,
      garment_type: 'Verification Suit',
      total_amt: 2000,
      payment_amount: 500,
      payment_status: 'partial',
      status: 'pending',
      order_date: new Date().toISOString().split('T')[0]
    };

    const orders = await SupabaseAPI.createOrder(orderData);
    const orderId = orders[0].id;
    console.log(`✅ Test order created with ID: ${orderId}`);

    // 2. Verify advance record
    console.log('\nStep 2: Verifying advance record in revenue_tracking...');
    const { data: advanceRecord } = await supabase
      .from('revenue_tracking')
      .select('*')
      .eq('bill_id', testBillId)
      .eq('payment_type', 'advance')
      .single();

    if (advanceRecord && parseFloat(advanceRecord.amount) === 500) {
      console.log('✅ Advance record verified: ₹500');
    } else {
      console.error('❌ Advance record mismatch or not found!', advanceRecord);
    }

    // 3. Mark as paid and verify final payment
    console.log('\nStep 3: Marking order as PAID...');
    await SupabaseAPI.updatePaymentStatus(orderId, 'paid');
    
    const { data: finalRecord } = await supabase
      .from('revenue_tracking')
      .select('*')
      .eq('bill_id', testBillId)
      .eq('payment_type', 'final')
      .single();

    if (finalRecord && parseFloat(finalRecord.amount) === 1500) {
      console.log('✅ Final record verified: ₹1500 (2000 - 500)');
    } else {
      console.error('❌ Final record mismatch or not found!', finalRecord);
    }

    // 4. Check Daily Profit integration
    console.log('\nStep 4: Checking daily profit calculation...');
    const history = await SupabaseAPI.calculateDailyProfitHistory();
    const todayStr = new Date().toISOString().split('T')[0];
    const todayProfit = history.find(h => h.date === todayStr);

    if (todayProfit) {
      console.log(`✅ Today's Revenue in History: ₹${todayProfit.revenue}`);
      console.log(`✅ Today's Net Profit: ₹${todayProfit.netProfit}`);
    } else {
      console.log('ℹ️ No profit record for today (maybe date mismatch with IST?)');
    }

    // cleanup (optional)
    // await supabase.from('revenue_tracking').delete().eq('bill_id', testBillId);
    // await supabase.from('orders').delete().eq('id', orderId);

  } catch (err) {
    console.error('❌ Verification failed with error:', err);
  }
}

// verifyProfitLogic();
console.log('Script ready. Run manually if needed.');
