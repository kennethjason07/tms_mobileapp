// Test script to debug payment API issues for latest entries
// Run this with: node test_payment_api.js

const fetch = require('node-fetch'); // You may need to install: npm install node-fetch

const API_BASE = 'http://127.0.0.1:5000';

async function testPaymentAPI() {
    console.log('🔍 Testing Payment API for Latest Entries...\n');
    
    try {
        // Step 1: Get all orders to find recent ones
        console.log('1. Fetching all orders...');
        const ordersResponse = await fetch(`${API_BASE}/api/orders`);
        const ordersData = await ordersResponse.json();
        
        if (!ordersResponse.ok) {
            throw new Error(`Failed to fetch orders: ${JSON.stringify(ordersData)}`);
        }
        
        // Extract all orders into a flat array
        let allOrders = [];
        for (const deliveryDate in ordersData) {
            ordersData[deliveryDate].forEach(order => {
                allOrders.push({ ...order, deliveryDate });
            });
        }
        
        // Sort by ID to get latest orders
        allOrders.sort((a, b) => b.id - a.id);
        
        console.log(`✅ Found ${allOrders.length} total orders`);
        console.log('📋 Latest 5 orders:');
        allOrders.slice(0, 5).forEach(order => {
            console.log(`  - Order ID: ${order.id}, Bill: ${order.billnumberinput2}, Status: ${order.payment_status}`);
        });
        
        // Step 2: Test payment status update on the latest order
        const latestOrder = allOrders[0];
        if (!latestOrder) {
            console.log('❌ No orders found to test');
            return;
        }
        
        console.log(`\n2. Testing payment status update for Order ID: ${latestOrder.id}`);
        console.log(`   Current payment status: ${latestOrder.payment_status}`);
        
        // Try to update payment status to 'paid'
        const newStatus = latestOrder.payment_status === 'paid' ? 'pending' : 'paid';
        console.log(`   Attempting to change status to: ${newStatus}`);
        
        const updateResponse = await fetch(`${API_BASE}/api/orders/${latestOrder.id}/payment-status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ payment_status: newStatus })
        });
        
        const updateResult = await updateResponse.json();
        
        if (updateResponse.ok) {
            console.log(`✅ Payment status update successful: ${updateResult.message}`);
            
            // Step 3: Verify the update by fetching the order again
            console.log('\n3. Verifying the update...');
            const verifyResponse = await fetch(`${API_BASE}/api/orders`);
            const verifyData = await verifyResponse.json();
            
            // Find the updated order
            let updatedOrder = null;
            for (const deliveryDate in verifyData) {
                const found = verifyData[deliveryDate].find(order => order.id === latestOrder.id);
                if (found) {
                    updatedOrder = found;
                    break;
                }
            }
            
            if (updatedOrder) {
                console.log(`✅ Verification successful: Payment status is now '${updatedOrder.payment_status}'`);
                if (updatedOrder.payment_status === newStatus) {
                    console.log('🎉 Payment API is working correctly for latest entries!');
                } else {
                    console.log('⚠️ Status did not update as expected');
                }
            } else {
                console.log('❌ Could not find updated order for verification');
            }
            
        } else {
            console.log(`❌ Payment status update failed: ${updateResult.error || JSON.stringify(updateResult)}`);
        }
        
    } catch (error) {
        console.log(`❌ Test failed with error: ${error.message}`);
        
        // Additional debugging info
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Troubleshooting suggestions:');
            console.log('   1. Make sure the Flask server is running on port 5000');
            console.log('   2. Check if the server started successfully without errors');
            console.log('   3. Verify the database connection is working');
        }
    }
}

// Run the test
testPaymentAPI();
