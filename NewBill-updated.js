// Updated NewBill.js with enhanced printing functionality

window.onload = function() {
    document.querySelector('.login-container').style.display = 'block';
    document.querySelector('.main').style.display = 'none'; // Ensure main content is hidden initially
}

function authenticateUser() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Set your desired username and password
    const validUsername = "admin";
    const validPassword = "password123";

    // Simple check for username and password
    if (username === validUsername && password === validPassword) {
        // Redirect to a different page (e.g., "dashboard.html")
        window.location.href = 'user.html'; // Change this to your desired page
    } else {
        alert("Invalid username or password. Please try again.");
    }
}

function toggleDropdown() {
    const dropdown = document.getElementById("dropdownMenu");
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}

// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {
    if (!event.target.matches('.dropbtn') && !event.target.closest('.profile-dropdown')) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            dropdowns[i].style.display = "none";
        }
    }
};

// Optional: Redirect when an option is clicked
const dropdownLinks = document.querySelectorAll('.dropdown-content a');
dropdownLinks.forEach(link => {
    link.addEventListener('click', function() {
        window.location.href = this.href;
    });
});

function redirectToPage() {
    const select = document.getElementById("pageSelect");
    const selectedPage = select.value;
    if (selectedPage) {
        window.location.href = selectedPage;
    }
}

function openDropdown() {
    const select = document.getElementById("pageSelect");
    select.focus();
    select.size = select.options.length; // Expands to show all options on focus
}

// Function to show content based on clicked tab
function showContent(id) {
    // Hide all content sections
    const contentSections = document.querySelectorAll('.content-main > div');
    contentSections.forEach(section => {
        if (section.id === id) {
            section.classList.remove('hidden'); // Show the clicked section
        } else {
            section.classList.add('hidden'); // Hide other sections
        }
    });
}

