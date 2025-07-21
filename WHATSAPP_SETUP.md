# WhatsApp Notification Setup Guide

This guide will help you set up the Meta AI WhatsApp API to send automatic notifications when orders are completed.

## 🚀 Features Added

- **Automatic WhatsApp Notifications**: When all orders for a bill are marked as "completed", the system automatically sends a WhatsApp message to the customer
- **Customer Information Retrieval**: Fetches customer name and mobile number from the bills table
- **Order Details**: Includes order details in the notification message
- **Configuration Screen**: Easy-to-use setup screen for API credentials

## 📱 Meta AI WhatsApp API Setup

### Step 1: Create Meta Developer Account

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Sign in with your Facebook account
3. Create a new app or use an existing one
4. Add the "WhatsApp" product to your app

### Step 2: Get Your Phone Number ID

1. In your Meta app dashboard, go to **WhatsApp > Getting Started**
2. Note down your **Phone Number ID** (this is a long number)
3. This will be used in the API URL

### Step 3: Generate Access Token

1. Go to **System Users** in your app dashboard
2. Create a new system user with admin role
3. Generate a token with the following permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
4. Copy the generated token (keep it secure!)

### Step 4: Configure Webhook (Optional)

For two-way messaging capabilities:

1. Set up a webhook URL for message delivery
2. Verify the webhook with Meta
3. This enables receiving messages from customers

### Step 5: Configure in the App

1. Open the TMS app
2. Go to **Orders Overview** screen
3. Tap the WhatsApp icon (💬) in the header
4. Enter your credentials:
   - **Phone Number ID**: Your Meta Phone Number ID
   - **Access Token**: Your generated access token
5. Click "Test Connection" to verify setup
6. Click "Save Credentials" to store them

## 🔧 How It Works

### Automatic Notification Trigger

When you mark an order as "completed" in the Orders Overview:

1. The system checks if ALL orders for that bill are completed
2. If yes, it fetches customer information from the bills table
3. Generates a personalized WhatsApp message
4. Sends the notification to the customer's mobile number

### Message Format

```
🎉 Order Completed!

Dear [Customer Name],

Your order (Bill #[Bill Number]) has been completed and is ready for delivery!

Order Details:
• [Garment Type]: [Quantity] piece(s)
• [Garment Type]: [Quantity] piece(s)

Please visit our shop to collect your order.

Thank you for choosing our services!

Best regards,
Your Tailor Shop
```

## 📋 Requirements

### Meta WhatsApp Business API Requirements

- **Business Account**: You need a WhatsApp Business account
- **Verified Business**: Your business should be verified by Meta
- **Phone Number**: A dedicated phone number for WhatsApp Business
- **API Access**: Proper API permissions and tokens

### App Requirements

- **Internet Connection**: Required for API calls
- **Valid Credentials**: Properly configured Phone Number ID and Access Token
- **Customer Data**: Customer mobile numbers must be stored in the bills table

## 🛠️ Troubleshooting

### Common Issues

1. **"WhatsApp API Error"**
   - Check your Phone Number ID and Access Token
   - Ensure your Meta app has WhatsApp product enabled
   - Verify your business account is active

2. **"No mobile number found"**
   - Ensure customer mobile numbers are stored in the bills table
   - Check the mobile number format (should be 10 digits for India)

3. **"Connection failed"**
   - Verify your internet connection
   - Check if Meta's servers are accessible
   - Ensure your API credentials are correct

### Testing the Setup

1. **Test Connection**: Use the "Test Connection" button in the configuration screen
2. **Test Notification**: Mark all orders for a bill as completed
3. **Check Logs**: Monitor console logs for any errors

## 🔒 Security Considerations

### API Token Security

- **Never share your access token** publicly
- **Rotate tokens regularly** for security
- **Use environment variables** in production
- **Monitor API usage** to prevent abuse

### Data Privacy

- **Customer consent**: Ensure customers have agreed to receive WhatsApp notifications
- **Data protection**: Follow local data protection laws
- **Opt-out mechanism**: Provide customers a way to opt out

## 📞 Support

### Meta Developer Support

- **Documentation**: [Meta WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- **Community**: [Meta Developer Community](https://developers.facebook.com/community/)
- **Support**: [Meta Developer Support](https://developers.facebook.com/support/)

### App Support

- **Configuration Issues**: Check the WhatsApp configuration screen
- **API Errors**: Review console logs for detailed error messages
- **Feature Requests**: Contact your development team

## 🎯 Best Practices

### Message Content

- **Keep messages concise** and professional
- **Include relevant order details**
- **Provide clear next steps** for customers
- **Use appropriate emojis** sparingly

### Timing

- **Send during business hours** when possible
- **Avoid spam** - only send when orders are actually completed
- **Respect customer preferences** for communication

### Monitoring

- **Track delivery rates** and success metrics
- **Monitor customer feedback** about notifications
- **Regularly review and update** message templates

## 🔄 Future Enhancements

### Planned Features

- **Custom Message Templates**: Allow customization of notification messages
- **Delivery Status Tracking**: Track if messages were delivered/read
- **Bulk Notifications**: Send notifications to multiple customers
- **Scheduled Messages**: Schedule notifications for specific times
- **Message History**: Keep track of sent notifications

### Integration Possibilities

- **SMS Fallback**: Send SMS if WhatsApp fails
- **Email Notifications**: Send email notifications as backup
- **Push Notifications**: In-app push notifications
- **Voice Calls**: Automated voice call notifications

---

**Note**: This WhatsApp integration requires a Meta Developer account and WhatsApp Business API access. Make sure you comply with Meta's terms of service and local regulations regarding automated messaging. 