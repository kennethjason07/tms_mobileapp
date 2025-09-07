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

document.addEventListener("DOMContentLoaded", fetchOrders);

// Global Variables
let workersData = [];
let selectedWorkers = {}; // Store selected workers per order
let allOrders = []; // Store all fetched orders
defaultPageSize = 50;

// Function to apply filters on delivery status, payment status, and delivery date
function applyFilters() {
    const deliveryStatus = document.getElementById("filter-delivery-status").value.trim().toLowerCase();
    const paymentStatus = document.getElementById("filter-payment-status").value.trim().toLowerCase();
    const deliveryDate = document.getElementById("filter-delivery-date").value; // Date in YYYY-MM-DD format

    const ordersContainer = document.getElementById('order-overview');
    const tables = ordersContainer.querySelectorAll("table");

    let anyVisibleRow = false;

    tables.forEach(table => {
        const rows = table.querySelectorAll("tbody tr");

        rows.forEach(row => {
            const rowDeliveryDate = row.querySelector("td:nth-child(6)").textContent.trim(); // Adjust column index if necessary
            const deliveryStatusCell = row.querySelector("td:nth-child(4)").textContent.trim().toLowerCase();
            const paymentStatusCell = row.querySelector("td:nth-child(8)").textContent.trim().toLowerCase();

            const showRow =
                (deliveryDate === "" || rowDeliveryDate === deliveryDate) &&
                (deliveryStatus === "" || deliveryStatusCell === deliveryStatus) &&
                (paymentStatus === "" || paymentStatusCell === paymentStatus);

            row.style.display = showRow ? "" : "none";
            if (showRow) anyVisibleRow = true;
        });

        // Toggle table visibility based on whether any rows are visible in it
        table.style.display = Array.from(rows).some(row => row.style.display === "") ? "" : "none";
    });

    // Show or hide "No orders match" message
    const noOrdersMessage = ordersContainer.querySelector(".no-orders-message");
    if (!anyVisibleRow) {
        if (!noOrdersMessage) {
            const message = document.createElement('p');
            message.classList.add('no-orders-message');
            message.textContent = 'No orders match the selected criteria.';
            ordersContainer.appendChild(message);
        }
    } else {
        if (noOrdersMessage) noOrdersMessage.remove();
    }
}

// Fetch orders and workers when the DOM is fully loaded
async function fetchOrders() {
    const ordersContainer = document.getElementById("order-overview");
    ordersContainer.innerHTML = ""; // Clear existing orders

    try {
        const [ordersResponse, workersResponse] = await Promise.all([
            fetch("http://127.0.0.1:5000/api/orders"),
            fetch("http://127.0.0.1:5000/api/workers")
        ]);

        const ordersData = await ordersResponse.json();
        workersData = await workersResponse.json();

        allOrders = [];
        for (const deliveryDate in ordersData) {
            ordersData[deliveryDate].forEach(order => {
                allOrders.push({ ...order, deliveryDate });
            });
        }

        // Sort orders to show latest bill numbers first (8053, 8052, 8051...)
        allOrders.sort((a, b) => {
            // Primary sort: by bill number in descending order (highest bill number first)
            const billNumberA = parseInt(a.billnumberinput2) || 0;
            const billNumberB = parseInt(b.billnumberinput2) || 0;
            
            if (billNumberB !== billNumberA) {
                return billNumberB - billNumberA; // Descending order: 8053, 8052, 8051...
            }
            
            // Secondary sort: by order ID descending (if bill numbers are the same)
            return (b.id || 0) - (a.id || 0);
        });


        renderPagination(1); // Render page 1 by default
    } catch (error) {
        console.error("Error fetching orders or workers:", error);
        ordersContainer.innerHTML = "<p>Error fetching orders.</p>";
    }
}

