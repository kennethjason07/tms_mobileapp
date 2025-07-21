// WhatsApp Service for Meta AI WhatsApp API
// This service handles sending WhatsApp notifications when orders are completed

// Use a mutable config object instead of consts
const WhatsAppConfigState = {
  apiUrl: 'https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages',
  token: 'YOUR_WHATSAPP_TOKEN',
};

// Set your test WhatsApp number here (must be a registered tester if in dev mode)
const TEST_WHATSAPP_NUMBER = '+917619107621'; // <-- Replace with your own WhatsApp number

export const WhatsAppService = {
  // Send WhatsApp message using Meta AI WhatsApp API
  async sendWhatsAppMessage(phoneNumber, message) {
    try {
      // Format phone number to international format (add country code if needed)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      
      const response = await fetch(WhatsAppConfigState.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WhatsAppConfigState.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: {
            body: message
          }
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('WhatsApp API Error:', result);
        throw new Error(`WhatsApp API Error: ${result.error?.message || 'Unknown error'}`);
      }

      console.log('WhatsApp message sent successfully:', result);
      return result;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  },

  // Generate completion notification message
  generateCompletionMessage(customerName, billNumber, orderDetails) {
    const message = `🎉 *Order Completed!*

Dear ${customerName},

Your order (Bill #${billNumber}) has been completed and is ready for delivery!

*Order Details:*
${orderDetails}

Please visit our shop to collect your order.

Thank you for choosing our services!

Best regards,
Your Tailor Shop`;

    return message;
  },

  // Check if all orders for a bill are completed
  async checkAllOrdersCompleted(billId, orders) {
    try {
      // Filter orders for this bill
      const billOrders = orders.filter(order => order.bill_id === billId);
      
      if (billOrders.length === 0) {
        return false;
      }

      // Check if all orders are completed
      const allCompleted = billOrders.every(order => 
        order.status?.toLowerCase() === 'completed'
      );

      return allCompleted;
    } catch (error) {
      console.error('Error checking order completion status:', error);
      return false;
    }
  },

  // Get customer information from bill
  getCustomerInfoFromBill(bill) {
    return {
      name: bill?.customer_name || 'Customer',
      mobile: bill?.mobile_number || null
    };
  },

  // Generate order details string
  generateOrderDetailsString(orders) {
    const details = orders.map(order => {
      const garmentType = order.garment_type || 'Unknown';
      const quantity = order.quantity || 1;
      return `• ${garmentType}: ${quantity} piece(s)`;
    }).join('\n');

    return details || '• Order details not available';
  }
};

// Configuration helper
export const WhatsAppConfig = {
  // Set your WhatsApp API credentials
  setCredentials(phoneNumberId, token) {
    WhatsAppConfigState.apiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    WhatsAppConfigState.token = token;
  },

  // Test the connection by sending a test message to your own WhatsApp number
  async testConnection() {
    try {
      // Send a test message to your own WhatsApp (must be a tester if in dev mode)
      const response = await fetch(WhatsAppConfigState.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WhatsAppConfigState.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: TEST_WHATSAPP_NUMBER,
          type: 'text',
          text: { body: 'WhatsApp API connection test.' }
        })
      });

      const result = await response.json();

      if (response.ok) {
        return { success: true, message: 'WhatsApp API connection successful (test message sent)' };
      } else {
        return { success: false, message: `Connection failed: ${result.error?.message || 'Unknown error'}` };
      }
    } catch (error) {
      return { success: false, message: `Connection error: ${error.message}` };
    }
  }
}; 