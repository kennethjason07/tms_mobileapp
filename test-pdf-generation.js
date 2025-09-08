// Test PDF Generation Function
// This file provides a simple way to test the PDF generation functionality

function testPDFGeneration() {
    // Test data that mimics a filled form
    const testBillData = {
        customerName: "John Doe",
        mobileNumber: "9876543210",
        orderDate: "2025-01-08",
        deliveryDate: "2025-01-15",
        orderNumber: "1001",
        paymentAmount: 500
    };

    const testItemizedBill = {
        suit_qty: "0",
        suit_amount: 0,
        safari_qty: "0", 
        safari_amount: 0,
        pant_qty: "1",
        pant_amount: 1000,
        shirt_qty: "0",
        shirt_amount: 0,
        sadri_qty: "0",
        sadri_amount: 0
    };

    // Temporarily fill form fields for testing
    fillTestData(testBillData, testItemizedBill);
    
    // Test PDF generation
    if (typeof window.webPDFGenerator !== 'undefined') {
        console.log('Testing PDF generation...');
        window.webPDFGenerator.generateBillPDF()
            .then(success => {
                if (success) {
                    console.log('✅ PDF generation test successful!');
                    alert('PDF generation test successful! Check your downloads folder.');
                } else {
                    console.error('❌ PDF generation test failed');
                    alert('PDF generation test failed. Check console for errors.');
                }
            })
            .catch(error => {
                console.error('❌ PDF generation test error:', error);
                alert('PDF generation test error: ' + error.message);
            });
    } else {
        console.error('❌ Web PDF Generator not found');
        alert('Web PDF Generator not found. Make sure the script is loaded.');
    }
}

function previewBillHTML() {
    // Test data that mimics a filled form
    const testBillData = {
        customerName: "John Doe",
        mobileNumber: "9876543210",
        orderDate: "2025-01-08",
        deliveryDate: "2025-01-15",
        orderNumber: "1001",
        paymentAmount: 500
    };

    const testItemizedBill = {
        suit_qty: "0",
        suit_amount: 0,
        safari_qty: "0", 
        safari_amount: 0,
        pant_qty: "1",
        pant_amount: 1000,
        shirt_qty: "0",
        shirt_amount: 0,
        sadri_qty: "0",
        sadri_amount: 0
    };

    if (typeof window.webPDFGenerator !== 'undefined') {
        const billHTML = window.webPDFGenerator.generateBillHTML(testBillData, testItemizedBill);
        
        // Open preview in new window
        const previewWindow = window.open('', '', 'width=500,height=700');
        previewWindow.document.write(`
            <html>
            <head>
                <title>Bill Preview</title>
                <style>
                    body { margin: 20px; background: #f0f0f0; }
                    .preview-container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                </style>
            </head>
            <body>
                <div class="preview-container">
                    <h2>Bill Preview (What will be in PDF)</h2>
                    ${billHTML}
                </div>
            </body>
            </html>
        `);
        previewWindow.document.close();
    } else {
        alert('Web PDF Generator not found');
    }
}

function fillTestData(billData, itemizedBill) {
    // Fill bill data
    const customerNameEl = document.getElementById("customer-name");
    if (customerNameEl) customerNameEl.value = billData.customerName;
    
    const mobileNumberEl = document.getElementById("mobile-number");
    if (mobileNumberEl) mobileNumberEl.value = billData.mobileNumber;
    
    const dateIssueEl = document.getElementById("date_issue");
    if (dateIssueEl) dateIssueEl.value = billData.orderDate;
    
    const deliveryDateEl = document.getElementById("delivery-date");
    if (deliveryDateEl) deliveryDateEl.value = billData.deliveryDate;
    
    const billNumberEl = document.getElementById("billnumberinput2");
    if (billNumberEl) billNumberEl.value = billData.orderNumber;
    
    const advanceAmtEl = document.getElementById("advance_amt");
    if (advanceAmtEl) advanceAmtEl.value = billData.paymentAmount;
    
    // Fill itemized bill data
    const pantQtyEl = document.getElementById('pant_qty');
    if (pantQtyEl) pantQtyEl.value = itemizedBill.pant_qty;
    
    const pantAmtEl = document.getElementById('pant_amount');
    if (pantAmtEl) pantAmtEl.value = itemizedBill.pant_amount;
    
    console.log('Test data filled in form fields');
}

