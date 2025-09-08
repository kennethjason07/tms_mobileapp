// Web PDF Generation System for TMS
// This provides professional PDF generation functionality for bills and measurements
// Uses jsPDF and html2canvas libraries for web compatibility

class WebPDFGenerator {
    constructor() {
        // Check if required libraries are available
        if (typeof window.jsPDF === 'undefined') {
            console.error('jsPDF library is not loaded');
        }
        if (typeof html2canvas === 'undefined') {
            console.error('html2canvas library is not loaded');
        }
    }

    // Generate Bill PDF using HTML to PDF conversion
    async generateBillPDF() {
        try {
            console.log('Starting bill PDF generation...');
            
            // Get bill data from form
            const billData = this.collectBillData();
            const itemizedBill = this.collectItemizedBillData();
            
            console.log('Collected bill data:', billData);
            console.log('Collected itemized bill:', itemizedBill);
            
            // Generate HTML content for the bill
            const billHTML = this.generateBillHTML(billData, itemizedBill);
            
            console.log('Generated HTML length:', billHTML.length);
            
            // Create a temporary container for PDF generation
            const tempContainer = this.createTempContainer(billHTML);
            
            // Wait for the DOM to render the content
            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log('Temporary container created and rendered');
            
            // Generate PDF from HTML
            const pdfBlob = await this.htmlToPDF(tempContainer, 'bill');
            
            // Clean up temporary container
            tempContainer.remove();
            
            // Download the PDF
            this.downloadPDF(pdfBlob, `Bill_${billData.orderNumber || Date.now()}.pdf`);
            
            console.log('Bill PDF generated successfully');
            return true;
            
        } catch (error) {
            console.error('Error generating bill PDF:', error);
            console.error('Error stack:', error.stack);
            alert(`Failed to generate bill PDF: ${error.message}`);
            return false;
        }
    }

