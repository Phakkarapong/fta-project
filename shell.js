/* =========================================================
   SHELL — shared sidebar + topbar + mobile drawer app shell.
   Shared by every non-landing page (root: n/a, subfolders:
   "../shell.js"). Requires icons.js and notify.js to be loaded
   first. Single source of truth for the per-role nav link list,
   so every page stays consistent without duplicating the shell
   markup 12 times.
   ========================================================= */

(function (window) {
    "use strict";

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
                return '<a href="' + l.href + '" class="sidebar-nav-link' +
                    (l.key === opts.active ? " active" : "") + '">' +
                    window.Icon(l.icon, "", 18) + '<span>' + l.label + '</span></a>';
            }).join("") +
            '</nav>' +
            '<div class="sidebar-footer">' +
            '<button type="button" class="sidebar-role-pill" id="shellSwitchRole" ' +
            'style="width:100%;cursor:pointer;">' +
            '<span class="sidebar-role-dot"></span><span>' + cfg.roleLabel + '</span>' +
            '</button>' +
            '</div>';

        var scrim = document.createElement("div");
        scrim.className = "drawer-scrim";
        scrim.id = "drawerScrim";

        document.body.insertBefore(scrim, document.body.firstChild);
        document.body.insertBefore(sidebar, document.body.firstChild);

        var topbar = document.getElementById("appTopbar");
        if (topbar) {
            topbar.innerHTML =
                '<button type="button" class="topbar-menu-btn" id="drawerToggle" aria-label="Menu">' +
                window.Icon("menu", "", 18) + '</button>' +
                '<div class="topbar-title">' + (opts.title || "") + '</div>';
        }

        function closeDrawer() { sidebar.classList.remove("open"); scrim.classList.remove("open"); }
        function openDrawer() { sidebar.classList.add("open"); scrim.classList.add("open"); }

        var toggleBtn = document.getElementById("drawerToggle");
        if (toggleBtn) toggleBtn.addEventListener("click", openDrawer);
        scrim.addEventListener("click", closeDrawer);

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

    window.Shell = { mount: mount };

})(window);
