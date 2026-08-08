const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const loginButton = document.getElementById("loginButton");

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    loginMessage.textContent = "";
    loginButton.disabled = true;
    loginButton.textContent = "Signing in...";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw error;
        }

        if (!data.user) {
            throw new Error("Unable to authenticate administrator.");
        }

        const { data: profile, error: profileError } =
            await supabaseClient
                .from("admin_profiles")
                .select("id, full_name, role")
                .eq("id", data.user.id)
                .single();

        if (profileError || !profile || profile.role !== "admin") {
            await supabaseClient.auth.signOut();
            throw new Error("This account is not authorized as an administrator.");
        }

        window.location.href = "dashboard.html";

    } catch (error) {
        console.error(error);

        loginMessage.textContent =
            error.message || "Unable to sign in.";

        loginButton.disabled = false;
        loginButton.textContent = "Sign In";
    }
});