    // Generate Measurement PDF
    async generateMeasurementPDF() {
        try {
            console.log('Starting measurement PDF generation...');
            
            // Get measurement data from form
            const billData = this.collectBillData();
            const measurements = this.collectMeasurementData();
            
            // Generate HTML content for measurements
            const measurementHTML = this.generateMeasurementHTML(billData, measurements);
            
            // Create a temporary container for PDF generation
            const tempContainer = this.createTempContainer(measurementHTML);
            
            // Generate PDF from HTML
            const pdfBlob = await this.htmlToPDF(tempContainer, 'measurement');
            
            // Clean up temporary container
            tempContainer.remove();
            
            // Download the PDF
            this.downloadPDF(pdfBlob, `Measurements_${billData.customerName || 'Customer'}.pdf`);
            
            console.log('Measurement PDF generated successfully');
            return true;
            
        } catch (error) {
            console.error('Error generating measurement PDF:', error);
            alert('Failed to generate measurement PDF. Please try again.');
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

    // Collect measurement data from form elements
    collectMeasurementData() {
        return {
            // Pant measurements
            pant_length: document.getElementById("length")?.value || '',
            pant_kamar: document.getElementById("kamar")?.value || '',
            pant_hips: document.getElementById("hips")?.value || '',
            pant_waist: document.getElementById("waist")?.value || '',
            pant_ghutna: document.getElementById("Ghutna")?.value || '',
            pant_bottom: document.getElementById("Bottom")?.value || '',
            pant_seat: document.getElementById("seat")?.value || '',
            SideP_Cross: document.getElementById("SideP_Cross")?.value || '',
            Plates: document.getElementById("Plates")?.value || '',
            Belt: document.getElementById("Belt")?.value || '',
            Back_P: document.getElementById("Back_P")?.value || '',
            WP: document.getElementById("WP")?.value || '',
            
            // Shirt measurements
            shirt_length: document.getElementById("shirtlength")?.value || '',
            shirt_body: document.getElementById("body")?.value || '',
            shirt_loose: document.getElementById("Loose")?.value || '',
            shirt_shoulder: document.getElementById("Shoulder")?.value || '',
            shirt_astin: document.getElementById("Astin")?.value || '',
            shirt_collar: document.getElementById("collor")?.value || '',
            shirt_aloose: document.getElementById("allose")?.value || '',
            Callar: document.getElementById("Callar")?.value || '',
            Cuff: document.getElementById("Cuff")?.value || '',
            Pkt: document.getElementById("Pkt")?.value || '',
            LooseShirt: document.getElementById("LooseShirt")?.value || '',
            DT_TT: document.getElementById("DT_TT")?.value || '',
            
            // Extra measurements
            extra_measurements: document.getElementById("extra-input")?.value || ''
        };
    }

    // Generate HTML for bill PDF (matching reference image exactly)
    generateBillHTML(billData, itemizedBill) {
        const totalAmount = (parseFloat(itemizedBill.suit_amount) || 0) + 
                           (parseFloat(itemizedBill.safari_amount) || 0) + 
                           (parseFloat(itemizedBill.pant_amount) || 0) + 
                           (parseFloat(itemizedBill.shirt_amount) || 0) + 
                           (parseFloat(itemizedBill.sadri_amount) || 0);

        return `
            <div class="bill-container" style="
                width: 400px;
                margin: 0;
                background: white;
                border: 1px solid #ddd;
                font-family: Arial, sans-serif;
                font-size: 12px;
                color: #333;
                box-shadow: 0 0 5px rgba(0,0,0,0.1);
            ">
                <!-- Header Section -->
                <div style="
                    background: #4a4a4a;
                    color: white;
                    padding: 8px 12px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
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
                    
                    <!-- Main Content Area with Table and Specialist -->
                    <div style="display: flex; gap: 12px; align-items: flex-start;">
                        <!-- Items Table -->
                        <div style="flex: 1;">
                            <table style="width: 100%; border-collapse: collapse; border: 1px solid #333; font-size: 11px;">
                                <thead>
                                    <tr style="background: #f0f0f0;">
                                        <th style="border: 1px solid #333; padding: 6px 8px; text-align: center; font-weight: bold;">Particulars</th>
                                        <th style="border: 1px solid #333; padding: 6px 8px; text-align: center; font-weight: bold; width: 60px;">Qty</th>
                                        <th style="border: 1px solid #333; padding: 6px 8px; text-align: center; font-weight: bold; width: 80px;">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${this.generateBillItemsTable(itemizedBill)}
                                    <tr style="background: #f8f8f8; font-weight: bold;">
                                        <td style="border: 1px solid #333; padding: 6px 8px; text-align: left;"><strong>Total</strong></td>
                                        <td style="border: 1px solid #333; padding: 6px 8px; text-align: center;"><strong>${this.getTotalQuantity(itemizedBill)}</strong></td>
                                        <td style="border: 1px solid #333; padding: 6px 8px; text-align: center;"><strong>${totalAmount.toFixed(2)}</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- Suit Specialist Panel -->
                        <div style="
                            width: 80px;
                            background: #333;
                            color: white;
                            padding: 8px;
                            text-align: center;
                            border-radius: 4px;
                            font-size: 8px;
                            line-height: 1.2;
                        ">
                            <div style="font-weight: bold; margin-bottom: 4px; font-size: 9px;">SUIT SPECIALIST</div>
                            <div style="
                                width: 50px;
                                height: 60px;
                                background: white;
                                margin: 0 auto 6px;
                                border-radius: 4px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: #333;
                                font-size: 24px;
                            ">
                                👔
                            </div>
                            <div style="margin-bottom: 2px;">Latest Collection</div>
                            <div style="margin-bottom: 2px;">Always Available</div>
                            <div style="margin-bottom: 2px;">Stitching Delivery</div>
                            <div style="margin-bottom: 2px;">Service Available</div>
                            <div>Wash & Servicing</div>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="text-align: center; padding: 8px; border-top: 1px solid #ddd; font-size: 11px;">
                    <div style="font-weight: bold; color: #333;">Thank You, Visit Again!</div>
                    <div style="color: #ff6600; margin-top: 2px; font-weight: bold;">Sunday Holiday</div>
                </div>
            </div>
        `;
    }

    // Generate bill items table HTML (matching reference image format)
    generateBillItemsTable(itemizedBill) {
        const items = [
            { name: 'Suit', qty: itemizedBill.suit_qty, amount: itemizedBill.suit_amount },
            { name: 'Safari/Jacket', qty: itemizedBill.safari_qty, amount: itemizedBill.safari_amount },
            { name: 'Pant', qty: itemizedBill.pant_qty, amount: itemizedBill.pant_amount },
            { name: 'Shirt', qty: itemizedBill.shirt_qty, amount: itemizedBill.shirt_amount },
            { name: 'Sadri', qty: itemizedBill.sadri_qty, amount: itemizedBill.sadri_amount }
        ];
        
        // Always show all items (like in reference image), even if qty/amount is 0
        const rows = items.map(item => {
            const amount = parseFloat(item.amount) || 0;
            const displayQty = item.qty && item.qty !== '0' ? item.qty : '';
            const displayAmount = amount > 0 ? amount.toFixed(2) : '';
            return `
                <tr>
                    <td style="border: 1px solid #333; padding: 6px 8px; text-align: left;">${item.name}</td>
                    <td style="border: 1px solid #333; padding: 6px 8px; text-align: center;">${displayQty}</td>
                    <td style="border: 1px solid #333; padding: 6px 8px; text-align: center;">${displayAmount}</td>
                </tr>
            `;
        }).join('');
        
        return rows;
    }

    // Get total quantity for bill
    getTotalQuantity(itemizedBill) {
        const totalQty = parseInt(itemizedBill.suit_qty || 0) + 
                        parseInt(itemizedBill.safari_qty || 0) + 
                        parseInt(itemizedBill.pant_qty || 0) + 
                        parseInt(itemizedBill.shirt_qty || 0) + 
                        parseInt(itemizedBill.sadri_qty || 0);
        return totalQty > 0 ? totalQty : '';
    }

    // Generate HTML for measurement PDF (based on documentation)
    generateMeasurementHTML(billData, measurements) {
        return `
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Customer Measurement Sheet</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 20px;
                        background: white;
                        color: #333;
                        line-height: 1.4;
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 20px;
                    }
                    .header h2 {
                        margin: 0;
                        font-size: 24px;
                        color: #333;
                    }
                    .header div {
                        font-size: 16px;
                        color: #ff6600;
                        margin: 10px 0;
                    }
                    .info-table, .measure-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-top: 16px; 
                    }
                    .info-table td { 
                        padding: 8px 12px; 
                        border: 1px solid #ddd;
                        font-size: 14px;
                    }
                    .measure-table th, .measure-table td { 
                        border: 1px solid #333; 
                        padding: 8px; 
                        text-align: left; 
                        font-size: 14px;
                    }
                    .measure-table th { 
                        background: #eee; 
                        font-weight: bold;
                    }
                    .footer { 
                        text-align: center; 
                        margin-top: 24px; 
                        font-size: 16px; 
                        font-weight: bold;
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
                        <td><b>Customer Name:</b> ${billData.customerName}</td>
                        <td><b>Mobile Number:</b> ${billData.mobileNumber}</td>
                    </tr>
                    <tr>
                        <td><b>Date:</b> ${billData.orderDate}</td>
                        <td><b>Delivery Date:</b> ${billData.deliveryDate}</td>
                    </tr>
                </table>
                <h3>All Measurements</h3>
                <table class="measure-table">
                    <tr>
                        <th>Measurement</th>
                        <th>Value</th>
                    </tr>
                    ${this.generateAllMeasurementsTable(measurements)}
                </table>
                <div class="footer">
                    Thank You, Visit Again!
                </div>
            </body>
            </html>
        `;
    }

    // Generate measurements table HTML
    generateAllMeasurementsTable(measurements) {
        const labelize = (key) =>
            key
                .replace(/_/g, ' ')
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

    // Create temporary container for PDF generation
    createTempContainer(htmlContent) {
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        tempDiv.style.width = '400px';
        tempDiv.style.backgroundColor = 'white';
        tempDiv.style.fontFamily = 'Arial, sans-serif';
        tempDiv.style.padding = '0';
        tempDiv.style.margin = '0';
        tempDiv.innerHTML = htmlContent;
        document.body.appendChild(tempDiv);
        
        console.log('Temporary container created with content');
        console.log('Container dimensions:', tempDiv.offsetWidth, 'x', tempDiv.offsetHeight);
        
        return tempDiv;
    }

    // Convert HTML to PDF using html2canvas and jsPDF
    async htmlToPDF(element, type = 'bill') {
        try {
            console.log('Starting PDF conversion...');
            console.log('Element to convert:', element);
            
            // Find the bill container within the element
            const billContainer = element.querySelector('.bill-container');
            if (!billContainer) {
                console.error('Bill container not found in element');
                throw new Error('Bill container not found');
            }
            
            console.log('Bill container found:', billContainer);
            
            // Configure html2canvas options for better quality
            const canvasOptions = {
                scale: 2, // Reduce scale for better performance
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: true, // Enable logging for debugging
                width: billContainer.scrollWidth,
                height: billContainer.scrollHeight,
                x: 0,
                y: 0
            };

            console.log('Canvas options:', canvasOptions);
            console.log('Generating canvas from bill container...');
            
            // Generate canvas from bill container
            const canvas = await html2canvas(billContainer, canvasOptions);
            
            console.log('Canvas generated successfully');
            console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
            
            // Create jsPDF instance with A4 size
            const { jsPDF } = window.jsPDF;
            const pdf = new jsPDF('p', 'mm', 'a4');

            // Calculate dimensions to fit A4 page
            const pdfWidth = 190; // A4 width minus margins
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            console.log('PDF dimensions:', pdfWidth, 'x', pdfHeight);
            
            // Add image to PDF
            const imgData = canvas.toDataURL('image/png', 0.95);
            pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);

            console.log('PDF created successfully');
            // Return PDF as blob
            return pdf.output('blob');

        } catch (error) {
            console.error('Error converting HTML to PDF:', error);
            console.error('Error details:', error.message, error.stack);
            throw error;
        }
    }

    // Download PDF file
    downloadPDF(pdfBlob, filename) {
        try {
            // Create download link
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            URL.revokeObjectURL(url);
            
            console.log(`PDF downloaded: ${filename}`);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            throw error;
        }
    }

    // Share PDF (for future web sharing API implementation)
    async sharePDF(pdfBlob, filename) {
        try {
            if (navigator.share && navigator.canShare) {
                const file = new File([pdfBlob], filename, { type: 'application/pdf' });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'TMS Bill PDF',
                        text: 'Generated bill from Yak\'s Men\'s Wear'
                    });
                    return true;
                }
            }
            
            // Fallback to download if sharing not available
            this.downloadPDF(pdfBlob, filename);
            return true;
            
        } catch (error) {
            console.error('Error sharing PDF:', error);
            // Fallback to download
            this.downloadPDF(pdfBlob, filename);
            return false;
        }
    }
}

// Initialize global PDF generator
window.webPDFGenerator = new WebPDFGenerator();

// Export functions for global use
window.generateBillPDF = () => window.webPDFGenerator.generateBillPDF();
window.generateMeasurementPDF = () => window.webPDFGenerator.generateMeasurementPDF();
window.downloadBillAsPDF = () => window.webPDFGenerator.generateBillPDF();

console.log('Web PDF Generator initialized successfully');
