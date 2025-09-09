# Fractional Input Component Demo

## 🎯 **Overview**
The FractionalInput component allows users to enter measurements using both decimal numbers and fractions, making it more intuitive for tailoring measurements.

## ✨ **Supported Input Formats**

### **1. Decimal Numbers**
```
35.5    → 35.5 inches
36.75   → 36.75 inches  
42.25   → 42.25 inches
```

### **2. Mixed Numbers (Whole + Fraction)**
```
35 1/2  → 35.5 inches
36 3/4  → 36.75 inches
42 1/4  → 42.25 inches
28 7/8  → 28.875 inches
```

### **3. Pure Fractions**
```
1/2     → 0.5 inches
3/4     → 0.75 inches
1/4     → 0.25 inches  
7/8     → 0.875 inches
```

### **4. Whole Numbers**
```
35      → 35 inches
36      → 36 inches
42      → 42 inches
```

### **5. Text + Fractions (NEW!)**
```
Cross 1/2, Side 3/4     → Text with fractions converted
Belt 1 1/2              → Belt 1.5
Regular, Cut Away 1/4   → Text with fraction
French, Button 1/2      → French, Button 0.5
2 Plates 1/4            → 2 Plates 0.25
Fitted, Loose 1 1/2     → Fitted, Loose 1.5
```

## 🧵 **Common Tailoring Measurements**

### **Pant Measurements Examples**
- **Length**: `42 1/2` or `42.5`
- **Waist**: `32 3/4` or `32.75`
- **Hip**: `38 1/4` or `38.25`
- **Thigh**: `22 1/2` or `22.5`
- **Bottom**: `16 3/4` or `16.75`

### **Shirt Measurements Examples**
- **Length**: `28 1/2` or `28.5`
- **Chest**: `40 3/4` or `40.75`
- **Shoulder**: `18 1/4` or `18.25`
- **Sleeve**: `24 7/8` or `24.875`
- **Collar**: `15 1/2` or `15.5`

## 🔧 **Implementation Details**

### **Component Features**
- ✅ Accepts both fraction and decimal input
- ✅ Converts all input to decimal for storage
- ✅ Preserves user's input format while typing
- ✅ Validates input and prevents invalid fractions
- ✅ Shows decimal equivalent (optional)
- ✅ Handles common fractions (1/2, 1/4, 3/4, 1/8, 3/8, 5/8, 7/8)

### **Usage in NewBillScreen**
```javascript
<FractionalInput
  value={measurements.pant_length}
  onChangeValue={(value) => setMeasurements({ ...measurements, pant_length: value })}
  placeholder="e.g. 35 1/2 or 35.5"
  textInputStyle={styles.measurementTextInput}
  keyboardType="default"
/>
```

## 📱 **User Experience**

### **Numeric Input Examples**
1. User types: `35 1/2`
2. Component converts to: `35.5`
3. Stored in database as: `35.5`
4. Display preserves user format: `35 1/2`

### **Text + Fraction Examples**
1. User types: `Cross 1/2, Side 3/4`
2. Component converts fractions: `Cross 0.5, Side 0.75`
3. Stored in database as: `"Cross 0.5, Side 0.75"`
4. Display shows converted format

### **Smart Conversion**
- `1/2` becomes `0.5`
- `1/4` becomes `0.25`  
- `3/4` becomes `0.75`
- `1/8` becomes `0.125`
- `3/8` becomes `0.375`
- `5/8` becomes `0.625`
- `7/8` becomes `0.875`

### **Text Processing**
- `Belt 1 1/2` becomes `Belt 1.5`
- `2 Plates 1/4` becomes `2 Plates 0.25`
- `Regular, Cut Away 1/4` becomes `Regular, Cut Away 0.25`

## 🎨 **Visual Features**

### **Placeholders**
- Contextual examples: `"e.g. 35 1/2 or 35.5"`
- Measurement-specific: `"e.g. 32 1/4"` for waist

