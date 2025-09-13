// Fixed Web PDF Generation System for TMS
// This version fixes the width scaling issue for proper print dimensions

class FixedWebPDFGenerator {
    constructor() {
        // Check if required libraries are available
        if (typeof window.jsPDF === 'undefined') {
            console.error('jsPDF library is not loaded');
        }
        if (typeof html2canvas === 'undefined') {
            console.error('html2canvas library is not loaded');
        }
        
        // Calculate proper dimensions for consistent print output
        this.PRINT_SETTINGS = {
            // For receipt-style bills (narrow format)
            receiptWidth: 106, // mm - actual desired print width
            receiptPixels: 400, // px - screen design width
            
            // For A4 format (wide format)
            a4Width: 190, // mm - A4 width minus margins
            a4Pixels: 718, // px - equivalent pixels for A4 width
            
            // PDF settings
            pdfMarginLeft: 10, // mm
            pdfMarginTop: 10, // mm
        };
    }

    // Generate Bill PDF with correct width scaling
    async generateBillPDF(format = 'receipt') {
        try {
            console.log(`Starting ${format} bill PDF generation...`);
            
            // Get bill data from form
            const billData = this.collectBillData();
            const itemizedBill = this.collectItemizedBillData();
            
            console.log('Collected bill data:', billData);
            console.log('Collected itemized bill:', itemizedBill);
            
            // Generate HTML content with correct width for format
            const billHTML = this.generateBillHTML(billData, itemizedBill, format);
            
            // Create a temporary container for PDF generation
            const tempContainer = this.createTempContainer(billHTML, format);
            
            // Wait for the DOM to render the content
            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log('Temporary container created and rendered');
            
            // Generate PDF from HTML with correct scaling
            const pdfBlob = await this.htmlToPDF(tempContainer, format);
            
            // Clean up temporary container
            tempContainer.remove();
            
            // Download the PDF
            this.downloadPDF(pdfBlob, `Bill_${billData.orderNumber || Date.now()}_${format}.pdf`);
            
            console.log(`${format} bill PDF generated successfully`);
            return true;
            
        } catch (error) {
            console.error('Error generating bill PDF:', error);
            console.error('Error stack:', error.stack);
            alert(`Failed to generate bill PDF: ${error.message}`);
            return false;
        }
    }

    // Collect bill data from form elements
    collectBillData() {
        return {
            customerName: document.getElementById("customer-name")?.value || '---',
            mobileNumber: document.getElementById("mobile-number")?.value || '---',
            orderDate: document.getElementById("date_issue")?.value || document.getElementById("today-date")?.value || new Date().toISOString().split('T')[0],
            deliveryDate: document.getElementById("delivery-date")?.value || document.getElementById("due-date")?.value || '---',
            orderNumber: document.getElementById("billnumberinput2")?.value || document.getElementById("billnumberinput3")?.value || '---',
            paymentAmount: parseFloat(document.getElementById("advance_amt")?.value) || 0,
            paymentMode: document.getElementById("Payment")?.value || '---',
            paymentStatus: document.getElementById("payementstatus")?.value || '---'
        };
    }

    // Collect itemized bill data from form elements
    collectItemizedBillData() {
        return {
            suit_qty: document.getElementById('suit_qty')?.value || '0',
            suit_amount: parseFloat(document.getElementById('suit_amount')?.value) || 0,
            safari_qty: document.getElementById('safari_qty')?.value || '0',
            safari_amount: parseFloat(document.getElementById('safari_amount')?.value) || 0,
            pant_qty: document.getElementById('pant_qty')?.value || '0',
            pant_amount: parseFloat(document.getElementById('pant_amount')?.value) || 0,
            shirt_qty: document.getElementById('shirt_qty')?.value || '0',
            shirt_amount: parseFloat(document.getElementById('shirt_amount')?.value) || 0,
            sadri_qty: document.getElementById('sadri_qty')?.value || '0',
            sadri_amount: parseFloat(document.getElementById('sadri_amount')?.value) || 0
        };
    }

