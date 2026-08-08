let currentUser = null;
let donationMethods = [];


document.addEventListener("DOMContentLoaded", async () => {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = "admin.html";
        return;
    }

    currentUser = session.user;

    await verifyAdministrator();
    await loadDashboard();
});


async function verifyAdministrator() {

    const { data, error } = await supabaseClient
        .from("admin_profiles")
        .select("full_name, role")
        .eq("id", currentUser.id)
        .single();

    if (error || !data || data.role !== "admin") {

        await supabaseClient.auth.signOut();

        window.location.href = "admin.html";

        return;
    }

    document.getElementById("adminName").textContent =
        `Signed in as ${data.full_name || currentUser.email}`;
}


async function loadDashboard() {

    await loadStatistics();
    await loadDonationMethods();
    await loadDonations();
}


async function loadStatistics() {

    const { data, error } = await supabaseClient
        .from("donations")
        .select("status");

    if (error) {
        console.error(error);
        return;
    }

    const total = data.length;

    const pending = data.filter(
        donation => donation.status === "pending"
    ).length;

    const confirmed = data.filter(
        donation => donation.status === "confirmed"
    ).length;

    document.getElementById("totalDonations").textContent = total;
    document.getElementById("pendingDonations").textContent = pending;
    document.getElementById("confirmedDonations").textContent = confirmed;
}


async function loadDonationMethods() {

    const { data, error } = await supabaseClient
        .from("donation_methods")
        .select("*")
        .order("method_name");

    if (error) {
        console.error(error);
        return;
    }

    donationMethods = data;

    const container =
        document.getElementById("methodsContainer");

    if (!data.length) {

        container.innerHTML = `
            <p>
                No donation methods have been configured yet.
            </p>
        `;

        return;
    }

    container.innerHTML = data.map(method => {

        return `
            <div class="method-card">

                <h3>${escapeHtml(method.display_name)}</h3>

                <div class="form-grid">

                    <div class="field">
                        <label>Display Name</label>
                        <input
                            data-id="${method.id}"
                            data-field="display_name"
                            value="${escapeAttribute(method.display_name || "")}"
                        >
                    </div>

                    <div class="field">
                        <label>Account Name</label>
                        <input
                            data-id="${method.id}"
                            data-field="account_name"
                            value="${escapeAttribute(method.account_name || "")}"
                        >
                    </div>

                    <div class="field">
                        <label>Account Number</label>
                        <input
                            data-id="${method.id}"
                            data-field="account_number"
                            value="${escapeAttribute(method.account_number || "")}"
                        >
                    </div>

                    <div class="field">
                        <label>Bank Name</label>
                        <input
                            data-id="${method.id}"
                            data-field="bank_name"
                            value="${escapeAttribute(method.bank_name || "")}"
                        >
                    </div>

                    <div class="field">
                        <label>Wallet Address</label>
                        <input
                            data-id="${method.id}"
                            data-field="wallet_address"
                            value="${escapeAttribute(method.wallet_address || "")}"
                        >
                    </div>

                    <div class="field">
                        <label>Network</label>
                        <input
                            data-id="${method.id}"
                            data-field="network"
                            value="${escapeAttribute(method.network || "")}"
                        >
                    </div>

                    <div class="field full">
                        <label>Instructions</label>

                        <textarea
                            data-id="${method.id}"
                            data-field="instructions"
                        >${escapeHtml(method.instructions || "")}</textarea>
                    </div>

                    <div class="checkbox">

                        <input
                            type="checkbox"
                            data-id="${method.id}"
                            data-field="is_active"
                            ${method.is_active ? "checked" : ""}
                        >

                        <label>
                            Display this method publicly
                        </label>

                    </div>

                </div>

            </div>
        `;

    }).join("");
}


async function loadDonations() {

    const { data, error } = await supabaseClient
        .from("donations")
        .select("donor_name, amount, currency, donation_method, status, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) {
        console.error(error);
        return;
    }

    const table = document.getElementById("donationsTable");

    if (!data.length) {

        table.innerHTML = `
            <tr>
                <td colspan="5">
                    No donation records yet.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML = data.map(donation => {

        return `
            <tr>

                <td>
                    ${escapeHtml(donation.donor_name || "Anonymous")}
                </td>

                <td>
                    ${escapeHtml(String(donation.amount || ""))}
                    ${escapeHtml(donation.currency || "")}
                </td>

                <td>
                    ${escapeHtml(donation.donation_method || "")}
                </td>

                <td>
                    ${escapeHtml(donation.status)}
                </td>

                <td>
                    ${new Date(donation.created_at).toLocaleString()}
                </td>

            </tr>
        `;

    }).join("");
}


document.getElementById("saveMethodsButton")
    .addEventListener("click", saveDonationMethods);


async function saveDonationMethods() {

    const button =
        document.getElementById("saveMethodsButton");

    const message =
        document.getElementById("saveMessage");

    button.disabled = true;
    button.textContent = "Saving...";
    message.textContent = "";

    try {

        const fields =
            document.querySelectorAll("[data-id][data-field]");

        const updates = {};

        fields.forEach(field => {

            const id = field.dataset.id;
            const fieldName = field.dataset.field;

            if (!updates[id]) {
                updates[id] = { id };
            }

            if (field.type === "checkbox") {
                updates[id][fieldName] = field.checked;
            } else {
                updates[id][fieldName] = field.value;
            }
        });


        for (const update of Object.values(updates)) {

            update.updated_at = new Date().toISOString();

            const { error } = await supabaseClient
                .from("donation_methods")
                .update(update)
                .eq("id", update.id);

            if (error) {
                throw error;
            }
        }

        message.textContent =
            "Donation settings saved successfully.";

    } catch (error) {

        console.error(error);

        message.textContent =
            "Unable to save changes.";

    } finally {

        button.disabled = false;
        button.textContent = "Save Changes";
    }
}


document.getElementById("logoutButton")
    .addEventListener("click", async () => {

        await supabaseClient.auth.signOut();

        window.location.href = "admin.html";
    });


function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function escapeAttribute(value) {
    return escapeHtml(value);
}
