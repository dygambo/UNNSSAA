(function () {
  "use strict";

  function fmtCurrency(value) {
    var num = Number(value || 0);
    return "NGN " + num.toLocaleString();
  }

  function fmtDate(value) {
    var d = new Date(value);
    if (Number.isNaN(d.getTime())) return "TBD";
    return d.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
  }

  function safeText(value) {
    return String(value == null ? "" : value);
  }

  async function fetchList(entity, pageSize) {
    var result = await window.UNNSSAAApi.request("/content/" + entity + "?page=1&pageSize=" + (pageSize || 10));
    return Array.isArray(result.data) ? result.data : [];
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function renderCareers(items) {
    var root = document.getElementById("member-career-list");
    if (!root) return;

    if (!items.length) {
      root.innerHTML = "<p class='text-sm text-slate-500'>No current career opportunities.</p>";
      return;
    }

    root.innerHTML = items.slice(0, 4).map(function (job) {
      return "<div class='border border-slate-100 rounded-xl p-4 bg-white'>" +
        "<div class='flex items-start justify-between gap-3'>" +
          "<div>" +
            "<p class='text-sm font-bold text-emerald-900'>" + safeText(job.title) + "</p>" +
            "<p class='text-xs text-slate-500 mt-1'>" + safeText(job.company) + " • " + safeText(job.location || "Remote") + "</p>" +
          "</div>" +
          "<span class='text-[10px] uppercase font-bold tracking-widest text-secondary'>" + safeText(job.type || "Role") + "</span>" +
        "</div>" +
        "</div>";
    }).join("");
  }

  function renderMentors(items) {
    var root = document.getElementById("member-mentor-list");
    if (!root) return;

    if (!items.length) {
      root.innerHTML = "<p class='text-sm text-slate-500'>No mentors available yet.</p>";
      return;
    }

    root.innerHTML = items.slice(0, 4).map(function (mentor) {
      return "<div class='border border-slate-100 rounded-xl p-4 bg-white'>" +
        "<p class='text-sm font-bold text-emerald-900'>" + safeText(mentor.name) + "</p>" +
        "<p class='text-xs text-slate-500 mt-1'>" + safeText(mentor.profession || "Mentor") + " • " + safeText(mentor.company || "UNNSSAA") + "</p>" +
        "<p class='text-xs text-slate-600 mt-2 line-clamp-2'>" + safeText(mentor.bio || mentor.expertise || "Available for mentorship") + "</p>" +
      "</div>";
    }).join("");
  }

  function enforceSession() {
    var raw = localStorage.getItem("unnssaa_current_user");
    if (!raw) {
      window.location.href = "login.html";
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      window.location.href = "login.html";
      return null;
    }
  }

  async function init() {
    if (!window.UNNSSAAApi) return;

    var user = enforceSession();
    if (!user) return;

    try {
      var results = await Promise.all([
        fetchList("events", 20),
        fetchList("donations", 50),
        fetchList("careers", 10),
        fetchList("mentors", 10)
      ]);

      var events = results[0];
      var donations = results[1];
      var careers = results[2];
      var mentors = results[3];

      var totalGiving = donations.reduce(function (sum, item) {
        return sum + Number(item.amount || 0);
      }, 0);

      var monthName = new Date().toLocaleDateString(undefined, { month: "long" });
      setText("stat-event-actions", String(events.length).padStart(2, "0"));
      setText("stat-giving-impact", fmtCurrency(totalGiving));
      setText("dashboard-donation-total", fmtCurrency(totalGiving));
      setText("dashboard-donation-meta", "Total Raised in " + monthName);

      renderCareers(careers);
      renderMentors(mentors);

      var eventCards = document.querySelectorAll("h5.text-sm.font-bold.text-emerald-900");
      if (eventCards.length >= 3 && events.length >= 1) {
        for (var i = 0; i < Math.min(3, events.length); i++) {
          var evt = events[i];
          var container = eventCards[i].parentElement;
          eventCards[i].textContent = safeText(evt.title || "Upcoming Event");
          var details = container && container.querySelector("p.text-xs");
          if (details) {
            details.textContent = safeText(evt.location || "TBA") + " • " + safeText(evt.schedule || fmtDate(evt.date));
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  init();
})();