function formatDateTime(dateTimeString) {
    // Create a Date object from the string
    const date = new Date(dateTimeString);
    
    // Extract date in YYYY-MM-DD format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

function calculateTotals() {
    // Get quantity and amount input values
    const suitQty = parseFloat(document.getElementById('suit_qty').value) || 0;
    const suitAmt = parseFloat(document.getElementById('suit_amount').value) || 0;

    const safariQty = parseFloat(document.getElementById('safari_qty').value) || 0;
    const safariAmt = parseFloat(document.getElementById('safari_amount').value) || 0;

    const pantQty = parseFloat(document.getElementById('pant_qty').value) || 0;
    const pantAmt = parseFloat(document.getElementById('pant_amount').value) || 0;

    const shirtQty = parseFloat(document.getElementById('shirt_qty').value) || 0;
    const shirtAmt = parseFloat(document.getElementById('shirt_amount').value) || 0;

    const sadriQty = parseFloat(document.getElementById('sadri_qty').value) || 0;
    const sadriAmt = parseFloat(document.getElementById('sadri_amount').value) || 0;

    // Calculate total quantities and total amount
    const totalQty = suitQty + safariQty + pantQty + shirtQty + sadriQty;
    const totalAmt = suitAmt + safariAmt + pantAmt + shirtAmt + sadriAmt;

    // Update the total quantity and amount in the respective fields
    document.getElementById('total_qty').value = totalQty;
    document.getElementById('total_amt').value = totalAmt.toFixed(2);
}

function toggleMeasurements() {
    console.log("toggleMeasurements function called");

    var pantSection = document.getElementById("pant-section");
    var shirtSection = document.getElementById("shirt-section");
    var extraSection = document.getElementById("extra-section");

    // Get all checkboxes for measurements selection
    var selectedValues = document.querySelectorAll('input[name="measurements-selection"]:checked');
    
    console.log("Selected values:", selectedValues); // Check selected values in the console

    // Hide all sections initially
    pantSection.classList.add("hidden");
    shirtSection.classList.add("hidden");
    extraSection.classList.add("hidden");

    // Show sections based on selected checkboxes
    selectedValues.forEach(selection => {
        console.log("Processing selection:", selection.value); // Check which values are being processed
        if (selection.value === "pant") {
            pantSection.classList.remove("hidden");
        } else if (selection.value === "shirt") {
            shirtSection.classList.remove("hidden");
        } else if (selection.value === "extra") {
            extraSection.classList.remove("hidden");
        }
    });
}

function getValueOrZero(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with ID "${id}" not found.`);
        return 0;
    }
    const value = element.value;
    return value === '' ? 0 : parseFloat(value);
}

// Enhanced form submission with better printing
document.getElementById('new-bill-form').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent default form submission behavior
    
    const customerName = document.getElementById("customer-name").value;
    const mobileNo = document.getElementById("mobile-number").value;
    const dateIssue = document.getElementById("date_issue").value;
    const deliveryDate = document.getElementById("delivery-date").value;
    const garmentType = document.getElementById("garment_type").value;
    const suitQty = getValueOrZero("suit_qty");
    const sadriQty = getValueOrZero("sadri_qty");
    const safariQty = getValueOrZero("safari_qty");
    const pantQty = getValueOrZero("pant_qty");
    const shirtQty = getValueOrZero("shirt_qty");
    const totalQty = getValueOrZero("total_qty");
    const todayDate = document.getElementById("today-date").value;
    const dueDate = document.getElementById("due-date").value;
    const totalAmt = getValueOrZero("total_amt");
    const paymentMode = document.getElementById("Payment").value;
    const paymentStatus = document.getElementById("payementstatus").value;
    const payment_amount = document.getElementById("advance_amt").value;
    const billnumberinput2 = document.getElementById("billnumberinput2").value;

    // Pant measurements
    const pantLength = getValueOrZero("length");
    const pantKamar = getValueOrZero("kamar");
    const pantHips = getValueOrZero("hips");
    const pantWaist = getValueOrZero("waist");
    const pantGhutna = getValueOrZero("Ghutna");
    const pantBottom = getValueOrZero("Bottom");
    const pantSeat = getValueOrZero("seat");
    const SideP_Cross = document.getElementById("SideP_Cross").value;
    const Plates = document.getElementById("Plates").value;
    const Belt = document.getElementById("Belt").value;
    const Back_P = document.getElementById("Back_P").value;
    const WP = document.getElementById("WP").value;

    // Shirt measurements
    const shirtLength = getValueOrZero("shirtlength");
    const shirtBody = document.getElementById("body").value;
    const shirtLoose = document.getElementById("Loose").value;
    const shirtShoulder = getValueOrZero("Shoulder");
    const shirtAstin = getValueOrZero("Astin");
    const shirtCollar = getValueOrZero("collor");
    const shirtAloose = getValueOrZero("allose");
    const Callar = document.getElementById("Callar").value;
    const Cuff = document.getElementById("Cuff").value;
    const Pkt = document.getElementById("Pkt").value;
    const LooseShirt = document.getElementById("LooseShirt").value;
    const DT_TT = document.getElementById("DT_TT").value;

    // Extra measurements
    const extraMeasurements = document.getElementById("extra-input").value || null;

    const formData = {
        customerName,
        mobileNo,
        dateIssue,
        deliveryDate,
        garmentType,
        suitQty,
        safariQty,
        sadriQty,
        pantQty,
        shirtQty,
        totalQty,
        todayDate,
        dueDate,
        totalAmt,
        paymentMode,
        paymentStatus,
        payment_amount,
        billnumberinput2,
        pantLength,
        pantKamar,
        pantHips,
        pantWaist,
        pantGhutna,
        pantBottom,
        pantSeat,
        SideP_Cross,
        Plates,
        Belt,
        Back_P,
        WP,
        shirtLength,
        shirtBody,
        shirtLoose,
        shirtShoulder,
        shirtAstin,
        shirtCollar,
        shirtAloose,
        Callar,
        Cuff,
        Pkt,
        LooseShirt,
        DT_TT,
        extraMeasurements
    };

    // Submit the form data to the backend
    fetch('http://127.0.0.1:5000/api/new-bill', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(result => {
        console.log(formData);
        alert('Bill created successfully');
        
        // Use enhanced printing instead of old saveAndPrint
        if (typeof enhancedSaveAndPrint === 'function') {
            enhancedSaveAndPrint(); // Use the enhanced bill printing
        } else {
            console.warn('Enhanced print function not available, falling back to basic print');
            saveAndPrint(); // Fallback to old method
        }
    })
    .catch(error => {
        console.error('Error creating bill:', error);
        alert('An error occurred while creating the bill.');
    });
});

// Improved saveAndPrint function (keep as fallback)
function saveAndPrint() {
    const customerBill = document.getElementById('customerbill').cloneNode(true);

    const printWindow = window.open('', '', 'width=800,height=600');

    printWindow.document.write('<html><head><title>Print Bill</title>');
    // Include your external CSS file
    printWindow.document.write('<link rel="stylesheet" type="text/css" href="styles.css">');

    // Additional print styles
    printWindow.document.write(`
        <style>
            @media print {
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }
                .hidden {
                    display: none !important;
                }
                .page-break {
                    page-break-before: always;
                }
            }
        </style>
    `);

    printWindow.document.write('</head><body>');
    printWindow.document.body.appendChild(customerBill);

    printWindow.document.write('</body></html>');
    printWindow.document.close();

    // Wait for all images in the new window to load before printing
    const images = printWindow.document.images;
    const totalImages = images.length;
    let imagesLoaded = 0;

    if (totalImages === 0) {
        // If there are no images, print immediately
        printAndClose();
    } else {
        // Wait for all images to load
        Array.from(images).forEach(image => {
            image.onload = handleImageLoad;
            image.onerror = handleImageLoad; // Handle error as load
        });
    }

    function handleImageLoad() {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            printAndClose();
        }
    }

    function printAndClose() {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }
}

// Customer info Form js For fetching Customer info by mobile number
document.getElementById('search-button').addEventListener('click', function () {
    const mobileNumber = document.getElementById('mobile-number2').value;

    if (!mobileNumber || isNaN(mobileNumber) || mobileNumber.length !== 10) {
        alert("Please enter a valid 10-digit mobile number.");
        return;
    }

    // Fetch customer data from backend
    fetch(`http://127.0.0.1:5000/api/customer-info/${mobileNumber}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("No data found for the provided mobile number.");
            }
            return response.json();
        })
        .then(data => {
            // Populate customer name and mobile number
            if (document.getElementById('customer-name')) {
                document.getElementById('customer-name').value = data.customer_name || '';
            }
            if (document.getElementById('mobile-number')) {
                document.getElementById('mobile-number').value = data.mobile_number || '';
            }
            // Populate measurements
            populateMeasurements(data.measurements || {});
        })
        .catch(error => {
            console.error('Error fetching customer data:', error);
            alert('Error: Could not fetch customer data. Please try again.');
        });
});

