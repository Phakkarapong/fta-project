/* =========================================================
   THEME-BOOT — resolves and applies the theme BEFORE first
   paint, so there is no flash of the wrong theme. Shared by
   every page (root: "theme-boot.js", subfolders:
   "../theme-boot.js"). Must be the very first <script> in
   <head>, before the theme.css <link> — script tags block
   parsing, so this guarantees data-theme is set on <html>
   before theme.css's rules are applied.

   Three-state model: the stored preference is "light", "dark",
   or "system" (default when nothing is stored / storage is
   unavailable). "system" defers to prefers-color-scheme and
   stays live — if the OS theme changes while a page is open in
   "system" mode, the page re-resolves without a reload.

   No dependency on icons.js/shell.js/theme-toggle.js — this
   file only ever reads localStorage and matchMedia and sets
   attributes, kept deliberately tiny so it stays safe to inline
   this early in <head>. theme-toggle.js (loaded later) owns
   writing the stored preference; this file only ever reads it.
   ========================================================= */

(function () {
    "use strict";

    var STORAGE_KEY = "jorproa-theme";
    var mql = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

    function storedMode() {
        try {
            var v = window.localStorage.getItem(STORAGE_KEY);
            if (v === "light" || v === "dark" || v === "system") return v;
        } catch (e) {
            // localStorage unavailable (privacy mode, etc.) — fall through.
        }
        return "system";
    }

    function resolvedTheme(mode) {
        if (mode === "light" || mode === "dark") return mode;
        return (mql && mql.matches) ? "dark" : "light";
    }

    function apply(mode) {
        var theme = resolvedTheme(mode);
        document.documentElement.setAttribute("data-theme", theme);
        document.documentElement.classList.toggle("dark", theme === "dark");
    }

    apply(storedMode());

    // Live-update while in "system" mode if the OS preference flips —
    // e.g. the OS switches to dark at sunset while the page is still open.
    if (mql) {
        var onChange = function () { if (storedMode() === "system") apply("system"); };
        if (mql.addEventListener) mql.addEventListener("change", onChange);
        else if (mql.addListener) mql.addListener(onChange); // Safari < 14
    }

})();
