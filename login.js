(function () {
  "use strict";

  var form = document.getElementById("login-form");
  if (!form || !window.UNNSSAAApi) {
    return;
  }

  var emailInput = document.getElementById("login-email");
  var passwordInput = document.getElementById("login-password");
  var submitButton = document.getElementById("login-submit");
  var errorBox = document.getElementById("login-error");

  function showError(message) {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.classList.remove("hidden");
  }

  function hideError() {
    if (!errorBox) return;
    errorBox.textContent = "";
    errorBox.classList.add("hidden");
  }

  function redirectByRole(user) {
    var role = user && user.role ? String(user.role).toUpperCase() : "MEMBER";
    if (role === "ADMIN" || role === "SUPERADMIN") {
      window.location.href = "admin_dashboard.html";
      return;
    }
    window.location.href = "members_dashboard.html";
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    hideError();

    var email = emailInput ? emailInput.value.trim() : "";
    var password = passwordInput ? passwordInput.value : "";

    if (!email || !password) {
      showError("Please enter both email and password.");
      return;
    }

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Signing in...";
      }

      var session = await window.UNNSSAAApi.login(email, password);
      redirectByRole(session.user || {});
    } catch (error) {
      showError(error.message || "Unable to login right now.");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Login";
      }
    }
  });
})();
