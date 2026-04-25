(function () {
  "use strict";

  function textOf(el) {
    return (el && el.textContent ? el.textContent : "").replace(/\s+/g, " ").trim();
  }

  function showToast(message) {
    var existing = document.getElementById("app-toast");
    if (existing) {
      existing.remove();
    }

    var toast = document.createElement("div");
    toast.id = "app-toast";
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.right = "20px";
    toast.style.bottom = "20px";
    toast.style.zIndex = "9999";
    toast.style.background = "#00342b";
    toast.style.color = "#ffffff";
    toast.style.padding = "12px 16px";
    toast.style.borderRadius = "10px";
    toast.style.boxShadow = "0 10px 30px rgba(0,0,0,0.25)";
    toast.style.fontSize = "14px";
    toast.style.maxWidth = "320px";
    document.body.appendChild(toast);

    setTimeout(function () {
      if (toast && toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 2400);
  }

  function saveItem(key, payload) {
    var current = [];
    try {
      current = JSON.parse(localStorage.getItem(key) || "[]");
    } catch (e) {
      current = [];
    }
    current.push(payload);
    localStorage.setItem(key, JSON.stringify(current));
  }

  function setItems(key, value) {
    localStorage.setItem(key, JSON.stringify(Array.isArray(value) ? value : []));
  }

  function updateItemAt(key, index, updater) {
    var items = getItems(key);
    if (!items[index]) return false;
    items[index] = updater(items[index], index);
    setItems(key, items);
    return true;
  }

  function removeItemAt(key, index) {
    var items = getItems(key);
    if (!items[index]) return false;
    items.splice(index, 1);
    setItems(key, items);
    return true;
  }

  function getItems(key) {
    try {
      var value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (e) {
      return [];
    }
  }

  function formatWhen(iso) {
    if (!iso) return "just now";
    var date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "just now";
    return date.toLocaleString();
  }

  function toNumber(value) {
    var n = Number(String(value).replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }

  function sumAmounts(items, field) {
    return items.reduce(function (total, item) {
      return total + toNumber(item && item[field]);
    }, 0);
  }

  function ensureSeed(key, fallback) {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, JSON.stringify(fallback));
  }

  function seedRegistryDatabase() {
    var seedPath = "registry_sample.json";

    return fetch(seedPath, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Failed to load registry sample");
        }
        return response.json();
      })
      .catch(function () {
        return {
          members: [],
          events: [],
          donations: [],
          grievances: [],
          whistleReports: []
        };
      })
      .then(function (data) {
        ensureSeed("unnssaa_registry_members", data.members || []);
        ensureSeed("unnssaa_registry_events", data.events || []);
        ensureSeed("unnssaa_registry_donations", data.donations || []);
        ensureSeed("unnssaa_registry_grievances", data.grievances || []);
        ensureSeed("unnssaa_registry_whistle_reports", data.whistleReports || []);
        ensureSeed("unnssaa_registry_careers", data.careers || [{
            title: "Senior Business Analyst",
            company: "Access Bank Plc",
            location: "Lagos, NG",
            type: "Full Time",
            description: "An exciting opportunity for Lions in the financial sector. Requires 5+ years of experience in data-driven strategy and financial modeling."
        }, {
            title: "Graduate Engineer Trainee",
            company: "Dangote Group",
            location: "Kano, NG",
            type: "Internship",
            description: "Kickstart your engineering career. Perfect for recent UNN graduates looking to gain hands-on industrial experience."
        }]);
        ensureSeed("unnssaa_registry_mentors", data.mentors || [{
            name: "Dr. Jane Doe",
            profession: "Data Scientist",
            company: "Google",
            expertise: "Technology",
            bio: "Passionate about helping young alumni navigate the tech sector."
        }, {
            name: "John Smith",
            profession: "Investment Banker",
            company: "Goldman Sachs",
            expertise: "Finance",
            bio: "15 years in Wall Street. Open to reviewing resumes and conducting mock interviews."
        }]);
        if (!localStorage.getItem("unnssaa_admin_events") || localStorage.getItem("unnssaa_admin_events") === JSON.stringify(data.events || [])) {
          setItems("unnssaa_admin_events", []);
        }
        if (!localStorage.getItem("unnssaa_donations") || localStorage.getItem("unnssaa_donations") === JSON.stringify(data.donations || [])) {
          setItems("unnssaa_donations", []);
        }
        if (!localStorage.getItem("unnssaa_grievances") || localStorage.getItem("unnssaa_grievances") === JSON.stringify(data.grievances || [])) {
          setItems("unnssaa_grievances", []);
        }
        if (!localStorage.getItem("unnssaa_whistle_reports") || localStorage.getItem("unnssaa_whistle_reports") === JSON.stringify(data.whistleReports || [])) {
          setItems("unnssaa_whistle_reports", []);
        }
        if (!localStorage.getItem("unnssaa_member_registrations")) {
          setItems("unnssaa_member_registrations", []);
        }
        if (!localStorage.getItem("unnssaa_admin_donation_entries")) {
          setItems("unnssaa_admin_donation_entries", []);
        }
      });
  }

  function downloadJson(filename, payload) {
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function buildRegistrySnapshot() {
    return {
      registryMembers: getItems("unnssaa_registry_members"),
      registryEvents: getItems("unnssaa_registry_events"),
      registryDonations: getItems("unnssaa_registry_donations"),
      registryGrievances: getItems("unnssaa_registry_grievances"),
      registryWhistleReports: getItems("unnssaa_registry_whistle_reports"),
      registryCareers: getItems("unnssaa_registry_careers"),
      registryMentors: getItems("unnssaa_registry_mentors"),
      adminEvents: getItems("unnssaa_admin_events"),
      donations: getItems("unnssaa_donations"),
      grievances: getItems("unnssaa_grievances"),
      whistleReports: getItems("unnssaa_whistle_reports"),
      memberRegistrations: getItems("unnssaa_member_registrations"),
      adminDonationEntries: getItems("unnssaa_admin_donation_entries"),
      meta: {
        createdAt: new Date().toISOString(),
        source: "UNNSSAA admin dashboard"
      }
    };
  }

  function applyRegistrySnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      throw new Error("Invalid snapshot payload");
    }

    setItems("unnssaa_registry_members", snapshot.registryMembers || snapshot.members || []);
    setItems("unnssaa_registry_events", snapshot.registryEvents || snapshot.events || []);
    setItems("unnssaa_registry_donations", snapshot.registryDonations || []);
    setItems("unnssaa_registry_grievances", snapshot.registryGrievances || []);
    setItems("unnssaa_registry_whistle_reports", snapshot.registryWhistleReports || []);
    setItems("unnssaa_registry_careers", snapshot.registryCareers || snapshot.careers || []);
    setItems("unnssaa_registry_mentors", snapshot.registryMentors || snapshot.mentors || []);

    setItems("unnssaa_admin_events", snapshot.adminEvents || []);
    setItems("unnssaa_donations", snapshot.donations || []);
    setItems("unnssaa_grievances", snapshot.grievances || []);
    setItems("unnssaa_whistle_reports", snapshot.whistleReports || []);
    setItems("unnssaa_member_registrations", snapshot.memberRegistrations || []);
    setItems("unnssaa_admin_donation_entries", snapshot.adminDonationEntries || []);
  }

  function readJsonFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        try {
          resolve(JSON.parse(String(reader.result || "{}")));
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = function () {
        reject(reader.error || new Error("Unable to read file"));
      };
      reader.readAsText(file);
    });
  }

  function promptEdit(title, fields, current) {
    var next = Object.assign({}, current || {});
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      var currentValue = next[field.key] == null ? "" : String(next[field.key]);
      var value = window.prompt(title + " - " + field.label, currentValue);
      if (value === null) {
        return null;
      }
      next[field.key] = value.trim();
    }
    return next;
  }

  function wireTopButtons() {
    document.querySelectorAll("button").forEach(function (btn) {
      if (btn.closest("form") || String(btn.type || "").toLowerCase() === "submit") {
        return;
      }

      var label = textOf(btn).toLowerCase();
      if (!label) return;

      if (label === "login") {
        btn.addEventListener("click", function () {
          window.location.href = "login.html";
        });
      }

      if (label === "contact") {
        btn.addEventListener("click", function () {
          window.location.href = "contact.html";
        });
      }

      if (label === "join the network") {
        btn.addEventListener("click", function () {
          window.location.href = "about.html";
        });
      }

      if (label === "explore alumni directory") {
        btn.addEventListener("click", function () {
          window.location.href = "alumni_directory.html";
        });
      }
    });
  }

  function wireNewsletter() {
    document.querySelectorAll("button").forEach(function (btn) {
      var label = textOf(btn).toLowerCase();
      if (label !== "subscribe" && label !== "join") return;

      btn.addEventListener("click", function () {
        var container = btn.closest("section, footer, div");
        if (!container) {
          showToast("Subscribed successfully.");
          return;
        }

        var emailInput = container.querySelector("input[type='email'], input[placeholder*='Email'], input[placeholder*='email']");
        var email = emailInput ? String(emailInput.value || "").trim() : "";
        if (emailInput && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          showToast("Enter a valid email to subscribe.");
          return;
        }

        if (emailInput) {
          emailInput.value = "";
        }

        saveItem("unnssaa_subscriptions", {
          email: email || "anonymous@subscriber",
          at: new Date().toISOString()
        });
        showToast("Newsletter subscription received.");
      });
    });
  }

  function wireEventsActions() {
    var actionWords = ["register now", "book seat", "join stream", "add to calendar", "register", "view full archive"];
    document.querySelectorAll("button").forEach(function (btn) {
      var label = textOf(btn).toLowerCase();
      if (!actionWords.some(function (word) { return label.indexOf(word) !== -1; })) return;

      btn.addEventListener("click", function () {
        var card = btn.closest(".glass-card, .group, .p-6, .p-8, .p-12") || document.body;
        var titleEl = card.querySelector("h3, h4, h5");
        var title = titleEl ? textOf(titleEl) : "UNNSSAA event";

        saveItem("unnssaa_event_actions", {
          action: textOf(btn),
          event: title,
          at: new Date().toISOString()
        });

        showToast(textOf(btn) + " confirmed for " + title + ".");
      });
    });
  }

  function wireCareersActions() {
    document.querySelectorAll("button").forEach(function (btn) {
      var label = textOf(btn).toLowerCase();
      if (label === "view details") {
        btn.addEventListener("click", function () {
          var card = btn.closest(".glass-card") || document.body;
          var roleEl = card.querySelector("h3, h4");
          var role = roleEl ? textOf(roleEl) : "Opportunity";

          saveItem("unnssaa_career_interest", {
            role: role,
            at: new Date().toISOString()
          });
          showToast("Saved interest in " + role + ".");
        });
      }

      if (label === "find a mentor" || label === "browse mentors") {
        btn.addEventListener("click", function () {
          window.location.href = "mentors.html";
        });
      }

      if (label === "post an opportunity" || label === "post a job") {
        btn.addEventListener("click", function () {
          showToast("Opportunity post flow opened for admins.");
        });
      }

      if (label === "become a mentor") {
        btn.addEventListener("click", function () {
          saveItem("unnssaa_mentor_interest", { at: new Date().toISOString() });
          showToast("Mentor interest submitted.");
        });
      }
    });
  }

  function wireGiveback() {
    if (window.UNNSSAA_DISABLE_LOCAL_GIVEBACK) {
      return;
    }

    var donationSection = document.getElementById("donation-section");
    if (!donationSection) return;

    var amountButtons = Array.from(donationSection.querySelectorAll("button")).filter(function (btn) {
      return /\d/.test(textOf(btn));
    });
    var donateBtn = Array.from(donationSection.querySelectorAll("button")).find(function (btn) {
      return textOf(btn).toLowerCase() === "donate now";
    });
    var customInput = donationSection.querySelector("input[placeholder*='Custom']");
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

    if (donateBtn) {
      donateBtn.addEventListener("click", function () {
        var customAmount = customInput ? toNumber(customInput.value) : 0;
        var amount = customAmount > 0 ? customAmount : selectedAmount;

        if (!amount || amount <= 0) {
          showToast("Enter a valid donation amount.");
          return;
        }

        var total = toNumber(localStorage.getItem("unnssaa_donation_total") || "0");
        total += amount;
        localStorage.setItem("unnssaa_donation_total", String(total));

        saveItem("unnssaa_donations", {
          amount: amount,
          currency: "NGN",
          at: new Date().toISOString()
        });

        if (customInput) customInput.value = "";
        showToast("Donation pledge recorded: NGN " + amount.toLocaleString() + ".");
      });
    }
  }

  function wireForms() {
    var forms = Array.from(document.querySelectorAll("form"));
    forms.forEach(function (form) {
      var hasPassword = !!form.querySelector("input[type='password']");
      var action = (form.getAttribute("action") || "").toLowerCase();

      if (hasPassword && action.indexOf("members_dashboard.html") !== -1) {
        form.addEventListener("submit", function (event) {
          var email = form.querySelector("input[type='email']");
          var pwd = form.querySelector("input[type='password']");
          if (!email || !pwd) return;

          var emailValue = String(email.value || "").trim();
          var pwdValue = String(pwd.value || "");
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue) || pwdValue.length < 4) {
            event.preventDefault();
            showToast("Enter valid login details.");
            return;
          }

          showToast("Login successful. Redirecting to dashboard...");
        });
        return;
      }

      form.addEventListener("submit", function (event) {
        event.preventDefault();

        var formText = textOf(form).toLowerCase();
        var isWhistle = formText.indexOf("whistle") !== -1;
        var isGrievance = formText.indexOf("grievance") !== -1;
        var isPostEvent = formText.indexOf("post event") !== -1;
        var isRegisterMember = formText.indexOf("register member") !== -1;
        var isUpdateDonation = formText.indexOf("update donations") !== -1;

        if (isPostEvent) {
          var postInputs = form.querySelectorAll("input");
          saveItem("unnssaa_admin_events", {
            title: postInputs[0] ? String(postInputs[0].value || "").trim() : "Untitled event",
            schedule: postInputs[1] ? String(postInputs[1].value || "").trim() : "TBD",
            at: new Date().toISOString()
          });
          form.reset();
          showToast("Admin event created successfully.");
          return;
        }

        if (isRegisterMember) {
          var memberInputs = form.querySelectorAll("input");
          saveItem("unnssaa_member_registrations", {
            name: memberInputs[0] ? String(memberInputs[0].value || "").trim() : "Unnamed member",
            classYear: memberInputs[1] ? String(memberInputs[1].value || "").trim() : "Unknown",
            at: new Date().toISOString()
          });
          form.reset();
          showToast("Member registration saved.");
          return;
        }

        if (isUpdateDonation) {
          var donationInputs = form.querySelectorAll("input");
          saveItem("unnssaa_admin_donation_entries", {
            donor: donationInputs[0] ? String(donationInputs[0].value || "").trim() : "Unnamed donor",
            details: donationInputs[1] ? String(donationInputs[1].value || "").trim() : "No details",
            at: new Date().toISOString()
          });
          form.reset();
          showToast("Donation ledger entry saved.");
          return;
        }

        if (isWhistle) {
          var whistleId = "WB-" + Math.random().toString(36).slice(2, 8).toUpperCase();
          saveItem("unnssaa_whistle_reports", {
            trackingId: whistleId,
            at: new Date().toISOString()
          });
          form.reset();
          showToast("Secure report submitted. Tracking ID: " + whistleId);
          return;
        }

        if (isGrievance) {
          var grievanceId = "GV-" + Math.random().toString(36).slice(2, 8).toUpperCase();
          saveItem("unnssaa_grievances", {
            trackingId: grievanceId,
            status: "Received",
            at: new Date().toISOString()
          });
          form.reset();
          showToast("Grievance submitted. Tracking ID: " + grievanceId);
          return;
        }

        saveItem("unnssaa_form_submissions", {
          page: window.location.pathname,
          at: new Date().toISOString()
        });
        form.reset();
        showToast("Form submitted successfully.");
      });
    });
  }

  function renderDashboardData() {
    if (window.location.pathname.toLowerCase().indexOf("members_dashboard") === -1) {
      return;
    }

    var eventActions = getItems("unnssaa_event_actions");
    var donations = getItems("unnssaa_donations");
    var grievances = getItems("unnssaa_grievances");
    var whistleReports = getItems("unnssaa_whistle_reports");
    var formSubmissions = getItems("unnssaa_form_submissions");
    var adminEvents = getItems("unnssaa_admin_events");
    var registrations = getItems("unnssaa_member_registrations");
    var donationEntries = getItems("unnssaa_admin_donation_entries");

    var eventStat = document.getElementById("stat-event-actions");
    if (eventStat) {
      eventStat.textContent = String(eventActions.length + adminEvents.length).padStart(2, "0");
    }

    var donationStat = document.getElementById("stat-giving-impact");
    var donationTotal = toNumber(localStorage.getItem("unnssaa_donation_total") || "0");
    if (donationStat) {
      donationStat.textContent = "NGN " + donationTotal.toLocaleString();
    }

    var donationWidgetTotal = document.getElementById("dashboard-donation-total");
    if (donationWidgetTotal) {
      donationWidgetTotal.textContent = "NGN " + donationTotal.toLocaleString();
    }

    var donationWidgetMeta = document.getElementById("dashboard-donation-meta");
    if (donationWidgetMeta) {
      donationWidgetMeta.textContent = donations.length + " donation pledge" + (donations.length === 1 ? "" : "s") + " recorded";
    }

    var records = [];
    eventActions.slice(-3).forEach(function (item) {
      records.push("Event: " + (item.action || "Action") + " for " + (item.event || "event") + " (" + formatWhen(item.at) + ")");
    });
    registrations.slice(-3).forEach(function (item) {
      records.push("Member: " + (item.name || "Unnamed") + " registered (" + formatWhen(item.at) + ")");
    });
    grievances.slice(-3).forEach(function (item) {
      records.push("Grievance " + (item.trackingId || "") + " - " + (item.status || "Received") + " (" + formatWhen(item.at) + ")");
    });
    whistleReports.slice(-3).forEach(function (item) {
      records.push("Whistle report " + (item.trackingId || "") + " submitted (" + formatWhen(item.at) + ")");
    });
    donationEntries.slice(-3).forEach(function (item) {
      records.push("Donation ledger: " + (item.donor || "Unnamed donor") + " (" + formatWhen(item.at) + ")");
    });
    formSubmissions.slice(-2).forEach(function (item) {
      records.push("Submission from " + (item.page || "site form") + " (" + formatWhen(item.at) + ")");
    });

    var recordsList = document.getElementById("dashboard-records-list");
    if (recordsList) {
      recordsList.innerHTML = "";
      if (!records.length) {
        var empty = document.createElement("li");
        empty.className = "text-xs text-slate-500";
        empty.textContent = "No recorded activity yet.";
        recordsList.appendChild(empty);
      } else {
        records.slice(-8).reverse().forEach(function (text) {
          var li = document.createElement("li");
          li.className = "text-xs text-slate-600 leading-relaxed";
          li.textContent = text;
          recordsList.appendChild(li);
        });
      }
    }

    var membersCareersList = document.getElementById("member-career-list");
    if (membersCareersList) {
        var careers = getItems("unnssaa_registry_careers");
        membersCareersList.innerHTML = "";
        if (careers.length === 0) {
            membersCareersList.innerHTML = "<p class='text-sm text-stone-500'>No opportunities available at the moment.</p>";
        } else {
            careers.slice(-3).reverse().forEach(function(career) {
                var item = document.createElement("div");
                item.className = "group cursor-pointer pt-6 border-t border-slate-50 first:pt-0 first:border-0";
                item.innerHTML = "<div class='flex justify-between items-start mb-2'><h5 class='text-sm font-bold text-emerald-900 group-hover:text-secondary transition-colors'>" + (career.title || 'Opportunity') + "</h5><span class='px-2 py-1 bg-emerald-50 text-[10px] font-bold text-primary rounded uppercase'>" + (career.type || 'Full Time') + "</span></div><p class='text-xs text-slate-500 mb-2'>" + (career.company || 'Company') + " • " + (career.location || 'Remote') + "</p><p class='text-xs text-slate-400 line-clamp-2'>" + (career.description || 'Details unavailable.') + "</p>";
                membersCareersList.appendChild(item);
            });
        }
    }

    var membersMentorsList = document.getElementById("member-mentor-list");
    if (membersMentorsList) {
        var mentors = getItems("unnssaa_registry_mentors");
        membersMentorsList.innerHTML = "";
        if (mentors.length === 0) {
            membersMentorsList.innerHTML = "<p class='text-sm text-stone-500'>No mentors available at the moment.</p>";
        } else {
            mentors.slice(-3).reverse().forEach(function(mentor) {
                var item = document.createElement("div");
                item.className = "group cursor-pointer pt-6 border-t border-slate-50 first:pt-0 first:border-0";
                item.innerHTML = "<div class='flex justify-between items-start mb-2'><h5 class='text-sm font-bold text-emerald-900 group-hover:text-secondary transition-colors'>" + (mentor.name || 'Mentor') + "</h5><span class='px-2 py-1 bg-emerald-50 text-[10px] font-bold text-primary rounded uppercase'>" + (mentor.expertise || 'General') + "</span></div><p class='text-xs text-slate-500 mb-2'>" + (mentor.profession || 'Professional') + " • " + (mentor.company || 'Company') + "</p><p class='text-xs text-slate-400 line-clamp-2'>" + (mentor.bio || 'Details unavailable.') + "</p>";
                membersMentorsList.appendChild(item);
            });
        }
    }
  }

  function renderCareersPageData() {
    if (window.location.pathname.toLowerCase().indexOf("careers") === -1) return;
    var careersGrid = document.getElementById("careers-job-grid");
    if (careersGrid) {
        var careersAll = getItems("unnssaa_registry_careers");
        careersGrid.innerHTML = "";
        if (careersAll.length === 0) {
            careersGrid.innerHTML = "<p class='text-stone-500 text-center col-span-full'>No roles found.</p>";
        } else {
            careersAll.reverse().forEach(function(career) {
                var iconMap = { "full time": "corporate_fare", "contract": "medical_services", "internship": "account_balance" };
                var icon = iconMap[(career.type || "").toLowerCase()] || "work";
                var c = document.createElement("div");
                c.className = "glass-card p-8 rounded-[1.5rem] border border-white/40 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group";
                c.innerHTML = "<div class='flex justify-between items-start mb-6'><div class='w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center'><span class='material-symbols-outlined text-primary text-3xl'>" + icon + "</span></div><span class='px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-[0.65rem] font-bold tracking-wider uppercase'>" + (career.type || "Full Time") + "</span></div><h3 class='text-xl font-bold text-primary mb-2 group-hover:text-secondary transition-colors'>" + (career.title || 'Role') + "</h3><p class='text-stone-500 text-sm mb-6'>" + (career.company || 'Company') + " • " + (career.location || 'Remote') + "</p><div class='flex flex-wrap gap-2 mb-8'><span class='text-[0.65rem] font-semibold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full'>UNNSSAA</span><span class='text-[0.65rem] font-semibold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full'>Recent</span></div><button class='w-full py-3 rounded-xl border-2 border-primary text-primary font-bold text-sm hover:bg-primary hover:text-on-primary transition-all'>View Details</button>";
                careersGrid.appendChild(c);
            });
        }
    }
  }

  function renderMentorsPageData() {
    if (window.location.pathname.toLowerCase().indexOf("mentors") === -1) return;
    var mentorsGrid = document.getElementById("mentors-directory-grid");
    if (mentorsGrid) {
        var mentorsAll = getItems("unnssaa_registry_mentors");
        mentorsGrid.innerHTML = "";
        if (mentorsAll.length === 0) {
            mentorsGrid.innerHTML = "<p class='text-stone-500 text-center col-span-full'>No mentors found.</p>";
        } else {
            mentorsAll.reverse().forEach(function(mentor) {
                var c = document.createElement("div");
                c.className = "glass-card p-8 rounded-[1.5rem] border border-white/40 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group";
                c.innerHTML = "<div class='flex justify-between items-start mb-6'><div class='w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center'><span class='material-symbols-outlined text-secondary text-3xl'>psychology</span></div><span class='px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[0.65rem] font-bold tracking-wider uppercase'>" + (mentor.expertise || "General") + "</span></div><h3 class='text-xl font-bold text-primary mb-2 group-hover:text-secondary transition-colors'>" + (mentor.name || 'Name') + "</h3><p class='text-stone-500 text-sm mb-6'>" + (mentor.profession || 'Profession') + " • " + (mentor.company || 'Company') + "</p><div class='text-xs text-stone-500 mb-8'>" + (mentor.bio || 'No bio available.') + "</div><button class='w-full py-3 rounded-xl border-2 border-primary text-primary font-bold text-sm hover:bg-primary hover:text-on-primary transition-all'>Request Mentorship</button>";
                mentorsGrid.appendChild(c);
            });
        }
    }
  }

  function renderAdminDashboardData() {
    if (window.location.pathname.toLowerCase().indexOf("admin_dashboard") === -1) {
      return;
    }

    var members = getItems("unnssaa_registry_members");
    var events = getItems("unnssaa_registry_events");
    var donations = getItems("unnssaa_registry_donations").concat(getItems("unnssaa_donations"));
    var grievances = getItems("unnssaa_registry_grievances").concat(getItems("unnssaa_grievances"));
    var whistleReports = getItems("unnssaa_registry_whistle_reports").concat(getItems("unnssaa_whistle_reports"));
    var eventActions = getItems("unnssaa_event_actions");
    var registrations = getItems("unnssaa_member_registrations");
    var adminEvents = getItems("unnssaa_admin_events");
    var donationEntries = getItems("unnssaa_admin_donation_entries");

    var memberCount = document.getElementById("admin-member-count");
    if (memberCount) {
      memberCount.textContent = String(members.length + registrations.length).padStart(2, "0");
    }

    var memberCountCard = document.getElementById("admin-member-count-card");
    if (memberCountCard) {
      memberCountCard.textContent = String(members.length + registrations.length).padStart(2, "0");
    }

    var verifiedCount = document.getElementById("admin-verified-count");
    if (verifiedCount) {
      verifiedCount.textContent = String(members.filter(function (member) { return member.verified; }).length).padStart(2, "0");
    }

    var verifiedCountCard = document.getElementById("admin-verified-count-card");
    if (verifiedCountCard) {
      verifiedCountCard.textContent = String(members.filter(function (member) { return member.verified; }).length).padStart(2, "0");
    }

    var eventCount = document.getElementById("admin-event-count");
    if (eventCount) {
      eventCount.textContent = String(events.length + adminEvents.length + eventActions.length).padStart(2, "0");
    }

    var givingTotal = document.getElementById("admin-giving-total");
    var totalGifts = sumAmounts(donations, "amount") + sumAmounts(donationEntries.map(function (item) { return { amount: item.amount || item.details }; }), "amount");
    if (givingTotal) {
      givingTotal.textContent = "NGN " + totalGifts.toLocaleString();
    }

    var grievanceCount = document.getElementById("admin-open-grievances");
    if (grievanceCount) {
      grievanceCount.textContent = String(grievances.filter(function (item) {
        return !item.status || String(item.status).toLowerCase() !== "resolved";
      }).length).padStart(2, "0");
    }

    var grievanceCountCard = document.getElementById("admin-open-grievances-card");
    if (grievanceCountCard) {
      grievanceCountCard.textContent = String(grievances.filter(function (item) {
        return !item.status || String(item.status).toLowerCase() !== "resolved";
      }).length).padStart(2, "0");
    }

    var memberTable = document.getElementById("admin-member-table-body");
    if (memberTable) {
      memberTable.innerHTML = "";
      members.map(function (member, index) {
        return {
          source: "unnssaa_registry_members",
          index: index,
          name: member.name,
          classYear: member.classYear,
          profession: member.profession,
          chapter: member.chapter,
          location: member.location,
          verified: !!member.verified
        };
      }).concat(registrations.map(function (registration, index) {
        return {
          source: "unnssaa_member_registrations",
          index: index,
          name: registration.name,
          classYear: registration.classYear,
          profession: registration.role || "Pending assignment",
          chapter: registration.chapter || "Unassigned",
          location: registration.location || "New registration",
          verified: false
        };
      })).forEach(function (member) {
        var row = document.createElement("tr");
        row.className = "border-b border-surface-container-low";
        row.innerHTML = "<td class='py-4 pr-4'><div class='font-semibold text-primary'>" + member.name + "</div><div class='text-xs text-slate-500'>" + member.location + "</div></td>" +
          "<td class='py-4 pr-4 text-sm text-slate-600'>Class of " + member.classYear + "</td>" +
          "<td class='py-4 pr-4 text-sm text-slate-600'>" + member.profession + "</td>" +
          "<td class='py-4 pr-4 text-sm text-slate-600'>" + (member.chapter || "General") + "</td>" +
          "<td class='py-4 text-right'><span class='px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary-fixed text-on-primary-fixed'>" + (member.verified ? "Verified" : "Pending") + "</span></td>" +
          "<td class='py-4 text-right'><div class='flex justify-end gap-2'><button class='px-3 py-1 rounded-full bg-surfaceContainer text-[10px] font-bold uppercase tracking-[0.25em]' data-action='edit' data-source='" + member.source + "' data-index='" + member.index + "'>Edit</button><button class='px-3 py-1 rounded-full bg-secondaryContainer text-[10px] font-bold uppercase tracking-[0.25em]' data-action='delete' data-source='" + member.source + "' data-index='" + member.index + "'>Delete</button></div></td>";
        memberTable.appendChild(row);
      });
    }

    var eventList = document.getElementById("admin-event-list");
    if (eventList) {
      eventList.innerHTML = "";
      events.map(function (event, index) {
        return {
          source: "unnssaa_registry_events",
          index: index,
          title: event.title,
          date: event.date,
          schedule: event.schedule,
          type: event.type,
          location: event.location
        };
      }).concat(adminEvents.map(function (event, index) {
        return {
          source: "unnssaa_admin_events",
          index: index,
          title: event.title,
          date: event.date,
          schedule: event.schedule,
          type: event.type,
          location: event.location
        };
      })).slice(0, 6).forEach(function (event) {
        var li = document.createElement("li");
        li.className = "rounded-2xl border border-surface-container-high bg-white p-4";
        li.innerHTML = "<div class='flex items-start justify-between gap-4'><div><div class='font-semibold text-primary'>" + event.title + "</div><div class='text-xs text-slate-500 mt-1'>" + (event.date || event.schedule || "TBD") + "</div></div><span class='text-[10px] font-bold uppercase tracking-widest text-secondary'>" + (event.type || "Event") + "</span></div>" +
          "<div class='mt-4 flex justify-end gap-2'><button class='px-3 py-1 rounded-full bg-surfaceContainer text-[10px] font-bold uppercase tracking-[0.25em]' data-action='edit' data-source='" + event.source + "' data-index='" + event.index + "'>Edit</button><button class='px-3 py-1 rounded-full bg-secondaryContainer text-[10px] font-bold uppercase tracking-[0.25em]' data-action='delete' data-source='" + event.source + "' data-index='" + event.index + "'>Delete</button></div>";
        eventList.appendChild(li);
      });
    }

    var donationList = document.getElementById("admin-donation-list");
    if (donationList) {
      donationList.innerHTML = "";
      donations.map(function (donation, index) {
        return {
          source: index < getItems("unnssaa_registry_donations").length ? "unnssaa_registry_donations" : index < getItems("unnssaa_registry_donations").length + getItems("unnssaa_donations").length ? "unnssaa_donations" : "unnssaa_admin_donation_entries",
          index: index < getItems("unnssaa_registry_donations").length ? index : index < getItems("unnssaa_registry_donations").length + getItems("unnssaa_donations").length ? index - getItems("unnssaa_registry_donations").length : index - getItems("unnssaa_registry_donations").length - getItems("unnssaa_donations").length,
          donor: donation.donor || donation.name || "Anonymous",
          classYear: donation.classYear,
          amount: donation.amount || donation.value || 0,
          details: donation.details || donation.note || "Registry entry"
        };
      }).slice(0, 6).forEach(function (donation) {
        var li = document.createElement("li");
        li.className = "flex items-center justify-between rounded-2xl bg-surface-container-low p-4";
        li.innerHTML = "<div><div class='font-semibold text-primary'>" + donation.donor + "</div><div class='text-xs text-slate-500 mt-1'>" + (donation.classYear || donation.details) + "</div></div><div class='flex items-center gap-2'><div class='font-bold text-secondary'>NGN " + toNumber(donation.amount).toLocaleString() + "</div><button class='px-3 py-1 rounded-full bg-surfaceContainer text-[10px] font-bold uppercase tracking-[0.25em]' data-action='edit' data-source='" + donation.source + "' data-index='" + donation.index + "'>Edit</button><button class='px-3 py-1 rounded-full bg-secondaryContainer text-[10px] font-bold uppercase tracking-[0.25em]' data-action='delete' data-source='" + donation.source + "' data-index='" + donation.index + "'>Delete</button></div>";
        donationList.appendChild(li);
      });
    }

    var grievanceList = document.getElementById("admin-grievance-list");
    if (grievanceList) {
      grievanceList.innerHTML = "";
      grievances.map(function (item, index) {
        return {
          source: index < getItems("unnssaa_registry_grievances").length ? "unnssaa_registry_grievances" : "unnssaa_grievances",
          index: index < getItems("unnssaa_registry_grievances").length ? index : index - getItems("unnssaa_registry_grievances").length,
          trackingId: item.trackingId || item.subject || "Grievance",
          category: item.category || item.message || "Member feedback",
          message: item.message || item.subject || "Member feedback",
          status: item.status || "Received"
        };
      }).slice(0, 6).forEach(function (item) {
        var li = document.createElement("li");
        li.className = "rounded-2xl border border-surface-container-high bg-white p-4";
        li.innerHTML = "<div class='flex items-start justify-between gap-4'><div><div class='font-semibold text-primary'>" + item.trackingId + "</div><div class='text-xs text-slate-500 mt-1'>" + item.category + "</div></div><span class='text-[10px] font-bold uppercase tracking-widest text-emerald-700'>" + item.status + "</span></div>" +
          "<div class='mt-4 flex justify-end gap-2'><button class='px-3 py-1 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-[0.25em]' data-action='resolve' data-source='" + item.source + "' data-index='" + item.index + "'>Resolve</button><button class='px-3 py-1 rounded-full bg-surfaceContainer text-[10px] font-bold uppercase tracking-[0.25em]' data-action='edit' data-source='" + item.source + "' data-index='" + item.index + "'>Edit</button><button class='px-3 py-1 rounded-full bg-secondaryContainer text-[10px] font-bold uppercase tracking-[0.25em]' data-action='delete' data-source='" + item.source + "' data-index='" + item.index + "'>Delete</button></div>";
        grievanceList.appendChild(li);
      });
    }

    var whistleList = document.getElementById("admin-whistle-list");
    if (whistleList) {
      whistleList.innerHTML = "";
      whistleReports.map(function (item, index) {
        return {
          source: index < getItems("unnssaa_registry_whistle_reports").length ? "unnssaa_registry_whistle_reports" : "unnssaa_whistle_reports",
          index: index < getItems("unnssaa_registry_whistle_reports").length ? index : index - getItems("unnssaa_registry_whistle_reports").length,
          trackingId: item.trackingId || "Anonymous report",
          note: item.note || item.summary || "Encrypted and queued for compliance review"
        };
      }).slice(0, 6).forEach(function (item) {
        var li = document.createElement("li");
        li.className = "rounded-2xl border border-surface-container-high bg-tertiary text-white p-4";
        li.innerHTML = "<div class='flex items-start justify-between gap-4'><div><div class='font-semibold'>" + item.trackingId + "</div><div class='text-xs text-primary-fixed/80 mt-1'>" + item.note + "</div></div><span class='text-[10px] font-bold uppercase tracking-widest text-secondary-fixed'>Secure</span></div>" +
          "<div class='mt-4 flex justify-end gap-2'><button class='px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-[0.25em]' data-action='archive' data-source='" + item.source + "' data-index='" + item.index + "'>Archive</button><button class='px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-[0.25em]' data-action='delete' data-source='" + item.source + "' data-index='" + item.index + "'>Delete</button></div>";
        whistleList.appendChild(li);
      });
    }

    var careerList = document.getElementById("admin-career-list");
    if (careerList) {
        var careers = getItems("unnssaa_registry_careers");
        careerList.innerHTML = "";
        careers.map(function(career, index) {
            return {
                source: "unnssaa_registry_careers",
                index: index,
                title: career.title,
                company: career.company,
                location: career.location,
                type: career.type,
                description: career.description
            };
        }).forEach(function(career) {
            var li = document.createElement("li");
            li.className = "rounded-2xl border border-surface-container-high bg-white p-4 flex flex-col gap-2";
            li.innerHTML = "<div class='flex justify-between items-start'><div><h4 class='font-bold text-primary'>" + (career.title || "Untitled Role") + "</h4><p class='text-xs text-stone-500'>" + (career.company || "Unknown Company") + " • " + (career.location || "Remote") + "</p></div><span class='px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-secondary-container text-on-secondary-container rounded'>" + (career.type || "Full Time") + "</span></div><p class='text-sm text-stone-600 line-clamp-2'>" + (career.description || "") + "</p><div class='flex justify-end gap-2 mt-2'><button class='px-3 py-1 rounded-full bg-surface-container text-[10px] font-bold uppercase tracking-[0.25em]' data-action='edit' data-source='" + career.source + "' data-index='" + career.index + "'>Edit</button><button class='px-3 py-1 rounded-full bg-error text-white text-[10px] font-bold uppercase tracking-[0.25em]' data-action='delete' data-source='" + career.source + "' data-index='" + career.index + "'>Delete</button></div>";
            careerList.appendChild(li);
        });
    }

    var mentorList = document.getElementById("admin-mentor-list");
    if (mentorList) {
        var mentors = getItems("unnssaa_registry_mentors");
        mentorList.innerHTML = "";
        mentors.map(function(mentor, index) {
            return {
                source: "unnssaa_registry_mentors",
                index: index,
                name: mentor.name,
                profession: mentor.profession,
                company: mentor.company,
                expertise: mentor.expertise,
                bio: mentor.bio
            };
        }).forEach(function(mentor) {
            var li = document.createElement("li");
            li.className = "rounded-2xl border border-surface-container-high bg-white p-4 flex flex-col gap-2";
            li.innerHTML = "<div class='flex justify-between items-start'><div><h4 class='font-bold text-primary'>" + (mentor.name || "Unknown") + "</h4><p class='text-xs text-stone-500'>" + (mentor.profession || "Professional") + " • " + (mentor.company || "Company") + "</p></div><span class='px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-secondary-container text-on-secondary-container rounded'>" + (mentor.expertise || "General") + "</span></div><p class='text-sm text-stone-600 line-clamp-2'>" + (mentor.bio || "") + "</p><div class='flex justify-end gap-2 mt-2'><button class='px-3 py-1 rounded-full bg-surface-container text-[10px] font-bold uppercase tracking-[0.25em]' data-action='edit' data-source='" + mentor.source + "' data-index='" + mentor.index + "'>Edit</button><button class='px-3 py-1 rounded-full bg-error text-white text-[10px] font-bold uppercase tracking-[0.25em]' data-action='delete' data-source='" + mentor.source + "' data-index='" + mentor.index + "'>Delete</button></div>";
            mentorList.appendChild(li);
        });
    }

    var activityList = document.getElementById("admin-activity-list");
    if (activityList) {
      activityList.innerHTML = "";
      [
        { label: "Event actions", count: eventActions.length },
        { label: "Registry members", count: members.length },
        { label: "Member registrations", count: registrations.length },
        { label: "Donation entries", count: donations.length },
        { label: "Open grievances", count: grievances.filter(function (item) { return !item.status || String(item.status).toLowerCase() !== 'resolved'; }).length },
        { label: "Whistle reports", count: whistleReports.length }
      ].forEach(function (item) {
        var li = document.createElement("li");
        li.className = "flex items-center justify-between rounded-xl bg-white px-4 py-3 border border-surface-container-high";
        li.innerHTML = "<span class='text-sm text-slate-700'>" + item.label + "</span><span class='font-bold text-primary'>" + item.count + "</span>";
        activityList.appendChild(li);
      });
    }
  }

  function wireAdminDashboardActions() {
    if (window.location.pathname.toLowerCase().indexOf("admin_dashboard") === -1) {
      return;
    }

    var exportBtn = document.getElementById("admin-export-report");
    if (exportBtn) {
      exportBtn.addEventListener("click", function () {
        downloadJson("unnssaa-registry-snapshot.json", buildRegistrySnapshot());
        showToast("Registry snapshot exported.");
      });
    }

    var refreshBtn = document.getElementById("admin-refresh-snapshot");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", function () {
        renderAdminDashboardData();
        showToast("Admin snapshot refreshed.");
      });
    }

    var importBtn = document.getElementById("admin-import-report");
    var importFile = document.getElementById("admin-import-file");
    if (importBtn && importFile) {
      importBtn.addEventListener("click", function () {
        importFile.value = "";
        importFile.click();
      });

      importFile.addEventListener("change", function () {
        var file = importFile.files && importFile.files[0];
        if (!file) return;

        readJsonFile(file)
          .then(function (snapshot) {
            applyRegistrySnapshot(snapshot);
            renderAdminDashboardData();
            showToast("Registry snapshot restored.");
          })
          .catch(function () {
            showToast("Could not restore snapshot. Use a valid UNNSSAA export file.");
          });
      });
    }

    document.getElementById("admin-member-table-body")?.addEventListener("click", function (event) {
      var target = event.target.closest("button[data-action]");
      if (!target) return;

      var index = Number(target.getAttribute("data-index"));
      var action = target.getAttribute("data-action");
      if (Number.isNaN(index)) return;

      if (action === "edit") {
        var members = getItems("unnssaa_registry_members");
        var current = members[index];
        if (!current) return;
        var updated = promptEdit("Edit member", [
          { key: "name", label: "Full name" },
          { key: "classYear", label: "Class year" },
          { key: "profession", label: "Profession" },
          { key: "chapter", label: "Chapter" },
          { key: "location", label: "Location" }
        ], current);
        if (!updated) return;
        updated.verified = !!current.verified;
        updated.joinedAt = current.joinedAt || new Date().toISOString();
        updateItemAt("unnssaa_registry_members", index, function () { return updated; });
        renderAdminDashboardData();
        showToast("Member record updated.");
        return;
      }

      if (action === "delete") {
        if (!window.confirm("Delete this member record?")) return;
        if (removeItemAt("unnssaa_registry_members", index)) {
          renderAdminDashboardData();
          showToast("Member record deleted.");
        }
      }
    });

    document.getElementById("admin-event-list")?.addEventListener("click", function (event) {
      var target = event.target.closest("button[data-action]");
      if (!target) return;
      var index = Number(target.getAttribute("data-index"));
      var action = target.getAttribute("data-action");
      var items = getItems(target.getAttribute("data-source"));
      if (Number.isNaN(index) || !items[index]) return;

      if (action === "edit") {
        var updated = promptEdit("Edit event", [
          { key: "title", label: "Title" },
          { key: "date", label: "Date" },
          { key: "schedule", label: "Schedule" },
          { key: "location", label: "Location" }
        ], items[index]);
        if (!updated) return;
        updateItemAt(target.getAttribute("data-source"), index, function () { return updated; });
        renderAdminDashboardData();
        showToast("Event updated.");
        return;
      }

      if (action === "delete") {
        if (!window.confirm("Delete this event?")) return;
        if (removeItemAt(target.getAttribute("data-source"), index)) {
          renderAdminDashboardData();
          showToast("Event deleted.");
        }
      }
    });

    document.getElementById("admin-donation-list")?.addEventListener("click", function (event) {
      var target = event.target.closest("button[data-action]");
      if (!target) return;
      var index = Number(target.getAttribute("data-index"));
      var action = target.getAttribute("data-action"), source = target.getAttribute("data-source");
      var items = getItems(source);
      if (Number.isNaN(index) || !items[index]) return;

      if (action === "edit") {
        var updated = promptEdit("Edit donation", [
          { key: "donor", label: "Donor name" },
          { key: "classYear", label: "Class year" },
          { key: "amount", label: "Amount" },
          { key: "details", label: "Details" }
        ], items[index]);
        if (!updated) return;
        updateItemAt(source, index, function () { return updated; });
        renderAdminDashboardData();
        showToast("Donation updated.");
        return;
      }

      if (action === "delete") {
        if (!window.confirm("Delete this donation entry?")) return;
        if (removeItemAt(source, index)) {
          renderAdminDashboardData();
          showToast("Donation entry deleted.");
        }
      }
    });

    document.getElementById("admin-grievance-list")?.addEventListener("click", function (event) {
      var target = event.target.closest("button[data-action]");
      if (!target) return;
      var index = Number(target.getAttribute("data-index"));
      var action = target.getAttribute("data-action"), source = target.getAttribute("data-source");
      var items = getItems(source);
      if (Number.isNaN(index) || !items[index]) return;

      if (action === "resolve") {
        updateItemAt(source, index, function (item) {
          item.status = "Resolved";
          return item;
        });
        renderAdminDashboardData();
        showToast("Grievance marked as resolved.");
        return;
      }

      if (action === "edit") {
        var updated = promptEdit("Edit grievance", [
          { key: "trackingId", label: "Tracking ID" },
          { key: "category", label: "Category" },
          { key: "message", label: "Message" },
          { key: "status", label: "Status" }
        ], items[index]);
        if (!updated) return;
        updateItemAt(source, index, function () { return updated; });
        renderAdminDashboardData();
        showToast("Grievance updated.");
        return;
      }

      if (action === "delete") {
        if (!window.confirm("Delete this grievance?")) return;
        if (removeItemAt(source, index)) {
          renderAdminDashboardData();
          showToast("Grievance deleted.");
        }
      }
    });

    document.getElementById("admin-whistle-list")?.addEventListener("click", function (event) {
      var target = event.target.closest("button[data-action]");
      if (!target) return;
      var index = Number(target.getAttribute("data-index"));
      var action = target.getAttribute("data-action"), source = target.getAttribute("data-source");
      var items = getItems(source);
      if (Number.isNaN(index) || !items[index]) return;

      if (action === "archive") {
        updateItemAt(source, index, function (item) {
          item.archived = true;
          return item;
        });
        renderAdminDashboardData();
        showToast("Whistle report archived.");
        return;
      }

      if (action === "delete") {
        if (!window.confirm("Delete this whistle report?")) return;
        if (removeItemAt(source, index)) {
          renderAdminDashboardData();
          showToast("Whistle report deleted.");
        }
      }
    });

    document.getElementById("admin-career-list")?.addEventListener("click", function(event) {
        var target = event.target.closest("button[data-action]");
        if (!target) return;
        var index = Number(target.getAttribute("data-index"));
        var action = target.getAttribute("data-action"), source = target.getAttribute("data-source");
        var items = getItems(source);
        if (Number.isNaN(index) || !items[index]) return;

        if (action === "edit") {
            var updated = promptEdit("Edit opportunity", [
                { key: "title", label: "Role Title" },
                { key: "company", label: "Company" },
                { key: "location", label: "Location" },
                { key: "type", label: "Type" },
                { key: "description", label: "Description" }
            ], items[index]);
            if (!updated) return;
            updateItemAt(source, index, function () { return updated; });
            renderAdminDashboardData();
            showToast("Opportunity updated.");
            return;
        }

        if (action === "delete") {
            if (!window.confirm("Delete this opportunity?")) return;
            if (removeItemAt(source, index)) {
                renderAdminDashboardData();
                showToast("Opportunity deleted.");
            }
        }
    });

    document.getElementById("admin-mentor-list")?.addEventListener("click", function(event) {
        var target = event.target.closest("button[data-action]");
        if (!target) return;
        var index = Number(target.getAttribute("data-index"));
        var action = target.getAttribute("data-action"), source = target.getAttribute("data-source");
        var items = getItems(source);
        if (Number.isNaN(index) || !items[index]) return;

        if (action === "edit") {
            var updated = promptEdit("Edit Mentor", [
                { key: "name", label: "Mentor Name" },
                { key: "profession", label: "Profession" },
                { key: "company", label: "Company" },
                { key: "expertise", label: "Expertise" },
                { key: "bio", label: "Bio" }
            ], items[index]);
            if (!updated) return;
            updateItemAt(source, index, function () { return updated; });
            renderAdminDashboardData();
            showToast("Mentor updated.");
            return;
        }

        if (action === "delete") {
            if (!window.confirm("Delete this mentor?")) return;
            if (removeItemAt(source, index)) {
                renderAdminDashboardData();
                showToast("Mentor deleted.");
            }
        }
    });
  }

  function wireMiscButtons() {
    document.querySelectorAll("button").forEach(function (btn) {
      var label = textOf(btn).toLowerCase();
      if (label === "donate now") {
        btn.addEventListener("click", function () {
          if (window.location.pathname.toLowerCase().indexOf("giveback") === -1) {
            window.location.href = "giveback.html#donation-section";
          }
        });
      }
      if (label === "view faq") {
        btn.addEventListener("click", function () {
          window.location.href = "contact.html#faq";
        });
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    seedRegistryDatabase().then(function () {
      wireTopButtons();
      wireNewsletter();
      wireEventsActions();
      wireCareersActions();
      wireGiveback();
      wireForms();
      wireMiscButtons();
      wireAdminDashboardActions();
      renderDashboardData();
      renderAdminDashboardData();
      if (typeof renderCareersPageData === "function") renderCareersPageData();
      if (typeof renderMentorsPageData === "function") renderMentorsPageData();
    });
  });

  window.addEventListener("unnssaa_data_updated", function() {
    if (typeof renderDashboardData === "function") renderDashboardData();
    if (typeof renderAdminDashboardData === "function") renderAdminDashboardData();
    if (typeof renderCareersPageData === "function") renderCareersPageData();
    if (typeof renderMentorsPageData === "function") renderMentorsPageData();
  });
})();
