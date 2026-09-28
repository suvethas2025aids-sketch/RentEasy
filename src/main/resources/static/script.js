/* =========================================================
   RENTEASY - COMPLETE SCRIPT.JS
   ========================================================= */


/* =========================================================
   API
   ========================================================= */

const API = {
    tenants: "/api/tenants",
    rooms: "/api/rooms",
    payments: "/api/payments"
};


/* =========================================================
   GLOBAL DATA
   ========================================================= */

let tenants = [];
let rooms = [];
let payments = [];

let editingTenantId = null;
let editingRoomId = null;
let selectedRoomId = null;


/* =========================================================
   INITIAL LOAD
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("RentEasy JavaScript loaded");

    setupNavigation();
    setupForms();
    setupButtons();

    loadAllData();

});


/* =========================================================
   LOAD ALL DATA
   ========================================================= */

async function loadAllData() {

    try {

        await Promise.all([
            loadTenants(),
            loadRooms(),
            loadPayments()
        ]);

        updateDashboard();
        populateTenantDropdowns();
        populateRoomDropdowns();

    } catch (error) {

        console.error("Loading error:", error);

        showToast(
            "Unable to load application data",
            "error"
        );
    }
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    const links = document.querySelectorAll(
        ".sidebar a, .sidebar button, [data-page]"
    );

    links.forEach(function (link) {

        link.addEventListener("click", function (event) {

            event.preventDefault();

            let page =
                this.getAttribute("data-page");

            if (!page) {

                const href =
                    this.getAttribute("href");

                if (href && href.startsWith("#")) {
                    page = href.substring(1);
                }
            }

            if (!page) {
                return;
            }

            page = page.replace("#", "");

            showPage(page);
        });

    });

}


/* =========================================================
   SHOW PAGE
   ========================================================= */

function showPage(page) {

    console.log("Opening page:", page);

    document
        .querySelectorAll(".page")
        .forEach(function (section) {

            section.classList.remove("active");
            section.style.display = "none";

        });

    let selectedPage =
        document.getElementById(page);

    if (!selectedPage) {

        const alternatives = {

            dashboard: [
                "dashboard",
                "dashboardPage"
            ],

            tenants: [
                "tenants",
                "tenantPage",
                "tenantsPage"
            ],

            rooms: [
                "rooms",
                "roomPage",
                "roomsPage"
            ],

            payments: [
                "payments",
                "paymentPage",
                "paymentsPage"
            ],

            pending: [
                "pending",
                "pendingDues",
                "pendingPage",
                "pending-dues"
            ],

            "pending-dues": [
                "pending",
                "pendingDues",
                "pendingPage"
            ]

        };

        const ids =
            alternatives[page] || [];

        for (const id of ids) {

            const element =
                document.getElementById(id);

            if (element) {

                selectedPage = element;

                break;
            }
        }
    }

    if (selectedPage) {

        selectedPage.classList.add("active");
        selectedPage.style.display = "block";

    } else {

        console.error(
            "Page not found:",
            page
        );

        return;
    }

    document
        .querySelectorAll(
            ".sidebar a, .sidebar button, [data-page]"
        )
        .forEach(function (link) {

            link.classList.remove("active");

            let linkPage =
                link.getAttribute("data-page");

            if (!linkPage) {

                const href =
                    link.getAttribute("href");

                if (
                    href &&
                    href.startsWith("#")
                ) {

                    linkPage =
                        href.substring(1);
                }
            }

            if (
                linkPage &&
                linkPage.replace("#", "") === page
            ) {

                link.classList.add("active");
            }

        });

    if (page === "dashboard") {
        updateDashboard();
    }

    if (page === "tenants") {
        loadTenants();
    }

    if (page === "rooms") {
        loadRooms();
    }

    if (page === "payments") {
        loadPayments();
    }

    if (
        page === "pending" ||
        page === "pending-dues"
    ) {

        loadPendingDues();

    }

}


/* =========================================================
   TENANTS
   ========================================================= */

