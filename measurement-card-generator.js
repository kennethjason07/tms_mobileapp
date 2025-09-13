// Traditional Measurement Card Generator for TMS
// This creates measurement cards that look like traditional tailor measurement forms

class MeasurementCardGenerator {
    constructor() {
        this.measurementFields = this.initializeMeasurementFields();
    }

    // Initialize measurement field mappings
    initializeMeasurementFields() {
        return {
            pant: {
                title: "PANT",
                fields: [
                    { key: "length", label: "Length", position: "top-left" },
                    { key: "kamar", label: "Kamar", position: "top-center" },
                    { key: "hips", label: "Hips", position: "top-right" },
                    { key: "waist", label: "Waist", position: "middle-left" },
                    { key: "Ghutna", label: "Ghutna", position: "middle-center" },
                    { key: "Bottom", label: "Bottom", position: "middle-right" },
                    { key: "seat", label: "Seat", position: "bottom-left" },
                    { key: "SideP_Cross", label: "SideP/Cross", position: "labeled-box-1" },
                    { key: "Plates", label: "Plates", position: "labeled-box-2" },
                    { key: "Belt", label: "Belt", position: "labeled-box-3" },
                    { key: "Back_P", label: "Back P.", position: "labeled-box-4" },
                    { key: "WP", label: "WP.", position: "labeled-box-5" }
                ]
            },
            shirt: {
                title: "SHIRT",
                fields: [
                    { key: "shirtlength", label: "Length", position: "top-left" },
                    { key: "body", label: "Body", position: "top-center" },
                    { key: "Loose", label: "Loose", position: "top-right" },
                    { key: "Shoulder", label: "Shoulder", position: "middle-left" },
                    { key: "Astin", label: "Astin", position: "middle-center" },
                    { key: "collor", label: "Collar", position: "middle-right" },
                    { key: "allose", label: "A.Loose", position: "bottom-left" },
                    { key: "Callar", label: "Collar", position: "labeled-box-1" },
                    { key: "Cuff", label: "Cuff", position: "labeled-box-2" },
                    { key: "Pkt", label: "Pkt", position: "labeled-box-3" },
                    { key: "LooseShirt", label: "Loose", position: "labeled-box-4" },
                    { key: "DT_TT", label: "DT/TT", position: "labeled-box-5" }
                ]
            }
        };
    }

