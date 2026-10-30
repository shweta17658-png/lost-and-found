
/* ==========================================
   FINDORA AI - COMPLETE JAVASCRIPT
   Lost & Found Management System
========================================== */

// 1. LOAD SAVED DATA

function loadItems() {
    try {
        return JSON.parse(localStorage.getItem("findoraItems")) || [];
    } catch (error) {
        return [];
    }
}

function getRequests() {
    try {
        return JSON.parse(localStorage.getItem("findoraRequests")) || [];
    } catch (error) {
        return [];
    }
}

let items = loadItems();

let activeFilter = "All";


// 2. SAVE ITEMS

function saveItems() {
    localStorage.setItem(
        "findoraItems",
        JSON.stringify(items)
    );
}


// 3. SAVE REQUESTS

function saveRequests(requests) {
    localStorage.setItem(
        "findoraRequests",
        JSON.stringify(requests)
    );
}


// 4. SAFE TEXT DISPLAY

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const characters = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return characters[character];
    });
}


// 5. GENERATE UNIQUE IDS

function createID() {
    return Date.now().toString() +
        Math.random().toString(36).slice(2, 8);
}


// 6. KEYWORD MATCHING

function getKeywords(text) {
    const ignoredWords = [
        "the", "and", "with", "from", "that",
        "this", "have", "has", "was", "were",
        "item", "lost", "found", "near", "school",
        "its", "into", "for", "one", "two"
    ];

    return String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(word =>
            word.length > 2 &&
            !ignoredWords.includes(word)
        );
}


function findMatches(newItem) {

    const oppositeType =
        newItem.type === "Lost" ? "Found" : "Lost";

    const newKeywords = new Set(
        getKeywords(
            newItem.name + " " +
            newItem.description + " " +
            newItem.location
        )
    );

    return items.filter(item => {

        if (item.type !== oppositeType) return false;

        if (item.status === "Returned") return false;

        if (
            item.category.toLowerCase() !==
            newItem.category.toLowerCase()
        ) {
            return false;
        }

        const existingKeywords = getKeywords(
            item.name + " " +
            item.description + " " +
            item.location
        );

        return existingKeywords.some(word =>
            newKeywords.has(word)
        );

    });
}


// 7. REPORT ITEM FORM

const itemForm = document.getElementById("itemForm");

itemForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const type = document.getElementById("itemType").value;
    const name = document.getElementById("itemName").value.trim();
    const category = document.getElementById("itemCategory").value;
    const description = document.getElementById("itemDescription").value.trim();
    const location = document.getElementById("itemLocation").value.trim();
    const date = document.getElementById("itemDate").value;
    const contact = document.getElementById("itemContact").value.trim();

    if (
        !type || !name || !category ||
        !description || !location || !date
    ) {
        alert("Please fill in all required fields.");
        return;
    }

    const newItem = {

        id: createID(),

        type: type,

        name: name,

        category: category,

        description: description,

        location: location,

        date: date,

        contact: contact,

        status: "Available"

    };

    // Check possible matches before saving
    const matches = findMatches(newItem);

    // Save new report
    items.push(newItem);

    saveItems();

    displayItems();

    updateStats();

    // Show possible matches
    if (matches.length > 0) {

        alert(
            "Report submitted successfully!\n\n" +
            matches.length +
            " possible matching " +
            (matches.length === 1 ? "report" : "reports") +
            " found.\n\n" +
            "Please check the Browse Items section."
        );

    } else {

        alert(
            "Your " + type.toLowerCase() +
            " report has been submitted successfully!"
        );

    }

    itemForm.reset();

});


// 8. STUDENT RETURN REQUEST

function requestReturn(foundItem) {

    // Only available Found items can receive requests
    if (
        foundItem.type !== "Found" ||
        foundItem.status === "Returned"
    ) {
        alert("This item is not available for a return request.");
        return;
    }

    const matches = findMatches(foundItem);

    if (matches.length === 0) {

        alert(
            "No matching lost report is available yet.\n\n" +
            "A return request can be submitted when a matching Lost report exists."
        );

        return;
    }

    const studentName = prompt(
        "Enter your name to request this item:"
    );

    if (!studentName || !studentName.trim()) {
        alert("Please enter your name.");
        return;
    }

    const studentClass = prompt(
        "Enter your class and section (Example: XII-B):"
    );

    if (!studentClass || !studentClass.trim()) {
        alert("Please enter your class and section.");
        return;
    }

    const requests = getRequests();

    // Prevent duplicate requests
    const alreadyRequested = requests.some(request =>

        String(request.foundItemId) === String(foundItem.id) &&

        request.studentName.toLowerCase() ===
        studentName.trim().toLowerCase() &&

        request.status !== "Returned"

    );

    if (alreadyRequested) {

        alert("You have already requested this item.");

        return;

    }

    // Create return request
    const newRequest = {

        requestId: createID(),

        foundItemId: foundItem.id,

        matchedLostItemIds: matches.map(item => item.id),

        itemName: foundItem.name,

        studentName: studentName.trim(),

        studentClass: studentClass.trim(),

        status: "Pending Verification",

        requestDate: new Date().toLocaleDateString()

    };

    // Save request
    requests.push(newRequest);

    saveRequests(requests);

    // Refresh Admin Dashboard
    displayAdminRequests();

    updateAdminStats();

    alert(
        "Return request submitted successfully! 🎉\n\n" +
        "Item: " + foundItem.name + "\n" +
        "Student: " + studentName.trim() + "\n\n" +
        "Your request is now visible in the Admin Dashboard."
    );

}


