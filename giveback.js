(function () {
  "use strict";

  var latestReceipt = null;

  function textOf(el) {
    return (el && el.textContent ? el.textContent : "").replace(/\s+/g, " ").trim();
  }

  function toNumber(value) {
    var n = Number(String(value || "").replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("unnssaa_current_user") || "null");
    } catch {
      return null;
    }
  }

  function setStatus(message, isError) {
    var status = document.getElementById("giveback-status");
    if (!status) return;
    status.textContent = message;
    status.className = "text-sm mt-1 mb-4 " + (isError ? "text-red-200" : "text-on-primary-container");
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function showReceipt(details) {
    var card = document.getElementById("giveback-receipt-card");
    if (!card || !details) return;

    var ref = document.getElementById("giveback-receipt-reference");
    var donor = document.getElementById("giveback-receipt-donor");
    var amount = document.getElementById("giveback-receipt-amount");
    var status = document.getElementById("giveback-receipt-status");
    var channel = document.getElementById("giveback-receipt-channel");
    var paidAt = document.getElementById("giveback-receipt-paid-at");

    if (ref) ref.textContent = details.reference || "-";
    if (donor) donor.textContent = details.donorName || details.donorEmail || "-";

    var amountNaira = Number(details.amountKobo || 0) / 100;
    if (amount) amount.textContent = "NGN " + amountNaira.toLocaleString();

    if (status) status.textContent = String(details.gatewayStatus || "unknown");
    if (channel) channel.textContent = details.channel || "-";
    if (paidAt) {
      paidAt.textContent = details.paidAt ? new Date(details.paidAt).toLocaleString() : "-";
    }

    latestReceipt = {
      donor: details.donorName || details.donorEmail || "-",
      reference: details.reference || "-",
      amountNaira: Number(details.amountKobo || 0) / 100,
      status: String(details.gatewayStatus || "unknown"),
      channel: details.channel || "-",
      paidAt: details.paidAt ? new Date(details.paidAt).toLocaleString() : "-"
    };

    card.classList.remove("hidden");
  }

  function setupReceiptActions() {
    var printBtn = document.getElementById("giveback-receipt-print");
    var downloadBtn = document.getElementById("giveback-receipt-download");

    if (printBtn) {
      printBtn.addEventListener("click", function () {
        if (!latestReceipt) return;
        window.print();
      });
    }

    if (downloadBtn) {
      downloadBtn.addEventListener("click", function () {
        if (!latestReceipt) return;

        var html = [
          "<!doctype html>",
          "<html><head><meta charset='utf-8'><title>UNNSSAA Donation Receipt</title>",
          "<style>body{font-family:Arial,sans-serif;padding:24px;color:#111827;}h1{margin:0 0 6px;font-size:22px;}p{margin:0 0 16px;color:#4b5563;}table{width:100%;border-collapse:collapse;}td{border:1px solid #e5e7eb;padding:10px;font-size:14px;}td:first-child{width:35%;font-weight:700;background:#f9fafb;} .ref{font-family:Consolas,monospace;}</style>",
          "</head><body>",
          "<h1>UNNSSAA Donation Receipt</h1>",
          "<p>Generated " + escapeHtml(new Date().toLocaleString()) + "</p>",
          "<table>",
          "<tr><td>Donor</td><td>" + escapeHtml(latestReceipt.donor) + "</td></tr>",
          "<tr><td>Reference</td><td class='ref'>" + escapeHtml(latestReceipt.reference) + "</td></tr>",
          "<tr><td>Amount</td><td>NGN " + escapeHtml(latestReceipt.amountNaira.toLocaleString()) + "</td></tr>",
          "<tr><td>Status</td><td>" + escapeHtml(latestReceipt.status) + "</td></tr>",
          "<tr><td>Channel</td><td>" + escapeHtml(latestReceipt.channel) + "</td></tr>",
          "<tr><td>Paid At</td><td>" + escapeHtml(latestReceipt.paidAt) + "</td></tr>",
          "</table>",
          "</body></html>"
        ].join("");

        var blob = new Blob([html], { type: "text/html" });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = "unnssaa-receipt-" + latestReceipt.reference + ".html";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      });
    }
  }

  async function verifyPaymentReferenceIfPresent() {
    if (!window.UNNSSAAApi) return;

    var params = new URLSearchParams(window.location.search || "");
    var reference = params.get("reference") || params.get("trxref");
    if (!reference) return;

    try {
      setStatus("Verifying payment confirmation...", false);
      var result = await window.UNNSSAAApi.request("/payments/verify/" + encodeURIComponent(reference));
      var gatewayStatus = result && result.data ? result.data.gatewayStatus : "unknown";
      showReceipt(result && result.data ? result.data : null);

      if (String(gatewayStatus).toLowerCase() === "success") {
        setStatus("Donation confirmed. Thank you for your contribution.", false);
      } else {
        setStatus("Payment verification is pending. Reference: " + reference, true);
      }
    } catch (error) {
      setStatus(error.message || "Unable to verify payment reference.", true);
    }
  }

  async function initDonationFlow() {
    if (!window.UNNSSAAApi) return;

    var donationSection = document.getElementById("donation-section");
    var donateBtn = document.getElementById("giveback-donate-btn");
    var customInput = document.getElementById("giveback-custom-amount");
    if (!donationSection || !donateBtn) return;

    var amountButtons = Array.from(donationSection.querySelectorAll("button")).filter(function (btn) {
      return /\d/.test(textOf(btn));
    });

    var selectedAmount = toNumber((amountButtons[0] && textOf(amountButtons[0])) || "100000");

    amountButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        amountButtons.forEach(function (other) {
          other.classList.remove("ring-2", "ring-secondary-container", "scale-105");
        });
        btn.classList.add("ring-2", "ring-secondary-container", "scale-105");
        selectedAmount = toNumber(textOf(btn));
      });
    });

    donateBtn.addEventListener("click", async function () {
      var customAmount = customInput ? toNumber(customInput.value) : 0;
      var amount = customAmount > 0 ? customAmount : selectedAmount;

      if (!amount || amount <= 0) {
        setStatus("Enter a valid donation amount.", true);
        return;
      }

      var user = getCurrentUser();
      var email = (user && user.email) || window.prompt("Enter donor email", "");
      if (!email) {
        setStatus("Email is required to process payment.", true);
        return;
      }

      var donorName = (user && user.fullName) || window.prompt("Enter donor full name", "UNNSSAA Donor");
      if (!donorName) {
        setStatus("Donor name is required.", true);
        return;
      }

      try {
        donateBtn.disabled = true;
        donateBtn.textContent = "Preparing payment...";
        setStatus("Initializing secure payment...", false);

        var response = await window.UNNSSAAApi.request("/payments/initialize", {
          method: "POST",
          body: {
            email: email,
            donorName: donorName,
            amount: amount,
            details: "UNNSSAA Give Back contribution",
            callbackUrl: window.location.origin + "/giveback.html"
          }
        });

        var nextUrl = response && response.data && response.data.authorizationUrl;
        if (!nextUrl) {
          throw new Error("Payment gateway returned an invalid response");
        }

        setStatus("Redirecting to secure payment gateway...", false);
        window.location.href = nextUrl;
      } catch (error) {
        setStatus(error.message || "Unable to initialize payment right now.", true);
      } finally {
        donateBtn.disabled = false;
        donateBtn.textContent = "Donate Now";
      }
    });
  }

  verifyPaymentReferenceIfPresent().catch(function () {});
  setupReceiptActions();
  initDonationFlow();
})();