    // Generate HTML for bill PDF with format-specific width
    generateBillHTML(billData, itemizedBill, format = 'receipt') {
        const totalAmount = (parseFloat(itemizedBill.suit_amount) || 0) + 
                           (parseFloat(itemizedBill.safari_amount) || 0) + 
                           (parseFloat(itemizedBill.pant_amount) || 0) + 
                           (parseFloat(itemizedBill.shirt_amount) || 0) + 
                           (parseFloat(itemizedBill.sadri_amount) || 0);

        const remainingAmount = totalAmount - (parseFloat(billData.paymentAmount) || 0);

        // Set width based on format
        const containerWidth = format === 'a4' ? this.PRINT_SETTINGS.a4Pixels : this.PRINT_SETTINGS.receiptPixels;
        
        // Generate items table
        const itemsTable = this.generateItemsTableHTML(itemizedBill);

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Bill - ${billData.orderNumber}</title>
                <style>
                    @page {
                        size: ${format === 'a4' ? 'A4' : `${this.PRINT_SETTINGS.receiptWidth}mm 297mm`};
                        margin: ${this.PRINT_SETTINGS.pdfMarginTop}mm ${this.PRINT_SETTINGS.pdfMarginLeft}mm;
                    }
                    
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        background: white;
                        color: #333;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    
                    .bill-container {
                        width: ${containerWidth}px;
                        margin: 0;
                        background: white;
                        font-size: 12px;
                        color: #333;
                        box-sizing: border-box;
                    }
                </style>
            </head>
            <body>
                <div class="bill-container">
                    <!-- Header Section -->
                    <div style="
                        background: #4a4a4a;
                        color: white;
                        padding: 8px 12px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    ">
                        <!-- Left: Logo and Shop Name -->
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="
                                background: white;
                                color: #333;
                                width: 32px;
                                height: 32px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-weight: bold;
                                font-size: 14px;
                                border-radius: 2px;
                            ">Y</div>
                            <div>
                                <div style="font-size: 16px; font-weight: bold; color: #ff6600; margin: 0; line-height: 1;">Yak's</div>
                                <div style="font-size: 10px; color: white; margin: 0; line-height: 1;">Prop : Jaganath Sidda</div>
                            </div>
                            <div style="color: #ff6600; font-size: 16px; font-weight: bold; margin-left: 4px;">Men's Wear</div>
                        </div>
                        
                        <!-- Right: Contact Info -->
                        <div style="text-align: right; font-size: 9px; line-height: 1.2;">
                            <div>Shop : 8660897168</div>
                            <div>9448678033</div>
                        </div>
                    </div>
                    
                    <!-- Address Bar -->
                    <div style="background: #f5f5f5; padding: 4px 12px; font-size: 9px; text-align: center; border-bottom: 1px solid #ddd;">
                        Sulgunte Complex, Opp. Old Service Stand, Near SBI Bank, BIDAR-585 401 (K.S.)
                    </div>
                    
                    <!-- Customer Information Section -->
                    <div style="padding: 12px;">
                        <div style="text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 12px; color: #333;">
                            Customer Information
                        </div>
                        
                        <!-- Order Number -->
                        <div style="margin-bottom: 8px;">
                            <span style="color: #0066cc; font-weight: bold; font-size: 11px;">Order Number: </span>
                            <span style="color: #0066cc; font-size: 11px;">${billData.orderNumber}</span>
                        </div>
                        
                        <!-- Customer Details Grid -->
                        <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                            <div style="flex: 1;">
                                <div style="font-weight: bold; color: #333; font-size: 11px; margin-bottom: 3px;">Customer Name:</div>
                                <div style="background: #f9f9f9; border: 1px solid #ddd; padding: 4px 6px; font-size: 11px; min-height: 16px;">
                                    ${billData.customerName}
                                </div>
                            </div>
                            <div style="flex: 1;">
                                <div style="font-weight: bold; color: #333; font-size: 11px; margin-bottom: 3px;">Mobile Number:</div>
                                <div style="background: #f9f9f9; border: 1px solid #ddd; padding: 4px 6px; font-size: 11px; min-height: 16px;">
                                    ${billData.mobileNumber}
                                </div>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                            <div style="flex: 1;">
                                <div style="font-weight: bold; color: #333; font-size: 11px; margin-bottom: 3px;">Date:</div>
                                <div style="background: #f9f9f9; border: 1px solid #ddd; padding: 4px 6px; font-size: 11px; min-height: 16px;">
                                    ${billData.orderDate}
                                </div>
                            </div>
                            <div style="flex: 1;">
                                <div style="font-weight: bold; color: #333; font-size: 11px; margin-bottom: 3px;">Delivery Date:</div>
                                <div style="background: #f9f9f9; border: 1px solid #ddd; padding: 4px 6px; font-size: 11px; min-height: 16px;">
                                    ${billData.deliveryDate}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Items Table -->
                        ${itemsTable}
                        
                        <!-- Payment Summary -->
                        <div style="margin-top: 16px; padding: 12px; background: #f9f9f9; border: 1px solid #ddd;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                                <span style="font-weight: bold;">Total Amount:</span>
                                <span style="font-weight: bold;">₹${totalAmount.toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                                <span>Advance Paid:</span>
                                <span>₹${(parseFloat(billData.paymentAmount) || 0).toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding-top: 6px; border-top: 1px solid #ccc;">
                                <span style="font-weight: bold; color: #d63384;">Balance Due:</span>
                                <span style="font-weight: bold; color: #d63384;">₹${Math.max(0, remainingAmount).toFixed(2)}</span>
                            </div>
                        </div>
                        
                        <!-- Service Message -->
                        <div style="text-align: center; margin: 16px 0; padding: 8px; background: #e7f3ff; border: 1px solid #b6d7ff;">
                            <div style="font-weight: bold; color: #0066cc; margin-bottom: 4px;">Good Service • Prompt Delivery</div>
                        </div>
                        
                        <!-- Terms & Conditions -->
                        <div style="margin-top: 20px; padding: 12px; background: #fff3cd; border: 1px solid #ffc107;">
                            <div style="font-weight: bold; font-size: 12px; margin-bottom: 8px; color: #856404;">Terms & Conditions:</div>
                            <ul style="font-size: 10px; margin: 0; padding-left: 16px; color: #856404;">
                                <li>Please bring this receipt while collecting your order</li>
                                <li>Management will not be responsible after 2 months</li>
                                <li>No exchanges after 7pm daily</li>
                            </ul>
                        </div>
                        
                        <!-- Footer -->
                        <div style="text-align: center; margin-top: 20px; padding-top: 12px; border-top: 1px solid #ddd;">
                            <div style="font-size: 12px; font-weight: bold; color: #333; margin-bottom: 4px;">Thank You for Your Business!</div>
                            <div style="font-size: 10px; color: #666;">Sunday Holiday</div>
                            <div style="margin-top: 16px; border-top: 1px solid #ddd; padding-top: 8px;">
                                <div style="font-size: 10px; color: #666;">Customer Signature: _________________</div>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // Generate items table HTML
    generateItemsTableHTML(itemizedBill) {
        const items = [
            { name: 'Suit', qty: itemizedBill.suit_qty, amount: itemizedBill.suit_amount },
            { name: 'Safari/Jacket', qty: itemizedBill.safari_qty, amount: itemizedBill.safari_amount },
            { name: 'Pant', qty: itemizedBill.pant_qty, amount: itemizedBill.pant_amount },
            { name: 'Shirt', qty: itemizedBill.shirt_qty, amount: itemizedBill.shirt_amount },
            { name: 'Sadri', qty: itemizedBill.sadri_qty, amount: itemizedBill.sadri_amount }
        ];

        const activeItems = items.filter(item => 
            (parseFloat(item.qty) || 0) > 0 || (parseFloat(item.amount) || 0) > 0
        );

        if (activeItems.length === 0) {
            return `
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #333; font-size: 11px; margin: 16px 0;">
                    <thead>
                        <tr style="background: #f0f0f0;">
                            <th style="border: 1px solid #333; padding: 6px 8px; text-align: center; font-weight: bold;">Particulars</th>
                            <th style="border: 1px solid #333; padding: 6px 8px; text-align: center; font-weight: bold; width: 60px;">Qty</th>
                            <th style="border: 1px solid #333; padding: 6px 8px; text-align: center; font-weight: bold; width: 80px;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="3" style="border: 1px solid #333; padding: 12px; text-align: center; font-style: italic; color: #666;">
                                No items added to this bill
                            </td>
                        </tr>
                    </tbody>
                </table>
            `;
        }

        const rows = activeItems.map(item => `
            <tr>
                <td style="border: 1px solid #333; padding: 6px 8px; text-align: left;">${item.name}</td>
                <td style="border: 1px solid #333; padding: 6px 8px; text-align: center;">${item.qty || '0'}</td>
                <td style="border: 1px solid #333; padding: 6px 8px; text-align: right;">₹${(parseFloat(item.amount) || 0).toFixed(2)}</td>
            </tr>
        `).join('');

        return `
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #333; font-size: 11px; margin: 16px 0;">
                <thead>
                    <tr style="background: #f0f0f0;">
                        <th style="border: 1px solid #333; padding: 6px 8px; text-align: center; font-weight: bold;">Particulars</th>
                        <th style="border: 1px solid #333; padding: 6px 8px; text-align: center; font-weight: bold; width: 60px;">Qty</th>
                        <th style="border: 1px solid #333; padding: 6px 8px; text-align: center; font-weight: bold; width: 80px;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    }

    // Create temporary container for PDF generation with correct width
    createTempContainer(htmlContent, format) {
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        
        // Set width based on format
        const containerWidth = format === 'a4' ? this.PRINT_SETTINGS.a4Pixels : this.PRINT_SETTINGS.receiptPixels;
        tempDiv.style.width = `${containerWidth}px`;
        
        tempDiv.style.backgroundColor = 'white';
        tempDiv.style.fontFamily = 'Arial, sans-serif';
        tempDiv.style.padding = '0';
        tempDiv.style.margin = '0';
        tempDiv.innerHTML = htmlContent;
        document.body.appendChild(tempDiv);
        
        console.log(`Temporary container created with ${format} format`);
        console.log('Container dimensions:', tempDiv.offsetWidth, 'x', tempDiv.offsetHeight);
        
        return tempDiv;
    }

    // Convert HTML to PDF with correct scaling
    async htmlToPDF(element, format = 'receipt') {
        try {
            console.log(`Starting ${format} PDF conversion...`);
            
            // Configure html2canvas options for better quality and correct scaling
            const canvasOptions = {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: element.scrollWidth,
                height: element.scrollHeight
            };

            console.log('Generating canvas...');
            const canvas = await html2canvas(element, canvasOptions);
            
            console.log('Canvas generated successfully');
            console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
            
            // Create jsPDF instance with correct page size
            const { jsPDF } = window.jsPDF;
            
            let pdf;
            let pdfWidth;
            
            if (format === 'a4') {
                // A4 format
                pdf = new jsPDF('p', 'mm', 'a4');
                pdfWidth = this.PRINT_SETTINGS.a4Width;
            } else {
                // Receipt format - custom paper size
                const paperWidth = this.PRINT_SETTINGS.receiptWidth + (this.PRINT_SETTINGS.pdfMarginLeft * 2);
                const paperHeight = 297; // A4 height
                pdf = new jsPDF('p', 'mm', [paperWidth, paperHeight]);
                pdfWidth = this.PRINT_SETTINGS.receiptWidth;
            }
            
            // Calculate height maintaining aspect ratio
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            console.log(`${format.toUpperCase()} PDF dimensions:`, pdfWidth, 'x', pdfHeight, 'mm');
            
            // Add image to PDF at correct position and size
            const imgData = canvas.toDataURL('image/png', 0.95);
            pdf.addImage(
                imgData, 
                'PNG', 
                this.PRINT_SETTINGS.pdfMarginLeft, 
                this.PRINT_SETTINGS.pdfMarginTop, 
                pdfWidth, 
                pdfHeight
            );

            console.log('PDF created successfully');
            return pdf.output('blob');

        } catch (error) {
            console.error('Error converting HTML to PDF:', error);
            throw error;
        }
    }

    // Download PDF file
    downloadPDF(pdfBlob, filename) {
        try {
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            console.log(`PDF downloaded: ${filename}`);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            throw error;
        }
    }
}

// Initialize the fixed PDF generator
window.fixedWebPDFGenerator = new FixedWebPDFGenerator();

// Export convenience functions
window.generateReceiptBillPDF = () => window.fixedWebPDFGenerator.generateBillPDF('receipt');
window.generateA4BillPDF = () => window.fixedWebPDFGenerator.generateBillPDF('a4');

console.log('Fixed Web PDF Generator initialized successfully');
console.log('Use generateReceiptBillPDF() for 106mm width or generateA4BillPDF() for A4 width');