### **Validation**
- ✅ Valid: `35 1/2`, `35.5`, `1/4`, `42`
- ❌ Invalid: `35 1/0`, `abc`, `35 1/2/3`

### **Error Handling**
- Invalid fractions (division by zero) are rejected
- Non-numeric input is ignored
- Maintains last valid value on invalid input

## 🚀 **Benefits for Tailors**

1. **Natural Input**: Enter measurements as you would speak them
2. **Precision**: Support for 1/8 inch precision (common in tailoring)
3. **Flexibility**: Use fractions OR decimals based on preference
4. **Accuracy**: No manual decimal conversion needed
5. **Speed**: Faster data entry with familiar formats

## 🔄 **Data Storage**

All measurements are stored as decimal numbers in the database:
- `pant_length: 35.5` (stored as decimal)
- `shirt_collar: 15.5` (stored as decimal)
- User can input as `35 1/2` or `35.5` - both work!

## 📋 **Supported Measurements**

### **Pant Measurements (Numeric + Fractions)**
- ✅ Length: `FractionalInput` (numeric)
- ✅ Kamar (Waist): `FractionalInput` (numeric)
- ✅ Hips: `FractionalInput` (numeric)
- ✅ Ran (Thigh): `FractionalInput` (numeric)
- ✅ Ghutna (Knee): `FractionalInput` (numeric)
- ✅ Bottom: `FractionalInput` (numeric)
- ✅ Seat: `FractionalInput` (numeric)

### **Pant Details (Text + Fractions)**
- ✅ SideP/Cross: `FractionalInput` (text mode)
- ✅ Plates: `FractionalInput` (text mode)
- ✅ Belt: `FractionalInput` (text mode)
- ✅ Back P: `FractionalInput` (text mode)
- ✅ WP: `FractionalInput` (text mode)

### **Shirt Measurements (Numeric + Fractions)**
- ✅ Length: `FractionalInput` (numeric)
- ✅ Shoulder: `FractionalInput` (numeric)
- ✅ Astin (Sleeve): `FractionalInput` (numeric)
- ✅ Collar: `FractionalInput` (numeric)
- ✅ Aloose (Armhole): `FractionalInput` (numeric)
- ✅ Body: `FractionalInput` (text mode)
- ✅ Loose: `FractionalInput` (text mode)

### **Shirt Details (Text + Fractions)**
- ✅ Collar Style: `FractionalInput` (text mode)
- ✅ Cuff: `FractionalInput` (text mode)
- ✅ Pocket: `FractionalInput` (text mode)
- ✅ Loose Style: `FractionalInput` (text mode)
- ✅ DT/TT: `FractionalInput` (text mode)

### **Text-Only Fields**
- Extra Measurements: Regular TextInput (multiline)

## 🧪 **Testing Examples**

Try these inputs in the New Bill screen:

### **Numeric Measurements**
1. **Pant Length**: `42 1/2`
2. **Waist**: `32.75` 
3. **Hip**: `38 1/4`
4. **Shirt Length**: `28 3/4`
5. **Collar**: `15 1/2`

### **Text + Fraction Fields**
1. **SideP/Cross**: `Cross 1/2, Side 3/4`
2. **Plates**: `2 Plates 1/4`
3. **Belt**: `Belt 1 1/2`
4. **Shirt Body**: `Body 40 1/2`
5. **Collar Style**: `Regular, Cut Away 1/4`
6. **Cuff**: `French, Button 1/2`
7. **Loose**: `Fitted, Loose 1 1/2`

All measurements will be correctly processed - numeric fields convert to decimals, text fields preserve text but convert embedded fractions.

## 🎯 **Perfect for Tailoring!**

This enhancement makes the TMS app much more user-friendly for tailors who are accustomed to using fractional measurements in their daily work. No more mental math to convert fractions to decimals!
