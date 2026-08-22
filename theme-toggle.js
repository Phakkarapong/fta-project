/* =========================================================
   THEME-TOGGLE — shared 3-state (light/dark/system) toggle
   button + apply logic. Shared by every page (root:
   "theme-toggle.js", subfolders: "../theme-toggle.js"). Requires
   icons.js (sun/moon/monitor glyphs) and theme-boot.js (which
   already applied the initial theme before this file loads) to
   run first.

   One button, cycling light -> dark -> system -> light on each
   click (kept to a single icon-button, matching the rest of the
   chrome's compact controls, rather than a 3-way segmented
   control) — the icon and title always show the CURRENT mode,
   so state is never hidden.

   window.ThemeToggle.apply(mode) is the single place that
   flips the theme at runtime — it keeps theme.css's [data-theme]
   branch and the Tailwind-CDN hybrid pages' `dark` class in
   sync, persists the choice, and dispatches a "themechange"
   event so anything drawing colors itself (e.g. a Chart.js
   canvas that read var(--x) at draw time) knows to redraw.

   window.ThemeToggle.mount(container) renders the button into
   a given element — used by shell.js (sidebar footer) and by
   index.html directly (no shell on the landing page).
   ========================================================= */

(function (window, document) {
    "use strict";

    var STORAGE_KEY = "jorproa-theme";
    var ORDER = ["light", "dark", "system"];
    var LABEL = { light: "สว่าง", dark: "มืด", system: "ตามระบบ" };

    function storedMode() {
        try {
            var v = window.localStorage.getItem(STORAGE_KEY);
            if (v === "light" || v === "dark" || v === "system") return v;
        } catch (e) { /* ignore */ }
        return "system";
    }

    function resolvedTheme(mode) {
        if (mode === "light" || mode === "dark") return mode;
        var mql = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
        return (mql && mql.matches) ? "dark" : "light";
    }

    function apply(mode) {
        var theme = resolvedTheme(mode);
        document.documentElement.setAttribute("data-theme", theme);
        document.documentElement.classList.toggle("dark", theme === "dark");
        try { window.localStorage.setItem(STORAGE_KEY, mode); } catch (e) { /* ignore */ }
        document.dispatchEvent(new CustomEvent("themechange", { detail: { mode: mode, theme: theme } }));
        return theme;
    }

    function iconFor(mode, theme) {
        if (!window.Icon) return "";
        var name = mode === "system" ? "monitor" : (theme === "dark" ? "moon" : "sun");
        return window.Icon(name, "", 17);
    }

    function labelFor(mode) {
        var next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
        return "ธีม: " + LABEL[mode] + " (คลิกเพื่อเปลี่ยนเป็น" + LABEL[next] + ")";
    }

    function mount(container, opts) {
        if (!container) return null;
        opts = opts || {};

        var mode = storedMode();
        var theme = resolvedTheme(mode);

        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "theme-toggle-btn" + (opts.className ? " " + opts.className : "");
        btn.title = labelFor(mode);
        btn.setAttribute("aria-label", labelFor(mode));
        btn.innerHTML = iconFor(mode, theme);

        btn.addEventListener("click", function () {
            mode = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
            theme = apply(mode);
            btn.innerHTML = iconFor(mode, theme);
            btn.title = labelFor(mode);
            btn.setAttribute("aria-label", labelFor(mode));
        });

        container.appendChild(btn);
        return btn;
    }

    window.ThemeToggle = {
        apply: apply,
        mount: mount,
        current: function () { return resolvedTheme(storedMode()); }
    };

})(window, document);