// Function to populate customer measurements in the form
function populateMeasurements(measurements) {
    // Check each element's existence before trying to set its value
    if (document.getElementById('length')) {
        document.getElementById('length').value = measurements.pant_length || '';
    }
    if (document.getElementById('kamar')) {
        document.getElementById('kamar').value = measurements.pant_kamar || '';
    }
    if (document.getElementById('hips')) {
        document.getElementById('hips').value = measurements.pant_hips || '';
    }
    if (document.getElementById('waist')) {
        document.getElementById('waist').value = measurements.pant_waist || '';
    }
    if (document.getElementById('Ghutna')) {
        document.getElementById('Ghutna').value = measurements.pant_ghutna || '';
    }
    if (document.getElementById('Bottom')) {
        document.getElementById('Bottom').value = measurements.pant_bottom || '';
    }
    if (document.getElementById('seat')) {
        document.getElementById('seat').value = measurements.pant_seat || ''; 
    }
    if (document.getElementById('SideP_Cross')) {
        document.getElementById('SideP_Cross').value = measurements.SideP_Cross || ''; 
    }
    if (document.getElementById('Plates')) {
        document.getElementById('Plates').value = measurements.Plates || ''; 
    }
    if (document.getElementById('Belt')) {
        document.getElementById('Belt').value = measurements.Belt || ''; 
    }
    if (document.getElementById('Back_P')) {
        document.getElementById('Back_P').value = measurements.Back_P || ''; 
    }
    if (document.getElementById('WP')) {
        document.getElementById('WP').value = measurements.WP || ''; 
    }
    if (document.getElementById('shirtlength')) {
        document.getElementById('shirtlength').value = measurements.shirt_length || '';
    }
    if (document.getElementById('body')) {
        document.getElementById('body').value = measurements.shirt_body || '';
    }
    if (document.getElementById('Loose')) {
        document.getElementById('Loose').value = measurements.shirt_loose || '';
    }
    if (document.getElementById('Shoulder')) {
        document.getElementById('Shoulder').value = measurements.shirt_shoulder || '';
    }
    if (document.getElementById('Astin')) {
        document.getElementById('Astin').value = measurements.shirt_astin || '';
    }
    if (document.getElementById('collor')) {
        document.getElementById('collor').value = measurements.shirt_collar || '';
    }
    if (document.getElementById('allose')) {
        document.getElementById('allose').value = measurements.shirt_aloose || '';
    }
    if (document.getElementById('Callar')) {
        document.getElementById('Callar').value = measurements.Callar || ''; 
    }
    if (document.getElementById('Cuff')) {
        document.getElementById('Cuff').value = measurements.Cuff || ''; 
    }
    if (document.getElementById('Pkt')) {
        document.getElementById('Pkt').value = measurements.Pkt || ''; 
    }
    if (document.getElementById('LooseShirt')) {
        document.getElementById('LooseShirt').value = measurements.LooseShirt || ''; 
    }
    if (document.getElementById('DT_TT')) {
        document.getElementById('DT_TT').value = measurements.DT_TT || ''; 
    }
    if (document.getElementById('extra-input')) {
        document.getElementById('extra-input').value = measurements.extra_measurements || '';
    }
}

//autofill logic
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('today-date').addEventListener('input', function () {
        const todayDate = this.value;
        document.getElementById('date_issue').value = todayDate;
    });

    document.getElementById('due-date').addEventListener('input', function () {
        const dueDate = this.value;
        document.getElementById('delivery-date').value = dueDate;
    });
});