    // Generate traditional measurement card HTML
    generateMeasurementHTML(billData, measurements) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Customer Measurement Sheet</title>
                <style>
                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                    
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 0;
                        padding: 20px;
                        background: white;
                        color: #333;
                        line-height: 1.4;
                    }
                    
                    .header { 
                        text-align: center; 
                        margin-bottom: 30px;
                        border-bottom: 2px solid #333;
                        padding-bottom: 15px;
                    }
                    
                    .header h2 {
                        margin: 0;
                        font-size: 28px;
                        color: #333;
                        font-weight: bold;
                    }
                    
                    .header .subtitle {
                        font-size: 18px;
                        color: #ff6600;
                        margin: 10px 0 5px 0;
                        font-weight: bold;
                    }
                    
                    .customer-info {
                        display: flex;
                        justify-content: space-between;
                        margin: 20px 0;
                        padding: 15px;
                        background: #f9f9f9;
                        border: 1px solid #ddd;
                        border-radius: 5px;
                    }
                    
                    .info-item {
                        font-size: 14px;
                    }
                    
                    .info-item strong {
                        color: #333;
                    }
                    
                    .measurement-cards {
                        display: flex;
                        gap: 30px;
                        margin: 30px 0;
                        justify-content: space-between;
                    }
                    
                    .measurement-card {
                        flex: 1;
                        border: 2px solid #333;
                        border-radius: 8px;
                        padding: 0;
                        background: white;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    }
                    
                    .card-header {
                        background: #333;
                        color: white;
                        padding: 8px 15px;
                        text-align: center;
                        font-weight: bold;
                        font-size: 16px;
                        margin: 0;
                        border-radius: 5px 5px 0 0;
                    }
                    
                    .card-content {
                        padding: 15px;
                        position: relative;
                        min-height: 200px;
                    }
                    
                    /* Main measurement grid */
                    .measurement-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr 1fr;
                        grid-template-rows: auto auto auto;
                        gap: 10px;
                        margin-bottom: 20px;
                    }
                    
                    .measurement-field {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                    }
                    
                    .field-label {
                        font-size: 12px;
                        font-weight: bold;
                        margin-bottom: 5px;
                        color: #666;
                    }
                    
                    .field-value {
                        border: 1px solid #999;
                        border-radius: 3px;
                        padding: 8px;
                        min-width: 50px;
                        min-height: 20px;
                        text-align: center;
                        font-size: 14px;
                        font-weight: bold;
                        background: #f8f8f8;
                        color: #333;
                    }
                    
                    .field-value.has-value {
                        background: #e8f5e8;
                        border-color: #4CAF50;
                        color: #2e7d32;
                    }
                    
                    /* Labeled boxes at bottom */
                    .labeled-boxes {
                        display: grid;
                        grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
                        gap: 8px;
                        margin-top: 20px;
                        padding-top: 15px;
                        border-top: 1px solid #ddd;
                    }
                    
                    .labeled-box {
                        text-align: center;
                    }
                    
                    .box-label {
                        font-size: 10px;
                        font-weight: bold;
                        margin-bottom: 3px;
                        color: #666;
                        background: #f0f0f0;
                        padding: 2px 4px;
                        border-radius: 2px;
                    }
                    
                    .box-value {
                        border: 1px solid #999;
                        border-radius: 3px;
                        padding: 6px;
                        min-height: 16px;
                        font-size: 12px;
                        font-weight: bold;
                        background: #f8f8f8;
                        color: #333;
                    }
                    
                    .box-value.has-value {
                        background: #fff3cd;
                        border-color: #ffc107;
                        color: #856404;
                    }
                    
                    /* Date and number fields */
                    .card-details {
                        position: absolute;
                        top: 10px;
                        right: 15px;
                        font-size: 12px;
                    }
                    
                    .date-field, .number-field {
                        margin: 5px 0;
                        display: flex;
                        align-items: center;
                        gap: 5px;
                    }
                    
                    .date-field input, .number-field input {
                        border: none;
                        border-bottom: 1px solid #666;
                        background: transparent;
                        padding: 2px;
                        font-size: 11px;
                        width: 80px;
                    }
                    
                    .extra-measurements {
                        margin-top: 30px;
                        padding: 15px;
                        background: #f0f8ff;
                        border: 1px solid #4A90E2;
                        border-radius: 5px;
                    }
                    
                    .extra-measurements h4 {
                        margin: 0 0 10px 0;
                        color: #2c5282;
                        font-size: 14px;
                    }
                    
                    .extra-content {
                        background: white;
                        border: 1px solid #ddd;
                        border-radius: 3px;
                        padding: 10px;
                        min-height: 40px;
                        font-size: 13px;
                        line-height: 1.5;
                        color: #333;
                    }
                    
                    .footer { 
                        text-align: center; 
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid #ddd;
                        font-size: 16px; 
                        font-weight: bold;
                        color: #333;
                    }
                    
                    .footer .shop-name {
                        color: #ff6600;
                        margin-bottom: 5px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>Yak's Men's Wear</h2>
                    <div class="subtitle">Customer Measurement Sheet</div>
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">
                        Prop: Jaganath Sidda | Shop: 8660897168, 9448678033
                    </div>
                </div>

                <div class="customer-info">
                    <div class="info-item">
                        <strong>Customer Name:</strong> ${billData.customerName || '___________________'}
                    </div>
                    <div class="info-item">
                        <strong>Mobile Number:</strong> ${billData.mobileNumber || '___________________'}
                    </div>
                    <div class="info-item">
                        <strong>Date:</strong> ${billData.orderDate || '___________'}
                    </div>
                    <div class="info-item">
                        <strong>Delivery Date:</strong> ${billData.deliveryDate || '___________'}
                    </div>
                </div>

                <div class="measurement-cards">
                    ${this.generateMeasurementCard('pant', measurements)}
                    ${this.generateMeasurementCard('shirt', measurements)}
                </div>

                ${this.generateExtraMeasurements(measurements)}

                <div class="footer">
                    <div class="shop-name">Thank You, Visit Again!</div>
                    <div style="font-size: 12px; color: #666; margin-top: 10px;">Sunday Holiday</div>
                </div>
            </body>
            </html>
        `;
    }

    // Generate individual measurement card (PANT or SHIRT)
    generateMeasurementCard(type, measurements) {
        const cardConfig = this.measurementFields[type];
        if (!cardConfig) return '';

        // Get main grid fields (positions: top-left, top-center, etc.)
        const gridFields = cardConfig.fields.filter(field => 
            field.position.includes('top-') || 
            field.position.includes('middle-') || 
            field.position.includes('bottom-')
        );

        // Get labeled box fields
        const labeledFields = cardConfig.fields.filter(field => 
            field.position.includes('labeled-box-')
        );

        return `
            <div class="measurement-card">
                <div class="card-header">${cardConfig.title}</div>
                <div class="card-details">
                    <div class="date-field">
                        <span>Date:</span>
                        <input type="text" value="" />
                    </div>
                    <div class="number-field">
                        <span>No.</span>
                        <input type="text" value="" />
                    </div>
                </div>
                <div class="card-content">
                    <div class="measurement-grid">
                        ${this.generateGridFields(gridFields, measurements)}
                    </div>
                    <div class="labeled-boxes">
                        ${this.generateLabeledBoxes(labeledFields, measurements)}
                    </div>
                </div>
            </div>
        `;
    }

    // Generate grid fields (main measurement boxes)
    generateGridFields(fields, measurements) {
        const positions = [
            'top-left', 'top-center', 'top-right',
            'middle-left', 'middle-center', 'middle-right',
            'bottom-left', 'bottom-center', 'bottom-right'
        ];

        return positions.map(position => {
            const field = fields.find(f => f.position === position);
            if (!field) {
                return '<div class="measurement-field"></div>'; // Empty cell
            }

            const value = measurements[field.key] || '';
            const hasValue = value !== '';

            return `
                <div class="measurement-field">
                    <div class="field-label">${field.label}</div>
                    <div class="field-value ${hasValue ? 'has-value' : ''}">${value}</div>
                </div>
            `;
        }).join('');
    }

    // Generate labeled boxes (bottom section)
    generateLabeledBoxes(fields, measurements) {
        return fields.map(field => {
            const value = measurements[field.key] || '';
            const hasValue = value !== '';

            return `
                <div class="labeled-box">
                    <div class="box-label">${field.label}</div>
                    <div class="box-value ${hasValue ? 'has-value' : ''}">${value}</div>
                </div>
            `;
        }).join('');
    }

    // Generate extra measurements section
    generateExtraMeasurements(measurements) {
        const extraValue = measurements.extra_measurements || '';
        
        return `
            <div class="extra-measurements">
                <h4>Additional Notes / Extra Measurements:</h4>
                <div class="extra-content">${extraValue || 'No additional measurements specified.'}</div>
            </div>
        `;
    }

    // Generate measurement PDF
    async generateMeasurementPDF(billData, measurements) {
        try {
            console.log('Starting traditional measurement card PDF generation...');
            
            // Generate HTML content
            const measurementHTML = this.generateMeasurementHTML(billData, measurements);
            
            // Create a temporary container for PDF generation
            const tempContainer = this.createTempContainer(measurementHTML);
            
            // Wait for the DOM to render the content
            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log('Temporary container created and rendered');
            
            // Generate PDF from HTML
            const pdfBlob = await this.htmlToPDF(tempContainer);
            
            // Clean up temporary container
            tempContainer.remove();
            
            // Download the PDF
            this.downloadPDF(pdfBlob, `Measurements_${billData.customerName || 'Customer'}_${Date.now()}.pdf`);
            
            console.log('Measurement card PDF generated successfully');
            return true;
            
        } catch (error) {
            console.error('Error generating measurement card PDF:', error);
            alert(`Failed to generate measurement PDF: ${error.message}`);
            return false;
        }
    }

    // Create temporary container for PDF generation
    createTempContainer(htmlContent) {
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        tempDiv.style.width = '210mm';  // A4 width
        tempDiv.style.backgroundColor = 'white';
        tempDiv.style.fontFamily = 'Arial, sans-serif';
        tempDiv.style.padding = '0';
        tempDiv.style.margin = '0';
        tempDiv.innerHTML = htmlContent;
        document.body.appendChild(tempDiv);
        
        console.log('Temporary measurement card container created');
        console.log('Container dimensions:', tempDiv.offsetWidth, 'x', tempDiv.offsetHeight);
        
        return tempDiv;
    }

    // Convert HTML to PDF
    async htmlToPDF(element) {
        try {
            console.log('Starting measurement card PDF conversion...');
            
            // Configure html2canvas options
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
            
            // Create jsPDF instance for A4
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
            return pdf.output('blob');

        } catch (error) {
            console.error('Error converting measurement card to PDF:', error);
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
            
            console.log(`Measurement PDF downloaded: ${filename}`);
        } catch (error) {
            console.error('Error downloading measurement PDF:', error);
            throw error;
        }
    }

    // Collect measurement data from form elements
    collectMeasurementData() {
        return {
            // Pant measurements
            length: document.getElementById("length")?.value || '',
            kamar: document.getElementById("kamar")?.value || '',
            hips: document.getElementById("hips")?.value || '',
            waist: document.getElementById("waist")?.value || '',
            Ghutna: document.getElementById("Ghutna")?.value || '',
            Bottom: document.getElementById("Bottom")?.value || '',
            seat: document.getElementById("seat")?.value || '',
            SideP_Cross: document.getElementById("SideP_Cross")?.value || '',
            Plates: document.getElementById("Plates")?.value || '',
            Belt: document.getElementById("Belt")?.value || '',
            Back_P: document.getElementById("Back_P")?.value || '',
            WP: document.getElementById("WP")?.value || '',
            
            // Shirt measurements
            shirtlength: document.getElementById("shirtlength")?.value || '',
            body: document.getElementById("body")?.value || '',
            Loose: document.getElementById("Loose")?.value || '',
            Shoulder: document.getElementById("Shoulder")?.value || '',
            Astin: document.getElementById("Astin")?.value || '',
            collor: document.getElementById("collor")?.value || '',
            allose: document.getElementById("allose")?.value || '',
            Callar: document.getElementById("Callar")?.value || '',
            Cuff: document.getElementById("Cuff")?.value || '',
            Pkt: document.getElementById("Pkt")?.value || '',
            LooseShirt: document.getElementById("LooseShirt")?.value || '',
            DT_TT: document.getElementById("DT_TT")?.value || '',
            
            // Extra measurements
            extra_measurements: document.getElementById("extra-input")?.value || ''
        };
    }

    // Collect bill data for measurement sheet
    collectBillData() {
        return {
            customerName: document.getElementById("customer-name")?.value || '',
            mobileNumber: document.getElementById("mobile-number")?.value || '',
            orderDate: document.getElementById("date_issue")?.value || document.getElementById("today-date")?.value || new Date().toISOString().split('T')[0],
            deliveryDate: document.getElementById("delivery-date")?.value || document.getElementById("due-date")?.value || ''
        };
    }
}

// Initialize the measurement card generator
window.measurementCardGenerator = new MeasurementCardGenerator();

// Export convenience functions
window.generateTraditionalMeasurementPDF = async () => {
    const billData = window.measurementCardGenerator.collectBillData();
    const measurements = window.measurementCardGenerator.collectMeasurementData();
    return await window.measurementCardGenerator.generateMeasurementPDF(billData, measurements);
};

console.log('Traditional Measurement Card Generator initialized successfully');
console.log('Use generateTraditionalMeasurementPDF() to generate cards like traditional measurement forms');
