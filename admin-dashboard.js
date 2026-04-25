(function () {
  "use strict";

  var entityByModalType = {
    member: "members",
    event: "events",
    donation: "donations",
    grievance: "grievances",
    whistle: "whistle-reports",
    career: "careers",
    mentor: "mentors"
  };

  var globalQuery = "";
  var eventQuery = "";
  var donationQuery = "";
  var careerQuery = "";
  var mentorQuery = "";
  var memberPage = 1;
  var memberPageSize = 15;
  var memberTotalPages = 1;
  var eventPage = 1;
  var eventPageSize = 5;
  var eventTotalPages = 1;
  var donationPage = 1;
  var donationPageSize = 5;
  var donationTotalPages = 1;
  var careerPage = 1;
  var careerPageSize = 6;
  var careerTotalPages = 1;
  var mentorPage = 1;
  var mentorPageSize = 6;
  var mentorTotalPages = 1;

  function byId(id) {
    return document.getElementById(id);
  }

  function fmtCurrency(value) {
    var num = Number(value || 0);
    return "NGN " + num.toLocaleString();
  }

  function safeText(value) {
    return String(value == null ? "" : value).replace(/"/g, "&quot;");
  }

  function enforceAdmin() {
    var raw = localStorage.getItem("unnssaa_current_user");
    if (!raw) {
      window.location.href = "login.html";
      return false;
    }

    try {
      var user = JSON.parse(raw);
      var role = String(user.role || "").toUpperCase();
      if (role !== "ADMIN" && role !== "SUPERADMIN") {
        window.location.href = "members_dashboard.html";
        return false;
      }
      return true;
    } catch {
      window.location.href = "login.html";
      return false;
    }
  }

  async function fetchEntity(entity, options) {
    var opts = options || {};
    var page = opts.page || 1;
    var pageSize = opts.pageSize || 50;
    var q = opts.q ? String(opts.q).trim() : "";

    var query = "/content/" + entity + "?page=" + page + "&pageSize=" + pageSize;
    if (q) {
      query += "&q=" + encodeURIComponent(q);
    }

    var result = await window.UNNSSAAApi.request(query);
    return {
      items: Array.isArray(result.data) ? result.data : [],
      meta: result.meta || { page: page, pageSize: pageSize, total: 0, totalPages: 1 }
    };
  }

  async function updateRecord(entity, id, payload) {
    return window.UNNSSAAApi.request("/content/" + entity + "/" + id, {
      method: "PUT",
      body: payload
    });
  }

  async function deleteRecord(entity, id) {
    return window.UNNSSAAApi.request("/content/" + entity + "/" + id, {
      method: "DELETE"
    });
  }

  function renderMembers(items) {
    var tbody = byId("admin-member-table-body");
    if (!tbody) return;

    if (!items.length) {
      tbody.innerHTML = "<tr><td colspan='4' class='py-4 px-2 text-sm text-stone-500'>No members found.</td></tr>";
      return;
    }

    tbody.innerHTML = items.slice(0, 15).map(function (m) {
      var status = m.verified ? "Verified" : "Pending";
      return "<tr>" +
        "<td class='py-4 px-2'><p class='font-semibold text-teal-950 break-safe'>" + safeText(m.name) + "</p><p class='text-xs text-stone-500 break-safe'>" + safeText(m.location || "") + "</p></td>" +
        "<td class='py-4 px-2 text-sm text-stone-600'>" + safeText(m.classYear || "-") + "</td>" +
        "<td class='py-4 px-2 text-sm font-semibold text-teal-700'>" + status + "</td>" +
        "<td class='py-4 px-2 text-right text-xs text-stone-500'><div class='inline-flex gap-2'>" +
          "<button class='px-2 py-1 rounded border border-stone-200 hover:bg-stone-100' data-action='edit' data-entity='members' data-id='" + safeText(m.id) + "' data-name='" + safeText(m.name) + "' data-class-year='" + safeText(m.classYear || "") + "' data-profession='" + safeText(m.profession || "") + "' data-location='" + safeText(m.location || "") + "' data-status='" + safeText(m.status || "Active") + "'>Edit</button>" +
          "<button class='px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50' data-action='delete' data-entity='members' data-id='" + safeText(m.id) + "'>Delete</button>" +
        "</div></td>" +
      "</tr>";
    }).join("");
  }

  function renderSimpleList(id, items, mapper, emptyText) {
    var root = byId(id);
    if (!root) return;
    if (!items.length) {
      root.innerHTML = "<li class='text-sm text-stone-500'>" + emptyText + "</li>";
      return;
    }
    root.innerHTML = items.map(mapper).join("");
  }

  function applyKpis(data) {
    var members = data.members;
    var donations = data.donations;
    var grievances = data.grievances;

    var verifiedCount = members.filter(function (m) { return Boolean(m.verified); }).length;
    var donationTotal = donations.reduce(function (sum, d) { return sum + Number(d.amount || 0); }, 0);
    var openGrievances = grievances.filter(function (g) {
      return String(g.status || "").toLowerCase() !== "resolved";
    }).length;

    byId("admin-member-count-card").textContent = String(members.length);
    byId("admin-verified-count-card").textContent = String(verifiedCount);
    byId("admin-giving-total").textContent = fmtCurrency(donationTotal);
    byId("admin-open-grievances-card").textContent = String(openGrievances);
    byId("dashboard-donation-total").textContent = fmtCurrency(donationTotal);
  }

  function updateMemberPaginationMeta(meta) {
    var label = byId("admin-member-pagination-meta");
    var prev = byId("admin-member-prev");
    var next = byId("admin-member-next");
    if (label) {
      label.textContent = "Page " + meta.page + " of " + Math.max(1, meta.totalPages) + " • " + meta.total + " members";
    }
    if (prev) {
      prev.disabled = meta.page <= 1;
      prev.classList.toggle("opacity-50", meta.page <= 1);
      prev.classList.toggle("cursor-not-allowed", meta.page <= 1);
    }
    if (next) {
      next.disabled = meta.page >= Math.max(1, meta.totalPages);
      next.classList.toggle("opacity-50", meta.page >= Math.max(1, meta.totalPages));
      next.classList.toggle("cursor-not-allowed", meta.page >= Math.max(1, meta.totalPages));
    }
  }

  function updateListPaginationMeta(prefix, meta, noun) {
    var label = byId(prefix + "-pagination-meta");
    var prev = byId(prefix + "-prev");
    var next = byId(prefix + "-next");
    var totalPages = Math.max(1, meta.totalPages || 1);
    var page = meta.page || 1;
    var total = Number(meta.total || 0);

    if (label) {
      label.textContent = "Page " + page + " of " + totalPages + " • " + total + " " + noun;
    }
    if (prev) {
      prev.disabled = page <= 1;
      prev.classList.toggle("opacity-50", page <= 1);
      prev.classList.toggle("cursor-not-allowed", page <= 1);
    }
    if (next) {
      next.disabled = page >= totalPages;
      next.classList.toggle("opacity-50", page >= totalPages);
      next.classList.toggle("cursor-not-allowed", page >= totalPages);
    }
  }

  function mergeQuery(global, local) {
    var base = String(global || "").trim();
    var scoped = String(local || "").trim();
    if (!base) return scoped;
    if (!scoped) return base;
    return base + " " + scoped;
  }

  function setupViewNavigation() {
    function setView(view) {
      var navKeys = ["overview", "members", "events", "careers", "mentors", "directory", "donations", "compliance"];
      navKeys.forEach(function (key) {
        var nav = byId("nav-" + key);
        if (nav) nav.classList.remove("admin-nav-active");
      });
      var current = byId("nav-" + view);
      if (current) current.classList.add("admin-nav-active");

      var pageTitle = byId("page-title");
      var pageSubtitle = byId("page-subtitle");
      var titleMap = {
        overview: ["Admin Dashboard", "Lions Heritage Campus"],
        members: ["User Management", "Registry of verified and pending alumni members"],
        events: ["Event Management", "Upcoming and scheduled alumni programs"],
        careers: ["Career Hub", "Manage platform job opportunities"],
        mentors: ["Mentorship Hub", "Manage alumni mentors and mentorship tracks"],
        directory: ["Alumni Directory", "Browse and manage alumni records"],
        donations: ["Donations", "Track and manage donor contributions"],
        compliance: ["Compliance", "Grievances and whistleblowing operations"]
      };
      var heading = titleMap[view] || titleMap.overview;
      if (pageTitle) pageTitle.textContent = heading[0];
      if (pageSubtitle) pageSubtitle.textContent = heading[1];

      var blocks = [
        byId("view-kpi"), byId("view-left-column"), byId("view-right-column"), byId("view-members-card"),
        byId("view-compliance-card"), byId("view-events-card"), byId("view-careers-card"), byId("view-mentors-card"),
        byId("view-donations-card"), byId("view-tip-card")
      ];
      blocks.forEach(function (el) { if (el) el.classList.remove("admin-view-hidden"); });

      if (view === "overview") return;
      if (view === "members" || view === "directory") {
        if (byId("view-right-column")) byId("view-right-column").classList.add("admin-view-hidden");
        if (byId("view-compliance-card")) byId("view-compliance-card").classList.add("admin-view-hidden");
        if (byId("view-careers-card")) byId("view-careers-card").classList.add("admin-view-hidden");
        if (byId("view-mentors-card")) byId("view-mentors-card").classList.add("admin-view-hidden");
      }
      if (view === "events") {
        if (byId("view-left-column")) byId("view-left-column").classList.add("admin-view-hidden");
        if (byId("view-donations-card")) byId("view-donations-card").classList.add("admin-view-hidden");
        if (byId("view-tip-card")) byId("view-tip-card").classList.add("admin-view-hidden");
      }
      if (view === "donations") {
        if (byId("view-left-column")) byId("view-left-column").classList.add("admin-view-hidden");
        if (byId("view-events-card")) byId("view-events-card").classList.add("admin-view-hidden");
        if (byId("view-tip-card")) byId("view-tip-card").classList.add("admin-view-hidden");
      }
      if (view === "compliance") {
        if (byId("view-right-column")) byId("view-right-column").classList.add("admin-view-hidden");
        if (byId("view-members-card")) byId("view-members-card").classList.add("admin-view-hidden");
        if (byId("view-careers-card")) byId("view-careers-card").classList.add("admin-view-hidden");
        if (byId("view-mentors-card")) byId("view-mentors-card").classList.add("admin-view-hidden");
      }
      if (view === "careers") {
        if (byId("view-right-column")) byId("view-right-column").classList.add("admin-view-hidden");
        if (byId("view-members-card")) byId("view-members-card").classList.add("admin-view-hidden");
        if (byId("view-compliance-card")) byId("view-compliance-card").classList.add("admin-view-hidden");
        if (byId("view-mentors-card")) byId("view-mentors-card").classList.add("admin-view-hidden");
      }
      if (view === "mentors") {
        if (byId("view-right-column")) byId("view-right-column").classList.add("admin-view-hidden");
        if (byId("view-members-card")) byId("view-members-card").classList.add("admin-view-hidden");
        if (byId("view-compliance-card")) byId("view-compliance-card").classList.add("admin-view-hidden");
        if (byId("view-careers-card")) byId("view-careers-card").classList.add("admin-view-hidden");
      }
    }

    ["overview", "members", "events", "careers", "mentors", "directory", "donations", "compliance"].forEach(function (view) {
      var nav = byId("nav-" + view);
      if (!nav) return;
      nav.addEventListener("click", function (event) {
        event.preventDefault();
        setView(view);
      });
    });

    setView("overview");
  }

  function buildModalForm(type) {
    if (type === "member") {
      return "<div class='admin-field'><label>Full Name</label><input name='name' required></div>" +
        "<div class='admin-field'><label>Class Year</label><input name='classYear'></div>" +
        "<div class='admin-field'><label>Profession</label><input name='profession'></div>" +
        "<div class='admin-field'><label>Chapter</label><input name='chapter'></div>" +
        "<div class='admin-field'><label>Location</label><input name='location'></div>" +
        "<div class='admin-field'><label>Status</label><input name='status' value='Active'></div>" +
        "<div class='mt-4 flex gap-2'><button type='submit' class='px-4 py-2 bg-primary text-white rounded-lg font-semibold'>Save</button><button type='button' id='admin-cancel-btn' class='px-4 py-2 border border-outline-variant rounded-lg font-semibold'>Cancel</button></div>";
    }
    if (type === "career") {
      return "<div class='admin-field'><label>Title</label><input name='title' required></div>" +
        "<div class='admin-field'><label>Company</label><input name='company' required></div>" +
        "<div class='admin-field'><label>Location</label><input name='location'></div>" +
        "<div class='admin-field'><label>Type</label><input name='type' value='Full Time'></div>" +
        "<div class='admin-field'><label>Description</label><textarea name='description'></textarea></div>" +
        "<div class='mt-4 flex gap-2'><button type='submit' class='px-4 py-2 bg-primary text-white rounded-lg font-semibold'>Save</button><button type='button' id='admin-cancel-btn' class='px-4 py-2 border border-outline-variant rounded-lg font-semibold'>Cancel</button></div>";
    }
    if (type === "mentor") {
      return "<div class='admin-field'><label>Name</label><input name='name' required></div>" +
        "<div class='admin-field'><label>Profession</label><input name='profession'></div>" +
        "<div class='admin-field'><label>Company</label><input name='company'></div>" +
        "<div class='admin-field'><label>Expertise</label><input name='expertise'></div>" +
        "<div class='admin-field'><label>Bio</label><textarea name='bio'></textarea></div>" +
        "<div class='mt-4 flex gap-2'><button type='submit' class='px-4 py-2 bg-primary text-white rounded-lg font-semibold'>Save</button><button type='button' id='admin-cancel-btn' class='px-4 py-2 border border-outline-variant rounded-lg font-semibold'>Cancel</button></div>";
    }
    if (type === "event") {
      return "<div class='admin-field'><label>Title</label><input name='title' required></div>" +
        "<div class='admin-field'><label>Date</label><input type='date' name='date' required></div>" +
        "<div class='admin-field'><label>Schedule</label><input name='schedule'></div>" +
        "<div class='admin-field'><label>Location</label><input name='location'></div>" +
        "<div class='admin-field'><label>Type</label><input name='type'></div>" +
        "<div class='admin-field'><label>Description</label><textarea name='description'></textarea></div>" +
        "<div class='mt-4 flex gap-2'><button type='submit' class='px-4 py-2 bg-primary text-white rounded-lg font-semibold'>Save</button><button type='button' id='admin-cancel-btn' class='px-4 py-2 border border-outline-variant rounded-lg font-semibold'>Cancel</button></div>";
    }
    if (type === "grievance") {
      return "<div class='admin-field'><label>Tracking ID</label><input name='trackingId' value='GRV-" + Date.now() + "' required></div>" +
        "<div class='admin-field'><label>Category</label><input name='category' required></div>" +
        "<div class='admin-field'><label>Message</label><textarea name='message' required></textarea></div>" +
        "<div class='admin-field'><label>Status</label><input name='status' value='Received'></div>" +
        "<div class='mt-4 flex gap-2'><button type='submit' class='px-4 py-2 bg-primary text-white rounded-lg font-semibold'>Save</button><button type='button' id='admin-cancel-btn' class='px-4 py-2 border border-outline-variant rounded-lg font-semibold'>Cancel</button></div>";
    }
    if (type === "whistle") {
      return "<div class='admin-field'><label>Tracking ID</label><input name='trackingId' value='WBL-" + Date.now() + "' required></div>" +
        "<div class='admin-field'><label>Note</label><textarea name='note' required></textarea></div>" +
        "<div class='admin-field'><label>Anonymous</label><select name='isAnonymous'><option value='true'>Yes</option><option value='false'>No</option></select></div>" +
        "<div class='mt-4 flex gap-2'><button type='submit' class='px-4 py-2 bg-primary text-white rounded-lg font-semibold'>Save</button><button type='button' id='admin-cancel-btn' class='px-4 py-2 border border-outline-variant rounded-lg font-semibold'>Cancel</button></div>";
    }
    if (type === "donation") {
      return "<div class='admin-field'><label>Donor Name</label><input name='donorName' required></div>" +
        "<div class='admin-field'><label>Class Year</label><input name='classYear'></div>" +
        "<div class='admin-field'><label>Amount</label><input type='number' name='amount' required></div>" +
        "<div class='admin-field'><label>Currency</label><input name='currency' value='NGN'></div>" +
        "<div class='admin-field'><label>Details</label><textarea name='details'></textarea></div>" +
        "<div class='mt-4 flex gap-2'><button type='submit' class='px-4 py-2 bg-primary text-white rounded-lg font-semibold'>Save</button><button type='button' id='admin-cancel-btn' class='px-4 py-2 border border-outline-variant rounded-lg font-semibold'>Cancel</button></div>";
    }
    return "";
  }

  function normalizePayload(type, input) {
    var payload = Object.assign({}, input);
    if (type === "whistle") {
      payload.isAnonymous = String(payload.isAnonymous) !== "false";
    }
    if (type === "donation") {
      payload.amount = Number(payload.amount || 0);
      payload.donatedAt = new Date().toISOString();
    }
    if (type === "member") {
      payload.verified = String(payload.status || "").toLowerCase() === "active";
      payload.joinedAt = new Date().toISOString();
    }
    if (type === "grievance") {
      payload.submittedAt = new Date().toISOString();
    }
    if (type === "whistle") {
      payload.submittedAt = new Date().toISOString();
    }
    return payload;
  }

  function normalizeImportRecord(entity, record) {
    if (entity === "members") {
      return {
        name: record.name,
        classYear: record.classYear,
        profession: record.profession,
        chapter: record.chapter,
        location: record.location,
        status: record.status || "Active",
        verified: Boolean(record.verified),
        joinedAt: record.joinedAt || new Date().toISOString()
      };
    }
    if (entity === "events") {
      return {
        title: record.title,
        date: record.date || new Date().toISOString(),
        schedule: record.schedule,
        type: record.type,
        location: record.location,
        description: record.description || ""
      };
    }
    if (entity === "donations") {
      return {
        donorName: record.donorName || record.donor,
        classYear: record.classYear,
        amount: Number(record.amount || 0),
        currency: record.currency || "NGN",
        details: record.details || "",
        donatedAt: record.donatedAt || record.dateReceived || new Date().toISOString()
      };
    }
    if (entity === "grievances") {
      return {
        trackingId: record.trackingId || ("GRV-" + Date.now()),
        category: record.category || "General",
        message: record.message || "",
        status: record.status || "Received",
        submittedAt: record.submittedAt || record.at || new Date().toISOString()
      };
    }
    if (entity === "whistle-reports") {
      return {
        trackingId: record.trackingId || ("WBL-" + Date.now()),
        note: record.note || "",
        isAnonymous: record.isAnonymous !== false,
        submittedAt: record.submittedAt || record.at || new Date().toISOString()
      };
    }
    if (entity === "careers") {
      return {
        title: record.title,
        company: record.company,
        location: record.location,
        type: record.type,
        description: record.description || ""
      };
    }
    if (entity === "mentors") {
      return {
        name: record.name,
        profession: record.profession,
        company: record.company,
        expertise: record.expertise,
        bio: record.bio || ""
      };
    }
    return record;
  }

  async function importSnapshotPayload(payload) {
    var mapping = [
      ["members", payload.members || payload.registryMembers || []],
      ["events", payload.events || payload.registryEvents || []],
      ["donations", payload.donations || payload.registryDonations || []],
      ["grievances", payload.grievances || payload.registryGrievances || []],
      ["whistle-reports", payload.whistleReports || payload.registryWhistleReports || []],
      ["careers", payload.careers || payload.registryCareers || []],
      ["mentors", payload.mentors || payload.registryMentors || []]
    ];

    var total = 0;
    for (var i = 0; i < mapping.length; i++) {
      var entity = mapping[i][0];
      var rows = Array.isArray(mapping[i][1]) ? mapping[i][1] : [];
      for (var j = 0; j < rows.length; j++) {
        try {
          await window.UNNSSAAApi.request("/content/" + entity, {
            method: "POST",
            body: normalizeImportRecord(entity, rows[j])
          });
          total += 1;
        } catch (error) {
        }
      }
    }

    return total;
  }

  function setupModal(onSaved) {
    var backdrop = byId("admin-modal-backdrop");
    var form = byId("admin-modal-form");
    var title = byId("admin-modal-title");
    var closeBtn = byId("admin-modal-close");
    var currentType = null;

    function closeModal() {
      backdrop.classList.remove("active");
      form.innerHTML = "";
      currentType = null;
    }

    document.querySelectorAll("[data-open-modal]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        currentType = btn.getAttribute("data-open-modal");
        var display = currentType.charAt(0).toUpperCase() + currentType.slice(1);
        title.textContent = "Add " + display;
        form.innerHTML = buildModalForm(currentType);
        backdrop.classList.add("active");
      });
    });

    closeBtn.addEventListener("click", closeModal);

    backdrop.addEventListener("click", function (event) {
      if (event.target === backdrop) {
        closeModal();
      }
    });

    form.addEventListener("click", function (event) {
      if (event.target && event.target.id === "admin-cancel-btn") {
        closeModal();
      }
    });

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!currentType || !entityByModalType[currentType]) return;

      var data = Object.fromEntries(new FormData(form).entries());
      var payload = normalizePayload(currentType, data);

      try {
        await window.UNNSSAAApi.request("/content/" + entityByModalType[currentType], {
          method: "POST",
          body: payload
        });
        closeModal();
        await onSaved();
      } catch (error) {
        alert(error.message || "Unable to save record");
      }
    });
  }

  async function loadDashboard() {
    var results = await Promise.all([
      fetchEntity("members", { page: memberPage, pageSize: memberPageSize, q: globalQuery }),
      fetchEntity("donations", { page: donationPage, pageSize: donationPageSize, q: mergeQuery(globalQuery, donationQuery) }),
      fetchEntity("grievances", { page: 1, pageSize: 100, q: globalQuery }),
      fetchEntity("whistle-reports", { page: 1, pageSize: 50 }),
      fetchEntity("events", { page: eventPage, pageSize: eventPageSize, q: mergeQuery(globalQuery, eventQuery) }),
      fetchEntity("careers", { page: careerPage, pageSize: careerPageSize, q: mergeQuery(globalQuery, careerQuery) }),
      fetchEntity("mentors", { page: mentorPage, pageSize: mentorPageSize, q: mergeQuery(globalQuery, mentorQuery) })
    ]);

    var data = {
      members: results[0].items,
      donations: results[1].items,
      grievances: results[2].items,
      whistleReports: results[3].items,
      events: results[4].items,
      careers: results[5].items,
      mentors: results[6].items
    };

    memberTotalPages = Math.max(1, results[0].meta.totalPages || 1);
    donationTotalPages = Math.max(1, results[1].meta.totalPages || 1);
    eventTotalPages = Math.max(1, results[4].meta.totalPages || 1);
    careerTotalPages = Math.max(1, results[5].meta.totalPages || 1);
    mentorTotalPages = Math.max(1, results[6].meta.totalPages || 1);

    updateMemberPaginationMeta({
      page: results[0].meta.page || memberPage,
      totalPages: memberTotalPages,
      total: results[0].meta.total || data.members.length
    });
    updateListPaginationMeta("admin-donation", {
      page: results[1].meta.page || donationPage,
      totalPages: donationTotalPages,
      total: results[1].meta.total || data.donations.length
    }, "donations");
    updateListPaginationMeta("admin-event", {
      page: results[4].meta.page || eventPage,
      totalPages: eventTotalPages,
      total: results[4].meta.total || data.events.length
    }, "events");
    updateListPaginationMeta("admin-career", {
      page: results[5].meta.page || careerPage,
      totalPages: careerTotalPages,
      total: results[5].meta.total || data.careers.length
    }, "opportunities");
    updateListPaginationMeta("admin-mentor", {
      page: results[6].meta.page || mentorPage,
      totalPages: mentorTotalPages,
      total: results[6].meta.total || data.mentors.length
    }, "mentors");

    applyKpis(data);
    renderMembers(data.members);

    renderSimpleList(
      "admin-career-list",
      data.careers,
      function (item) {
        return "<li class='p-4 rounded-xl border border-stone-100 bg-white'><div class='flex items-start justify-between gap-2'><div><p class='font-semibold text-teal-950'>" + safeText(item.title) + "</p><p class='text-xs text-stone-500 mt-1'>" + safeText(item.company) + " • " + safeText(item.location || "-") + "</p></div><div class='inline-flex gap-2'><button class='px-2 py-1 rounded border border-stone-200 hover:bg-stone-100 text-xs' data-action='edit' data-entity='careers' data-id='" + safeText(item.id) + "' data-title='" + safeText(item.title || "") + "' data-company='" + safeText(item.company || "") + "' data-location='" + safeText(item.location || "") + "' data-type='" + safeText(item.type || "") + "' data-description='" + safeText(item.description || "") + "'>Edit</button><button class='px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 text-xs' data-action='delete' data-entity='careers' data-id='" + safeText(item.id) + "'>Delete</button></div></div></li>";
      },
      "No opportunities found."
    );

    renderSimpleList(
      "admin-mentor-list",
      data.mentors,
      function (item) {
        return "<li class='p-4 rounded-xl border border-stone-100 bg-white'><div class='flex items-start justify-between gap-2'><div><p class='font-semibold text-teal-950'>" + safeText(item.name) + "</p><p class='text-xs text-stone-500 mt-1'>" + safeText(item.profession || "Mentor") + " • " + safeText(item.expertise || "General") + "</p></div><div class='inline-flex gap-2'><button class='px-2 py-1 rounded border border-stone-200 hover:bg-stone-100 text-xs' data-action='edit' data-entity='mentors' data-id='" + safeText(item.id) + "' data-name='" + safeText(item.name || "") + "' data-profession='" + safeText(item.profession || "") + "' data-company='" + safeText(item.company || "") + "' data-expertise='" + safeText(item.expertise || "") + "' data-bio='" + safeText(item.bio || "") + "'>Edit</button><button class='px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 text-xs' data-action='delete' data-entity='mentors' data-id='" + safeText(item.id) + "'>Delete</button></div></div></li>";
      },
      "No mentors found."
    );

    var grievanceRoot = byId("admin-grievance-list");
    if (grievanceRoot) {
      if (!data.grievances.length) {
        grievanceRoot.innerHTML = "<p class='text-xs text-white/80'>No grievances logged.</p>";
      } else {
        grievanceRoot.innerHTML = data.grievances.slice(0, 4).map(function (g) {
          return "<div class='rounded-lg bg-white/10 p-3 text-xs'><div class='flex items-start justify-between gap-2'><div><p class='font-bold'>" + safeText(g.category) + "</p><p class='mt-1 text-white/80'>" + safeText(g.status || "Received") + "</p></div><div class='inline-flex gap-2'><button class='px-2 py-1 rounded border border-white/30 text-white hover:bg-white/10 text-[10px]' data-action='edit' data-entity='grievances' data-id='" + safeText(g.id) + "' data-category='" + safeText(g.category || "") + "' data-message='" + safeText(g.message || "") + "' data-status='" + safeText(g.status || "Received") + "'>Edit</button><button class='px-2 py-1 rounded border border-red-200 text-red-100 hover:bg-red-500/20 text-[10px]' data-action='delete' data-entity='grievances' data-id='" + safeText(g.id) + "'>Delete</button></div></div></div>";
        }).join("");
      }
    }

    var whistleRoot = byId("admin-whistle-list");
    if (whistleRoot) {
      var w = data.whistleReports[0];
      whistleRoot.innerHTML = w
        ? "<span class='material-symbols-outlined text-tertiary'>encrypted</span><div class='flex-1'><p class='text-sm font-bold text-teal-950'>" + safeText(w.trackingId) + "</p><p class='text-xs text-stone-500'>" + safeText(w.note).slice(0, 84) + "...</p></div><div class='inline-flex gap-2'><button class='px-2 py-1 rounded border border-stone-200 hover:bg-stone-100 text-xs' data-action='edit' data-entity='whistle-reports' data-id='" + safeText(w.id) + "' data-note='" + safeText(w.note || "") + "'>Edit</button><button class='px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 text-xs' data-action='delete' data-entity='whistle-reports' data-id='" + safeText(w.id) + "'>Delete</button></div>"
        : "<p class='text-sm text-stone-500'>No whistle reports yet.</p>";
    }

    var eventsRoot = byId("admin-event-list");
    if (eventsRoot) {
      if (!data.events.length) {
        eventsRoot.innerHTML = "<p class='text-sm text-stone-500'>No upcoming events.</p>";
      } else {
        eventsRoot.innerHTML = data.events.map(function (e) {
          return "<div class='p-3 rounded-xl bg-white'><div class='flex items-start justify-between gap-2'><div><p class='text-sm font-bold text-teal-950'>" + safeText(e.title) + "</p><p class='text-xs text-stone-500 mt-1'>" + safeText(e.location || "TBA") + " • " + safeText(e.schedule || "") + "</p></div><div class='inline-flex gap-2'><button class='px-2 py-1 rounded border border-stone-200 hover:bg-stone-100 text-xs' data-action='edit' data-entity='events' data-id='" + safeText(e.id) + "' data-title='" + safeText(e.title || "") + "' data-date='" + safeText(e.date || "") + "' data-schedule='" + safeText(e.schedule || "") + "' data-location='" + safeText(e.location || "") + "' data-type='" + safeText(e.type || "") + "' data-description='" + safeText(e.description || "") + "'>Edit</button><button class='px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 text-xs' data-action='delete' data-entity='events' data-id='" + safeText(e.id) + "'>Delete</button></div></div></div>";
        }).join("");
      }
    }

    var donationRoot = byId("admin-donation-list");
    if (donationRoot) {
      if (!data.donations.length) {
        donationRoot.innerHTML = "<p class='text-sm text-stone-500'>No donations recorded.</p>";
      } else {
        donationRoot.innerHTML = data.donations.map(function (d) {
          return "<div class='flex items-center justify-between gap-3'><div><p class='text-sm font-semibold text-teal-950'>" + safeText(d.donorName) + "</p><p class='text-xs text-stone-500'>" + safeText(d.classYear || "") + "</p></div><div class='flex items-center gap-2'><p class='text-sm font-extrabold text-primary'>" + fmtCurrency(d.amount) + "</p><button class='px-2 py-1 rounded border border-stone-200 hover:bg-stone-100 text-xs' data-action='edit' data-entity='donations' data-id='" + safeText(d.id) + "' data-donor-name='" + safeText(d.donorName || "") + "' data-class-year='" + safeText(d.classYear || "") + "' data-amount='" + safeText(d.amount || "") + "' data-currency='" + safeText(d.currency || "NGN") + "' data-details='" + safeText(d.details || "") + "'>Edit</button><button class='px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 text-xs' data-action='delete' data-entity='donations' data-id='" + safeText(d.id) + "'>Delete</button></div></div>";
        }).join("");
      }
    }

    return data;
  }

  function bindActionHandlers(loadFn) {
    document.addEventListener("click", async function (event) {
      var target = event.target;
      if (!target || !target.getAttribute) return;

      var action = target.getAttribute("data-action");
      if (!action) return;

      var entity = target.getAttribute("data-entity");
      var id = target.getAttribute("data-id");
      if (!entity || !id) return;

      if (action === "delete") {
        if (!window.confirm("Delete this record?")) return;
        try {
          await deleteRecord(entity, id);
          await loadFn();
        } catch (error) {
          alert(error.message || "Unable to delete record");
        }
        return;
      }

      if (action === "edit") {
        var payload = {};

        if (entity === "members") {
          var mName = window.prompt("Member name", target.getAttribute("data-name") || "");
          if (mName === null) return;
          var mClass = window.prompt("Class year", target.getAttribute("data-class-year") || "");
          if (mClass === null) return;
          var mProfession = window.prompt("Profession", target.getAttribute("data-profession") || "");
          if (mProfession === null) return;
          var mLocation = window.prompt("Location", target.getAttribute("data-location") || "");
          if (mLocation === null) return;
          payload = {
            name: mName.trim(),
            classYear: mClass.trim(),
            profession: mProfession.trim(),
            location: mLocation.trim(),
            status: (target.getAttribute("data-status") || "Active").trim()
          };
        }

        if (entity === "events") {
          var eTitle = window.prompt("Event title", target.getAttribute("data-title") || "");
          if (eTitle === null) return;
          var eDate = window.prompt("Event date (YYYY-MM-DD)", target.getAttribute("data-date") || "");
          if (eDate === null) return;
          var eSchedule = window.prompt("Schedule", target.getAttribute("data-schedule") || "");
          if (eSchedule === null) return;
          var eLocation = window.prompt("Location", target.getAttribute("data-location") || "");
          if (eLocation === null) return;
          var eType = window.prompt("Type", target.getAttribute("data-type") || "");
          if (eType === null) return;
          var eDescription = window.prompt("Description", target.getAttribute("data-description") || "");
          if (eDescription === null) return;
          payload = {
            title: eTitle.trim(),
            date: eDate.trim(),
            schedule: eSchedule.trim(),
            location: eLocation.trim(),
            type: eType.trim(),
            description: eDescription.trim()
          };
        }

        if (entity === "donations") {
          var dName = window.prompt("Donor name", target.getAttribute("data-donor-name") || "");
          if (dName === null) return;
          var dClass = window.prompt("Class year", target.getAttribute("data-class-year") || "");
          if (dClass === null) return;
          var dAmount = window.prompt("Amount", target.getAttribute("data-amount") || "");
          if (dAmount === null) return;
          var dCurrency = window.prompt("Currency", target.getAttribute("data-currency") || "NGN");
          if (dCurrency === null) return;
          var dDetails = window.prompt("Details", target.getAttribute("data-details") || "");
          if (dDetails === null) return;
          payload = {
            donorName: dName.trim(),
            classYear: dClass.trim(),
            amount: Number(dAmount || 0),
            currency: dCurrency.trim(),
            details: dDetails.trim()
          };
        }

        if (entity === "careers") {
          var cTitle = window.prompt("Title", target.getAttribute("data-title") || "");
          if (cTitle === null) return;
          var cCompany = window.prompt("Company", target.getAttribute("data-company") || "");
          if (cCompany === null) return;
          var cLocation = window.prompt("Location", target.getAttribute("data-location") || "");
          if (cLocation === null) return;
          var cType = window.prompt("Type", target.getAttribute("data-type") || "");
          if (cType === null) return;
          var cDescription = window.prompt("Description", target.getAttribute("data-description") || "");
          if (cDescription === null) return;
          payload = {
            title: cTitle.trim(),
            company: cCompany.trim(),
            location: cLocation.trim(),
            type: cType.trim(),
            description: cDescription.trim()
          };
        }

        if (entity === "mentors") {
          var meName = window.prompt("Name", target.getAttribute("data-name") || "");
          if (meName === null) return;
          var meProfession = window.prompt("Profession", target.getAttribute("data-profession") || "");
          if (meProfession === null) return;
          var meCompany = window.prompt("Company", target.getAttribute("data-company") || "");
          if (meCompany === null) return;
          var meExpertise = window.prompt("Expertise", target.getAttribute("data-expertise") || "");
          if (meExpertise === null) return;
          var meBio = window.prompt("Bio", target.getAttribute("data-bio") || "");
          if (meBio === null) return;
          payload = {
            name: meName.trim(),
            profession: meProfession.trim(),
            company: meCompany.trim(),
            expertise: meExpertise.trim(),
            bio: meBio.trim()
          };
        }

        if (entity === "grievances") {
          var gCategory = window.prompt("Category", target.getAttribute("data-category") || "");
          if (gCategory === null) return;
          var gMessage = window.prompt("Message", target.getAttribute("data-message") || "");
          if (gMessage === null) return;
          var gStatus = window.prompt("Status", target.getAttribute("data-status") || "Received");
          if (gStatus === null) return;
          payload = {
            category: gCategory.trim(),
            message: gMessage.trim(),
            status: gStatus.trim()
          };
        }

        if (entity === "whistle-reports") {
          var wNote = window.prompt("Note", target.getAttribute("data-note") || "");
          if (wNote === null) return;
          payload = { note: wNote.trim() };
        }

        if (!Object.keys(payload).length) return;

        try {
          await updateRecord(entity, id, payload);
          await loadFn();
        } catch (error) {
          alert(error.message || "Unable to update record");
        }
      }
    });
  }

  function setupMemberControls(loadFn) {
    var searchInput = byId("admin-global-search");
    var prevBtn = byId("admin-member-prev");
    var nextBtn = byId("admin-member-next");
    var debounceTimer = null;

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(function () {
          globalQuery = String(searchInput.value || "").trim();
          memberPage = 1;
          donationPage = 1;
          eventPage = 1;
          careerPage = 1;
          mentorPage = 1;
          loadFn().catch(function (error) {
            console.error(error);
          });
        }, 250);
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        if (memberPage <= 1) return;
        memberPage -= 1;
        loadFn().catch(function (error) {
          console.error(error);
        });
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        if (memberPage >= memberTotalPages) return;
        memberPage += 1;
        loadFn().catch(function (error) {
          console.error(error);
        });
      });
    }
  }

  function setupCollectionControls(loadFn) {
    var debounceTimers = {};

    function wireSearch(inputId, onChange) {
      var input = byId(inputId);
      if (!input) return;
      input.addEventListener("input", function () {
        if (debounceTimers[inputId]) {
          clearTimeout(debounceTimers[inputId]);
        }
        debounceTimers[inputId] = setTimeout(function () {
          onChange(String(input.value || "").trim());
          loadFn().catch(function (error) { console.error(error); });
        }, 250);
      });
    }

    function wire(prefix, getPage, setPage, getTotalPages) {
      var prev = byId(prefix + "-prev");
      var next = byId(prefix + "-next");

      if (prev) {
        prev.addEventListener("click", function () {
          if (getPage() <= 1) return;
          setPage(getPage() - 1);
          loadFn().catch(function (error) { console.error(error); });
        });
      }

      if (next) {
        next.addEventListener("click", function () {
          if (getPage() >= getTotalPages()) return;
          setPage(getPage() + 1);
          loadFn().catch(function (error) { console.error(error); });
        });
      }
    }

    wire("admin-event", function () { return eventPage; }, function (v) { eventPage = v; }, function () { return eventTotalPages; });
    wire("admin-donation", function () { return donationPage; }, function (v) { donationPage = v; }, function () { return donationTotalPages; });
    wire("admin-career", function () { return careerPage; }, function (v) { careerPage = v; }, function () { return careerTotalPages; });
    wire("admin-mentor", function () { return mentorPage; }, function (v) { mentorPage = v; }, function () { return mentorTotalPages; });

    wireSearch("admin-event-search", function (value) {
      eventQuery = value;
      eventPage = 1;
    });
    wireSearch("admin-donation-search", function (value) {
      donationQuery = value;
      donationPage = 1;
    });
    wireSearch("admin-career-search", function (value) {
      careerQuery = value;
      careerPage = 1;
    });
    wireSearch("admin-mentor-search", function (value) {
      mentorQuery = value;
      mentorPage = 1;
    });
  }

  function setupActions(loadFn) {
    var refreshBtn = byId("admin-refresh-snapshot");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", function () {
        loadFn().catch(function (error) {
          console.error(error);
        });
      });
    }

    var exportBtn = byId("admin-export-report");
    if (exportBtn) {
      exportBtn.addEventListener("click", async function () {
        try {
          var data = await loadFn();
          var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
          var url = URL.createObjectURL(blob);
          var link = document.createElement("a");
          link.href = url;
          link.download = "unnssaa-admin-snapshot.json";
          document.body.appendChild(link);
          link.click();
          link.remove();
          setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        } catch (error) {
          alert(error.message || "Unable to export report");
        }
      });
    }

    var importBtn = byId("admin-import-report");
    var importFile = byId("admin-import-file");
    if (importBtn) {
      importBtn.addEventListener("click", function () {
        if (importFile) importFile.click();
      });
    }

    if (importFile) {
      importFile.addEventListener("change", async function () {
        var file = importFile.files && importFile.files[0];
        if (!file) return;

        var payload = null;
        try {
          payload = JSON.parse(await file.text());
          var entitiesPayload = {
            members: payload.members || payload.registryMembers || [],
            events: payload.events || payload.registryEvents || [],
            donations: payload.donations || payload.registryDonations || [],
            grievances: payload.grievances || payload.registryGrievances || [],
            "whistle-reports": payload.whistleReports || payload.registryWhistleReports || [],
            careers: payload.careers || payload.registryCareers || [],
            mentors: payload.mentors || payload.registryMentors || []
          };

          var response = await window.UNNSSAAApi.request("/content/import", {
            method: "POST",
            body: { entities: entitiesPayload }
          });

          var imported = response && response.data ? response.data.imported : 0;
          alert("Import complete. Records imported: " + imported);
          await loadFn();
        } catch (error) {
          try {
            var fallbackImported = await importSnapshotPayload(payload || {});
            alert("Import completed using fallback mode. Records imported: " + fallbackImported);
            await loadFn();
          } catch (fallbackError) {
            alert((fallbackError && fallbackError.message) || error.message || "Unable to import file");
          }
        } finally {
          importFile.value = "";
        }
      });
    }
  }

  async function init() {
    if (!window.UNNSSAAApi) return;
    if (!enforceAdmin()) return;

    setupViewNavigation();
    setupModal(async function () {
      await loadDashboard();
    });

    var loadFn = async function () {
      return loadDashboard();
    };

    bindActionHandlers(loadFn);
    setupActions(loadFn);
    setupMemberControls(loadFn);
    setupCollectionControls(loadFn);
    await loadFn();
  }

  init().catch(function (error) {
    console.error(error);
  });
})();