function clearTestData() {
    // Clear all form fields
    const fields = [
        "customer-name", "mobile-number", "date_issue", "delivery-date",
        "billnumberinput2", "advance_amt", "suit_qty", "suit_amount",
        "safari_qty", "safari_amount", "pant_qty", "pant_amount",
        "shirt_qty", "shirt_amount", "sadri_qty", "sadri_amount"
    ];
    
    fields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) element.value = "";
    });
    
    console.log('Test data cleared from form fields');
}

function checkPDFDependencies() {
    console.log('=== PDF Dependencies Check ===');
    console.log('jsPDF available:', typeof window.jsPDF !== 'undefined');
    console.log('html2canvas available:', typeof html2canvas !== 'undefined');
    console.log('webPDFGenerator available:', typeof window.webPDFGenerator !== 'undefined');
    
    if (typeof window.jsPDF === 'undefined') {
        console.error('❌ jsPDF library not found. Make sure it is loaded in your HTML.');
    }
    
    if (typeof html2canvas === 'undefined') {
        console.error('❌ html2canvas library not found. Make sure it is loaded in your HTML.');
    }
    
    if (typeof window.webPDFGenerator === 'undefined') {
        console.error('❌ webPDFGenerator not found. Make sure web-pdf-generator.js is loaded.');
    }
    
    if (typeof window.jsPDF !== 'undefined' && 
        typeof html2canvas !== 'undefined' && 
        typeof window.webPDFGenerator !== 'undefined') {
        console.log('✅ All PDF dependencies are available');
        return true;
    }
    
    return false;
}

// Add test buttons to page (for development/testing)
function addTestButtons() {
    const testContainer = document.createElement('div');
    testContainer.style.position = 'fixed';
    testContainer.style.bottom = '10px';
    testContainer.style.right = '10px';
    testContainer.style.zIndex = '9999';
    testContainer.style.background = 'rgba(0,0,0,0.8)';
    testContainer.style.padding = '10px';
    testContainer.style.borderRadius = '5px';
    testContainer.style.color = 'white';
    testContainer.style.fontSize = '12px';
    
    const title = document.createElement('div');
    title.textContent = 'PDF Test Controls';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '5px';
    testContainer.appendChild(title);
    
    const testBtn = document.createElement('button');
    testBtn.textContent = 'Test PDF Generation';
    testBtn.style.margin = '2px';
    testBtn.style.padding = '5px 10px';
    testBtn.style.fontSize = '11px';
    testBtn.onclick = testPDFGeneration;
    testContainer.appendChild(testBtn);
    
    const checkBtn = document.createElement('button');
    checkBtn.textContent = 'Check Dependencies';
    checkBtn.style.margin = '2px';
    checkBtn.style.padding = '5px 10px';
    checkBtn.style.fontSize = '11px';
    checkBtn.onclick = checkPDFDependencies;
    testContainer.appendChild(checkBtn);
    
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear Test Data';
    clearBtn.style.margin = '2px';
    clearBtn.style.padding = '5px 10px';
    clearBtn.style.fontSize = '11px';
    clearBtn.onclick = clearTestData;
    testContainer.appendChild(clearBtn);
    
    const previewBtn = document.createElement('button');
    previewBtn.textContent = 'Preview Bill HTML';
    previewBtn.style.margin = '2px';
    previewBtn.style.padding = '5px 10px';
    previewBtn.style.fontSize = '11px';
    previewBtn.onclick = previewBillHTML;
    testContainer.appendChild(previewBtn);
    
    document.body.appendChild(testContainer);
}

// Auto-add test buttons on page load (only in development)
document.addEventListener('DOMContentLoaded', function() {
    // Only add test buttons if in development mode
    // You can comment out this line in production
    addTestButtons();
    
    // Automatically check dependencies on load
    setTimeout(checkPDFDependencies, 1000);
});

console.log('PDF Test functions loaded. Use testPDFGeneration() to test.');
