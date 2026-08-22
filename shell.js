/* =========================================================
   SHELL — shared sidebar + topbar + mobile drawer app shell.
   Shared by every non-landing page (root: n/a, subfolders:
   "../shell.js"). Requires icons.js, notify.js and
   theme-toggle.js to be loaded first. Single source of truth
   for the per-role nav link list, so every page stays
   consistent without duplicating the shell markup 12 times.
   ========================================================= */

(function (window) {
    "use strict";

    var RECORDS_KEY = "ftaAnalysisRecords";

    // Completed analyses Expert has sent back that Safety Officer hasn't
    // opened yet (see analysis-result-view.js's render(), which stamps
    // soViewedAt the moment that record's result page is opened — that's
    // what clears an entry from this list). Newest first.
    function getPendingSoReviewRecords() {
        var records = [];
        try {
            records = JSON.parse(window.localStorage.getItem(RECORDS_KEY)) || [];
        } catch (e) {
            records = [];
        }
        if (!Array.isArray(records)) records = [];

        return records
            .filter(function (r) {
                return r && r.status === "COMPLETED" && !r.soViewedAt;
            })
            .sort(function (a, b) {
                var at = new Date(a.completedAt || a.updatedAt || a.createdAt || 0).getTime();
                var bt = new Date(b.completedAt || b.updatedAt || b.createdAt || 0).getTime();
                return bt - at;
            });
    }

    var NAV = {
        expert: {
            brand: "Expert Workspace",
            roleLabel: "EXPERT",
            links: [
                { key: "dashboard", label: "Dashboard", icon: "home", href: "expert.html" },
                { key: "queue", label: "Analysis Queue", icon: "inbox", href: "analysis-queue.html" },
                { key: "result", label: "Analysis Result", icon: "file-text", href: "analysis-result.html" },
                { key: "history", label: "Result History", icon: "list", href: "analysis-result-history.html" }
            ],
            switchHref: "../index.html"
        },
        "safety-officer": {
            brand: "Safety Officer Workspace",
            roleLabel: "SAFETY OFFICER",
            links: [
                { key: "dashboard", label: "Dashboard", icon: "home", href: "safety-officer.html" },
                { key: "new", label: "New Analysis", icon: "plus", href: "new-analysis.html" },
                { key: "history", label: "Analysis History", icon: "list", href: "analysis-history.html" },
                { key: "result", label: "Analysis Result", icon: "file-text", href: "analysis-result-view.html" }
            ],
            switchHref: "../index.html"
        }
    };

    function mount(opts) {
        var cfg = NAV[opts.role];
        if (!cfg) return;

        // Only meaningful for safety-officer (Expert has no "pending
        // review" concept) — badges the "Analysis Result" link with a
        // count whenever Expert has completed analyses SO hasn't opened
        // yet, visible from every SO page, not just the dashboard.
        var pendingCount =
            opts.role === "safety-officer"
                ? getPendingSoReviewRecords().length
                : 0;

        var sidebar = document.createElement("aside");
        sidebar.className = "sidebar";
        sidebar.id = "appSidebar";
        sidebar.innerHTML =
            '<div class="sidebar-brand">' +
            '<div class="sidebar-brand-mark"><img src="' + (opts.logo || "../logo-icon.png") +
            '" alt="JorproA" style="width:100%;height:100%;object-fit:cover;"></div>' +
            '<div><div class="sidebar-brand-name">JorproA</div>' +
            '<div class="sidebar-brand-sub">' + cfg.brand + '</div></div>' +
            '</div>' +
            '<nav class="sidebar-nav">' +
            '<div class="sidebar-section-label">เมนู</div>' +
            cfg.links.map(function (l) {
                var badge =
                    (l.key === "result" && pendingCount > 0)
                        ? '<span class="sidebar-nav-badge">' + pendingCount + '</span>'
                        : "";
                return '<a href="' + l.href + '" class="sidebar-nav-link' +
                    (l.key === opts.active ? " active" : "") + '">' +
                    window.Icon(l.icon, "", 18) + '<span>' + l.label + '</span>' + badge + '</a>';
            }).join("") +
            '</nav>' +
            '<div class="sidebar-footer">' +
            '<div class="sidebar-footer-row">' +
            '<button type="button" class="sidebar-role-pill" id="shellSwitchRole" ' +
            'style="cursor:pointer;">' +
            '<span class="sidebar-role-dot"></span><span>' + cfg.roleLabel + '</span>' +
            '</button>' +
            '<div id="shellThemeToggle"></div>' +
            '</div>' +
            '</div>';

        var scrim = document.createElement("div");
        scrim.className = "drawer-scrim";
        scrim.id = "drawerScrim";

        document.body.insertBefore(scrim, document.body.firstChild);
        document.body.insertBefore(sidebar, document.body.firstChild);

        if (window.ThemeToggle) {
            window.ThemeToggle.mount(document.getElementById("shellThemeToggle"));
        }

        // Dashboard link doubles as this role's "Home" — same destination
        // as the sidebar's own Dashboard nav item, just reachable from the
        // topbar on every page (including on mobile, before the drawer
        // is even opened).
        var homeHref = (cfg.links.filter(function (l) { return l.key === "dashboard"; })[0] || cfg.links[0]).href;

        var topbar = document.getElementById("appTopbar");
        if (topbar) {
            topbar.innerHTML =
                '<button type="button" class="topbar-menu-btn" id="drawerToggle" aria-label="Menu">' +
                window.Icon("menu", "", 18) + '</button>' +
                '<div class="topbar-nav-actions">' +
                '<button type="button" class="topbar-icon-btn" id="topbarBackBtn" aria-label="ย้อนกลับ" title="ย้อนกลับ">' +
                window.Icon("arrow-left", "", 17) + '</button>' +
                '<button type="button" class="topbar-icon-btn" id="topbarHomeBtn" aria-label="หน้าแรก" title="หน้าแรก">' +
                window.Icon("home", "", 17) + '</button>' +
                '</div>' +
                '<div class="topbar-title">' + (opts.title || "") + '</div>';
        }

        function closeDrawer() { sidebar.classList.remove("open"); scrim.classList.remove("open"); }
        function openDrawer() { sidebar.classList.add("open"); scrim.classList.add("open"); }

        var toggleBtn = document.getElementById("drawerToggle");
        if (toggleBtn) toggleBtn.addEventListener("click", openDrawer);
        scrim.addEventListener("click", closeDrawer);

        var backBtn = document.getElementById("topbarBackBtn");
        if (backBtn) {
            backBtn.addEventListener("click", function () {
                // Real multi-page navigation, so the tab's own history
                // stack already IS the correct "came from" trail — only
                // fall back to Home when there is nowhere to go back to
                // (e.g. this page was opened fresh, no prior entry).
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location.href = homeHref;
                }
            });
        }

        var homeBtn = document.getElementById("topbarHomeBtn");
        if (homeBtn) {
            homeBtn.addEventListener("click", function () {
                window.location.href = homeHref;
            });
        }

        var switchBtn = document.getElementById("shellSwitchRole");
        if (switchBtn) {
            switchBtn.addEventListener("click", async function () {
                var ok = await window.Notify.confirm({
                    title: "กลับไปหน้าเลือกบทบาท?",
                    text: "คุณจะออกจากหน้านี้และกลับไปยังหน้าเลือกบทบาทใหม่",
                    icon: "question",
                    confirmText: "กลับหน้าหลัก"
                });
                if (ok) window.location.href = cfg.switchHref;
            });
        }
    }

    window.Shell = { mount: mount, getPendingSoReviewRecords: getPendingSoReviewRecords };

})(window);