async function loadTenants() {

    try {

        const response =
            await fetch(API.tenants);

        if (!response.ok) {

            throw new Error(
                "Failed to load tenants"
            );
        }

        tenants =
            await response.json();

        renderTenants();
        populateTenantDropdowns();
        updateDashboard();

    } catch (error) {

        console.error(error);

        showToast(
            error.message,
            "error"
        );
    }

}


/* =========================================================
   RENDER TENANTS
   ========================================================= */

function renderTenants() {

    const tableBody =
        document.getElementById("tenantTableBody") ||
        document.getElementById("tenantsTableBody") ||
        document.querySelector("#tenants tbody");

    if (!tableBody) {

        console.warn(
            "Tenant table body not found"
        );

        return;
    }

    tableBody.innerHTML = "";

    if (tenants.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    No tenants found
                </td>
            </tr>
        `;

        return;
    }

    tenants.forEach(function (tenant) {

        const room =
            rooms.find(function (room) {

                return (
                    room.tenant &&
                    Number(room.tenant.id) ===
                    Number(tenant.id)
                );

            });

        const roomName =
            room
                ? room.roomNumber
                : "Not assigned";

        const row =
            document.createElement("tr");

        row.innerHTML = `

            <td>${tenant.id ?? "-"}</td>

            <td>${escapeHtml(
            tenant.name ?? "-"
        )}</td>

            <td>${escapeHtml(
            tenant.phone ?? "-"
        )}</td>

            <td>${escapeHtml(
            tenant.email ?? "-"
        )}</td>

            <td>${formatDate(
            tenant.moveInDate
        )}</td>

            <td>
                ${escapeHtml(roomName)}
            </td>

            <td>

                <button
                    class="btn btn-edit"
                    onclick="editTenant(${tenant.id})">
                    Edit
                </button>

                <button
                    class="btn btn-delete"
                    onclick="deleteTenant(${tenant.id})">
                    Delete
                </button>

            </td>
        `;

        tableBody.appendChild(row);

    });

}


/* =========================================================
   OPEN TENANT MODAL
   ========================================================= */

function openTenantModal(id = null) {

    editingTenantId = id;

    const modal =
        document.getElementById("tenantModal");

    const title =
        document.getElementById("tenantModalTitle");

    const nameInput =
        document.getElementById("tenantName");

    const phoneInput =
        document.getElementById("tenantPhone");

    const emailInput =
        document.getElementById("tenantEmail");

    const dateInput =
        document.getElementById("tenantMoveInDate");

    if (id) {

        const tenant =
            tenants.find(function (item) {

                return Number(item.id) === Number(id);

            });

        if (!tenant) {

            showToast(
                "Tenant not found",
                "error"
            );

            return;
        }

        if (title) {
            title.textContent = "Edit Tenant";
        }

        if (nameInput) {
            nameInput.value =
                tenant.name || "";
        }

        if (phoneInput) {
            phoneInput.value =
                tenant.phone || "";
        }

        if (emailInput) {
            emailInput.value =
                tenant.email || "";
        }

        if (dateInput) {
            dateInput.value =
                tenant.moveInDate || "";
        }

    } else {

        if (title) {
            title.textContent = "Add Tenant";
        }

        if (nameInput) {
            nameInput.value = "";
        }

        if (phoneInput) {
            phoneInput.value = "";
        }

        if (emailInput) {
            emailInput.value = "";
        }

        if (dateInput) {
            dateInput.value = "";
        }

    }

    if (modal) {
        showModal(modal);
    }

}


/* =========================================================
   EDIT TENANT
   ========================================================= */

function editTenant(id) {

    openTenantModal(id);

}


/* =========================================================
   SAVE TENANT
   ========================================================= */

async function saveTenant() {

    const name =
        document.getElementById("tenantName")?.value.trim();

    const phone =
        document.getElementById("tenantPhone")?.value.trim();

    const email =
        document.getElementById("tenantEmail")?.value.trim();

    const moveInDate =
        document.getElementById("tenantMoveInDate")?.value;

    if (!name) {

        showToast(
            "Tenant name is required",
            "error"
        );

        return;
    }

    if (!/^\d{10}$/.test(phone)) {

        showToast(
            "Phone number must contain exactly 10 digits",
            "error"
        );

        return;
    }

    if (!moveInDate) {

        showToast(
            "Move-in date is required",
            "error"
        );

        return;
    }

    const data = {

        name: name,
        phone: phone,
        email: email,
        moveInDate: moveInDate

    };

    try {

        let response;

        if (editingTenantId) {

            response =
                await fetch(
                    `${API.tenants}/${editingTenantId}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify(data)
                    }
                );

        } else {

            response =
                await fetch(
                    API.tenants,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify(data)
                    }
                );

        }

        const result =
            await readResponse(response);

        if (!response.ok) {

            throw new Error(
                getErrorMessage(result)
            );
        }

        showToast(
            editingTenantId
                ? "Tenant updated successfully"
                : "Tenant added successfully",
            "success"
        );

        closeAllModals();

        editingTenantId = null;

        await loadAllData();

    } catch (error) {

        console.error(error);

        showToast(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   DELETE TENANT
   ========================================================= */

async function deleteTenant(id) {

    const tenant =
        tenants.find(function (item) {

            return Number(item.id) === Number(id);

        });

    if (!tenant) {

        showToast(
            "Tenant not found",
            "error"
        );

        return;
    }

    const confirmed =
        confirm(
            `Delete tenant "${tenant.name}"?`
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API.tenants}/${id}`,
                {
                    method: "DELETE"
                }
            );

        const result =
            await readResponse(response);

        if (!response.ok) {

            throw new Error(
                getErrorMessage(result)
            );
        }

        showToast(
            "Tenant deleted successfully",
            "success"
        );

        await loadAllData();

    } catch (error) {

        console.error(error);

        showToast(
            error.message ||
            "Unable to delete tenant",
            "error"
        );

    }

}


/* =========================================================
   ROOMS
   ========================================================= */

async function loadRooms() {

    try {

        const response =
            await fetch(API.rooms);

        if (!response.ok) {

            throw new Error(
                "Failed to load rooms"
            );
        }

        rooms =
            await response.json();

        renderRooms();
        populateRoomDropdowns();
        renderTenants();
        updateDashboard();

    } catch (error) {

        console.error(error);

        showToast(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   RENDER ROOMS
   ========================================================= */

function renderRooms() {

    const tableBody =
        document.getElementById("roomTableBody") ||
        document.getElementById("roomsTableBody") ||
        document.querySelector("#rooms tbody");

    if (!tableBody) {

        console.warn(
            "Room table body not found"
        );

        return;
    }

    tableBody.innerHTML = "";

    if (rooms.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    No rooms found
                </td>
            </tr>
        `;

        return;
    }

    rooms.forEach(function (room) {

        const occupied =
            !!room.tenant;

        const tenantName =
            room.tenant?.name ||
            "-";

        const row =
            document.createElement("tr");

        row.innerHTML = `

            <td>${room.id ?? "-"}</td>

            <td>${escapeHtml(
            room.roomNumber ?? "-"
        )}</td>

            <td>
                ₹${formatAmount(
            room.monthlyRent
        )}
            </td>

            <td>
                <span class="
                    ${occupied
            ? "status-occupied"
            : "status-available"}
                ">
                    ${occupied
            ? "Occupied"
            : "Available"}
                </span>
            </td>

            <td>
                ${
            occupied
                ? escapeHtml(tenantName)
                : "No tenant assigned"
        }
            </td>

            <td>

                <button
                    class="btn btn-edit"
                    onclick="editRoom(${room.id})">
                    Edit
                </button>

                ${
            occupied
                ?
                `<button
                            class="btn btn-warning"
                            onclick="vacateRoom(${room.id})">
                            Vacate
                        </button>`
                :
                `<button
                            class="btn btn-primary"
                            onclick="openAssignModal(${room.id})">
                            Assign
                        </button>`
        }

                <button
                    class="btn btn-delete"
                    onclick="deleteRoom(${room.id})">
                    Delete
                </button>

            </td>
        `;

        tableBody.appendChild(row);

    });

}


/* =========================================================
   OPEN ROOM MODAL
   ========================================================= */

function openRoomModal(id = null) {

    editingRoomId = id;

    const modal =
        document.getElementById("roomModal");

    const title =
        document.getElementById("roomModalTitle");

    const roomNumber =
        document.getElementById("roomNumber");

    const monthlyRent =
        document.getElementById("monthlyRent");

    if (id) {

        const room =
            rooms.find(function (item) {

                return Number(item.id) === Number(id);

            });

        if (!room) {

            showToast(
                "Room not found",
                "error"
            );

            return;
        }

        if (title) {
            title.textContent = "Edit Room";
        }

        if (roomNumber) {
            roomNumber.value =
                room.roomNumber || "";
        }

        if (monthlyRent) {
            monthlyRent.value =
                room.monthlyRent || "";
        }

    } else {

        if (title) {
            title.textContent = "Add Room";
        }

        if (roomNumber) {
            roomNumber.value = "";
        }

        if (monthlyRent) {
            monthlyRent.value = "";
        }

    }

    if (modal) {
        showModal(modal);
    }

}


/* =========================================================
   EDIT ROOM
   ========================================================= */

function editRoom(id) {

    openRoomModal(id);

}


/* =========================================================
   SAVE ROOM
   ========================================================= */

async function saveRoom() {

    const roomNumber =
        document
            .getElementById("roomNumber")
            ?.value
            .trim();

    const monthlyRent =
        document
            .getElementById("monthlyRent")
            ?.value;

    if (!roomNumber) {

        showToast(
            "Room number is required",
            "error"
        );

        return;
    }

    if (
        !monthlyRent ||
        Number(monthlyRent) <= 0
    ) {

        showToast(
            "Monthly rent must be greater than zero",
            "error"
        );

        return;
    }

    const data = {

        roomNumber: roomNumber,
        monthlyRent: Number(monthlyRent)

    };

    try {

        let response;

        if (editingRoomId) {

            response =
                await fetch(
                    `${API.rooms}/${editingRoomId}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify(data)
                    }
                );

        } else {

            response =
                await fetch(
                    API.rooms,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify(data)
                    }
                );

        }

        const result =
            await readResponse(response);

        if (!response.ok) {

            throw new Error(
                getErrorMessage(result)
            );
        }

        showToast(
            editingRoomId
                ? "Room updated successfully"
                : "Room added successfully",
            "success"
        );

        closeAllModals();

        editingRoomId = null;

        await loadAllData();

    } catch (error) {

        console.error(error);

        showToast(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   DELETE ROOM
   ========================================================= */

async function deleteRoom(id) {

    const room =
        rooms.find(function (item) {

            return Number(item.id) === Number(id);

        });

    if (!room) {

        showToast(
            "Room not found",
            "error"
        );

        return;
    }

    const confirmed =
        confirm(
            `Delete room "${room.roomNumber}"?`
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API.rooms}/${id}`,
                {
                    method: "DELETE"
                }
            );

        /*
         * Always read backend response.
         * This handles 400, 404 and 500 responses.
         */

        const result =
            await readResponse(response);

        if (!response.ok) {

            const errorMessage =
                getErrorMessage(result);

            console.error(
                "Delete room failed:",
                errorMessage,
                result
            );

            throw new Error(
                errorMessage
            );
        }

        showToast(
            "Room deleted successfully",
            "success"
        );

        await loadAllData();

    } catch (error) {

        console.error(
            "Delete room error:",
            error
        );

        showToast(
            error.message ||
            "Unable to delete room",
            "error"
        );

    }

}


/* =========================================================
   ASSIGN ROOM
   ========================================================= */

function openAssignModal(roomId) {

    selectedRoomId = roomId;

    const room =
        rooms.find(function (item) {

            return Number(item.id) === Number(roomId);

        });

    if (!room) {

        showToast(
            "Room not found",
            "error"
        );

        return;
    }

    if (room.tenant) {

        showToast(
            "Room is already occupied",
            "error"
        );

        return;
    }

    populateTenantDropdowns();

    const modal =
        document.getElementById("assignModal");

    if (modal) {
        showModal(modal);
    }

}


/* =========================================================
   ASSIGN TENANT
   ========================================================= */

async function assignRoom() {

    const tenantSelect =
        document.getElementById(
            "assignTenantSelect"
        ) ||
        document.getElementById(
            "assignTenant"
        );

    const tenantId =
        tenantSelect?.value;

    if (!selectedRoomId) {

        showToast(
            "Room not selected",
            "error"
        );

        return;
    }

    if (!tenantId) {

        showToast(
            "Please select a tenant",
            "error"
        );

        return;
    }

    try {

        const response =
            await fetch(
                `${API.rooms}/${selectedRoomId}/assign/${tenantId}`,
                {
                    method: "PUT"
                }
            );

        const result =
            await readResponse(response);

        if (!response.ok) {

            throw new Error(
                getErrorMessage(result)
            );
        }

        showToast(
            "Tenant assigned successfully",
            "success"
        );

        selectedRoomId = null;

        closeAllModals();

        await loadAllData();

    } catch (error) {

        console.error(error);

        showToast(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   VACATE ROOM
   ========================================================= */

async function vacateRoom(roomId) {

    const room =
        rooms.find(function (item) {

            return Number(item.id) === Number(roomId);

        });

    if (!room) {

        showToast(
            "Room not found",
            "error"
        );

        return;
    }

    const confirmed =
        confirm(
            `Vacate room "${room.roomNumber}"?`
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API.rooms}/${roomId}/vacate`,
                {
                    method: "PUT"
                }
            );

        const result =
            await readResponse(response);

        if (!response.ok) {

            throw new Error(
                getErrorMessage(result)
            );
        }

        showToast(
            "Room vacated successfully",
            "success"
        );

        await loadAllData();

    } catch (error) {

        console.error(error);

        showToast(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   PAYMENTS
   ========================================================= */

async function loadPayments() {

    try {

        const response =
            await fetch(API.payments);

        if (!response.ok) {

            throw new Error(
                "Failed to load payments"
            );
        }

        payments =
            await response.json();

        renderPayments();
        updateDashboard();

    } catch (error) {

        console.error(error);

        showToast(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   RENDER PAYMENTS
   ========================================================= */

function renderPayments() {

    const tableBody =
        document.getElementById("paymentTableBody") ||
        document.getElementById("paymentsTableBody") ||
        document.querySelector("#payments tbody");

    if (!tableBody) {

        console.warn(
            "Payment table body not found"
        );

        return;
    }

    tableBody.innerHTML = "";

    if (payments.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    No payments found
                </td>
            </tr>
        `;

        return;
    }

    payments.forEach(function (payment) {

        const tenantId =
            payment.tenant?.id ??
            payment.tenantId ??
            payment.tenant_id;

        const tenantName =
            payment.tenant?.name ||

            tenants.find(function (tenant) {

                return Number(tenant.id) ===
                    Number(tenantId);

            })?.name ||

            "-";

        const roomNumber =
            payment.room?.roomNumber ||

            rooms.find(function (room) {

                return (
                    Number(room.id) ===
                    Number(
                        payment.room?.id ??
                        payment.roomId ??
                        payment.room_id
                    )
                );

            })?.roomNumber ||

            "-";

        const row =
            document.createElement("tr");

        row.innerHTML = `

            <td>
                ${payment.id ?? "-"}
            </td>

            <td>
                ${escapeHtml(tenantName)}
            </td>

            <td>
                ${escapeHtml(roomNumber)}
            </td>

            <td>
                ${formatMonth(
            payment.paymentMonth
        )}
            </td>

            <td>
                ₹${formatAmount(
            payment.amount
        )}
            </td>

            <td>
                <span class="status-paid">
                    ${payment.status ?? "PAID"}
                </span>
            </td>

            <td>
                ${formatDate(
            payment.paidDate
        )}
            </td>

        `;

        tableBody.appendChild(row);

    });

}


/* =========================================================
   PAYMENT MODAL
   ========================================================= */

function openPaymentModal() {

    populateTenantDropdowns();

    const modal =
        document.getElementById("paymentModal");

    const monthInput =
        document.getElementById("paymentMonth");

    const amountInput =
        document.getElementById("paymentAmount");

    if (monthInput) {

        const today =
            new Date();

        const year =
            today.getFullYear();

        const month =
            String(
                today.getMonth() + 1
            ).padStart(2, "0");

        monthInput.value =
            `${year}-${month}-01`;
    }

    if (amountInput) {
        amountInput.value = "";
    }

    if (modal) {
        showModal(modal);
    }

}


/* =========================================================
   SAVE PAYMENT
   ========================================================= */

async function savePayment() {

    const tenantSelect =
        document.getElementById(
            "paymentTenantSelect"
        ) ||
        document.getElementById(
            "paymentTenant"
        );

    const tenantId =
        tenantSelect?.value;

    const paymentMonth =
        document.getElementById(
            "paymentMonth"
        )?.value;

    const amount =
        document.getElementById(
            "paymentAmount"
        )?.value;

    if (!tenantId) {

        showToast(
            "Please select a tenant",
            "error"
        );

        return;
    }

    if (!paymentMonth) {

        showToast(
            "Payment month is required",
            "error"
        );

        return;
    }

    if (
        !amount ||
        Number(amount) <= 0
    ) {

        showToast(
            "Payment amount must be greater than zero",
            "error"
        );

        return;
    }

    const data = {

        paymentMonth:
        paymentMonth,

        amount:
            Number(amount)

    };

    try {

        const response =
            await fetch(
                `${API.payments}/tenant/${tenantId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body:
                        JSON.stringify(data)
                }
            );

        const result =
            await readResponse(response);

        if (!response.ok) {

            throw new Error(
                getErrorMessage(result)
            );
        }

        showToast(
            "Payment recorded successfully",
            "success"
        );

        closeAllModals();

        await loadAllData();

    } catch (error) {

        console.error(error);

        showToast(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   PENDING DUES
   ========================================================= */

async function loadPendingDues() {

    const tableBody =
        document.getElementById(
            "pendingTableBody"
        ) ||
        document.querySelector(
            "#pending tbody"
        );

    if (!tableBody) {

        console.warn(
            "Pending table body not found"
        );

        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="5">
                Loading...
            </td>
        </tr>
    `;

    try {

        const response =
            await fetch(
                `${API.payments}/pending/current-month`
            );

        if (!response.ok) {

            throw new Error(
                "Failed to load pending tenants"
            );
        }

        const pendingTenants =
            await response.json();

        renderPendingDues(
            pendingTenants
        );

    } catch (error) {

        console.error(error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    Unable to load pending dues
                </td>
            </tr>
        `;

        showToast(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   RENDER PENDING DUES
   ========================================================= */

function renderPendingDues(
    pendingTenants
) {

    const tableBody =
        document.getElementById(
            "pendingTableBody"
        ) ||
        document.querySelector(
            "#pending tbody"
        );

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (
        !pendingTenants ||
        pendingTenants.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    No pending dues for current month
                </td>
            </tr>
        `;

        return;
    }

    pendingTenants.forEach(function (tenant) {

        const room =
            rooms.find(function (room) {

                return (
                    room.tenant &&
                    Number(room.tenant.id) ===
                    Number(tenant.id)
                );

            });

        const row =
            document.createElement("tr");

        row.innerHTML = `

            <td>
                ${tenant.id ?? "-"}
            </td>

            <td>
                ${escapeHtml(
            tenant.name ?? "-"
        )}
            </td>

            <td>
                ${escapeHtml(
            tenant.phone ?? "-"
        )}
            </td>

            <td>
                ${escapeHtml(
            room?.roomNumber ??
            "Not assigned"
        )}
            </td>

            <td>
                <span class="status-pending">
                    PENDING
                </span>
            </td>

        `;

        tableBody.appendChild(row);

    });

}


/* =========================================================
   TENANT DROPDOWNS
   ========================================================= */

function populateTenantDropdowns() {

    const selects = [

        document.getElementById(
            "assignTenantSelect"
        ),

        document.getElementById(
            "assignTenant"
        ),

        document.getElementById(
            "paymentTenantSelect"
        ),

        document.getElementById(
            "paymentTenant"
        )

    ];

    selects.forEach(function (select) {

        if (!select) {
            return;
        }

        const currentValue =
            select.value;

        select.innerHTML = `
            <option value="">
                Select Tenant
            </option>
        `;

        tenants.forEach(function (tenant) {

            let roomAssigned = false;

            rooms.forEach(function (room) {

                if (
                    room.tenant &&
                    Number(room.tenant.id) ===
                    Number(tenant.id)
                ) {

                    roomAssigned = true;
                }

            });

            const isAssignDropdown =
                select.id ===
                "assignTenantSelect" ||
                select.id ===
                "assignTenant";

            if (
                isAssignDropdown &&
                roomAssigned
            ) {

                return;
            }

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                tenant.id;

            option.textContent =
                `${tenant.name} - ${tenant.phone}`;

            select.appendChild(option);

        });

        if (currentValue) {
            select.value = currentValue;
        }

    });

}


/* =========================================================
   ROOM DROPDOWNS
   ========================================================= */

function populateRoomDropdowns() {

    const selects =
        document.querySelectorAll(
            ".room-select, [data-room-select]"
        );

    selects.forEach(function (select) {

        select.innerHTML = `
            <option value="">
                Select Room
            </option>
        `;

        rooms
            .filter(function (room) {

                return !room.tenant;

            })
            .forEach(function (room) {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    room.id;

                option.textContent =
                    `${room.roomNumber} - ₹${formatAmount(
                        room.monthlyRent
                    )}`;

                select.appendChild(option);

            });

    });

}


/* =========================================================
   DASHBOARD
   ========================================================= */

function updateDashboard() {

    const totalTenants =
        tenants.length;

    const totalRooms =
        rooms.length;

    const occupiedRooms =
        rooms.filter(function (room) {

            return !!room.tenant;

        }).length;

    const availableRooms =
        rooms.filter(function (room) {

            return !room.tenant;

        }).length;

    setText(
        "totalTenants",
        totalTenants
    );

    setText(
        "totalRooms",
        totalRooms
    );

    setText(
        "occupiedRooms",
        occupiedRooms
    );

    setText(
        "availableRooms",
        availableRooms
    );

    setText(
        "totalPayments",
        payments.length
    );

    setText(
        "tenantCount",
        totalTenants
    );

    setText(
        "roomCount",
        totalRooms
    );

    setText(
        "occupiedCount",
        occupiedRooms
    );

    setText(
        "availableCount",
        availableRooms
    );

    setText(
        "paymentCount",
        payments.length
    );

}


/* =========================================================
   FORM SETUP
   ========================================================= */

function setupForms() {

    const tenantForm =
        document.getElementById(
            "tenantForm"
        );

    if (tenantForm) {

        tenantForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                saveTenant();

            }
        );

    }

    const roomForm =
        document.getElementById(
            "roomForm"
        );

    if (roomForm) {

        roomForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                saveRoom();

            }
        );

    }

    const assignForm =
        document.getElementById(
            "assignForm"
        );

    if (assignForm) {

        assignForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                assignRoom();

            }
        );

    }

    const paymentForm =
        document.getElementById(
            "paymentForm"
        );

    if (paymentForm) {

        paymentForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                savePayment();

            }
        );

    }

}


