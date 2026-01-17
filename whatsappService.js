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
Yak's Men's Wear`;

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
  },

  // Format measurements for WhatsApp message
  formatMeasurementsForWhatsApp(measurements) {
    if (!measurements) {
      return '📏 *Measurements:* Not available\n\n';
    }

    const measurementSections = [];

    // Pant measurements
    const pantMeasurements = {
      'Length': measurements.pant_length,
      'Kamar (Waist)': measurements.pant_kamar,
      'Hips': measurements.pant_hips,
      'Waist': measurements.pant_waist,
      'Ghutna (Knee)': measurements.pant_ghutna,
      'Bottom': measurements.pant_bottom,
      'Seat': measurements.pant_seat,
      'Side P Cross': measurements.SideP_Cross,
      'Plates': measurements.Plates,
      'Belt': measurements.Belt,
      'Back P': measurements.Back_P,
      'WP': measurements.WP
    };

    const pantItems = Object.entries(pantMeasurements)
      .filter(([key, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `  • ${key}: ${value}`);

    if (pantItems.length > 0) {
      measurementSections.push('👖 *Pant Measurements:*\n' + pantItems.join('\n'));
    }

    // Shirt measurements
    const shirtMeasurements = {
      'Length': measurements.shirt_length,
      'Body': measurements.shirt_body,
      'Loose': measurements.shirt_loose,
      'Shoulder': measurements.shirt_shoulder,
      'Astin (Sleeve)': measurements.shirt_astin,
      'Collar': measurements.shirt_collar,
      'A Loose': measurements.shirt_aloose,
      'Collar Type': measurements.Callar,
      'Cuff': measurements.Cuff,
      'Pocket': measurements.Pkt,
      'Loose Shirt': measurements.LooseShirt,
      'DT/TT': measurements.DT_TT
    };

    const shirtItems = Object.entries(shirtMeasurements)
      .filter(([key, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `  • ${key}: ${value}`);

    if (shirtItems.length > 0) {
      measurementSections.push('👔 *Shirt Measurements:*\n' + shirtItems.join('\n'));
    }

    // Extra measurements
    if (measurements.extra_measurements && measurements.extra_measurements.trim() !== '') {
      measurementSections.push('📝 *Additional Notes:*\n  • ' + measurements.extra_measurements.trim());
    }

    if (measurementSections.length === 0) {
      return '📏 *Measurements:* Not available\n\n';
    }

    return '📏 *Customer Measurements:*\n\n' + measurementSections.join('\n\n') + '\n\n';
  },

  // Generate worker assignment message with measurements
  generateWorkerAssignmentMessage(customerName, billNumber, garmentType, measurements) {
    const measurementsText = this.formatMeasurementsForWhatsApp(measurements);
    
    const message = `🎯 *New Work Assignment*

Hi! You have been assigned a new order:

📋 *Order Details:*
  • Customer: ${customerName || 'N/A'}
  • Bill Number: #${billNumber || 'N/A'}
  • Garment Type: ${garmentType || 'N/A'}

${measurementsText}Please start working on this order. Thank you!

Best regards,
Your Tailor Shop`;

    return message;
  }
};

// WhatsApp Redirect Service - Opens WhatsApp with pre-filled message
export const WhatsAppRedirectService = {
  // Open WhatsApp with pre-filled message WITH CONFIRMATION POPUP
  openWhatsAppWithMessage(phoneNumber, message, showConfirmation = true) {
    try {
      // Validate phone number first
      if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim() === '') {
        return { success: false, message: 'No WhatsApp number available for this customer' };
      }

      // Format phone number to remove any non-digits and add country code if needed
      let formattedPhone = phoneNumber.replace(/\D/g, ''); // Remove all non-digits
      
      // Validate phone number length and format
      if (formattedPhone.length < 10) {
        return { success: false, message: 'Invalid phone number format' };
      }
      
      // Add country code if not present (assuming India +91)
      if (formattedPhone.length === 10 && /^[6-9]/.test(formattedPhone)) {
        formattedPhone = '91' + formattedPhone;
      } else if (formattedPhone.length === 11 && formattedPhone.startsWith('0')) {
        // Remove leading 0 and add country code
        formattedPhone = '91' + formattedPhone.substring(1);
      } else if (formattedPhone.length === 13 && formattedPhone.startsWith('91')) {
        // Already has country code
        // Keep as is
      } else {
        return { success: false, message: 'Invalid phone number format for WhatsApp' };
      }
      
      // Validate message
      if (!message || message.trim() === '') {
        return { success: false, message: 'No message content to send' };
      }
      
      // Function to actually open WhatsApp
      const openWhatsApp = () => {
        // Encode the message for URL
        const encodedMessage = encodeURIComponent(message);
        
        // Create WhatsApp URL with pre-filled message
        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
        
        // Check if we're in a web environment or React Native
        if (typeof window !== 'undefined' && typeof window.open === 'function') {
          // Web environment - open in new window
          try {
            window.open(whatsappUrl, '_blank');
            return { success: true, message: 'WhatsApp opened successfully in browser' };
          } catch (webError) {
            console.error('Failed to open WhatsApp in web:', webError);
            return { success: false, message: 'Failed to open WhatsApp in browser. Please check if popup blocking is disabled.' };
          }
        } else {
          // React Native environment - use Linking
          try {
            const { Linking } = require('react-native');
            
            // For React Native, we'll use a simpler approach and handle errors
            Linking.openURL(whatsappUrl)
              .then(() => {
                console.log('WhatsApp opened successfully');
              })
              .catch(err => {
                console.error('Failed to open WhatsApp:', err);
                // Don't throw here as it's async
              });
              
            // Return success immediately for React Native as we can't wait for the async result
            return { success: true, message: 'WhatsApp opened successfully' };
          } catch (linkingError) {
            console.error('Linking module error:', linkingError);
            return { success: false, message: 'WhatsApp is not available on this device' };
          }
        }
      };
      
      // If no confirmation needed, open directly
      if (!showConfirmation) {
        return openWhatsApp();
      }
      
      // Show confirmation popup (this needs to be handled by the caller)
      // Return a special response that indicates confirmation is needed
      return {
        success: 'confirmation_needed',
        message: `Open WhatsApp to send completion message to ${phoneNumber}?`,
        phoneNumber: phoneNumber,
        formattedPhone: formattedPhone,
        messageContent: message,
        openWhatsApp: openWhatsApp // Function to call if user confirms
      };
      
    } catch (error) {
      console.error('Error preparing WhatsApp:', error);
      return { success: false, message: `Error preparing WhatsApp: ${error.message}` };
    }
  },

  // Generate WhatsApp URL for sharing
  generateWhatsAppUrl(phoneNumber, message) {
    try {
      let formattedPhone = phoneNumber.replace(/\D/g, '');
      
      if (formattedPhone.length === 10 && formattedPhone.startsWith('9')) {
        formattedPhone = '91' + formattedPhone;
      }
      
      const encodedMessage = encodeURIComponent(message);
      return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    } catch (error) {
      console.error('Error generating WhatsApp URL:', error);
      return null;
    }
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