// 9. DISPLAY PUBLIC ITEMS

function displayItems() {

    const container = document.getElementById("itemsContainer");

    const searchText = document.getElementById("searchInput")
        .value.toLowerCase().trim();

    // Hide all returned items
    const filteredItems = items.filter(item => {

        if (item.status === "Returned") {
            return false;
        }

        const searchableText = (
            item.name + " " +
            item.category + " " +
            item.description + " " +
            item.location
        ).toLowerCase();

        const matchesSearch =
            searchableText.includes(searchText);

        const matchesFilter =
            activeFilter === "All" ||
            item.type === activeFilter;

        return matchesSearch && matchesFilter;

    });

    if (filteredItems.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <span>🔎</span>
                <h3>No items found</h3>
                <p>Try another search or submit a new report.</p>
            </div>
        `;

        return;

    }

    container.innerHTML = filteredItems.map(item => {

        const itemTypeClass =
            item.type.toLowerCase();

        const actionButton =
            item.type === "Found"
                ? `
                    <button
                        class="item-action"
                        data-action="request"
                        data-id="${escapeHTML(item.id)}">
                        Request Return
                    </button>
                `
                : "";

        return `

            <div class="item-card">

                <div class="item-card-top">

                    <span class="item-type ${itemTypeClass}">
                        ${escapeHTML(item.type)}
                    </span>

                    <span class="item-category">
                        ${escapeHTML(item.category)}
                    </span>

                </div>

                <h3>${escapeHTML(item.name)}</h3>

                <p class="item-description">
                    ${escapeHTML(item.description)}
                </p>

                <div class="item-details">

                    <p>
                        <strong>Location:</strong>
                        ${escapeHTML(item.location)}
                    </p>

                    <p>
                        <strong>Date:</strong>
                        ${escapeHTML(item.date)}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        Available
                    </p>

                </div>

                ${actionButton}

            </div>

        `;

    }).join("");

}


// 10. HANDLE REQUEST BUTTONS

document.getElementById("itemsContainer")
    .addEventListener("click", function(event) {

        const button = event.target.closest(
            '[data-action="request"]'
        );

        if (!button) return;

        const itemID = button.dataset.id;

        const foundItem = items.find(item =>
            String(item.id) === String(itemID)
        );

        if (foundItem) {
            requestReturn(foundItem);
        }

    });


// 11. SEARCH ITEMS

document.getElementById("searchInput")
    .addEventListener("input", displayItems);


// 12. FILTER ITEMS

document.querySelectorAll(".filter-btn").forEach(button => {

    button.addEventListener("click", function() {

        activeFilter = this.dataset.filter;

        document.querySelectorAll(".filter-btn").forEach(btn => {
            btn.classList.remove("active");
        });

        this.classList.add("active");

        displayItems();

    });

});


// 13. DISPLAY ADMIN RETURN REQUESTS

function displayAdminRequests() {

    const container =
        document.getElementById("requestsContainer");

    const requests = getRequests();

    if (requests.length === 0) {

        container.innerHTML = `

            <div class="empty-state">
                <span>📋</span>
                <h3>No return requests yet</h3>
                <p>Student requests will appear here.</p>
            </div>

        `;

        updateAdminStats();

        return;

    }

    // Show newest requests first
    const sortedRequests = [...requests].reverse();

    container.innerHTML = sortedRequests.map(request => {

        let statusClass = "";

        if (request.status === "Returned") {
            statusClass = "returned";
        } else if (
            request.status === "Approved - Awaiting Handover"
        ) {
            statusClass = "approved";
        }

        let actionButtons = "";

        if (request.status === "Pending Verification") {

            actionButtons = `

                <button
                    class="admin-action approve-button"
                    data-admin-action="approve"
                    data-id="${escapeHTML(request.requestId)}">
                    Approve Verified Claim
                </button>

            `;

        } else if (
            request.status === "Approved - Awaiting Handover"
        ) {

            actionButtons = `

                <button
                    class="admin-action return-button"
                    data-admin-action="returned"
                    data-id="${escapeHTML(request.requestId)}">
                    Mark Item as Returned
                </button>

            `;

        } else {

            actionButtons = `
                <span class="completed-message">
                    ✓ Handover completed
                </span>
            `;

        }

        return `

            <div class="request-card">

                <div class="request-header">

                    <h3>${escapeHTML(request.itemName)}</h3>

                    <span class="request-status ${statusClass}">
                        ${escapeHTML(request.status)}
                    </span>

                </div>

                <div class="request-info">

                    <p>
                        <strong>Student:</strong>
                        ${escapeHTML(request.studentName)}
                    </p>

                    <p>
                        <strong>Class:</strong>
                        ${escapeHTML(request.studentClass)}
                    </p>

                    <p>
                        <strong>Request Date:</strong>
                        ${escapeHTML(request.requestDate)}
                    </p>

                </div>

                <div class="request-actions">
                    ${actionButtons}
                </div>

            </div>

        `;

    }).join("");

    updateAdminStats();

}


// 14. APPROVE RETURN REQUEST

function updateRequestStatus(requestId) {

    const requests = getRequests();

    const request = requests.find(item =>
        String(item.requestId) === String(requestId)
    );

    if (!request) {

        alert("Request not found.");

        return;

    }

    if (request.status !== "Pending Verification") {
        return;
    }

    const confirmed = confirm(
        "Have you verified this student's claim?\n\n" +
        "Approve this return request?"
    );

    if (!confirmed) return;

    request.status = "Approved - Awaiting Handover";

    saveRequests(requests);

    displayAdminRequests();

    updateAdminStats();

    alert("Request approved successfully!");

}


// 15. MARK ITEM AS RETURNED

function markItemReturned(requestId) {

    const requests = getRequests();

    const request = requests.find(item =>
        String(item.requestId) === String(requestId)
    );

    if (!request) {

        alert("Return request not found.");

        return;

    }

    if (
        request.status !== "Approved - Awaiting Handover"
    ) {

        alert("Please approve the request before marking it returned.");

        return;

    }

    const foundItem = items.find(item =>
        String(item.id) === String(request.foundItemId)
    );

    if (!foundItem) {

        alert("Found item could not be located.");

        return;

    }

    const confirmed = confirm(
        "Confirm that the item has been handed over to the student?\n\n" +
        "Item: " + request.itemName + "\n" +
        "Student: " + request.studentName
    );

    if (!confirmed) return;

    // Mark Found entry as Returned
    foundItem.status = "Returned";

    // Mark all matching Lost entries as Returned
    const lostIds = request.matchedLostItemIds || [];

    lostIds.forEach(lostId => {

        const lostItem = items.find(item =>
            String(item.id) === String(lostId)
        );

        if (lostItem) {
            lostItem.status = "Returned";
        }

    });

    // Update request history
    request.status = "Returned";

    // Save both datasets
    saveItems();

    saveRequests(requests);

    // Refresh the complete website
    displayAdminRequests();

    displayItems();

    updateStats();

    updateAdminStats();

    alert(
        "🎉 Item successfully marked as returned!\n\n" +
        "Item: " + request.itemName + "\n" +
        "Student: " + request.studentName
    );

}


// 16. ADMIN BUTTON HANDLING

document.getElementById("requestsContainer")
    .addEventListener("click", function(event) {

        const button = event.target.closest("[data-admin-action]");

        if (!button) return;

        const requestId = button.dataset.id;

        const action = button.dataset.adminAction;

        if (action === "approve") {

            updateRequestStatus(requestId);

        }

        if (action === "returned") {

            markItemReturned(requestId);

        }

    });


// 17. UPDATE MAIN STATISTICS

function updateStats() {

    const lost = items.filter(item =>

        item.type === "Lost" &&
        item.status !== "Returned"

    ).length;

    const found = items.filter(item =>

        item.type === "Found" &&
        item.status !== "Returned"

    ).length;

    const returned = items.filter(item =>

        item.type === "Found" &&
        item.status === "Returned"

    ).length;

    document.getElementById("lostCount").textContent = lost;

    document.getElementById("foundCount").textContent = found;

    document.getElementById("returnedCount").textContent = returned;

}


// 18. UPDATE ADMIN STATISTICS

function updateAdminStats() {

    const requests = getRequests();

    const pending = requests.filter(request =>

        request.status === "Pending Verification"

    ).length;

    const approved = requests.filter(request =>

        request.status === "Approved - Awaiting Handover"

    ).length;

    const returned = requests.filter(request =>

        request.status === "Returned"

    ).length;

    document.getElementById("pendingCount").textContent = pending;

    document.getElementById("approvedCount").textContent = approved;

    document.getElementById("adminReturnedCount").textContent = returned;

}


// 19. INITIALIZE WEBSITE

function initializeFindora() {

    displayItems();

    displayAdminRequests();

    updateStats();

    updateAdminStats();

}

// Run when the page loads
initializeFindora();
