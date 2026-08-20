/* =========================================================
   NOTIFY — SweetAlert2 wrapper, styled with JorproA tokens
   Shared by every page (root: "notify.js", subfolders: "../notify.js").
   Requires SweetAlert2 (https://cdn.jsdelivr.net/npm/sweetalert2@11)
   to be loaded first.
   ========================================================= */

(function (window) {
    "use strict";

    if (typeof window.Swal === "undefined") {
        console.warn("Notify: SweetAlert2 (Swal) was not found on window — " +
            "make sure the SweetAlert2 <script> tag loads before notify.js.");
    }

    var JORPRO_CONFIRM_COLOR = "#123E7C";
    var JORPRO_CANCEL_COLOR = "#8A94A6";
    var JORPRO_DANGER_COLOR = "#C21F2E";

    var BASE = {
        confirmButtonColor: JORPRO_CONFIRM_COLOR,
        cancelButtonColor: JORPRO_CANCEL_COLOR,
        buttonsStyling: true,
        customClass: {
            popup: "jorpro-swal-popup",
            confirmButton: "jorpro-swal-confirm",
            cancelButton: "jorpro-swal-cancel"
        }
    };

    function mix(extra) {
        var out = {};
        for (var k in BASE) out[k] = BASE[k];
        for (var k2 in extra) out[k2] = extra[k2];
        return out;
    }

    var Notify = {

        /** Success alert — replaces alert("...") success/confirmation messages. */
        success: function (message, title) {
            return window.Swal.fire(mix({
                icon: "success",
                title: title || "สำเร็จ",
                text: message,
                confirmButtonText: "ตกลง"
            }));
        },

        /** Error alert — replaces alert("...") error/blocking-guard messages. */
        error: function (message, title) {
            return window.Swal.fire(mix({
                icon: "error",
                title: title || "เกิดข้อผิดพลาด",
                text: message,
                confirmButtonColor: JORPRO_DANGER_COLOR,
                confirmButtonText: "ตกลง"
            }));
        },

        /** Warning alert — replaces alert("...") validation messages. */
        warn: function (message, title) {
            return window.Swal.fire(mix({
                icon: "warning",
                title: title || "โปรดตรวจสอบ",
                text: message,
                confirmButtonText: "ตกลง"
            }));
        },

        /**
         * Destructive-action confirm — replaces confirm()/window.confirm().
         * Resolves true only if the user pressed the confirm button.
         */
        confirmDelete: function (opts) {
            opts = opts || {};
            return window.Swal.fire(mix({
                icon: "warning",
                title: opts.title || "ยืนยันการลบ",
                text: opts.text || "การกระทำนี้ไม่สามารถย้อนกลับได้",
                showCancelButton: true,
                confirmButtonColor: JORPRO_DANGER_COLOR,
                confirmButtonText: opts.confirmText || "ลบ",
                cancelButtonText: opts.cancelText || "ยกเลิก",
                reverseButtons: true
            })).then(function (result) {
                return !!(result && result.isConfirmed);
            });
        },

        /**
         * Generic confirm (non-destructive) — e.g. "leave this page?".
         * Resolves true only if the user pressed the confirm button.
         */
        confirm: function (opts) {
            opts = opts || {};
            return window.Swal.fire(mix({
                icon: opts.icon || "question",
                title: opts.title || "ยืนยันการทำรายการ",
                text: opts.text || "",
                showCancelButton: true,
                confirmButtonText: opts.confirmText || "ยืนยัน",
                cancelButtonText: opts.cancelText || "ยกเลิก",
                reverseButtons: true
            })).then(function (result) {
                return !!(result && result.isConfirmed);
            });
        },

        /**
         * Non-blocking auto-dismiss toast — top-end, ~2s.
         * Use for high-frequency feedback (e.g. per-row save confirmations)
         * instead of a blocking modal.
         */
        toast: function (message, icon) {
            var Toast = window.Swal.mixin({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 2200,
                timerProgressBar: true,
                customClass: { popup: "jorpro-swal-toast" },
                didOpen: function (el) {
                    el.addEventListener("mouseenter", window.Swal.stopTimer);
                    el.addEventListener("mouseleave", window.Swal.resumeTimer);
                }
            });
            return Toast.fire({
                icon: icon || "success",
                title: message
            });
        }
    };

    window.Notify = Notify;

})(window);
