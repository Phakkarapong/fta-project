/* =========================================================
   DATA TABLE — reusable search + filter + pagination +
   responsive table/list-row renderer.
   Shared by every list/history page (root: "data-table.js",
   subfolders: "../data-table.js"). Pure presentation layer —
   callers keep owning how their data is fetched/normalized;
   this only renders + paginates + wires row actions.
   ========================================================= */

(function (window) {
    "use strict";

    function escapeHtml(str) {
        return String(str === null || str === undefined ? "" : str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function getValue(row, path) {
        return String(path).split(".").reduce(function (o, k) {
            return o === null || o === undefined ? o : o[k];
        }, row);
    }

    /**
     * renderDataTable(container, config) → { setRows(rows), refresh() }
     *
     * config:
     *  - columns: [{ key, label, align?, cellHtml(row) → string }]
     *  - rows: array of row data objects
     *  - rowMeta(row) → { icon, title, subtitle, badgeHtml } for the mobile
     *      list-row card. Falls back to the first two columns if omitted.
     *  - rowActions(row) → [{ label, icon?, variant?('primary'|'danger'|'default'),
     *      onClick(row) }] — rendered as buttons in the desktop "Actions" cell
     *      and inside each mobile list-row.
     *  - onRowClick(row) → optional, fires when a mobile list-row (outside of
     *      an action button) is tapped — used for the primary "view details" action.
     *  - searchKeys: [string] — dot-path keys matched against the search box.
     *  - searchPlaceholder: string
     *  - filterKey: string — dot-path key used for the status filter chips.
     *  - filterOptions: [{ value, label }] — chip list; an "ALL"/"ทั้งหมด" chip
     *      is always prepended automatically.
     *  - pageSize: number (default 10)
     *  - emptyMessage: string
     */
    function renderDataTable(container, config) {
        if (!container) return null;

        var cfg = {
            columns: config.columns || [],
            rows: config.rows || [],
            rowMeta: config.rowMeta || null,
            rowActions: config.rowActions || function () { return []; },
            onRowClick: config.onRowClick || null,
            searchKeys: config.searchKeys || [],
            searchPlaceholder: config.searchPlaceholder || "ค้นหา...",
            filterKey: config.filterKey || null,
            filterOptions: config.filterOptions || [],
            pageSize: config.pageSize || 10,
            emptyMessage: config.emptyMessage || "ไม่พบข้อมูล"
        };

        var state = { query: "", filter: "ALL", page: 1 };
        var currentPageRows = [];
        var currentActions = [];

        function matchesQuery(row) {
            if (!state.query) return true;
            var q = state.query.toLowerCase();
            return cfg.searchKeys.some(function (k) {
                var v = getValue(row, k);
                return v !== null && v !== undefined && String(v).toLowerCase().indexOf(q) !== -1;
            });
        }

        function matchesFilter(row) {
            if (!cfg.filterKey || state.filter === "ALL") return true;
            return String(getValue(row, cfg.filterKey)) === state.filter;
        }

        function filteredRows() {
            return cfg.rows.filter(function (r) {
                return matchesQuery(r) && matchesFilter(r);
            });
        }

        function defaultRowMeta(row) {
            var firstCol = cfg.columns[0];
            var secondCol = cfg.columns[1];
            return {
                icon: "▤",
                title: firstCol ? String(getValue(row, firstCol.key) || "-") : "-",
                subtitle: secondCol ? String(getValue(row, secondCol.key) || "") : "",
                badgeHtml: ""
            };
        }

        function renderActionButtons(rowIdx) {
            var actions = currentActions[rowIdx] || [];
            return actions.map(function (a, actionIdx) {
                var variant = a.variant || "default";
                return '<button type="button" class="dt-action-btn dt-action-btn-' + variant + '" ' +
                    'data-dt-action="1" data-dt-row-idx="' + rowIdx + '" data-dt-action-idx="' + actionIdx + '" ' +
                    'title="' + escapeHtml(a.label || "") + '">' +
                    (a.icon ? '<span class="dt-action-icon">' + a.icon + '</span>' : "") +
                    '<span class="dt-action-label">' + escapeHtml(a.label || "") + '</span>' +
                    '</button>';
            }).join("");
        }

        function renderToolbar() {
            var chipsHtml = "";
            if (cfg.filterKey && cfg.filterOptions.length) {
                var allChip = '<button type="button" class="dt-filter-chip' +
                    (state.filter === "ALL" ? " active" : "") + '" data-dt-filter="ALL">ทั้งหมด</button>';
                var chips = cfg.filterOptions.map(function (opt) {
                    return '<button type="button" class="dt-filter-chip' +
                        (state.filter === opt.value ? " active" : "") + '" data-dt-filter="' +
                        escapeHtml(opt.value) + '">' + escapeHtml(opt.label) + '</button>';
                }).join("");
                chipsHtml = '<div class="dt-filter-row">' + allChip + chips + '</div>';
            }
            return (
                '<div class="table-toolbar">' +
                '<div class="dt-search-wrap">' +
                '<span class="dt-search-icon">⌕</span>' +
                '<input type="search" class="dt-search" data-dt-search placeholder="' +
                escapeHtml(cfg.searchPlaceholder) + '" value="' + escapeHtml(state.query) + '">' +
                '</div>' +
                chipsHtml +
                '</div>'
            );
        }

        function renderTable(rows) {
            var thead = '<thead><tr>' + cfg.columns.map(function (c) {
                return '<th class="' + (c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left") + '">' +
                    escapeHtml(c.label) + '</th>';
            }).join("") + '<th class="text-right">จัดการ</th></tr></thead>';

            var tbody = '<tbody>' + rows.map(function (row, i) {
                var cells = cfg.columns.map(function (c) {
                    var html = typeof c.cellHtml === "function" ? c.cellHtml(row) : escapeHtml(getValue(row, c.key));
                    return '<td class="' + (c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left") + '">' + html + '</td>';
                }).join("");
                return '<tr class="dt-row" data-dt-row="1" data-dt-row-idx="' + i + '">' + cells +
                    '<td class="text-right"><div class="dt-action-group">' + renderActionButtons(i) + '</div></td></tr>';
            }).join("") + '</tbody>';

            return '<div class="data-table-scroll"><table class="data-table">' + thead + tbody + '</table></div>';
        }

        function renderList(rows) {
            return '<div class="dt-list">' + rows.map(function (row, i) {
                var meta = cfg.rowMeta ? cfg.rowMeta(row) : defaultRowMeta(row);
                return (
                    '<div class="list-row" data-dt-row="1" data-dt-row-idx="' + i + '">' +
                    '<div class="list-row-icon">' + (meta.icon || "▤") + '</div>' +
                    '<div class="list-row-body">' +
                    '<div class="list-row-title-line">' +
                    '<span class="list-row-title">' + escapeHtml(meta.title || "-") + '</span>' +
                    (meta.badgeHtml || "") +
                    '</div>' +
                    (meta.subtitle ? '<div class="list-row-subtitle">' + escapeHtml(meta.subtitle) + '</div>' : "") +
                    '<div class="dt-action-group dt-action-group-mobile">' + renderActionButtons(i) + '</div>' +
                    '</div>' +
                    '<div class="list-row-chevron">›</div>' +
                    '</div>'
                );
            }).join("") + '</div>';
        }

        function renderPagination(total, totalPages) {
            if (total === 0) return "";
            var start = (state.page - 1) * cfg.pageSize + 1;
            var end = Math.min(total, state.page * cfg.pageSize);
            return (
                '<div class="dt-pagination">' +
                '<span class="dt-pagination-info">' + start + '–' + end + ' จาก ' + total + ' รายการ</span>' +
                '<div class="dt-pagination-controls">' +
                '<button type="button" class="dt-page-btn" data-dt-prev' + (state.page <= 1 ? " disabled" : "") + '>‹ ก่อนหน้า</button>' +
                '<span class="dt-page-indicator">' + state.page + ' / ' + totalPages + '</span>' +
                '<button type="button" class="dt-page-btn" data-dt-next' + (state.page >= totalPages ? " disabled" : "") + '>ถัดไป ›</button>' +
                '</div>' +
                '</div>'
            );
        }

        function render() {
            var all = filteredRows();
            var totalPages = Math.max(1, Math.ceil(all.length / cfg.pageSize));
            state.page = Math.min(Math.max(1, state.page), totalPages);
            var start = (state.page - 1) * cfg.pageSize;
            var pageRows = all.slice(start, start + cfg.pageSize);

            currentPageRows = pageRows;
            currentActions = pageRows.map(function (row) { return cfg.rowActions(row) || []; });

            var body = all.length === 0
                ? '<div class="dt-empty">' + escapeHtml(cfg.emptyMessage) + '</div>'
                : (
                    '<div class="data-table-desktop">' + renderTable(pageRows) + '</div>' +
                    '<div class="data-table-mobile">' + renderList(pageRows) + '</div>'
                );

            container.innerHTML = renderToolbar() + body + renderPagination(all.length, totalPages);
            wireEvents();
        }

        function wireEvents() {
            var searchInput = container.querySelector("[data-dt-search]");
            if (searchInput) {
                searchInput.addEventListener("input", function (e) {
                    state.query = e.target.value;
                    state.page = 1;
                    render();
                    var el = container.querySelector("[data-dt-search]");
                    if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
                });
            }

            container.querySelectorAll("[data-dt-filter]").forEach(function (btn) {
                btn.addEventListener("click", function () {
                    state.filter = btn.getAttribute("data-dt-filter");
                    state.page = 1;
                    render();
                });
            });

            var prevBtn = container.querySelector("[data-dt-prev]");
            var nextBtn = container.querySelector("[data-dt-next]");
            if (prevBtn) prevBtn.addEventListener("click", function () { state.page -= 1; render(); });
            if (nextBtn) nextBtn.addEventListener("click", function () { state.page += 1; render(); });

            container.querySelectorAll("[data-dt-action]").forEach(function (btn) {
                btn.addEventListener("click", function (e) {
                    e.stopPropagation();
                    var rowIdx = Number(btn.getAttribute("data-dt-row-idx"));
                    var actionIdx = Number(btn.getAttribute("data-dt-action-idx"));
                    var action = (currentActions[rowIdx] || [])[actionIdx];
                    if (action && typeof action.onClick === "function") {
                        action.onClick(currentPageRows[rowIdx]);
                    }
                });
            });

            if (cfg.onRowClick) {
                container.querySelectorAll("[data-dt-row]").forEach(function (el) {
                    el.addEventListener("click", function (e) {
                        if (e.target.closest("[data-dt-action]")) return;
                        var rowIdx = Number(el.getAttribute("data-dt-row-idx"));
                        cfg.onRowClick(currentPageRows[rowIdx]);
                    });
                });
            }
        }

        render();

        return {
            setRows: function (rows) { cfg.rows = rows || []; render(); },
            refresh: render
        };
    }

    window.renderDataTable = renderDataTable;
    window.dtEscapeHtml = escapeHtml;

})(window);