// Render the orders for a specific page
function renderPagination(pageNumber) {
    currentPage = pageNumber;
    const ordersContainer = document.getElementById("order-overview");
    ordersContainer.innerHTML = "";

    const startIndex = (pageNumber - 1) * defaultPageSize;
    const endIndex = startIndex + defaultPageSize;
    const currentOrders = allOrders.slice(startIndex, endIndex);

        // Add filter dropdowns to the page
        const filterContainer = document.createElement('div');
        filterContainer.id = "filters-container";
        filterContainer.innerHTML = `
            <label for="filter-delivery-status">Delivery Status:</label>
            <select id="filter-delivery-status" onchange="applyFilters()">
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
            </select>

            <label for="filter-payment-status">Payment Status:</label>
            <select id="filter-payment-status" onchange="applyFilters()">
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
            </select>

            <label for="filter-delivery-date">Delivery Date:</label>
<input 
    type="date" 
    id="filter-delivery-date" 
    onchange="applyFilters()" 
    placeholder="Select a delivery date"
/>

        `;
        ordersContainer.prepend(filterContainer);

        // Check if there are orders to display
        if (allOrders.length > 0) {
            // Create a single table for all sorted orders
            const table = document.createElement('table');
            table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Bill Number</th>
                    <th>Garment Type</th>
                    <th>Delivery Status</th>
                    <th>Update Delivery Status</th>
                    <th>Delivery Date</th>
                    <th>Payment Mode</th>
                    <th>Payment Status</th>
                    <th>Update Payment Status</th>
                    <th>Total Amount</th>
                    <th>Advance Amount</th>
                    <th>Pending Amount</th>
                    <th>Customer Mobile</th>
                    <th>Bill ID</th>
                    <th>Worker Assignment</th>
                    <th>Worker Names</th>
                    <th>Total Worker Pay</th>
                </tr>
            </thead>
            <tbody id="orders-tbody"></tbody>
        `;
        ordersContainer.appendChild(table);

        const tbody = document.getElementById("orders-tbody");
        currentOrders.forEach(order => {
            const workerDropdownHTML = createWorkerDropdownSection(order.id);
            const workerNames = order.workers.map(worker => worker.name).join(", ") || "Not Assigned";

            tbody.innerHTML += `
                <tr>
                    <td>${order.id}</td>
                    <td>${order.billnumberinput2 || "N/A"}</td>
                    <td>${order.garment_type}</td>
                    <td>${order.status}</td>

                    <td>
    <select id="status-select-${order.id}">
        <option value="pending" ${order.status === "pending" ? "selected" : ""}>Pending</option>
        <option value="completed" ${order.status === "completed" ? "selected" : ""}>Completed</option>
        <option value="cancelled" ${order.status === "cancelled" ? "selected" : ""}>Cancelled</option>
    </select>
    <button onclick="updateOrderStatus(${order.id}, document.getElementById('status-select-${order.id}').value)">Update</button>
    <button onclick="copyStatusToAll(${order.id}, ${order.bill_id})">Copy to All</button>
</td>
                    <td>${order.due_date}</td>
                    <td>
                        <select onchange="updatePaymentMode(${order.id}, this.value)">
                            <option value="UPI" ${order.payment_mode === "UPI" ? "selected" : ""}>UPI</option>
                            <option value="Cash" ${order.payment_mode === "Cash" ? "selected" : ""}>Cash</option>
                        </select>
                    </td>
                    <td>${order.payment_status}</td>
                    <td>
                        <select onchange="updatePaymentStatus(${order.id}, this.value)">
                            <option value="pending" ${order.payment_status === "pending" ? "selected" : ""}>Pending</option>
                            <option value="paid" ${order.payment_status === "paid" ? "selected" : ""}>Paid</option>
                            <option value="cancelled" ${order.payment_status === "cancelled" ? "selected" : ""}>Cancelled</option>
                        </select>
                    </td>
                    <td>
                        <input type="number" value="${order.total_amt}" 
                               onchange="updateTotalAmount(${order.id}, this.value)" />
                    </td>
                    
                    <td>
    <input type="number" value="${order.payment_amount}" 
           onchange="updateAdvanceAmount(${order.id}, this.value)" />
</td>



                    <td>${order.total_amt - order.payment_amount}</td>
                    <td>${order.customer_mobile || "N/A"}</td>
                    <td>${order.bill_id}</td>
                    <td>${workerDropdownHTML}</td>
                    <td>${workerNames}</td>
                    <td id="worker-pay-${order.id}">${order.Work_pay || "N/A"}</td>
                </tr>
            `;
        });
    } else {
        ordersContainer.innerHTML = "<p>No orders found.</p>";
    }

    renderPaginationControls();
}

// Render pagination controls
function renderPaginationControls() {
    const ordersContainer = document.getElementById("order-overview");
    const totalPages = Math.ceil(allOrders.length / defaultPageSize);

    let paginationHTML = `
        <div class="pagination">
            <button ${currentPage === 1 ? "disabled" : ""} onclick="renderPagination(${currentPage - 1})">Previous</button>
            Page ${currentPage} of ${totalPages}
            <button ${currentPage === totalPages ? "disabled" : ""} onclick="renderPagination(${currentPage + 1})">Next</button>
        </div>
    `;

    ordersContainer.insertAdjacentHTML("beforeend", paginationHTML);
}

// Helper functions and other existing functionality
// (Include createWorkerDropdownSection, updateOrderStatus, updatePaymentStatus, etc.)



function updateTotalAmount(orderId, newAmount) {
    // Validate the input
    if (isNaN(newAmount) || newAmount < 0) {
        alert('Please enter a valid amount.');
        return;
    }

    // Optionally send the update to the server
    fetch(`http://127.0.0.1:5000/api/orders/${orderId}/update-total-amount`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ total_amt: parseFloat(newAmount) })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update the total amount.');
        }
        return response.json();
    })
    .then(data => {
        console.log('Total amount updated successfully:', data);
        alert('Total amount updated successfully!');
    })
    .catch(error => {
        console.error('Error updating total amount:', error);
        alert('Failed to update the total amount.');
    });
}


