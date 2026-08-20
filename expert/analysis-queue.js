// =====================================================
// EXPERT — ANALYSIS QUEUE
// Robust bridge from Safety Officer History/Records
// =====================================================

const RECORDS_KEY = "ftaAnalysisRecords";
const DATA_KEY = "ftaAnalysisData";


function readJSON(key) {

    try {
        const value =
            JSON.parse(
                localStorage.getItem(key)
            );

        return value;

    } catch (error) {

        console.warn(
            `Cannot read ${key}:`,
            error
        );

        return null;

    }

}


function loadRecords() {

    const value =
        readJSON(RECORDS_KEY);

    return Array.isArray(value)
        ? value
        : [];

}


function normalizeRecord(raw) {

    const source =
        raw?.analysisData ||
        raw?.analysis ||
        raw ||
        {};

    const fta =
        source.ftaData ||
        raw?.ftaData ||
        {};

    const rawEvents =
        Array.isArray(fta.basicEvents)
            ? fta.basicEvents
            : Array.isArray(source.basicEvents)
                ? source.basicEvents
                : Array.isArray(raw?.basicEvents)
                    ? raw.basicEvents
                    : [];

    const basicEvents =
        rawEvents.map(
            function(event, index) {

                return {

                    id:
                        event?.id ||
                        `E-${String(
                            index + 1
                        ).padStart(2, "0")}`,

                    name:
                        event?.name ||
                        event?.eventName ||
                        `Basic Event ${index + 1}`,

                    description:
                        event?.description ||
                        event?.detail ||
                        "",

                    // Preserve all Safety Officer controls per event.
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
                        "",

                    probability:
                        event?.probability ??
                        null

                };

            }
        );

    return {

        ...source,

        id:
            source.id ||
            raw?.id ||
            null,

        analysisTitle:
            source.analysisTitle ||
            source.title ||
            raw?.analysisTitle ||
            raw?.title ||
            "",

        topEvent:
            source.topEvent ||
            source.top_event ||
            raw?.topEvent ||
            raw?.top_event ||
            "",

        department:
            source.department ||
            source.departmentArea ||
            source.area ||
            raw?.department ||
            raw?.departmentArea ||
            raw?.area ||
            "",

        officerName:
            source.officerName ||
            source.createdBy ||
            raw?.officerName ||
            raw?.createdBy ||
            "Safety Officer",

        description:
            source.description ||
            source.scope ||
            raw?.description ||
            raw?.scope ||
            "",

        status:
            source.status ||
            raw?.status ||
            "DRAFT",

        submittedAt:
            source.submittedAt ||
            raw?.submittedAt ||
            null,

        createdAt:
            source.createdAt ||
            raw?.createdAt ||
            null,

        ftaData: {

            ...fta,

            gate:
                fta.gate ||
                source.gate ||
                raw?.gate ||
                "OR",

            basicEvents:
                basicEvents,

            intermediateEvents:
                Array.isArray(
                    fta.intermediateEvents
                )
                    ? fta.intermediateEvents
                    : []

        }

    };

}


function isUsableExpertRecord(record) {

    return Boolean(
        record &&
        record.analysisTitle &&
        record.topEvent &&
        Array.isArray(
            record.ftaData?.basicEvents
        ) &&
        record.ftaData.basicEvents.length > 0
    );

}


function getExpertCandidates() {

    const candidates = [];


    // 1. Canonical records from Safety Officer.
    loadRecords().forEach(
        function(record) {

            const normalized =
                normalizeRecord(record);

            if (
                isUsableExpertRecord(
                    normalized
                )
            ) {

                candidates.push(
                    normalized
                );

            }

        }
    );


    // 2. Current analysis data as a fallback.
    const current =
        normalizeRecord(
            readJSON(DATA_KEY)
        );

    if (
        isUsableExpertRecord(
            current
        )
    ) {

        const alreadyExists =
            candidates.some(
                function(item) {

                    return (
                        item.id &&
                        current.id &&
                        String(item.id) ===
                        String(current.id)
                    );

                }
            );

        if (!alreadyExists) {

            // A record that contains submittedAt
            // or is already pending is eligible.
            if (
                current.status ===
                    "PENDING_EXPERT" ||
                current.status ===
                    "UNDER_ANALYSIS" ||
                current.submittedAt
            ) {

                current.status =
                    current.status ===
                        "UNDER_ANALYSIS"
                        ? "UNDER_ANALYSIS"
                        : "PENDING_EXPERT";

                candidates.push(
                    current
                );

            }

        }

    }


    // 3. Only show work that is actually submitted.
    return candidates.filter(
        function(record) {

            return (
                record.status ===
                    "PENDING_EXPERT" ||
                record.status ===
                    "UNDER_ANALYSIS"
            );

        }
    );

}


