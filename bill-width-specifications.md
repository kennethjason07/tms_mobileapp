# Bill Width Specifications

## Primary Bill Width Settings

Your bill has **two different width configurations** depending on which template is used:

### 1. **Professional Bill Template (Main)**
```css
.bill-container {
  width: 100%;
  max-width: 210mm;        /* A4 paper width minus margins */
  margin: auto;
  padding: 20px;
  box-sizing: border-box;
}

@page {
  size: A4;                /* Standard A4 paper */
  margin: 20mm;            /* 20mm margins on all sides */
}
```

### 2. **Fallback Template (Alternative)**
```css
.bill-container {
  width: 400px;            /* Fixed width in pixels */
  margin: 0 auto;
  background: white;
  border: 1px solid #ddd;
}
```

## Width Breakdown:

### **Primary Template (210mm):**
- **Total Paper Width**: A4 = 210mm (8.27 inches)
- **Margins**: 20mm on each side = 40mm total
- **Effective Bill Width**: 210mm - 40mm = **170mm (6.69 inches)**
- **In Pixels**: Approximately **642px** (at 96 DPI)

### **Fallback Template (400px):**
- **Fixed Width**: **400px (4.17 inches at 96 DPI)**
- **Equivalent in mm**: Approximately **106mm**

## Additional Width Elements:

### **Internal Components:**
- **Suit/Image Box**: 220px fixed width
- **Items Table**: Flexible (takes remaining space)
- **Logo**: 32px × 32px
- **Image in Suit Box**: 150px max width

## Page Setup:

```css
@page {
  size: A4;                /* 210mm × 297mm */
  margin: 20mm;            /* Creates printable area of 170mm × 257mm */
}
```

## Responsive Behavior:

- **Desktop/Print**: Uses full 210mm (minus margins)
- **Small Screens**: Adapts within 400px container
- **PDF Generation**: Optimized for A4 paper size
- **Mobile**: Responsive within screen width

## Print Dimensions:

When printed on **A4 paper**:
- **Paper Size**: 210mm × 297mm (8.27" × 11.69")
- **Printable Area**: 170mm × 257mm (6.69" × 10.12")
- **Bill Width**: **170mm effective width**

## Recommended Usage:

- **For Professional Printing**: 210mm template (current primary)
- **For Receipt Printers**: 400px template would be better
- **For PDF Sharing**: 210mm template (A4 standard)
- **For Email/Digital**: Either works well

## Summary:

**Your bill width is primarily set to 210mm (A4 paper width) with 20mm margins, giving an effective printing width of 170mm (approximately 6.69 inches or 642px).**

This ensures professional, standard-sized bills that print perfectly on A4 paper and look professional in PDF format!
