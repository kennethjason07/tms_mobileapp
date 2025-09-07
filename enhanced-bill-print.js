// Enhanced Bill Printing System for Web TMS
// This provides professional bill printing functionality similar to the React Native version

function generateBillHTML() {
    // Debug: Log all form elements to console
    console.log('=== DEBUGGING BILL GENERATION ===');
    
    // Get all the form data with debugging
    const customerName = document.getElementById("customer-name")?.value || '---';
    const mobileNumber = document.getElementById("mobile-number")?.value || '---';
    const orderDate = document.getElementById("date_issue")?.value || document.getElementById("today-date")?.value || '---';
    const deliveryDate = document.getElementById("delivery-date")?.value || document.getElementById("due-date")?.value || '---';
    const orderNumber = document.getElementById("billnumberinput2")?.value || document.getElementById("billnumberinput3")?.value || '---';
    const advanceAmount = parseFloat(document.getElementById("advance_amt")?.value) || 0;
    
    // Debug: Log customer data
    console.log('Customer Data:', {
        customerName,
        mobileNumber,
        orderDate,
        deliveryDate,
        orderNumber,
        advanceAmount
    });
    
    // Get itemized billing data with debugging
    const suitQty = document.getElementById('suit_qty')?.value || '0';
    const suitAmount = parseFloat(document.getElementById('suit_amount')?.value) || 0;
    const safariQty = document.getElementById('safari_qty')?.value || '0';
    const safariAmount = parseFloat(document.getElementById('safari_amount')?.value) || 0;
    const pantQty = document.getElementById('pant_qty')?.value || '0';
    const pantAmount = parseFloat(document.getElementById('pant_amount')?.value) || 0;
    const shirtQty = document.getElementById('shirt_qty')?.value || '0';
    const shirtAmount = parseFloat(document.getElementById('shirt_amount')?.value) || 0;
    const sadriQty = document.getElementById('sadri_qty')?.value || '0';
    const sadriAmount = parseFloat(document.getElementById('sadri_amount')?.value) || 0;
    
    // Debug: Log itemized data
    console.log('Itemized Billing:', {
        suitQty, suitAmount,
        safariQty, safariAmount,
        pantQty, pantAmount,
        shirtQty, shirtAmount,
        sadriQty, sadriAmount
    });
    
    const totalAmount = suitAmount + safariAmount + pantAmount + shirtAmount + sadriAmount;
    const remainingAmount = totalAmount - advanceAmount;
    
    // Debug: Log totals
    console.log('Totals:', {
        totalAmount,
        advanceAmount,
        remainingAmount
    });
    
    // Generate items table rows
    function generateBillItemsTable() {
        const items = [
            { name: 'Suit', qty: suitQty, amount: suitAmount },
            { name: 'Safari/Jacket', qty: safariQty, amount: safariAmount },
            { name: 'Pant', qty: pantQty, amount: pantAmount },
            { name: 'Shirt', qty: shirtQty, amount: shirtAmount },
            { name: 'Sadri', qty: sadriQty, amount: sadriAmount }
        ];
        
        const rows = items
            .filter(item => parseFloat(item.qty) > 0 || parseFloat(item.amount) > 0)
            .map(item => `
                <tr>
                    <td style="text-align: left;">${item.name}</td>
                    <td style="text-align: center;">${item.qty || '0'}</td>
                    <td style="text-align: right;">₹${parseFloat(item.amount || 0).toFixed(2)}</td>
                </tr>
            `).join('');
            
        if (rows === '') {
            return '<tr><td colspan="3" style="text-align: center;">No items added</td></tr>';
        }
        
        return rows;
    }
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Bill - ${orderNumber}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: #f5f5f5;
                    color: #333;
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
                    line-height: 1.4;
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
                .service-message {
                    text-align: center;
                    margin: 15px 0;
                    font-size: 12px;
                    color: #666;
                }
                @media print {
                    body {
                        background: white;
                        padding: 10px;
                    }
                    .bill-container {
                        box-shadow: none;
                        border: 1px solid #ddd;
                    }
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
                    <div><strong>Date:</strong> ${orderDate}</div>
                    <div><strong>No:</strong> ${orderNumber}</div>
                </div>
                
                <div class="customer-info">
                    <div class="info-row">
                        <span><strong>Name:</strong></span>
                        <span>${customerName}</span>
                    </div>
                    <div class="info-row">
                        <span><strong>Order No:</strong></span>
                        <span>${orderNumber}</span>
                    </div>
                    <div class="info-row">
                        <span><strong>Date:</strong></span>
                        <span>${orderDate}</span>
                    </div>
                    <div class="info-row">
                        <span><strong>Cell:</strong></span>
                        <span>${mobileNumber}</span>
                    </div>
                    <div class="info-row">
                        <span><strong>D. Date:</strong></span>
                        <span>${deliveryDate}</span>
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
                        ${generateBillItemsTable()}
                    </tbody>
                </table>
                
                <div class="total-section">
                    <div class="total-row">
                        <span><strong>TOTAL</strong></span>
                        <span class="total-amount">₹${totalAmount.toFixed(2)}</span>
                    </div>
                    ${advanceAmount > 0 ? `
                    <div class="total-row">
                        <span><strong>ADVANCE</strong></span>
                        <span>₹${advanceAmount.toFixed(2)}</span>
                    </div>
                    <div class="total-row">
                        <span><strong>REMAINING</strong></span>
                        <span class="total-amount">₹${remainingAmount.toFixed(2)}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="service-message">
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
}

// Enhanced save and print function
function enhancedSaveAndPrint() {
    const billHTML = generateBillHTML();
    
    // Create a new window for printing
    const printWindow = window.open('', '', 'width=800,height=900,scrollbars=yes');
    
    if (!printWindow) {
        alert('Please allow popups for this website to enable printing.');
        return;
    }
    
    // Write the HTML content to the new window
    printWindow.document.open();
    printWindow.document.write(billHTML);
    printWindow.document.close();
    
    // Wait for the content to load, then print
    printWindow.onload = function() {
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            
            // Close the window after printing (optional)
            printWindow.onafterprint = function() {
                printWindow.close();
            };
        }, 500);
    };
}

// Function to print only measurements
function printMeasurements() {
    const customerName = document.getElementById("customer-name").value || '---';
    const mobileNumber = document.getElementById("mobile-number").value || '---';
    const orderDate = document.getElementById("date_issue").value || '---';
    const deliveryDate = document.getElementById("delivery-date").value || '---';
    
    // Get measurements data
    const measurements = {
        // Pant measurements
        pant_length: document.getElementById("length").value || '',
        pant_kamar: document.getElementById("kamar").value || '',
        pant_hips: document.getElementById("hips").value || '',
        pant_waist: document.getElementById("waist").value || '',
        pant_ghutna: document.getElementById("Ghutna").value || '',
        pant_bottom: document.getElementById("Bottom").value || '',
        pant_seat: document.getElementById("seat").value || '',
        SideP_Cross: document.getElementById("SideP_Cross").value || '',
        Plates: document.getElementById("Plates").value || '',
        Belt: document.getElementById("Belt").value || '',
        Back_P: document.getElementById("Back_P").value || '',
        WP: document.getElementById("WP").value || '',
        
        // Shirt measurements
        shirt_length: document.getElementById("shirtlength").value || '',
        shirt_body: document.getElementById("body").value || '',
        shirt_loose: document.getElementById("Loose").value || '',
        shirt_shoulder: document.getElementById("Shoulder").value || '',
        shirt_astin: document.getElementById("Astin").value || '',
        shirt_collar: document.getElementById("collor").value || '',
        shirt_aloose: document.getElementById("allose").value || '',
        Callar: document.getElementById("Callar").value || '',
        Cuff: document.getElementById("Cuff").value || '',
        Pkt: document.getElementById("Pkt").value || '',
        LooseShirt: document.getElementById("LooseShirt").value || '',
        DT_TT: document.getElementById("DT_TT").value || '',
        
        // Extra measurements
        extra_measurements: document.getElementById("extra-input").value || ''
    };
    
    function generateMeasurementsTable(measurements) {
        const labelize = (key) => 
            key.replace(/_/g, ' ')
               .replace(/([a-z])([A-Z])/g, '$1 $2')
               .replace(/\b\w/g, (l) => l.toUpperCase());
        
        const entries = Object.entries(measurements).filter(
            ([, value]) => value !== '' && value !== null && value !== undefined
        );
        
        if (entries.length === 0) {
            return '<tr><td colspan="2">No measurements entered.</td></tr>';
        }
        
        return entries
            .map(([key, value]) => 
                `<tr><td>${labelize(key)}</td><td>${value}</td></tr>`
            )
            .join('');
    }
    
    const measurementHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Customer Measurement Sheet</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 20px;
                    background: white;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 20px;
                }
                .info-table, .measure-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 16px; 
                }
                .info-table td { 
                    padding: 8px 12px; 
                    border: 1px solid #ddd;
                }
                .measure-table th, .measure-table td { 
                    border: 1px solid #333; 
                    padding: 8px; 
                    text-align: left; 
                }
                .measure-table th { 
                    background: #eee; 
                    font-weight: bold;
                }
                .footer { 
                    text-align: center; 
                    margin-top: 24px; 
                    font-size: 14px; 
                }
                @media print {
                    body {
                        margin: 10px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>Yak's Men's Wear</h2>
                <div>Customer Measurement Sheet</div>
            </div>
            
            <table class="info-table">
                <tr>
                    <td><b>Customer Name:</b> ${customerName}</td>
                    <td><b>Mobile Number:</b> ${mobileNumber}</td>
                </tr>
                <tr>
                    <td><b>Date:</b> ${orderDate}</td>
                    <td><b>Delivery Date:</b> ${deliveryDate}</td>
                </tr>
            </table>
            
            <h3>All Measurements</h3>
            <table class="measure-table">
                <tr>
                    <th>Measurement</th>
                    <th>Value</th>
                </tr>
                ${generateMeasurementsTable(measurements)}
            </table>
            
            <div class="footer">
                Thank You, Visit Again!
            </div>
        </body>
        </html>
    `;
    
    const printWindow = window.open('', '', 'width=800,height=900,scrollbars=yes');
    
    if (!printWindow) {
        alert('Please allow popups for this website to enable printing.');
        return;
    }
    
    printWindow.document.open();
    printWindow.document.write(measurementHTML);
    printWindow.document.close();
    
    printWindow.onload = function() {
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.onafterprint = function() {
                printWindow.close();
            };
        }, 500);
    };
}

// Function to download bill as PDF (alternative method)
function downloadBillAsPDF() {
    const billHTML = generateBillHTML();
    
    // Create a temporary div to hold the content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = billHTML;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);
    
    // Use html2canvas and jsPDF if available
    if (window.html2canvas && window.jsPDF) {
        html2canvas(tempDiv.firstElementChild, {
            scale: 2,
            useCORS: true,
            allowTaint: true
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            
            let position = 0;
            
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            const orderNumber = document.getElementById("billnumberinput2").value || 
                               document.getElementById("billnumberinput3").value || 'bill';
            pdf.save(`bill-${orderNumber}.pdf`);
            
            document.body.removeChild(tempDiv);
        });
    } else {
        console.warn('html2canvas or jsPDF not available. Falling back to print.');
        document.body.removeChild(tempDiv);
        enhancedSaveAndPrint();
    }
}
