// Debug Test Functions for Bill Printing

// Function to test with sample data
function testBillWithSampleData() {
    console.log('=== TESTING WITH SAMPLE DATA ===');
    
    // Fill form with sample data for testing
    if (document.getElementById("customer-name")) {
        document.getElementById("customer-name").value = "John Doe";
    }
    if (document.getElementById("mobile-number")) {
        document.getElementById("mobile-number").value = "9876543210";
    }
    if (document.getElementById("date_issue")) {
        document.getElementById("date_issue").value = "2024-01-15";
    }
    if (document.getElementById("delivery-date")) {
        document.getElementById("delivery-date").value = "2024-01-20";
    }
    if (document.getElementById("billnumberinput2")) {
        document.getElementById("billnumberinput2").value = "1001";
    }
    if (document.getElementById("advance_amt")) {
        document.getElementById("advance_amt").value = "500";
    }
    
    // Fill some itemized billing data
    if (document.getElementById("suit_qty")) {
        document.getElementById("suit_qty").value = "1";
    }
    if (document.getElementById("suit_amount")) {
        document.getElementById("suit_amount").value = "2500";
    }
    if (document.getElementById("shirt_qty")) {
        document.getElementById("shirt_qty").value = "2";
    }
    if (document.getElementById("shirt_amount")) {
        document.getElementById("shirt_amount").value = "1200";
    }
    
    // Recalculate totals
    if (typeof calculateTotals === 'function') {
        calculateTotals();
    }
    
    console.log('Sample data filled. Now calling enhanced print...');
    
    // Now try to print
    if (typeof enhancedSaveAndPrint === 'function') {
        enhancedSaveAndPrint();
    } else {
        console.error('enhancedSaveAndPrint function not found!');
    }
}

// Function to check what elements exist on the page
function debugFormElements() {
    console.log('=== DEBUGGING FORM ELEMENTS ===');
    
    const elementsToCheck = [
        'customer-name', 'mobile-number', 'date_issue', 'delivery-date',
        'billnumberinput2', 'billnumberinput3', 'advance_amt',
        'suit_qty', 'suit_amount', 'safari_qty', 'safari_amount',
        'pant_qty', 'pant_amount', 'shirt_qty', 'shirt_amount',
        'sadri_qty', 'sadri_amount'
    ];
    
    elementsToCheck.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`✅ ${id}: exists, value = "${element.value}"`);
        } else {
            console.log(`❌ ${id}: NOT FOUND`);
        }
    });
}

// Function to inspect the current form values
function inspectCurrentFormValues() {
    console.log('=== CURRENT FORM VALUES ===');
    
    // Customer info
    const customerName = document.getElementById("customer-name")?.value || 'EMPTY';
    const mobileNumber = document.getElementById("mobile-number")?.value || 'EMPTY';
    const orderDate = document.getElementById("date_issue")?.value || 'EMPTY';
    const deliveryDate = document.getElementById("delivery-date")?.value || 'EMPTY';
    const orderNumber = document.getElementById("billnumberinput2")?.value || 'EMPTY';
    const advanceAmount = document.getElementById("advance_amt")?.value || 'EMPTY';
    
    console.log('Customer Info:', {
        customerName, mobileNumber, orderDate, deliveryDate, orderNumber, advanceAmount
    });
    
    // Billing info
    const suitQty = document.getElementById('suit_qty')?.value || 'EMPTY';
    const suitAmount = document.getElementById('suit_amount')?.value || 'EMPTY';
    const shirtQty = document.getElementById('shirt_qty')?.value || 'EMPTY';
    const shirtAmount = document.getElementById('shirt_amount')?.value || 'EMPTY';
    const totalAmt = document.getElementById('total_amt')?.value || 'EMPTY';
    
    console.log('Billing Info:', {
        suitQty, suitAmount, shirtQty, shirtAmount, totalAmt
    });
}

// Add test buttons to the page
function addTestButtons() {
    const testContainer = document.createElement('div');
    testContainer.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #f0f0f0;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 5px;
        z-index: 1000;
        font-family: Arial, sans-serif;
        font-size: 12px;
    `;
    
    testContainer.innerHTML = `
        <h4 style="margin: 0 0 10px 0;">Debug Tools</h4>
        <button onclick="debugFormElements()" style="display: block; margin: 2px 0;">Check Elements</button>
        <button onclick="inspectCurrentFormValues()" style="display: block; margin: 2px 0;">Check Values</button>
        <button onclick="testBillWithSampleData()" style="display: block; margin: 2px 0;">Test with Sample</button>
        <button onclick="enhancedSaveAndPrint()" style="display: block; margin: 2px 0;">Print Current</button>
    `;
    
    document.body.appendChild(testContainer);
}

// Auto-add test buttons when page loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        addTestButtons();
    }, 1000);
});
