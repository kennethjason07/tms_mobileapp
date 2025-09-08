# TMS PDF Generation System Documentation

## Overview
The TMS (Tailoring Management System) includes a comprehensive PDF generation system for creating professional bills and measurement sheets. The system uses React Native with expo-print and expo-sharing libraries to generate PDFs from HTML templates.

## Table of Contents
1. [Main PDF Generation Functions](#main-pdf-generation-functions)
2. [Bill PDF Generation](#bill-pdf-generation)
3. [Measurement PDF Generation](#measurement-pdf-generation)
4. [PDF Formatting and Styling](#pdf-formatting-and-styling)
5. [Error Handling](#error-handling)
6. [Usage Examples](#usage-examples)

---

## Main PDF Generation Functions

### 1. Handle Print Measurement Function

```javascript
const handlePrintMeasurement = async () => {
  try {
    const html = generateMeasurementHTML(billData, measurements);
    const result = await Print.printToFileAsync({ html });
    
    if (result && result.uri) {
      await Sharing.shareAsync(result.uri);
    } else {
      Alert.alert('Error', 'Failed to generate PDF file');
      console.error('Print result:', result);
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to generate or share measurement PDF');
    console.error('Print error:', error);
  }
};
```

### 2. Handle Print Bill Function

```javascript
const handlePrintBill = async () => {
  try {
    // Web: use pre-printed template printer if available
    if (typeof window !== 'undefined') {
      try {
        if (typeof window.printPreprintedBill === 'function') {
          console.log('Using pre-printed bill template for printing');
          window.printPreprintedBill();
          return;
        }
        if (typeof window.enhancedSaveAndPrint === 'function') {
          console.log('Using enhancedSaveAndPrint fallback');
          window.enhancedSaveAndPrint();
          return;
        }
      } catch (webPrintErr) {
        console.warn('Web print path failed, falling back to RN print:', webPrintErr);
      }
    }

    // Use current bill number or generate one if not available
    let orderNumber = billData.billnumberinput2;
    if (!orderNumber) {
      try {
        const billNumber = await generateBillNumber();
        orderNumber = billNumber;
      } catch (genError) {
        console.error('Error generating bill number:', genError);
        orderNumber = 'TEMP_' + Date.now(); // Fallback order number
      }
    }
    
    console.log('Generating bill HTML for order:', orderNumber);
    const html = generateBillHTML(billData, itemizedBill, orderNumber);
    console.log('HTML generated, calling Print.printToFileAsync');
    const result = await Print.printToFileAsync({ html });
    console.log('Print result:', result);
    
    if (result && result.uri) {
      console.log('PDF generated successfully, sharing:', result.uri);
      await Sharing.shareAsync(result.uri);
    } else {
      Alert.alert('Error', 'Failed to generate bill PDF file');
      console.error('Print result is undefined or missing uri:', result);
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to generate or share bill PDF');
    console.error('Print error:', error);
  }
};
```

---

## Bill PDF Generation

### Complete Bill HTML Generation Function

```javascript
const generateBillHTML = (billData, itemizedBill, orderNumber) => {
  const totalAmount = parseFloat(itemizedBill.suit_amount || 0) + 
                     parseFloat(itemizedBill.safari_amount || 0) + 
                     parseFloat(itemizedBill.pant_amount || 0) + 
                     parseFloat(itemizedBill.shirt_amount || 0);
  const advanceAmount = parseFloat(billData.payment_amount || 0);
  const remainingAmount = totalAmount - advanceAmount;
  
  return `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
          }
          .bill-container {
            max-width: 400px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
            margin-bottom: 15px;
          }
          .shop-name {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin: 0;
          }
          .shop-subtitle {
            font-size: 16px;
            color: #ff6600;
            margin: 5px 0;
          }
          .shop-address {
            font-size: 12px;
            color: #666;
            margin: 5px 0;
          }
          .shop-contact {
            font-size: 12px;
            color: #666;
            margin: 5px 0;
          }
          .bill-info {
            display: flex;
            justify-content: space-between;
            margin: 15px 0;
            font-size: 14px;
          }
          .customer-info {
            margin: 15px 0;
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 5px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            font-size: 14px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          .items-table th {
            background: #333;
            color: white;
            padding: 10px 5px;
            text-align: center;
            font-size: 14px;
          }
          .items-table td {
            padding: 8px 5px;
            border-bottom: 1px solid #ddd;
            font-size: 14px;
          }
          .total-section {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 2px solid #333;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            font-size: 14px;
          }
          .total-amount {
            font-weight: bold;
            font-size: 16px;
          }
          .terms {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 11px;
            color: #666;
          }
          .terms h4 {
            margin: 0 0 10px 0;
            color: #ff6600;
            font-size: 13px;
          }
          .terms ul {
            margin: 5px 0;
            padding-left: 15px;
          }
          .terms li {
            margin: 3px 0;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 14px;
            font-weight: bold;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="bill-container">
          <div class="header">
            <h1 class="shop-name">Yak's Men's Wear</h1>
            <p class="shop-subtitle">Prop : Jaganath Sidda</p>
            <p class="shop-address">Sulgunte Complex, Opp. Old Service Stand, Near SBI Bank, BIDAR-585 401 (K.S.)</p>
            <p class="shop-contact">Shop : 8660897168 &nbsp;&nbsp; 9448678033</p>
          </div>
          
          <div class="bill-info">
            <div><strong>Date:</strong> \${billData.order_date || new Date().toISOString().split('T')[0]}</div>
            <div><strong>No:</strong> \${orderNumber || billData.billnumberinput2 || '---'}</div>
          </div>
          
          <div class="customer-info">
            <div class="info-row">
              <span><strong>Name:</strong></span>
              <span>\${billData.customer_name || '---'}</span>
            </div>
            <div class="info-row">
              <span><strong>Order No:</strong></span>
              <span>\${orderNumber || billData.billnumberinput2 || '---'}</span>
            </div>
            <div class="info-row">
              <span><strong>Date:</strong></span>
              <span>\${billData.order_date || '---'}</span>
            </div>
            <div class="info-row">
              <span><strong>Cell:</strong></span>
              <span>\${billData.mobile_number || '---'}</span>
            </div>
            <div class="info-row">
              <span><strong>D. Date:</strong></span>
              <span>\${billData.due_date || '---'}</span>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th style="text-align: left;">PARTICULARS</th>
                <th>QTY.</th>
                <th>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              \${generateBillItemsTable(itemizedBill)}
            </tbody>
          </table>
          
          <div class="total-section">
            <div class="total-row">
              <span><strong>TOTAL</strong></span>
              <span class="total-amount">₹\${totalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <div style="text-align: center; margin: 15px 0; font-size: 12px; color: #666;">
            Good Service<br>
            Prompt Delivery
          </div>
          
          <div class="terms">
            <h4>Terms & Conditions :</h4>
            <ul>
              <li>1. Delivery will not made without <strong>Receipt</strong></li>
              <li>2. We are not responsible, if the delivery is not taken within <strong>2 months.</strong></li>
              <li>3. Trial and Complaint after <strong>7pm &</strong></li>
              <li><strong>Delivery after 7pm</strong></li>
            </ul>
          </div>
          
          <div class="footer">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>Thank You, Visit Again</span>
              <span style="border: 1px solid #333; padding: 5px 15px; background: #fff;">Sunday Holiday</span>
              <span>Signature</span>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};
```

### Bill Items Table Generation

```javascript
function generateBillItemsTable(itemizedBill) {
  const items = [
    { name: 'Suit', qty: itemizedBill.suit_qty, amount: itemizedBill.suit_amount },
    { name: 'Safari/Jacket', qty: itemizedBill.safari_qty, amount: itemizedBill.safari_amount },
    { name: 'Pant', qty: itemizedBill.pant_qty, amount: itemizedBill.pant_amount },
    { name: 'Shirt', qty: itemizedBill.shirt_qty, amount: itemizedBill.shirt_amount }
  ];
  
  const rows = items
    .filter(item => parseFloat(item.qty) > 0 || parseFloat(item.amount) > 0)
    .map(item => `
      <tr>
        <td style="text-align: left;">\${item.name}</td>
        <td style="text-align: center;">\${item.qty || '0'}</td>
        <td style="text-align: right;">₹\${parseFloat(item.amount || 0).toFixed(2)}</td>
      </tr>
    `).join('');
    
  if (rows === '') {
    return '<tr><td colspan="3" style="text-align: center;">No items added</td></tr>';
  }
  
  return rows;
}
```

---

## Measurement PDF Generation

### Measurement HTML Generation Function

```javascript
const generateMeasurementHTML = (billData, measurements) => `
  <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .header { text-align: center; }
        .info-table, .measure-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        .info-table td { padding: 4px 8px; }
        .measure-table th, .measure-table td { border: 1px solid #333; padding: 8px; text-align: left; }
        .measure-table th { background: #eee; }
        .footer { text-align: center; margin-top: 24px; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>Yak's Men's Wear</h2>
        <div>Customer Measurement Sheet</div>
      </div>
      <table class="info-table">
        <tr>
          <td><b>Customer Name:</b> \${billData.customer_name}</td>
          <td><b>Mobile Number:</b> \${billData.mobile_number}</td>
        </tr>
        <tr>
          <td><b>Date:</b> \${billData.order_date}</td>
          <td><b>Delivery Date:</b> \${billData.due_date}</td>
        </tr>
      </table>
      <h3>All Measurements</h3>
      <table class="measure-table">
        <tr>
          <th>Measurement</th>
          <th>Value</th>
        </tr>
        \${generateAllMeasurementsTable(measurements)}
      </table>
      <div class="footer">
        Thank You, Visit Again!
      </div>
    </body>
  </html>
`;
```

### Measurements Table Generation

```javascript
function generateAllMeasurementsTable(measurements) {
  const labelize = (key) =>
    key
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  
  const entries = Object.entries(measurements).filter(
    ([, value]) => value !== '' && value !== null && value !== undefined
  );
  
  if (entries.length === 0) return '<tr><td colspan="2">No measurements entered.</td></tr>';
  
  return entries
    .map(
      ([key, value]) =>
        `<tr><td>\${labelize(key)}</td><td>\${value}</td></tr>`
    )
    .join('');
}
```

---

## PDF Formatting and Styling

### Bill Format Structure

#### 1. Header Section
- **Shop Name**: "Yak's Men's Wear" (24px, bold, #333)
- **Proprietor**: "Prop : Jaganath Sidda" (16px, #ff6600)
- **Address**: Complete business address (12px, #666)
- **Contact**: Phone numbers (12px, #666)

#### 2. Bill Information
- **Date**: Order/issue date
- **Bill Number**: Unique order number

#### 3. Customer Information Section
- **Name**: Customer full name
- **Order No**: Bill reference number
- **Date**: Order date
- **Cell**: Customer mobile number
- **Delivery Date**: Expected completion date

#### 4. Items Table
- **Headers**: PARTICULARS, QTY., AMOUNT
- **Styling**: Dark header (#333 background, white text)
- **Items**: Suit, Safari/Jacket, Pant, Shirt, Sadri
- **Formatting**: Left-aligned names, centered quantities, right-aligned amounts

#### 5. Total Section
- **Bold Total**: Grand total with ₹ symbol
- **Prominent styling**: Larger font, bold weight

#### 6. Service Message
- **Good Service**
- **Prompt Delivery**

#### 7. Terms & Conditions
- **Delivery Policy**: Receipt required
- **Responsibility**: 2-month limit
- **Operating Hours**: After 7pm restrictions

#### 8. Footer
- **Thank You Message**
- **Sunday Holiday Notice**
- **Signature Space**

### Measurement Sheet Format Structure

#### 1. Header
- **Shop Name**: "Yak's Men's Wear"
- **Document Type**: "Customer Measurement Sheet"

#### 2. Customer Information Table
- **Customer Name** and **Mobile Number**
- **Date** and **Delivery Date**

#### 3. Measurements Table
- **Two-column format**: Measurement | Value
- **Bordered table**: All measurements with values
- **Dynamic labeling**: Converts field names to readable labels

#### 4. Footer
- **Thank you message**

### CSS Styling Features

#### Typography
```css
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
  background: #f5f5f5;
}
```

#### Container Styling
```css
.bill-container {
  max-width: 400px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
}
```

#### Color Scheme
- **Primary Text**: #333 (dark gray)
- **Accent Color**: #ff6600 (orange)
- **Light Text**: #666 (medium gray)
- **Background**: #f5f5f5 (light gray)
- **White**: #fff (pure white)

#### Layout Features
- **Flexbox**: For proper alignment
- **Border Management**: Strategic borders for sections
- **Spacing**: Consistent margins and padding
- **Responsive Width**: 400px max-width for receipt format

---

## Error Handling

### PDF Generation Error Handling

```javascript
// Measurement PDF Error Handling
try {
  const html = generateMeasurementHTML(billData, measurements);
  const result = await Print.printToFileAsync({ html });
  
  if (result && result.uri) {
    await Sharing.shareAsync(result.uri);
  } else {
    Alert.alert('Error', 'Failed to generate PDF file');
    console.error('Print result:', result);
  }
} catch (error) {
  Alert.alert('Error', 'Failed to generate or share measurement PDF');
  console.error('Print error:', error);
}

// Bill PDF Error Handling
try {
  // Web fallback handling
  if (typeof window !== 'undefined') {
    // Try web-specific print functions first
  }
  
  // Generate order number with fallback
  let orderNumber = billData.billnumberinput2;
  if (!orderNumber) {
    orderNumber = 'TEMP_' + Date.now();
  }
  
  const html = generateBillHTML(billData, itemizedBill, orderNumber);
  const result = await Print.printToFileAsync({ html });
  
  if (result && result.uri) {
    await Sharing.shareAsync(result.uri);
  } else {
    Alert.alert('Error', 'Failed to generate bill PDF file');
  }
} catch (error) {
  Alert.alert('Error', 'Failed to generate or share bill PDF');
  console.error('Print error:', error);
}
```

### Common Error Scenarios

1. **Missing Bill Number**: Fallback to temporary number
2. **Web Platform Issues**: Multiple fallback printing methods
3. **PDF Generation Failure**: User-friendly error messages
4. **Sharing Failure**: Specific error alerts
5. **Empty Data**: Graceful handling with default values

---

## Usage Examples

### Integration in React Component

```javascript
// Import required libraries
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// In your component
const [billData, setBillData] = useState({
  customer_name: 'John Doe',
  mobile_number: '9876543210',
  order_date: '2024-01-15',
  due_date: '2024-01-25'
});

const [itemizedBill, setItemizedBill] = useState({
  suit_qty: '1',
  suit_amount: '2500',
  shirt_qty: '2',
  shirt_amount: '1200'
});

// Generate and share bill
const handlePrintBill = async () => {
  const orderNumber = await generateBillNumber();
  const html = generateBillHTML(billData, itemizedBill, orderNumber);
  const result = await Print.printToFileAsync({ html });
  if (result?.uri) {
    await Sharing.shareAsync(result.uri);
  }
};

// Generate and share measurements
const handlePrintMeasurements = async () => {
  const html = generateMeasurementHTML(billData, measurements);
  const result = await Print.printToFileAsync({ html });
  if (result?.uri) {
    await Sharing.shareAsync(result.uri);
  }
};
```

### Button Implementation

```javascript
// Action buttons in UI
<TouchableOpacity
  style={styles.printButton}
  onPress={handlePrintMeasurements}
>
  <Text style={styles.buttonText}>Print Measurements</Text>
</TouchableOpacity>

<TouchableOpacity
  style={styles.saveButton}
  onPress={async () => {
    const saved = await handleSaveBill();
    if (saved) {
      await handlePrintBill();
    }
  }}
>
  <Text style={styles.buttonText}>Save and Print</Text>
</TouchableOpacity>
```

---

## Dependencies

### Required Libraries

```json
{
  "expo-print": "^12.0.0",
  "expo-sharing": "^11.0.0",
  "@react-native-async-storage/async-storage": "^1.19.0",
  "react-native": "^0.72.0"
}
```

### Installation Commands

```bash
# Install PDF generation dependencies
npm install expo-print expo-sharing

# For Expo CLI projects
expo install expo-print expo-sharing

# For React Native CLI projects
npm install expo-print expo-sharing
cd ios && pod install
```

---

## Platform Compatibility

### Supported Platforms
- ✅ **iOS**: Full support with native printing
- ✅ **Android**: Full support with native sharing
- ✅ **Web**: Fallback to web printing APIs
- ❌ **Windows**: Limited support
- ❌ **macOS**: Limited support

### Web Platform Considerations
- Uses browser's print dialog
- Fallback to enhanced print functions
- HTML-to-PDF conversion in browser

---

## Performance Considerations

### Optimization Tips

1. **HTML Template Caching**: Pre-generate common HTML structures
2. **Image Optimization**: Use optimized logos and images
3. **CSS Minification**: Minimize CSS in production
4. **Error Boundaries**: Wrap PDF generation in error boundaries
5. **Loading States**: Show loading indicators during generation

### Memory Management

```javascript
// Clean up resources after PDF generation
const generatePDF = async () => {
  let html = null;
  let result = null;
  
  try {
    html = generateBillHTML(billData, itemizedBill, orderNumber);
    result = await Print.printToFileAsync({ html });
    
    if (result?.uri) {
      await Sharing.shareAsync(result.uri);
    }
  } finally {
    // Clean up
    html = null;
    result = null;
  }
};
```

---

## Future Enhancements

### Planned Features
1. **Custom Templates**: User-defined bill templates
2. **Multi-language Support**: Regional language support
3. **Logo Upload**: Custom shop logo integration
4. **Print Settings**: Paper size and orientation options
5. **Batch Printing**: Multiple bills at once
6. **Email Integration**: Direct email PDF functionality
7. **Cloud Storage**: Save PDFs to cloud services

### Technical Improvements
1. **Template Engine**: More flexible templating system
2. **CSS Framework**: Better responsive design
3. **Print Preview**: Live preview before generation
4. **Compression**: Smaller PDF file sizes
5. **Encryption**: Password-protected PDFs

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: PDF Not Generating
```javascript
// Solution: Check Print library installation
import * as Print from 'expo-print';

// Verify Print is available
if (Print.printToFileAsync) {
  console.log('Print library is available');
} else {
  console.error('Print library not found');
}
```

#### Issue: Sharing Not Working
```javascript
// Solution: Check platform support
import * as Sharing from 'expo-sharing';

const isAvailable = await Sharing.isAvailableAsync();
if (isAvailable) {
  await Sharing.shareAsync(result.uri);
} else {
  // Fallback to other sharing methods
  console.log('Sharing not available on this platform');
}
```

#### Issue: HTML Rendering Problems
```javascript
// Solution: Validate HTML structure
const validateHTML = (html) => {
  // Check for unclosed tags
  const openTags = (html.match(/</g) || []).length;
  const closeTags = (html.match(/>/g) || []).length;
  
  if (openTags !== closeTags) {
    console.warn('HTML structure may be invalid');
  }
  
  return html;
};
```

---

## Conclusion

The TMS PDF Generation System provides a comprehensive solution for creating professional bills and measurement sheets. With robust error handling, responsive design, and multi-platform support, it serves as a complete document generation solution for tailoring businesses.

The system's modular design allows for easy customization and extension, making it suitable for various business requirements while maintaining high-quality output standards.
