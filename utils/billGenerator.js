/**
 * Bill Generation Utilities
 * Shared logic for generating HTML for bills and measurement cards.
 */

// Helper: Format date as dd-mm-yyyy for receipt
export const formatDateForReceipt = (dateString, dayOffset = 0) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (dayOffset !== 0) {
      date.setDate(date.getDate() + dayOffset);
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateString;
  }
};

// PROFESSIONAL BILL HTML GENERATOR (From NewBillScreen.js)
export const generateProfessionalBillHTML = (billData, itemizedBill, orderNumber, includeMeasurements = true) => {
  console.log('🏭 generateProfessionalBillHTML called (Shared Utility)');

  // Calculate totals and organize data
  const garmentTotals = {};
  let totalAmount = 0;
  let totalQuantity = 0;

  // Process itemized bill data to create garment totals
  const garmentTypes = [
    { type: 'Suit', qty: parseInt(itemizedBill.suit_qty) || 0, amount: parseFloat(itemizedBill.suit_amount) || 0 },
    { type: 'Safari/Jacket', qty: parseInt(itemizedBill.safari_qty) || 0, amount: parseFloat(itemizedBill.safari_amount) || 0 },
    { type: 'Pant', qty: parseInt(itemizedBill.pant_qty) || 0, amount: parseFloat(itemizedBill.pant_amount) || 0 },
    { type: 'Shirt', qty: parseInt(itemizedBill.shirt_qty) || 0, amount: parseFloat(itemizedBill.shirt_amount) || 0 },
    { type: 'N.Shirt', qty: parseInt(itemizedBill.nshirt_qty) || 0, amount: parseFloat(itemizedBill.nshirt_amount) || 0 }
  ];

  garmentTypes.forEach(({ type, qty, amount }) => {
    if (qty > 0) {
      garmentTotals[type] = { qty, amount };
      totalAmount += amount;
      totalQuantity += qty;
    }
  });

  const advanceAmount = parseFloat(billData.payment_amount) || 0;
  const remainingAmount = totalAmount - advanceAmount;

  // Format dates
  const orderDate = billData.order_date ?
    new Date(billData.order_date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-') : '';

  const dueDate = billData.due_date ?
    new Date(billData.due_date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-') : '';

  // Generate measurements with separate boxes for PANT and SHIRT
  const generateMeasurementsForPDF = (measurements) => {
    // Format date as dd-mm-yyyy local helper
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      } catch {
        return dateString;
      }
    };

    if (!measurements || Object.keys(measurements).length === 0) {
      return '<div style="font-size: 10px; color: #666;">No measurements available</div>';
    }

    const excludedFields = ['id', 'customer_id', 'bill_id', 'order_id', 'phone', 'mobile', 'mobile_number', 'phone_number', 'customer_name', 'name', 'email', 'address', 'order_date', 'due_date', 'created_at', 'updated_at'];

    const allEntries = Object.entries(measurements).filter(([key, value]) => {
      const hasValue = value !== '' && value !== null && value !== undefined && value !== 0;
      const isNotExcluded = !excludedFields.some(excludedField => {
        return key.toLowerCase() === excludedField.toLowerCase() ||
          key.toLowerCase().startsWith(excludedField.toLowerCase() + '_') ||
          (excludedField === 'phone' && (key.toLowerCase() === 'phone' || key.toLowerCase() === 'phone_number'));
      });
      return hasValue && isNotExcluded;
    });

    if (allEntries.length === 0) {
      return '<div style="font-size: 10px; color: #666;">No measurements entered</div>';
    }

    // Group measurements
    const pantMeasurements = allEntries.filter(([key]) =>
      key.toLowerCase().includes('pant') ||
      ['length', 'kamar', 'hips', 'waist', 'ghutna', 'bottom', 'seat', 'sidep_cross', 'plates', 'belt', 'back_p', 'wp', 'sidep', 'cross'].includes(key.toLowerCase()) ||
      key.toLowerCase().replace('_', '').includes('sidepcross')
    );

    const shirtMeasurements = allEntries.filter(([key]) =>
      key.toLowerCase().includes('shirt') ||
      ['shirtlength', 'body', 'loose', 'shoulder', 'astin', 'collar', 'collor', 'aloose', 'allose', 'callar', 'cuff', 'pkt', 'looseshirt', 'dt_tt'].includes(key.toLowerCase())
    );

    const suitMeasurements = allEntries.filter(([key]) =>
      key.toLowerCase().includes('suit') ||
      ['suitlength', 'suitbody', 'suitloose', 'suitshoulder', 'suitastin', 'suitcollar', 'suitaloose', 'suitcallar', 'suitcuff', 'suitpkt', 'suitlooseshirt', 'suitdttt'].includes(key.toLowerCase())
    );

    const safariMeasurements = allEntries.filter(([key]) =>
      key.toLowerCase().includes('safari') ||
      ['safarilength', 'safaribody', 'safariloose', 'safarishoulder', 'safariastin', 'safaricollar', 'safarialoose', 'safaricallar', 'safaricuff', 'safaripkt', 'safarilooseshirt', 'safaridttt'].includes(key.toLowerCase())
    );

    const nshirtMeasurements = allEntries.filter(([key]) =>
      key.toLowerCase().includes('nshirt') ||
      ['nshirtlength', 'nshirtbody', 'nshirtloose', 'nshirtshoulder', 'nshirtastin', 'nshirtcollar', 'nshirtaloose', 'nshirtcallar', 'nshirtcuff', 'nshirtpkt', 'nshirtlooseshirt', 'nshirtdttt'].includes(key.toLowerCase())
    );

    const sadriMeasurements = allEntries.filter(([key]) =>
      key.toLowerCase().includes('sadri') ||
      ['sadrilength', 'sadribody', 'sadriloose', 'sadrishoulder', 'sadriastin', 'sadricollar', 'sadrialoose', 'sadricallar', 'sadricuff', 'sadripkt', 'sadrilooseshirt', 'sadridttt'].includes(key.toLowerCase())
    );

    const extraMeasurements = allEntries.filter(([key]) =>
      !pantMeasurements.some(([pantKey]) => pantKey === key) &&
      !shirtMeasurements.some(([shirtKey]) => shirtKey === key) &&
      !suitMeasurements.some(([suitKey]) => suitKey === key) &&
      !safariMeasurements.some(([safariKey]) => safariKey === key) &&
      !nshirtMeasurements.some(([nshirtKey]) => nshirtKey === key) &&
      !sadriMeasurements.some(([sadriKey]) => sadriKey === key)
    );

    let result = [];

    // Generate PANT measurements box
    if (pantMeasurements.length > 0) {
      const pantBoxedFieldsExact = ['SideP_Cross', 'Plates', 'Belt', 'Back_P', 'WP'];
      const pantBoxedFieldsLower = ['sidep_cross', 'sidepcross', 'plates', 'belt', 'back_p', 'backp', 'wp'];

      const isBoxedPantField = (key) => {
        return pantBoxedFieldsExact.includes(key) ||
          pantBoxedFieldsLower.includes(key.toLowerCase()) ||
          pantBoxedFieldsLower.includes(key.toLowerCase().replace('_', ''));
      };

      const regularPantFields = pantMeasurements.filter(([key]) => !isBoxedPantField(key));
      const boxedPantFields = pantMeasurements.filter(([key]) => isBoxedPantField(key));

      let pantContent = '';

      // Regular pant measurements in single line (numbers only)
      if (regularPantFields.length > 0) {
        const regularValues = regularPantFields.map(([key, value]) => {
          return `${value}`;
        }).join(' | ');
        pantContent += `<div style="margin-bottom: 2px; font-size: 16px; font-weight: bold;">${regularValues}</div>`;
      }

      // Boxed pant fields
      if (boxedPantFields.length > 0) {
        const boxedValues = boxedPantFields.map(([key, value]) => {
          let label = key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, l => l.toUpperCase()).replace('Pant ', '');
          if (key === 'SideP_Cross' || key.toLowerCase() === 'sidep_cross') {
            label = 'SideP/Cross';
          } else if (key === 'Back_P' || key.toLowerCase() === 'back_p') {
            label = 'Back P.';
          }
          return `<span style="display: inline-block; margin: 1px; padding: 2px 4px; background: #e8f5e8; border: 1px solid #2e7d32; border-radius: 3px; font-size: 12px; font-weight: bold; color: #1b5e20;">${label}:${value}</span>`;
        }).join('');
        pantContent += `<div style="margin-top: 2px;">${boxedValues}</div>`;
      }

      result.push(`
        <div style="width: 100%; border: 1px solid #2e7d32; border-radius: 4px; padding: 4px; background: #f9fdf9; margin-bottom: 3px; min-height: 45px;">
          <div style="font-weight: bold; font-size: 10px; color: #2e7d32; margin-bottom: 2px; text-align: center; border-bottom: 1px solid #2e7d32; padding-bottom: 1px;">PANT</div>
          <div style="font-size: 12px; color: #666; text-align: center; margin-bottom: 2px;">Bill No: ${orderNumber || billData.billnumberinput2 || 'N/A'} | Delivery: ${formatDate(billData.due_date)}</div>
          ${pantContent}
        </div>
      `);
    }

    // Generate SUIT measurements box
    if (suitMeasurements.length > 0) {
      const suitBoxedFields = ['suit_callar', 'suit_cuff', 'suit_pkt', 'suit_looseshirt', 'suit_dt_tt'];
      const regularSuitFields = suitMeasurements.filter(([key]) =>
        !suitBoxedFields.includes(key.toLowerCase())
      );
      const boxedSuitFields = suitMeasurements.filter(([key]) =>
        suitBoxedFields.includes(key.toLowerCase())
      );

      let suitContent = '';

      // Regular suit measurements
      if (regularSuitFields.length > 0) {
        const regularValues = regularSuitFields.map(([key, value]) => {
          return `${value}`;
        }).join(' | ');
        suitContent += `<div style="margin-bottom: 2px; font-size: 16px; font-weight: bold;">${regularValues}</div>`;
      }

      // Boxed suit fields
      if (boxedSuitFields.length > 0) {
        const boxedValues = boxedSuitFields.map(([key, value]) => {
          let label = key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, l => l.toUpperCase()).replace('Suit ', '').replace('suit_', '');
          if (label.toLowerCase().includes('callar')) label = 'Collar';
          if (label.toLowerCase().includes('looseshirt')) label = 'Loose';
          if (label.toLowerCase().includes('dt tt')) label = 'DT/TT';
          return `<span style="display: inline-block; margin: 1px; padding: 2px 4px; background: #e3f2fd; border: 1px solid #1976d2; border-radius: 3px; font-size: 12px; font-weight: bold; color: #0d47a1;">${label}:${value}</span>`;
        }).join('');
        suitContent += `<div style="margin-top: 2px;">${boxedValues}</div>`;
      }

      result.push(`
        <div style="width: 100%; border: 1px solid #1976d2; border-radius: 4px; padding: 4px; background: #f5fafd; margin-bottom: 3px; min-height: 45px;">
          <div style="font-weight: bold; font-size: 10px; color: #1976d2; margin-bottom: 2px; text-align: center; border-bottom: 1px solid #1976d2; padding-bottom: 1px;">SUIT</div>
          <div style="font-size: 12px; color: #666; text-align: center; margin-bottom: 2px;">Bill No: ${orderNumber || billData.billnumberinput2 || 'N/A'} | Delivery: ${formatDate(billData.due_date)}</div>
          ${suitContent}
        </div>
      `);
    }

    // Generate SHIRT measurements box
    if (shirtMeasurements.length > 0) {
      const shirtBoxedFields = ['collar', 'collor', 'callar', 'cuff', 'pkt', 'looseshirt', 'dt_tt'];
      const regularShirtFields = shirtMeasurements.filter(([key]) =>
        !shirtBoxedFields.includes(key.toLowerCase())
      );
      const boxedShirtFields = shirtMeasurements.filter(([key]) =>
        shirtBoxedFields.includes(key.toLowerCase())
      );

      let shirtContent = '';

      // Regular shirt measurements
      if (regularShirtFields.length > 0) {
        const regularValues = regularShirtFields.map(([key, value]) => {
          return `${value}`;
        }).join(' | ');
        shirtContent += `<div style="margin-bottom: 2px; font-size: 16px; font-weight: bold;">${regularValues}</div>`;
      }

      // Boxed shirt fields
      if (boxedShirtFields.length > 0) {
        const boxedValues = boxedShirtFields.map(([key, value]) => {
          let label = key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, l => l.toUpperCase()).replace('Shirt ', '');
          if (label.toLowerCase().includes('collar') || label.toLowerCase().includes('collor') || label.toLowerCase().includes('callar')) {
            label = 'Collar';
          } else if (label.toLowerCase().includes('looseshirt')) {
            label = 'Loose';
          }
          return `<span style="display: inline-block; margin: 1px; padding: 2px 4px; background: #fff8e1; border: 1px solid #f57c00; border-radius: 3px; font-size: 12px; font-weight: bold; color: #e65100;">${label}:${value}</span>`;
        }).join('');
        shirtContent += `<div style="margin-top: 2px;">${boxedValues}</div>`;
      }

      result.push(`
        <div style="width: 100%; border: 1px solid #f57c00; border-radius: 4px; padding: 4px; background: #fffbf5; margin-bottom: 3px; min-height: 45px;">
          <div style="font-weight: bold; font-size: 10px; color: #f57c00; margin-bottom: 2px; text-align: center; border-bottom: 1px solid #f57c00; padding-bottom: 1px;">SHIRT</div>
          <div style="font-size: 12px; color: #666; text-align: center; margin-bottom: 2px;">Bill No: ${orderNumber || billData.billnumberinput2 || 'N/A'} | Delivery: ${formatDate(billData.due_date)}</div>
          ${shirtContent}
        </div>
      `);
    }

    // Generate SAFARI/JACKET measurements box
    if (safariMeasurements.length > 0) {
      const safariBoxedFields = ['safari_callar', 'safari_cuff', 'safari_pkt', 'safari_looseshirt', 'safari_dt_tt'];
      const regularSafariFields = safariMeasurements.filter(([key]) =>
        !safariBoxedFields.includes(key.toLowerCase())
      );
      const boxedSafariFields = safariMeasurements.filter(([key]) =>
        safariBoxedFields.includes(key.toLowerCase())
      );

      let safariContent = '';

      if (regularSafariFields.length > 0) {
        const regularValues = regularSafariFields.map(([key, value]) => `${value}`).join(' | ');
        safariContent += `<div style="margin-bottom: 2px; font-size: 16px; font-weight: bold;">${regularValues}</div>`;
      }

      if (boxedSafariFields.length > 0) {
        const boxedValues = boxedSafariFields.map(([key, value]) => {
          let label = key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, l => l.toUpperCase()).replace('Safari ', '').replace('safari_', '');
          if (label.toLowerCase().includes('callar')) label = 'Collar';
          if (label.toLowerCase().includes('looseshirt')) label = 'Loose';
          if (label.toLowerCase().includes('dt tt')) label = 'DT/TT';
          return `<span style="display: inline-block; margin: 1px; padding: 2px 4px; background: #e0f2f1; border: 1px solid #00695c; border-radius: 3px; font-size: 12px; font-weight: bold; color: #004d40;">${label}:${value}</span>`;
        }).join('');
        safariContent += `<div style="margin-top: 2px;">${boxedValues}</div>`;
      }

      result.push(`
        <div style="width: 100%; border: 1px solid #00695c; border-radius: 4px; padding: 4px; background: #f0f7f6; margin-bottom: 3px; min-height: 45px;">
          <div style="font-weight: bold; font-size: 10px; color: #00695c; margin-bottom: 2px; text-align: center; border-bottom: 1px solid #00695c; padding-bottom: 1px;">SAFARI/JACKET</div>
          <div style="font-size: 12px; color: #666; text-align: center; margin-bottom: 2px;">Bill No: ${orderNumber || billData.billnumberinput2 || 'N/A'} | Delivery: ${formatDate(billData.due_date)}</div>
          ${safariContent}
        </div>
      `);
    }

    // Generate N.SHIRT measurements box
    if (nshirtMeasurements.length > 0) {
      const nshirtBoxedFields = ['nshirt_callar', 'nshirt_cuff', 'nshirt_pkt', 'nshirt_looseshirt', 'nshirt_dt_tt'];
      const regularNShirtFields = nshirtMeasurements.filter(([key]) =>
        !nshirtBoxedFields.includes(key.toLowerCase())
      );
      const boxedNShirtFields = nshirtMeasurements.filter(([key]) =>
        nshirtBoxedFields.includes(key.toLowerCase())
      );

      let nshirtContent = '';

      if (regularNShirtFields.length > 0) {
        const regularValues = regularNShirtFields.map(([key, value]) => `${value}`).join(' | ');
        nshirtContent += `<div style="margin-bottom: 2px; font-size: 16px; font-weight: bold;">${regularValues}</div>`;
      }

      if (boxedNShirtFields.length > 0) {
        const boxedValues = boxedNShirtFields.map(([key, value]) => {
          let label = key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, l => l.toUpperCase()).replace('Nshirt ', '').replace('nshirt_', '');
          if (label.toLowerCase().includes('callar')) label = 'Collar';
          if (label.toLowerCase().includes('looseshirt')) label = 'Loose';
          if (label.toLowerCase().includes('dt tt')) label = 'DT/TT';
          return `<span style="display: inline-block; margin: 1px; padding: 2px 4px; background: #e1bee7; border: 1px solid #8e24aa; border-radius: 3px; font-size: 12px; font-weight: bold; color: #4a148c;">${label}:${value}</span>`;
        }).join('');
        nshirtContent += `<div style="margin-top: 2px;">${boxedValues}</div>`;
      }

      result.push(`
        <div style="width: 100%; border: 1px solid #8e24aa; border-radius: 4px; padding: 4px; background: #f3e5f5; margin-bottom: 3px; min-height: 45px;">
          <div style="font-weight: bold; font-size: 10px; color: #8e24aa; margin-bottom: 2px; text-align: center; border-bottom: 1px solid #8e24aa; padding-bottom: 1px;">N.SHIRT</div>
          <div style="font-size: 12px; color: #666; text-align: center; margin-bottom: 2px;">Bill No: ${orderNumber || billData.billnumberinput2 || 'N/A'} | Delivery: ${formatDate(billData.due_date)}</div>
          ${nshirtContent}
        </div>
      `);
    }

    // Generate SADRI measurements box
    if (sadriMeasurements.length > 0) {
      const sadriBoxedFields = ['sadri_callar', 'sadri_cuff', 'sadri_pkt', 'sadri_looseshirt', 'sadri_dt_tt'];
      const regularSadriFields = sadriMeasurements.filter(([key]) =>
        !sadriBoxedFields.includes(key.toLowerCase())
      );
      const boxedSadriFields = sadriMeasurements.filter(([key]) =>
        sadriBoxedFields.includes(key.toLowerCase())
      );

      let sadriContent = '';

      if (regularSadriFields.length > 0) {
        const regularValues = regularSadriFields.map(([key, value]) => `${value}`).join(' | ');
        sadriContent += `<div style="margin-bottom: 2px; font-size: 16px; font-weight: bold;">${regularValues}</div>`;
      }

      if (boxedSadriFields.length > 0) {
        const boxedValues = boxedSadriFields.map(([key, value]) => {
          let label = key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, l => l.toUpperCase()).replace('Sadri ', '').replace('sadri_', '');
          if (label.toLowerCase().includes('callar')) label = 'Collar';
          if (label.toLowerCase().includes('looseshirt')) label = 'Loose';
          if (label.toLowerCase().includes('dt tt')) label = 'DT/TT';
          return `<span style="display: inline-block; margin: 1px; padding: 2px 4px; background: #fff9c4; border: 1px solid #fbc02d; border-radius: 3px; font-size: 12px; font-weight: bold; color: #f57f17;">${label}:${value}</span>`;
        }).join('');
        sadriContent += `<div style="margin-top: 2px;">${boxedValues}</div>`;
      }

      result.push(`
        <div style="width: 100%; border: 1px solid #fbc02d; border-radius: 4px; padding: 4px; background: #fffde7; margin-bottom: 3px; min-height: 45px;">
          <div style="font-weight: bold; font-size: 10px; color: #fbc02d; margin-bottom: 2px; text-align: center; border-bottom: 1px solid #fbc02d; padding-bottom: 1px;">SADRI</div>
          <div style="font-size: 12px; color: #666; text-align: center; margin-bottom: 2px;">Bill No: ${orderNumber || billData.billnumberinput2 || 'N/A'} | Delivery: ${formatDate(billData.due_date)}</div>
          ${sadriContent}
        </div>
      `);
    }

    // Add EXTRA measurements
    if (extraMeasurements.length > 0) {
      const extraValues = extraMeasurements.map(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, l => l.toUpperCase());
        return `${label}:${value}`;
      }).join(' | ');
      result.push(`<div style="margin-top: 4px; font-size: 10px;"><strong style="color: #2c5282;">EXTRA:</strong> ${extraValues}</div>`);
    }

    return result.join('');
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Bill</title>
  <style>
    @page {
      size: A4;
      margin: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    body {
      font-family: Calibri, Arial, sans-serif;
      margin: 0;
      padding: 0;
      /* Background removed for better printing, or use absolute path if needed */
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      min-height: 297mm;
      width: 210mm;
    }
    .bill-container {
      width: 100%;
      min-height: 297mm;
      padding: 8mm;
      box-sizing: border-box;
      border: 2px solid #333;
      position: relative;
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      display: flex;
      flex-direction: column;
    }
  </style>
</head>
<body>
  <div class="bill-container">

    <!-- Header Section -->
    <div style="margin-bottom: 15px;">
      <img src="https://oeqlxurzbdvliuqutqyo.supabase.co/storage/v1/object/public/suit-images/Shop.jpeg"
           alt="Shop Header"
           style="width: 100%; height: auto; display: block; -webkit-print-color-adjust: exact; print-color-adjust: exact;"
           onerror="this.style.display='none';">
    </div>

    <!-- Customer Info Fields -->
    <div style="margin-bottom: 15px; font-size: 24px; padding: 0 5px;">
      <!-- Line 1: Name and Order No. -->
      <div style="display: flex; border-bottom: 2px solid #000; padding: 8px 0; min-height: 24px; margin-bottom: 12px;">
        <div style="width: 50%; display: flex; gap: 8px;">
          <span style="font-weight: bold;">Name</span>
          <span>${billData.customer_name || ''}</span>
        </div>
        <div style="width: 50%; display: flex; gap: 8px;">
          <span style="font-weight: bold;">Order No.</span>
          <span>${orderNumber || billData.billnumberinput2 || ''}</span>
        </div>
      </div>

      <!-- Line 2: Date (right column) -->
      <div style="display: flex; border-bottom: 2px solid #000; padding: 8px 0; min-height: 24px; margin-bottom: 12px;">
        <div style="width: 50%;"></div>
        <div style="width: 50%; display: flex; gap: 8px;">
          <span style="font-weight: bold;">Date</span>
          <span>${orderDate}</span>
        </div>
      </div>

      <!-- Line 3: Cell and D. Date -->
      <div style="display: flex; border-bottom: 2px solid #000; padding: 8px 0; min-height: 24px; margin-bottom: 12px;">
        <div style="width: 50%; display: flex; gap: 8px;">
          <span style="font-weight: bold;">Cell</span>
          <span>${billData.mobile_number || ''}</span>
        </div>
        <div style="width: 50%; display: flex; gap: 8px;">
          <span style="font-weight: bold;">D. Date</span>
          <span>${dueDate}</span>
        </div>
      </div>
    </div>

    <!-- Main Content: Table and Image Side by Side -->
    <div style="display: flex; gap: 12px; margin-bottom: 12px; flex-grow: 1;">

      <!-- Left Side: Particulars Table -->
      <div style="flex: 0 0 70%; display: flex; flex-direction: column;">
        <!-- Column Headers -->
        <div style="display: flex; background: #514849; border: 2px solid #000; border-bottom: none; border-radius: 8px 8px 0 0; overflow: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
          <div style="flex: 0 0 40%; padding: 15px 10px; text-align: left; font-weight: bold; font-size: 26px; border-right: 2px solid #000; color: #fff;">PARTICULARS</div>
          <div style="flex: 0 0 20%; padding: 15px 10px; text-align: center; font-weight: bold; font-size: 26px; border-right: 2px solid #000; color: #fff;">QTY.</div>
          <div style="padding: 15px 28px 15px 15px; font-weight: bold; font-size: 26px; color: #fff;">AMOUNT</div>
        </div>

        <!-- Item Rows Container - grows to fill space -->
        <div style="flex-grow: 1; display: flex; flex-direction: column;">
          <!-- Item Rows -->
          <div style="display: flex; flex: 1; border-left: 2px solid #000; border-right: 2px solid #000; border-bottom: 1px solid #000; align-items: center;">
            <div style="flex: 0 0 40%; padding: 20px 10px; text-align: left; font-size: 28px; font-weight: 600; border-right: 2px solid #000;">Suit</div>
            <div style="flex: 0 0 20%; padding: 20px 10px; text-align: center; font-size: 28px; border-right: 2px solid #000;">${garmentTotals['Suit']?.qty || ''}</div>
            <div style="padding: 20px 28px 20px 15px; font-size: 28px;">${garmentTotals['Suit']?.amount || ''}</div>
          </div>

          <div style="display: flex; flex: 1; border-left: 2px solid #000; border-right: 2px solid #000; border-bottom: 1px solid #000; align-items: center;">
            <div style="flex: 0 0 40%; padding: 20px 10px; text-align: left; font-size: 28px; font-weight: 600; border-right: 2px solid #000;">Safari/Jacket</div>
            <div style="flex: 0 0 20%; padding: 20px 10px; text-align: center; font-size: 28px; border-right: 2px solid #000;">${garmentTotals['Safari/Jacket']?.qty || ''}</div>
            <div style="padding: 20px 28px 20px 15px; font-size: 28px;">${garmentTotals['Safari/Jacket']?.amount || ''}</div>
          </div>

          <div style="display: flex; flex: 1; border-left: 2px solid #000; border-right: 2px solid #000; border-bottom: 1px solid #000; align-items: center;">
            <div style="flex: 0 0 40%; padding: 20px 10px; text-align: left; font-size: 28px; font-weight: 600; border-right: 2px solid #000;">Pant</div>
            <div style="flex: 0 0 20%; padding: 20px 10px; text-align: center; font-size: 28px; border-right: 2px solid #000;">${garmentTotals['Pant']?.qty || ''}</div>
            <div style="padding: 20px 28px 20px 15px; font-size: 28px;">${garmentTotals['Pant']?.amount || ''}</div>
          </div>

          <div style="display: flex; flex: 1; border-left: 2px solid #000; border-right: 2px solid #000; border-bottom: 1px solid #000; align-items: center;">
            <div style="flex: 0 0 40%; padding: 20px 10px; text-align: left; font-size: 28px; font-weight: 600; border-right: 2px solid #000;">Shirt</div>
            <div style="flex: 0 0 20%; padding: 20px 10px; text-align: center; font-size: 28px; border-right: 2px solid #000;">${garmentTotals['Shirt']?.qty || ''}</div>
            <div style="padding: 20px 28px 20px 15px; font-size: 28px;">${garmentTotals['Shirt']?.amount || ''}</div>
          </div>

          <div style="display: flex; flex: 1; border-left: 2px solid #000; border-right: 2px solid #000; border-bottom: 1px solid #000; align-items: center;">
            <div style="flex: 0 0 40%; padding: 20px 10px; text-align: left; font-size: 28px; font-weight: 600; border-right: 2px solid #000;">N.Shirt</div>
            <div style="flex: 0 0 20%; padding: 20px 10px; text-align: center; font-size: 28px; border-right: 2px solid #000;">${garmentTotals['N.Shirt']?.qty || ''}</div>
            <div style="padding: 20px 28px 20px 15px; font-size: 28px;">${garmentTotals['N.Shirt']?.amount || ''}</div>
          </div>
        </div>

        <!-- Total Row -->
        <div style="display: flex; border: 2px solid #000; border-top: none; border-radius: 0 0 8px 8px; overflow: hidden; background: #e8e8e8; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
          <div style="flex: 0 0 40%; padding: 20px 10px; text-align: center; font-size: 24px; font-weight: bold; border-right: 2px solid #000;">
            <div style="margin-bottom: 5px;">Good Service</div>
            <div>Prompt Delivery</div>
          </div>
          <div style="flex: 0 0 20%; padding: 20px 10px; text-align: center; font-size: 28px; font-weight: bold; border-right: 2px solid #000; color: #db9b68; -webkit-print-color-adjust: exact; print-color-adjust: exact;">TOTAL</div>
          <div style="padding: 20px 28px 20px 15px; font-size: 28px; font-weight: bold;"></div>
        </div>
      </div>

      <!-- Right Side: Image and Measurements -->
      <div style="flex: 0 0 20%; display: flex; flex-direction: column; align-items: stretch;">
        <div style="flex: 1; margin-bottom: 10px;">
          <img src="https://oeqlxurzbdvliuqutqyo.supabase.co/storage/v1/object/public/suit-images/suit-icon.jpg"
               alt="Suit"
               style="width: 140%; height: 100%; object-fit: cover;"
               onerror="this.style.display='none';">
        </div>
        
        <!-- Measurement Boxes in PDF -->
        ${includeMeasurements ? `
        <div style="display: flex; flex-direction: column; gap: 5px;">
          ${generateMeasurementsForPDF(billData.measurements || {})}
        </div>
        ` : ''}
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center; border: 2px solid #000; border-radius: 8px; padding: 12px 20px; background: #fff;">
        <div style="flex: 1; text-align: left; font-size: 21px; font-weight: bold;">Thank You, Visit Again</div>
        <div style="flex: 0 0 auto; text-align: center;">
          <div style="background: #db9b68; color: #000; padding: 6px 20px; border-radius: 8px; font-weight: bold; font-size: 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact;">Sunday Holiday</div>
        </div>
        <div style="flex: 1; text-align: right; font-size: 21px; font-weight: bold; color: #db9b68; padding-right: 40px;">Signature</div>
      </div>
    </div>

  </div>
</body>
</html>
  `;
};

// TRADITIONAL MEASUREMENT CARD GENERATOR (From NewBillScreen.js)
export const generateMeasurementHTML = (billData, measurements) => {
  // Generate measurement card with full inline styling
  const generateMeasurementCard = (type, measurements) => {
    const cardConfig = {
      pant: {
        title: "PANT",
        fields: [
          { key: "pant_length", label: "Length", position: "top-left" },
          { key: "pant_kamar", label: "Kamar", position: "top-center" },
          { key: "pant_hips", label: "Hips", position: "top-right" },
          { key: "pant_waist", label: "Waist", position: "middle-left" },
          { key: "pant_ghutna", label: "Ghutna", position: "middle-center" },
          { key: "pant_bottom", label: "Bottom", position: "middle-right" },
          { key: "pant_seat", label: "Seat", position: "bottom-left" },
          { key: "SideP_Cross", label: "SideP/Cross", position: "labeled-box-1" },
          { key: "Plates", label: "Plates", position: "labeled-box-2" },
          { key: "Belt", label: "Belt", position: "labeled-box-3" },
          { key: "Back_P", label: "Back P.", position: "labeled-box-4" },
          { key: "WP", label: "WP.", position: "labeled-box-5" }
        ]
      },
      shirt: {
        title: (measurements.shirt_type || "SHIRT").toUpperCase(),
        fields: [
          { key: "shirt_length", label: "Length", position: "top-left" },
          { key: "shirt_body", label: "Body", position: "top-center" },
          { key: "shirt_loose", label: "Loose", position: "top-right" },
          { key: "shirt_shoulder", label: "Shoulder", position: "middle-left" },
          { key: "shirt_astin", label: "Astin", position: "middle-center" },
          { key: "shirt_collar", label: "Collar", position: "middle-right" },
          { key: "shirt_aloose", label: "A.Loose", position: "bottom-left" },
          { key: "Callar", label: "Collar", position: "labeled-box-1" },
          { key: "Cuff", label: "Cuff", position: "labeled-box-2" },
          { key: "Pkt", label: "Pkt", position: "labeled-box-3" },
          { key: "LooseShirt", label: "Loose", position: "labeled-box-4" },
          { key: "DT_TT", label: "DT/TT", position: "labeled-box-5" }
        ]
      }
    };

    const config = cardConfig[type];
    if (!config) return '';

    // Generate main grid fields with inline styling
    const positions = [
      'top-left', 'top-center', 'top-right',
      'middle-left', 'middle-center', 'middle-right',
      'bottom-left', 'bottom-center', 'bottom-right'
    ];

    const gridFields = positions.map(position => {
      const field = config.fields.find(f => f.position === position);
      if (!field) {
        return `<td style="width: 33.33%; padding: 8px; text-align: center; border: 1px solid #ddd;"></td>`;
      }

      const value = measurements[field.key] || '';
      const hasValue = value !== '' && value !== 0;

      const bgColor = hasValue ? '#e8f5e8' : '#ffffff';
      const borderColor = hasValue ? '#2e7d32' : '#333333';
      const textColor = hasValue ? '#1b5e20' : '#333333';

      return `
        <td style="width: 33.33%; padding: 8px; text-align: center; border: 1px solid #ddd; vertical-align: top;">
          <div style="font-size: 11px; font-weight: bold; margin-bottom: 4px; color: #666; background: #f5f5f5; padding: 2px 4px; border-radius: 2px;">${field.label}</div>
          <div style="border: 3px solid ${borderColor}; border-radius: 4px; padding: 8px; min-height: 25px; font-size: 13px; font-weight: bold; background: ${bgColor}; color: ${textColor}; display: flex; align-items: center; justify-content: center; box-sizing: border-box;">${value}</div>
        </td>
      `;
    });

    // Create grid table (3x3)
    const gridTable = `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; background: #fafafa; border: 1px solid #ddd;">
        <tr>
          ${gridFields[0]}
          ${gridFields[1]}
          ${gridFields[2]}
        </tr>
        <tr>
          ${gridFields[3]}
          ${gridFields[4]}
          ${gridFields[5]}
        </tr>
        <tr>
          ${gridFields[6]}
          ${gridFields[7]}
          ${gridFields[8]}
        </tr>
      </table>
    `;

    // Generate labeled boxes with inline styling
    const labeledFields = config.fields.filter(f => f.position.includes('labeled-box-'));
    const labeledBoxes = labeledFields.map(field => {
      const value = measurements[field.key] || '';
      const hasValue = value !== '' && value !== 0;

      const bgColor = hasValue ? '#fff8e1' : '#ffffff';
      const borderColor = hasValue ? '#f57c00' : '#666666';
      const textColor = hasValue ? '#e65100' : '#333333';

      return `
        <td style="width: 20%; padding: 4px; text-align: center; border: 1px solid #eee; vertical-align: top;">
          <div style="font-size: 10px; font-weight: bold; margin-bottom: 3px; color: #444; background: #e0e0e0; padding: 2px 4px; border-radius: 2px; border: 1px solid #ccc;">${field.label}</div>
          <div style="border: 2px solid ${borderColor}; border-radius: 3px; padding: 6px 2px; min-height: 18px; font-size: 11px; font-weight: bold; background: ${bgColor}; color: ${textColor}; display: flex; align-items: center; justify-content: center; box-sizing: border-box;">${value}</div>
        </td>
      `;
    }).join('');

    const labeledTable = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px; padding-top: 10px; border-top: 2px solid #666; background: #f8f8f8;">
        <tr>
          ${labeledBoxes}
        </tr>
      </table>
    `;

    return `
      <div style="flex: 1; border: 4px solid #333333; border-radius: 8px; margin: 10px; background: white; box-shadow: 0 4px 8px rgba(0,0,0,0.15); page-break-inside: avoid;">
        <div style="background: #333333; color: white; padding: 8px 15px; text-align: center; font-weight: bold; font-size: 16px; margin: 0; border-radius: 4px 4px 0 0;">${config.title}</div>
        <div style="position: absolute; top: 10px; right: 15px; font-size: 11px;">
          <div style="margin: 3px 0; display: flex; align-items: center; gap: 5px;">
            <span>Date:</span>
            <div style="border: 1px solid #666; border-radius: 2px; background: white; padding: 2px 4px; width: 60px; height: 16px;"></div>
          </div>
          <div style="margin: 3px 0; display: flex; align-items: center; gap: 5px;">
            <span>No.</span>
            <div style="border: 1px solid #666; border-radius: 2px; background: white; padding: 2px 4px; width: 60px; height: 16px;"></div>
          </div>
        </div>
        <div style="padding: 15px; position: relative; min-height: 180px; border: 1px solid #ddd; border-radius: 0 0 4px 4px;">
          ${gridTable}
          ${labeledTable}
        </div>
      </div>
    `;
  };

  // Generate extra measurements section with inline styling
  const generateExtraMeasurements = (measurements) => {
    const extraValue = measurements.extra_measurements || '';
    return `
      <div style="margin-top: 20px; padding: 15px; background: #f0f8ff; border: 2px solid #4A90E2; border-radius: 5px;">
        <h4 style="margin: 0 0 10px 0; color: #2c5282; font-size: 14px;">Additional Notes / Extra Measurements:</h4>
        <div style="background: white; border: 1px solid #ddd; border-radius: 3px; padding: 10px; min-height: 30px; font-size: 13px; line-height: 1.4; color: #333;">${extraValue || 'No additional measurements specified.'}</div>
      </div>
    `;
  };

  return `
  <html>
    <head>
      <style>
        body { 
          font-family: 'Courier New', monospace !important;
          margin: 0;
          padding: 2mm;
          background: white !important;
          color: #000 !important;
          line-height: 1.2;
          width: 58mm;
        }
        
        .header {
          text-align: center;
          border-bottom: 2px dashed #000;
          padding-bottom: 3mm;
          margin-bottom: 3mm;
        }
        
        .shop-name {
          font-size: 16px;
          font-weight: bold;
          margin: 0 0 2mm 0;
        }
        
        .subtitle {
          font-size: 12px;
          margin: 0;
          font-weight: bold;
        }
        
        .customer-info {
          font-size: 13px;
          margin-bottom: 3mm;
          padding-bottom: 2mm;
          border-bottom: 1px dashed #000;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 1mm 0;
        }
        
        .info-row span:first-child {
          font-weight: bold;
        }
        
        .info-row span:last-child {
          font-weight: bold;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: bold;
          text-align: center;
          background: #000;
          color: #fff;
          padding: 2mm;
          margin: 2mm 0 1mm 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .measurement-item {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          padding: 1.5mm 0;
          border-bottom: 1px dotted #ccc;
        }
        
        .measurement-label {
          font-weight: bold;
        }
        
        .measurement-value {
          text-align: right;
          font-size: 16px;
          font-weight: bold;
        }
        
        .special-box {
          display: inline-block;
          border: 1px solid #000;
          padding: 1mm 2mm;
          margin: 0.5mm;
          font-size: 12px;
          font-weight: bold;
          background: #f0f0f0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .special-boxes {
          margin: 2mm 0;
          text-align: center;
        }
        
        .extra-notes {
          margin-top: 3mm;
          padding-top: 2mm;
          border-top: 1px dashed #000;
          font-size: 11px;
        }
        
        .footer {
          text-align: center;
          margin-top: 3mm;
          padding-top: 2mm;
          border-top: 2px dashed #000;
          font-size: 11px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
      </div>
      
      <!-- Customer Info -->
      <div class="customer-info">
        <div class="info-row">
          <span>Order No:</span>
          <span>${billData.billnumberinput2 || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span>Date:</span>
          <span>${formatDateForReceipt(billData.order_date)}</span>
        </div>
        <div class="info-row">
          <span>Delivery:</span>
          <span>${formatDateForReceipt(billData.due_date, -1)}</span>
        </div>
      </div>
      
      <!-- SUIT Measurements -->
      ${measurements.suit_length || measurements.suit_body || measurements.suit_loose || measurements.suit_shoulder || measurements.suit_astin || measurements.suit_collar || measurements.suit_aloose ? `
      <div class="section-title">SUIT</div>
      ${measurements.suit_length ? `<div class="measurement-item"><span class="measurement-label">Length:</span><span class="measurement-value">${measurements.suit_length}</span></div>` : ''}
      ${measurements.suit_body ? `<div class="measurement-item"><span class="measurement-label">Body:</span><span class="measurement-value">${measurements.suit_body}</span></div>` : ''}
      ${measurements.suit_loose ? `<div class="measurement-item"><span class="measurement-label">Loose:</span><span class="measurement-value">${measurements.suit_loose}</span></div>` : ''}
      ${measurements.suit_shoulder ? `<div class="measurement-item"><span class="measurement-label">Shoulder:</span><span class="measurement-value">${measurements.suit_shoulder}</span></div>` : ''}
      ${measurements.suit_astin ? `<div class="measurement-item"><span class="measurement-label">Astin:</span><span class="measurement-value">${measurements.suit_astin}</span></div>` : ''}
      ${measurements.suit_collar ? `<div class="measurement-item"><span class="measurement-label">Collar:</span><span class="measurement-value">${measurements.suit_collar}</span></div>` : ''}
      ${measurements.suit_aloose ? `<div class="measurement-item"><span class="measurement-label">A.Loose:</span><span class="measurement-value">${measurements.suit_aloose}</span></div>` : ''}
      ${measurements.suit_callar || measurements.suit_cuff || measurements.suit_pkt || measurements.suit_looseshirt || measurements.suit_dt_tt ? `
      <div class="special-boxes">
        ${measurements.suit_callar ? `<span class="special-box">Collar: ${measurements.suit_callar}</span>` : ''}
        ${measurements.suit_cuff ? `<span class="special-box">Cuff: ${measurements.suit_cuff}</span>` : ''}
        ${measurements.suit_pkt ? `<span class="special-box">Pkt: ${measurements.suit_pkt}</span>` : ''}
        ${measurements.suit_looseshirt ? `<span class="special-box">Loose: ${measurements.suit_looseshirt}</span>` : ''}
        ${measurements.suit_dt_tt ? `<span class="special-box">DT/TT: ${measurements.suit_dt_tt}</span>` : ''}
      </div>
      ` : ''}
      ` : ''}

      <!-- PANT Measurements -->
      ${measurements.pant_length || measurements.pant_kamar || measurements.pant_hips || measurements.pant_waist || measurements.pant_ghutna || measurements.pant_bottom || measurements.pant_seat ? `
      <div class="section-title">PANT</div>
      ${measurements.pant_length ? `<div class="measurement-item"><span class="measurement-label">Length:</span><span class="measurement-value">${measurements.pant_length}</span></div>` : ''}
      ${measurements.pant_kamar ? `<div class="measurement-item"><span class="measurement-label">Kamar:</span><span class="measurement-value">${measurements.pant_kamar}</span></div>` : ''}
      ${measurements.pant_hips ? `<div class="measurement-item"><span class="measurement-label">Hips:</span><span class="measurement-value">${measurements.pant_hips}</span></div>` : ''}
      ${measurements.pant_waist ? `<div class="measurement-item"><span class="measurement-label">Waist:</span><span class="measurement-value">${measurements.pant_waist}</span></div>` : ''}
      ${measurements.pant_ghutna ? `<div class="measurement-item"><span class="measurement-label">Ghutna:</span><span class="measurement-value">${measurements.pant_ghutna}</span></div>` : ''}
      ${measurements.pant_bottom ? `<div class="measurement-item"><span class="measurement-label">Bottom:</span><span class="measurement-value">${measurements.pant_bottom}</span></div>` : ''}
      ${measurements.pant_seat ? `<div class="measurement-item"><span class="measurement-label">Seat:</span><span class="measurement-value">${measurements.pant_seat}</span></div>` : ''}
      ${measurements.SideP_Cross || measurements.Plates || measurements.Belt || measurements.Back_P || measurements.WP ? `
      <div class="special-boxes">
        ${measurements.SideP_Cross ? `<span class="special-box">SideP/Cross: ${measurements.SideP_Cross}</span>` : ''}
        ${measurements.Plates ? `<span class="special-box">Plates: ${measurements.Plates}</span>` : ''}
        ${measurements.Belt ? `<span class="special-box">Belt: ${measurements.Belt}</span>` : ''}
        ${measurements.Back_P ? `<span class="special-box">Back P: ${measurements.Back_P}</span>` : ''}
        ${measurements.WP ? `<span class="special-box">WP: ${measurements.WP}</span>` : ''}
      </div>
      ` : ''}
      ` : ''}
      
      <!-- SHIRT Measurements -->
      ${measurements.shirt_length || measurements.shirt_body || measurements.shirt_loose || measurements.shirt_shoulder || measurements.shirt_astin || measurements.shirt_collar || measurements.shirt_aloose ? `
      <div class="section-title">${(measurements.shirt_type || 'SHIRT').toUpperCase()}</div>
      ${measurements.shirt_length ? `<div class="measurement-item"><span class="measurement-label">Length:</span><span class="measurement-value">${measurements.shirt_length}</span></div>` : ''}
      ${(measurements.shirt_loose || measurements.LooseShirt) ? `<div class="measurement-item"><span class="measurement-label">Loose:</span><span class="measurement-value">${measurements.shirt_loose || measurements.LooseShirt}</span></div>` : ''}
      ${measurements.shirt_body ? `<div class="measurement-item"><span class="measurement-label">Body:</span><span class="measurement-value">${measurements.shirt_body}</span></div>` : ''}
      ${measurements.shirt_shoulder ? `<div class="measurement-item"><span class="measurement-label">Shoulder:</span><span class="measurement-value">${measurements.shirt_shoulder}</span></div>` : ''}
      ${measurements.shirt_astin ? `<div class="measurement-item"><span class="measurement-label">Astin:</span><span class="measurement-value">${measurements.shirt_astin}</span></div>` : ''}
      ${measurements.shirt_aloose ? `<div class="measurement-item"><span class="measurement-label">A.Loose:</span><span class="measurement-value">${measurements.shirt_aloose}</span></div>` : ''}
      ${(measurements.shirt_collar || measurements.Callar) ? `<div class="measurement-item"><span class="measurement-label">Collar:</span><span class="measurement-value">${measurements.shirt_collar || measurements.Callar}</span></div>` : ''}
      ${measurements.Callar || measurements.Cuff || measurements.Pkt || measurements.LooseShirt || measurements.DT_TT ? `
      <div class="special-boxes">
        ${measurements.Callar ? `<span class="special-box">Collar: ${measurements.Callar}</span>` : ''}
        ${measurements.Cuff ? `<span class="special-box">Cuff: ${measurements.Cuff}</span>` : ''}
        ${measurements.Pkt ? `<span class="special-box">Pkt: ${measurements.Pkt}</span>` : ''}
        ${measurements.LooseShirt ? `<span class="special-box">Loose: ${measurements.LooseShirt}</span>` : ''}
        ${measurements.DT_TT ? `<span class="special-box">DT/TT: ${measurements.DT_TT}</span>` : ''}
      </div>
      ` : ''}
      ` : ''}

      <!-- SAFARI Measurements -->
      ${measurements.safari_length || measurements.safari_body || measurements.safari_loose || measurements.safari_shoulder || measurements.safari_astin || measurements.safari_collar || measurements.safari_aloose ? `
      <div class="section-title">SAFARI/JACKET</div>
      ${measurements.safari_length ? `<div class="measurement-item"><span class="measurement-label">Length:</span><span class="measurement-value">${measurements.safari_length}</span></div>` : ''}
      ${measurements.safari_body ? `<div class="measurement-item"><span class="measurement-label">Body:</span><span class="measurement-value">${measurements.safari_body}</span></div>` : ''}
      ${measurements.safari_loose ? `<div class="measurement-item"><span class="measurement-label">Loose:</span><span class="measurement-value">${measurements.safari_loose}</span></div>` : ''}
      ${measurements.safari_shoulder ? `<div class="measurement-item"><span class="measurement-label">Shoulder:</span><span class="measurement-value">${measurements.safari_shoulder}</span></div>` : ''}
      ${measurements.safari_astin ? `<div class="measurement-item"><span class="measurement-label">Astin:</span><span class="measurement-value">${measurements.safari_astin}</span></div>` : ''}
      ${measurements.safari_collar ? `<div class="measurement-item"><span class="measurement-label">Collar:</span><span class="measurement-value">${measurements.safari_collar}</span></div>` : ''}
      ${measurements.safari_aloose ? `<div class="measurement-item"><span class="measurement-label">A.Loose:</span><span class="measurement-value">${measurements.safari_aloose}</span></div>` : ''}
      ${measurements.safari_callar || measurements.safari_cuff || measurements.safari_pkt || measurements.safari_looseshirt || measurements.safari_dt_tt ? `
      <div class="special-boxes">
        ${measurements.safari_callar ? `<span class="special-box">Collar: ${measurements.safari_callar}</span>` : ''}
        ${measurements.safari_cuff ? `<span class="special-box">Cuff: ${measurements.safari_cuff}</span>` : ''}
        ${measurements.safari_pkt ? `<span class="special-box">Pkt: ${measurements.safari_pkt}</span>` : ''}
        ${measurements.safari_looseshirt ? `<span class="special-box">Loose: ${measurements.safari_looseshirt}</span>` : ''}
        ${measurements.safari_dt_tt ? `<span class="special-box">DT/TT: ${measurements.safari_dt_tt}</span>` : ''}
      </div>
      ` : ''}
      ` : ''}

      <!-- N.SHIRT Measurements -->
      ${measurements.nshirt_length || measurements.nshirt_body || measurements.nshirt_loose || measurements.nshirt_shoulder || measurements.nshirt_astin || measurements.nshirt_collar || measurements.nshirt_aloose ? `
      <div class="section-title">N.SHIRT</div>
      ${measurements.nshirt_length ? `<div class="measurement-item"><span class="measurement-label">Length:</span><span class="measurement-value">${measurements.nshirt_length}</span></div>` : ''}
      ${measurements.nshirt_body ? `<div class="measurement-item"><span class="measurement-label">Body:</span><span class="measurement-value">${measurements.nshirt_body}</span></div>` : ''}
      ${measurements.nshirt_loose ? `<div class="measurement-item"><span class="measurement-label">Loose:</span><span class="measurement-value">${measurements.nshirt_loose}</span></div>` : ''}
      ${measurements.nshirt_shoulder ? `<div class="measurement-item"><span class="measurement-label">Shoulder:</span><span class="measurement-value">${measurements.nshirt_shoulder}</span></div>` : ''}
      ${measurements.nshirt_astin ? `<div class="measurement-item"><span class="measurement-label">Astin:</span><span class="measurement-value">${measurements.nshirt_astin}</span></div>` : ''}
      ${measurements.nshirt_collar ? `<div class="measurement-item"><span class="measurement-label">Collar:</span><span class="measurement-value">${measurements.nshirt_collar}</span></div>` : ''}
      ${measurements.nshirt_aloose ? `<div class="measurement-item"><span class="measurement-label">A.Loose:</span><span class="measurement-value">${measurements.nshirt_aloose}</span></div>` : ''}
      ${measurements.nshirt_callar || measurements.nshirt_cuff || measurements.nshirt_pkt || measurements.nshirt_looseshirt || measurements.nshirt_dt_tt ? `
      <div class="special-boxes">
        ${measurements.nshirt_callar ? `<span class="special-box">Collar: ${measurements.nshirt_callar}</span>` : ''}
        ${measurements.nshirt_cuff ? `<span class="special-box">Cuff: ${measurements.nshirt_cuff}</span>` : ''}
        ${measurements.nshirt_pkt ? `<span class="special-box">Pkt: ${measurements.nshirt_pkt}</span>` : ''}
        ${measurements.nshirt_looseshirt ? `<span class="special-box">Loose: ${measurements.nshirt_looseshirt}</span>` : ''}
        ${measurements.nshirt_dt_tt ? `<span class="special-box">DT/TT: ${measurements.nshirt_dt_tt}</span>` : ''}
      </div>
      ` : ''}
      ` : ''}

      <!-- SADRI Measurements -->
      ${measurements.sadri_length || measurements.sadri_body || measurements.sadri_loose || measurements.sadri_shoulder || measurements.sadri_astin || measurements.sadri_collar || measurements.sadri_aloose ? `
      <div class="section-title">SADRI</div>
      ${measurements.sadri_length ? `<div class="measurement-item"><span class="measurement-label">Length:</span><span class="measurement-value">${measurements.sadri_length}</span></div>` : ''}
      ${measurements.sadri_body ? `<div class="measurement-item"><span class="measurement-label">Body:</span><span class="measurement-value">${measurements.sadri_body}</span></div>` : ''}
      ${measurements.sadri_loose ? `<div class="measurement-item"><span class="measurement-label">Loose:</span><span class="measurement-value">${measurements.sadri_loose}</span></div>` : ''}
      ${measurements.sadri_shoulder ? `<div class="measurement-item"><span class="measurement-label">Shoulder:</span><span class="measurement-value">${measurements.sadri_shoulder}</span></div>` : ''}
      ${measurements.sadri_astin ? `<div class="measurement-item"><span class="measurement-label">Astin:</span><span class="measurement-value">${measurements.sadri_astin}</span></div>` : ''}
      ${measurements.sadri_collar ? `<div class="measurement-item"><span class="measurement-label">Collar:</span><span class="measurement-value">${measurements.sadri_collar}</span></div>` : ''}
      ${measurements.sadri_aloose ? `<div class="measurement-item"><span class="measurement-label">A.Loose:</span><span class="measurement-value">${measurements.sadri_aloose}</span></div>` : ''}
      ${measurements.sadri_callar || measurements.sadri_cuff || measurements.sadri_pkt || measurements.sadri_looseshirt || measurements.sadri_dt_tt ? `
      <div class="special-boxes">
        ${measurements.sadri_callar ? `<span class="special-box">Collar: ${measurements.sadri_callar}</span>` : ''}
        ${measurements.sadri_cuff ? `<span class="special-box">Cuff: ${measurements.sadri_cuff}</span>` : ''}
        ${measurements.sadri_pkt ? `<span class="special-box">Pkt: ${measurements.sadri_pkt}</span>` : ''}
        ${measurements.sadri_looseshirt ? `<span class="special-box">Loose: ${measurements.sadri_looseshirt}</span>` : ''}
        ${measurements.sadri_dt_tt ? `<span class="special-box">DT/TT: ${measurements.sadri_dt_tt}</span>` : ''}
      </div>
      ` : ''}
      ` : ''}
      
      <!-- Extra Measurements -->
      ${measurements.extra_measurements ? `
      <div class="extra-notes">
        <div style="font-weight: bold; margin-bottom: 1mm;">Extra Notes:</div>
        <div>${measurements.extra_measurements}</div>
      </div>
      ` : ''}
      
      
    
    </body>
    </html>
  `;
};