// Helper function to generate options for Delivery Date filter
function generateDeliveryDateOptions(ordersData) {
    const allDates = new Set(); // Use a Set to store unique dates
    for (const deliveryDate in ordersData) {
        allDates.add(deliveryDate);
    }

    // Generate option elements for each unique date
    return Array.from(allDates).map(date => `<option value="${date}">${date}</option>`).join('');
}



// Helper function to create worker dropdown section with buttons
function createWorkerDropdownSection(orderId) {
    return `
        <div id="worker-dropdown-container-${orderId}">
            ${createWorkerDropdown(orderId)}
        </div>
        <button onclick="addWorkerField(${orderId})">Add Another Worker</button>
        <button onclick="assignWorkersToOrder(${orderId})">Assign Workers</button>
    `;
}

// Helper function to create a single worker dropdown
function createWorkerDropdown(orderId) {
    return `
        <select onchange="addWorker(${orderId}, this.value)">
            <option value="">Select a worker</option>
            ${workersData.map(worker => `<option value="${worker.id}">${worker.name}</option>`).join('')}
        </select>
    `;
}

// Function to dynamically add a new worker dropdown for multiple selections
function addWorkerField(orderId) {
    if (!selectedWorkers[orderId]) selectedWorkers[orderId] = [];

    const container = document.getElementById(`worker-dropdown-container-${orderId}`);
    const newSelect = document.createElement('select');
    newSelect.onchange = () => addWorker(orderId, newSelect.value);
    newSelect.innerHTML = `<option value="">Select a worker</option>`;
    
    workersData.forEach(worker => {
        newSelect.innerHTML += `<option value="${worker.id}">${worker.name}</option>`;
    });

    container.appendChild(newSelect);
}

// Function to store selected workers for each order
function addWorker(orderId, workerId) {
    if (!selectedWorkers[orderId]) selectedWorkers[orderId] = [];
    if (workerId && !selectedWorkers[orderId].includes(workerId)) {
        selectedWorkers[orderId].push(workerId);
    }
}