/* =========================================================
   BUTTON SETUP
   ========================================================= */

function setupButtons() {

    const addTenantBtn =
        document.getElementById(
            "addTenantBtn"
        );

    if (addTenantBtn) {

        addTenantBtn.addEventListener(
            "click",
            function () {

                openTenantModal();

            }
        );

    }

    const addRoomBtn =
        document.getElementById(
            "addRoomBtn"
        );

    if (addRoomBtn) {

        addRoomBtn.addEventListener(
            "click",
            function () {

                openRoomModal();

            }
        );

    }

    const addPaymentBtn =
        document.getElementById(
            "addPaymentBtn"
        );

    if (addPaymentBtn) {

        addPaymentBtn.addEventListener(
            "click",
            function () {

                openPaymentModal();

            }
        );

    }

    document
        .querySelectorAll(
            ".modal-close, .close-modal, [data-close-modal]"
        )
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    closeAllModals();

                }
            );

        });

    document
        .querySelectorAll(".modal")
        .forEach(function (modal) {

            modal.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target === modal
                    ) {

                        closeModal(modal);

                    }

                }
            );

        });

}


/* =========================================================
   MODAL FUNCTIONS
   ========================================================= */

function showModal(modal) {

    modal.classList.add("show");

    modal.style.display = "flex";

    document.body.classList.add(
        "modal-open"
    );

}