function saveRecords(records) {

    localStorage.setItem(
        RECORDS_KEY,
        JSON.stringify(
            records
        )
    );

}


function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}



function startAnalysisById(id) {

    const queue =
        getExpertCandidates();

    const selected =
        queue.find(
            function(record) {

                return String(
                    record.id
                ) === String(id);

            }
        );


    if (!selected) {

        Notify.error(
            "ไม่พบข้อมูลการวิเคราะห์นี้ในระบบ",
            "Analysis record not found."
        );

        return false;

    }


    selected.status =
        "UNDER_ANALYSIS";

    selected.expert =
        selected.expert ||
        "Expert";

    selected.updatedAt =
        new Date().toISOString();


    const records =
        loadRecords();


    const recordIndex =
        records.findIndex(
            function(record) {

                return String(
                    normalizeRecord(record).id
                ) === String(
                    selected.id
                );

            }
        );


    if (recordIndex >= 0) {

        records[recordIndex] =
            selected;

    } else {

        records.unshift(
            selected
        );

    }


    saveRecords(
        records
    );


    const payload =
        JSON.stringify(
            selected
        );


    sessionStorage.setItem(
        DATA_KEY,
        payload
    );

    localStorage.setItem(
        DATA_KEY,
        payload
    );


    // Explicitly pass the selected analysis id.
    const target =
        "fta-analysis.html?id=" +
        encodeURIComponent(
            selected.id
        );


    window.location.assign(
        target
    );


    return false;

}

const QUEUE_STATUS_LABELS = {
    PENDING_EXPERT: "รอผู้เชี่ยวชาญ",
    UNDER_ANALYSIS: "กำลังวิเคราะห์"
};

const QUEUE_STATUS_BADGE_CLASS = {
    PENDING_EXPERT: "status-badge-amber",
    UNDER_ANALYSIS: "status-badge-blue"
};

function queueStatusBadgeHtml(status) {
    const cls = QUEUE_STATUS_BADGE_CLASS[status] || "status-badge-slate";
    const label = QUEUE_STATUS_LABELS[status] || status;
    return `<span class="status-badge ${cls}">${escapeHtml(label)}</span>`;
}

let queueTable = null;

function renderQueue() {

    const container =
        document.getElementById(
            "queueList"
        );

    if (!container) return;

    const queue = getExpertCandidates();

    const filterOptions = Array.from(
        new Set(queue.map(r => r.status))
    ).map(value => ({ value, label: QUEUE_STATUS_LABELS[value] || value }));

    const columns = [
        {
            key: "analysisTitle", label: "หัวข้อการวิเคราะห์",
            cellHtml: r => `
                <div style="font-weight:800;color:var(--ink);">${escapeHtml(r.analysisTitle)}</div>
                <div style="color:var(--muted);font-size:11px;margin-top:2px;">${r.ftaData.basicEvents.length} Basic Event(s)</div>
            `
        },
        { key: "topEvent", label: "Top Event", cellHtml: r => escapeHtml(r.topEvent) },
        { key: "department", label: "แผนก/พื้นที่", cellHtml: r => escapeHtml(r.department || "-") },
        { key: "status", label: "สถานะ", cellHtml: r => queueStatusBadgeHtml(r.status) }
    ];

    const config = {
        columns,
        rows: queue,
        searchKeys: ["analysisTitle", "topEvent", "department", "officerName"],
        searchPlaceholder: "ค้นหาหัวข้อ, Top Event หรือแผนก...",
        filterKey: "status",
        filterOptions,
        pageSize: 8,
        emptyMessage: "ไม่มีข้อมูลที่ส่งจาก Safety Officer — No Pending Analysis",
        rowMeta: r => ({
            icon: Icon("inbox", "", 16),
            title: r.analysisTitle,
            subtitle: `${r.topEvent} · ${r.ftaData.basicEvents.length} Basic Events`,
            badgeHtml: queueStatusBadgeHtml(r.status)
        }),
        onRowClick: r => startAnalysisById(r.id),
        rowActions: r => [
            { label: "เริ่มวิเคราะห์", icon: Icon("play", "", 12), variant: "primary", onClick: rec => startAnalysisById(rec.id) }
        ]
    };

    if (queueTable) {
        queueTable.setRows(queue);
    } else {
        queueTable = renderDataTable(container, config);
    }

}


const backBtn =
    document.getElementById(
        "backBtn"
    );

if (backBtn) {

    backBtn.addEventListener(
        "click",
        function() {

            window.location.href =
                "expert.html";

        }
    );

}


renderQueue();