// Function to assign multiple workers to an order
function assignWorkersToOrder(orderId) {
    const workerIds = selectedWorkers[orderId];
    if (!workerIds || workerIds.length === 0) {
        alert('Please select at least one worker.');
        return;
    }

    fetch(`http://127.0.0.1:5000/api/orders/${orderId}/assign-workers`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ worker_ids: workerIds })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`Workers assigned successfully. Total Work Pay: ₹${data.work_pay.toFixed(2)}`);
            document.querySelector(`#worker-pay-${orderId}`).textContent = `₹${data.work_pay.toFixed(2)}`;
            fetchOrders(); // Refresh orders to display updated worker names
        } else {
            console.error('Failed to assign workers:', data.error);
            alert(`Failed to assign workers: ${data.error}`);
        }
    })
    .catch(error => {
        console.error('Error assigning workers:', error);
        alert('An error occurred while assigning workers.');
    });
}

// Function to update order status
function updateOrderStatus(orderId, newStatus) {
    fetch(`http://127.0.0.1:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(result => {
        console.log('Order status update response:', result);
        alert('Order status updated successfully');
        // No need to reload the page, just show a success message
    })
    .catch(error => {
        console.error('Error updating order status:', error);
        alert('Error updating order status');
    });
}

// Function to update payment status
function updatePaymentStatus(orderId, newPaymentStatus) {
    fetch(`http://127.0.0.1:5000/api/orders/${orderId}/payment-status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ payment_status: newPaymentStatus })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(result => {
        console.log('Payment status update response:', result);
        alert('Payment status updated successfully');
        // No need to reload the page, just show a success message
    })
    .catch(error => {
        console.error('Error updating payment status:', error);
        alert('Error updating payment status');
    });
}
// Function to update Payment mode
function updatePaymentMode(orderId, newPaymentMode){
    fetch(`http://127.0.0.1:5000/api/orders/${orderId}/payment-mode`, {  // Corrected endpoint
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ payment_mode: newPaymentMode })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(result => {
        console.log('Payment Mode update response:', result);
        alert('Payment Mode updated successfully');
    })
    .catch(error => {
        console.error('Error updating payment mode:', error);
        alert('Error updating payment mode');
    });
}

       // Function to search for an order by bill number
       function searchOrder() {
        var billNumber = document.getElementById('orderSearchInput').value.trim();
    
        if (billNumber === '') {
            alert("Please enter an order number.");
            return;
        }
    
        fetch(`http://127.0.0.1:5000/api/orders/search?bill_number=${billNumber}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    allOrders = data;  // Replace allOrders with the searched result
                    renderPagination(1);  // Re-render to display the searched order
                }
            })
            .catch(error => {
                alert("Error fetching order data.");
                console.error(error);
            });
        }


        function updateAdvanceAmount(orderId, newAdvance) {
    if (isNaN(newAdvance) || newAdvance < 0) {
        alert('Please enter a valid advance amount.');
        return;
    }

    fetch(`http://127.0.0.1:5000/api/orders/${orderId}/update-advance-amount`, {
        method: 'POST',  // Or PUT depending on your API
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ payment_amount: parseFloat(newAdvance) })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update the advance amount.');
        }
        return response.json();
    })
    .then(data => {
        console.log('Advance amount updated successfully:', data);
        alert('Advance amount updated successfully!');
        fetchOrders(); // Refresh the table to update pending amount
    })
    .catch(error => {
        console.error('Error updating advance amount:', error);
        alert('Failed to update the advance amount.');
    });
}
function copyStatusToAll(orderId, billId) {
    const status = document.getElementById(`status-select-${orderId}`).value;

    // Filter all orders with same bill_id
    const relatedOrders = allOrders.filter(order => order.bill_id === billId);

    if (!relatedOrders.length) {
        alert("No related orders found.");
        return;
    }

    let updateCount = 0;

    relatedOrders.forEach(order => {
        fetch(`http://127.0.0.1:5000/api/orders/${order.id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: status })
        })
        .then(response => {
            if (!response.ok) throw new Error("Failed to update order");
            return response.json();
        })
        .then(() => {
            updateCount++;
            if (updateCount === relatedOrders.length) {
                alert(`Delivery status updated for all ${updateCount} items.`);
                fetchOrders(); // Refresh the UI
            }
        })
        .catch(err => {
            console.error(`Error updating order ${order.id}:`, err);
        });
    });
}