function closeModal(modal) {

    if (!modal) {
        return;
    }

    modal.classList.remove("show");

    modal.style.display = "none";

    document.body.classList.remove(
        "modal-open"
    );

}


function closeAllModals() {

    document
        .querySelectorAll(".modal")
        .forEach(function (modal) {

            modal.classList.remove("show");

            modal.style.display = "none";

        });

    document.body.classList.remove(
        "modal-open"
    );

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
    message,
    type = "success"
) {

    let toast =
        document.getElementById(
            "toast"
        );

    if (!toast) {

        toast =
            document.createElement(
                "div"
            );

        toast.id = "toast";

        document.body.appendChild(
            toast
        );

    }

    toast.textContent =
        message;

    toast.className =
        `toast ${type}`;

    toast.classList.add(
        "show"
    );

    setTimeout(function () {

        toast.classList.remove(
            "show"
        );

    }, 3000);

}


/* =========================================================
   HELPER - RESPONSE
   ========================================================= */

async function readResponse(
    response
) {

    const text =
        await response.text();

    if (!text) {
        return {};
    }

    try {

        return JSON.parse(text);

    } catch {

        return {
            message: text
        };

    }

}


/* =========================================================
   HELPER - ERROR MESSAGE
   ========================================================= */

function getErrorMessage(
    result
) {

    if (!result) {

        return "Something went wrong";

    }

    /*
     * GlobalExceptionHandler returns:
     *
     * {
     *     "error": "...",
     *     "details": "..."
     * }
     *
     * Always show the actual error first.
     */

    if (
        result.error &&
        result.error !== "Something went wrong"
    ) {

        return result.error;

    }

    if (result.message) {

        return result.message;

    }

    if (result.details) {

        return result.details;

    }

    return "Something went wrong";

}


