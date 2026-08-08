document.addEventListener("DOMContentLoaded", loadDonationMethods);

async function loadDonationMethods() {

    const container = document.getElementById(
        "publicDonationMethods"
    );

    if (!container) return;

    const { data, error } = await supabaseClient
        .from("donation_methods")
        .select("*")
        .eq("is_active", true)
        .order("method_name");

    if (error) {
        console.error(error);

        container.innerHTML = `
            <div class="donation-loading">
                Donation information is temporarily unavailable.
            </div>
        `;

        return;
    }

    if (!data || data.length === 0) {

        container.innerHTML = `
            <div class="donation-loading">
                Donation methods will be available soon.
            </div>
        `;

        return;
    }

    container.innerHTML = data
        .map(createDonationCard)
        .join("");
}


function createDonationCard(method) {

    const crypto =
        method.method_name === "bitcoin" ||
        method.method_name === "usdt";

    const icon =
        method.method_name === "bitcoin"
            ? "₿"
            : method.method_name === "usdt"
                ? "₮"
                : method.method_name === "usd"
                    ? "USD"
                    : "NGN";

    let details = "";

    if (crypto) {

        details = `
            ${
                method.network
                    ? `<p><strong>Network:</strong> ${escapeHtml(method.network)}</p>`
                    : ""
            }

            ${
                method.wallet_address
                    ? `
                        <div class="copy-box">
                            <span>
                                ${escapeHtml(method.wallet_address)}
                            </span>

                            <button
                                type="button"
                                onclick="copyValue(
                                    this,
                                    '${escapeJs(method.wallet_address)}'
                                )"
                            >
                                Copy
                            </button>
                        </div>
                    `
                    : ""
            }
        `;

    } else {

        details = `
            ${
                method.account_name
                    ? `<p><strong>Account Name:</strong> ${escapeHtml(method.account_name)}</p>`
                    : ""
            }

            ${
                method.bank_name
                    ? `<p><strong>Bank:</strong> ${escapeHtml(method.bank_name)}</p>`
                    : ""
            }

            ${
                method.account_number
                    ? `
                        <div class="copy-box">
                            <span>
                                ${escapeHtml(method.account_number)}
                            </span>

                            <button
                                type="button"
                                onclick="copyValue(
                                    this,
                                    '${escapeJs(method.account_number)}'
                                )"
                            >
                                Copy
                            </button>
                        </div>
                    `
                    : ""
            }
        `;
    }

    return `
        <div class="donation-card">

            <div class="icon">
                ${icon}
            </div>

            <h3>
                ${escapeHtml(method.display_name)}
            </h3>

            ${
                method.instructions
                    ? `<p>${escapeHtml(method.instructions)}</p>`
                    : ""
            }

            ${details}

        </div>
    `;
}


async function copyValue(button, value) {

    try {

        await navigator.clipboard.writeText(value);

        const original = button.textContent;

        button.textContent = "Copied!";

        setTimeout(() => {
            button.textContent = original;
        }, 1500);

    } catch (error) {

        console.error(error);

        button.textContent = "Copy failed";
    }
}


function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function escapeJs(value) {

    return String(value)
        .replaceAll("\\", "\\\\")
        .replaceAll("'", "\\'")
        .replaceAll("\n", "\\n")
        .replaceAll("\r", "\\r");
}
