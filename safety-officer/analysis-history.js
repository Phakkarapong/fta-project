// =====================================================
// SAFETY OFFICER — ANALYSIS HISTORY / CANONICAL BRIDGE
// =====================================================

const RECORDS_KEY = "ftaAnalysisRecords";
const DATA_KEY = "ftaAnalysisData";

function loadRecords() {
    try {
        const value = JSON.parse(
            localStorage.getItem(RECORDS_KEY)
        );
        return Array.isArray(value) ? value : [];
    } catch (error) {
        console.warn("Unable to load analysis records:", error);
        return [];
    }
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function normalizeRecord(record) {
    const source =
        record?.analysisData ||
        record?.analysis ||
        record ||
        {};

    const ftaSource =
        source.ftaData ||
        record?.ftaData ||
        {};

    const basicEvents =
        Array.isArray(ftaSource.basicEvents)
            ? ftaSource.basicEvents
            : Array.isArray(source.basicEvents)
                ? source.basicEvents
                : Array.isArray(record?.basicEvents)
                    ? record.basicEvents
                    : [];

    const normalizedEvents =
        basicEvents.map((event, index) => ({
            id:
                event?.id ||
                `E-${String(index + 1).padStart(2, "0")}`,
            name:
                event?.name ||
                event?.eventName ||
                `Basic Event ${index + 1}`,
            description:
                event?.description ||
                event?.detail ||
                "",
            probability:
                event?.probability ??
                null,

            existingRiskControl:
                event?.existingRiskControl ||
                event?.riskControl ||
                event?.existing_risk_control ||
                "",

            safetyMitigation:
                event?.safetyMitigation ||
                event?.safetyOfficerMitigation ||
                event?.safety_mitigation ||
                "",

            riskOwner:
                event?.riskOwner ||
                event?.risk_owner ||
                ""
        }));

    return {
        ...source,

        id:
            source.id ||
            record?.id ||
            `FTA-${Date.now()}`,

        analysisTitle:
            source.analysisTitle ||
            source.title ||
            record?.analysisTitle ||
            record?.title ||
            "",

        topEvent:
            source.topEvent ||
            source.top_event ||
            record?.topEvent ||
            record?.top_event ||
            "",

        department:
            source.department ||
            source.departmentArea ||
            source.area ||
            source.department_area ||
            record?.department ||
            record?.departmentArea ||
            record?.area ||
            "",

        officerName:
            source.officerName ||
            source.createdBy ||
            record?.officerName ||
            record?.createdBy ||
            "Safety Officer",

        description:
            source.description ||
            source.scope ||
            record?.description ||
            record?.scope ||
            "",

        ftaData: {
            ...ftaSource,

            gate:
                ftaSource.gate ||
                source.gate ||
                record?.gate ||
                "OR",

            basicEvents:
                normalizedEvents,

            intermediateEvents:
                Array.isArray(ftaSource.intermediateEvents)
                    ? ftaSource.intermediateEvents
                    : []
        },

        status:
            source.status ||
            record?.status ||
            "DRAFT",

        createdAt:
            source.createdAt ||
            record?.createdAt ||
            null,

        submittedAt:
            source.submittedAt ||
            record?.submittedAt ||
            null,

        analysisResult:
            source.analysisResult ||
            record?.analysisResult ||
            null,

        riskAssessment:
            source.riskAssessment ||
            record?.riskAssessment ||
            null,

        riskAssessments:
            Array.isArray(
                source.riskAssessments
            )
                ? source.riskAssessments
                : (
                    Array.isArray(
                        record?.riskAssessments
                    )
                        ? record.riskAssessments
                        : []
                ),

        analysisResult:
            source.analysisResult ||
            record?.analysisResult ||
            null
    };
}

function saveCanonical(record) {
    const canonical = normalizeRecord(record);

    sessionStorage.setItem(
        DATA_KEY,
        JSON.stringify(canonical)
    );

    localStorage.setItem(
        DATA_KEY,
        JSON.stringify(canonical)
    );

    return canonical;
}

const STATUS_LABELS = {
    DRAFT: "แบบร่าง",
    PENDING_EXPERT: "รอผู้เชี่ยวชาญ",
    UNDER_ANALYSIS: "กำลังวิเคราะห์",
    COMPLETED: "เสร็จสมบูรณ์"
};

const STATUS_BADGE_CLASS = {
    DRAFT: "status-badge-slate",
    PENDING_EXPERT: "status-badge-amber",
    UNDER_ANALYSIS: "status-badge-blue",
    COMPLETED: "status-badge-green"
};

function statusBadgeHtml(status) {
    const key = status || "DRAFT";
    const cls = STATUS_BADGE_CLASS[key] || "status-badge-slate";
    const label = STATUS_LABELS[key] || key;
    return `<span class="status-badge ${cls}">${escapeHtml(label)}</span>`;
}

function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return escapeHtml(String(value));
    return date.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

function viewRecord(record) {
    const records = loadRecords();

    const rawRecord =
        records.find(
            raw =>
                String(
                    raw?.id ??
                    raw?.analysisData?.id
                ) === String(record.id)
        );

    if (!rawRecord) {
        Notify.error("ไม่พบข้อมูลการวิเคราะห์นี้ในระบบ", "Analysis record not found.");
        return;
    }

    const canonical = saveCanonical(rawRecord);

    // Persist the canonical record back into history too.
    const normalizedRecords =
        records.map(raw => {
            const normalized = normalizeRecord(raw);
            return String(normalized.id) === String(canonical.id)
                ? canonical
                : normalized;
        });

    localStorage.setItem(RECORDS_KEY, JSON.stringify(normalizedRecords));

    window.location.href = "fta-review.html";
}

async function deleteRecord(record) {
    const id = String(record.id || "");
    if (!id) return;

    const confirmed = await Notify.confirmDelete({
        title: "ลบประวัติการวิเคราะห์นี้?",
        text: "การลบนี้จะนำรายการออกจากประวัติในเบราว์เซอร์นี้อย่างถาวร"
    });

    if (!confirmed) return;

    const records = loadRecords();

    const filtered = records.filter(raw => {
        const recordId = String(raw?.id ?? raw?.analysisData?.id ?? "");
        return recordId !== id;
    });

    localStorage.setItem(RECORDS_KEY, JSON.stringify(filtered));

    // Clear the canonical "current analysis" too, but only when it
    // is the same record that was just deleted.
    [localStorage, sessionStorage].forEach(storage => {
        try {
            const raw = storage.getItem(DATA_KEY);
            if (!raw) return;

            const current = JSON.parse(raw);

            if (String(current?.id || "") === id) {
                storage.removeItem(DATA_KEY);
            }
        } catch (error) {
            console.warn("Unable to clear current analysis:", error);
        }
    });

    Notify.toast("ลบรายการเรียบร้อยแล้ว");
    renderHistory();
}

let historyTable = null;

function renderHistory() {
    const container = document.getElementById("historyList");
    const count = document.getElementById("recordCount");
    const rawRecords = loadRecords();
    const records = rawRecords.map(normalizeRecord);

    if (count) {
        count.textContent =
            `${records.length} RECORD${records.length === 1 ? "" : "S"}`;
    }

    if (!container) return;

    const filterOptions = Array.from(
        new Set(records.map(r => r.status || "DRAFT"))
    ).map(value => ({ value, label: STATUS_LABELS[value] || value }));

    const columns = [
        {
            key: "analysisTitle", label: "หัวข้อการวิเคราะห์",
            cellHtml: r => `
                <div style="font-weight:800;color:var(--ink);">${escapeHtml(r.analysisTitle || "Untitled Analysis")}</div>
                <div style="color:var(--muted);font-size:11px;margin-top:2px;">${r.ftaData.basicEvents.length} Basic Event(s)</div>
            `
        },
        { key: "topEvent", label: "Top Event", cellHtml: r => escapeHtml(r.topEvent || "-") },
        { key: "department", label: "แผนก/พื้นที่", cellHtml: r => escapeHtml(r.department || "-") },
        { key: "status", label: "สถานะ", cellHtml: r => statusBadgeHtml(r.status) },
        { key: "date", label: "วันที่", cellHtml: r => formatDate(r.submittedAt || r.createdAt) }
    ];

    const config = {
        columns,
        rows: records,
        searchKeys: ["analysisTitle", "topEvent", "department", "officerName"],
        searchPlaceholder: "ค้นหาหัวข้อ, Top Event หรือแผนก...",
        filterKey: "status",
        filterOptions,
        pageSize: 8,
        emptyMessage: "ยังไม่มีประวัติการวิเคราะห์ — No Analysis History",
        rowMeta: r => ({
            icon: Icon("file-text", "", 16),
            title: r.analysisTitle || "Untitled Analysis",
            subtitle: `${r.topEvent || "-"} · ${r.department || "-"}`,
            badgeHtml: statusBadgeHtml(r.status)
        }),
        onRowClick: r => viewRecord(r),
        rowActions: r => [
            { label: "ดูรายละเอียด", icon: Icon("eye", "", 12), variant: "primary", onClick: viewRecord },
            { label: "ลบ", icon: Icon("trash", "", 12), variant: "danger", onClick: deleteRecord }
        ]
    };

    if (historyTable) {
        historyTable.setRows(records);
    } else {
        historyTable = renderDataTable(container, config);
    }
}

const backBtn =
    document.getElementById("backBtn");

if (backBtn) {
    backBtn.addEventListener(
        "click",
        function () {
            window.location.href =
                "safety-officer.html";
        }
    );
}

renderHistory();