/* =========================================================
   HELPER - DATE
   ========================================================= */

function formatDate(
    date
) {

    if (!date) {
        return "-";
    }

    const parts =
        String(date).split("-");

    if (parts.length === 3) {

        return (
            parts[2] +
            "/" +
            parts[1] +
            "/" +
            parts[0]
        );

    }

    return date;

}


/* =========================================================
   HELPER - MONTH
   ========================================================= */

function formatMonth(
    date
) {

    if (!date) {
        return "-";
    }

    const parts =
        String(date).split("-");

    if (parts.length >= 2) {

        return (
            parts[1] +
            "/" +
            parts[0]
        );

    }

    return date;

}


/* =========================================================
   HELPER - AMOUNT
   ========================================================= */

function formatAmount(
    amount
) {

    if (
        amount === null ||
        amount === undefined ||
        amount === ""
    ) {

        return "0";

    }

    const number =
        Number(amount);

    if (Number.isNaN(number)) {

        return amount;

    }

    return number.toLocaleString(
        "en-IN"
    );

}


/* =========================================================
   HELPER - SET TEXT
   ========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   HELPER - ESCAPE HTML
   ========================================================= */

function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.showPage =
    showPage;

window.openTenantModal =
    openTenantModal;

window.editTenant =
    editTenant;

window.deleteTenant =
    deleteTenant;

window.saveTenant =
    saveTenant;

window.openRoomModal =
    openRoomModal;

window.editRoom =
    editRoom;

window.deleteRoom =
    deleteRoom;

window.saveRoom =
    saveRoom;

window.openAssignModal =
    openAssignModal;

window.assignRoom =
    assignRoom;

window.vacateRoom =
    vacateRoom;

window.openPaymentModal =
    openPaymentModal;

window.savePayment =
    savePayment;

window.closeModal =
    closeModal;

window.closeAllModals =
    closeAllModals;

window.showToast =
    showToast;