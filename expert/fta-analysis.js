// =====================================================
// EXPERT — FTA ANALYSIS
// =====================================================

const STORAGE_KEY =
    "ftaAnalysisData";

const RECORDS_KEY =
    "ftaAnalysisRecords";

let analysisData = null;


// =====================================================
// LOAD ANALYSIS
// =====================================================

function loadAnalysis() {

    let raw = null;


    // =================================================
    // PRIMARY SOURCE:
    // Analysis Queue writes the selected record here.
    // =================================================

    try {

        raw =
            JSON.parse(
                sessionStorage.getItem(
                    STORAGE_KEY
                )
            );

    } catch (error) {

        console.warn(
            "Session analysis data is invalid:",
            error
        );

    }


    // =================================================
    // FALLBACK SOURCE:
    // localStorage copy of the same selected record.
    // =================================================

    if (
        !raw
    ) {

        try {

            raw =
                JSON.parse(
                    localStorage.getItem(
                        STORAGE_KEY
                    )
                );

        } catch (error) {

            console.warn(
                "Local analysis data is invalid:",
                error
            );

        }

    }


    if (
        !raw ||
        typeof raw !== "object"
    ) {

        Notify.error(
            "ไม่ได้รับข้อมูลการวิเคราะห์จาก Analysis Queue",
            "No Analysis data was received from Analysis Queue."
        ).then(function () {
            window.location.href =
                "analysis-queue.html";
        });

        return false;

    }


    // =================================================
    // NORMALIZE THE EXACT RECORD RECEIVED FROM QUEUE
    // =================================================

    const source =
        raw.analysisData ||
        raw.analysis ||
        raw;


    const ftaSource =
        source.ftaData ||
        raw.ftaData ||
        {};


    const sourceEvents =
        Array.isArray(
            ftaSource.basicEvents
        )
            ? ftaSource.basicEvents
            : (
                Array.isArray(
                    source.basicEvents
                )
                    ? source.basicEvents
                    : (
                        Array.isArray(
                            raw.basicEvents
                        )
                            ? raw.basicEvents
                            : []
                    )
            );


    analysisData = {

        ...source,

        id:
            source.id ||
            raw.id ||
            `FTA-${Date.now()}`,

        analysisTitle:
            source.analysisTitle ||
            source.title ||
            raw.analysisTitle ||
            raw.title ||
            "",

        topEvent:
            source.topEvent ||
            source.top_event ||
            raw.topEvent ||
            raw.top_event ||
            "",

        department:
            source.department ||
            source.departmentArea ||
            source.area ||
            source.department_area ||
            raw.department ||
            raw.departmentArea ||
            raw.area ||
            raw.department_area ||
            "",

        description:
            source.description ||
            source.scope ||
            raw.description ||
            raw.scope ||
            "",

        officerName:
            source.officerName ||
            source.createdBy ||
            raw.officerName ||
            raw.createdBy ||
            "Safety Officer",

        status:
            source.status ||
            raw.status ||
            "UNDER_ANALYSIS",

        ftaData: {

            ...ftaSource,

            gate:
                ftaSource.gate ||
                source.gate ||
                raw.gate ||
                "OR",

            basicEvents:
                sourceEvents.map(
                    function(event, index) {

                        return {

                            ...event,

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

                            existingRiskControl:
                                event?.existingRiskControl || event?.riskControl || event?.existing_risk_control || "",

                            safetyMitigation:
                                event?.safetyMitigation || event?.safetyOfficerMitigation || event?.safety_mitigation || "",

                            riskOwner:
                                event?.riskOwner || event?.risk_owner || ""

                        };

                    }
                )

        }

    };


    // =================================================
    // HARD VALIDATION
    // =================================================

    if (
        !analysisData.analysisTitle ||
        !analysisData.topEvent ||
        !Array.isArray(
            analysisData.ftaData.basicEvents
        ) ||
        analysisData.ftaData.basicEvents.length === 0
    ) {

        console.error(
            "Incomplete record received by FTA Analysis:",
            analysisData
        );

        Notify.error(
            "ข้อมูลที่ได้รับจาก Analysis Queue ไม่สมบูรณ์",
            "FTA Analysis received incomplete data from Analysis Queue."
        ).then(function () {
            window.location.href =
                "analysis-queue.html";
        });

        return false;

    }


    // Keep the exact selected record synchronized.
    saveAnalysis();


    return true;

}

// =====================================================
// STORAGE
// =====================================================

function saveAnalysis() {

    sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
            analysisData
        )
    );

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
            analysisData
        )
    );

}


function updateRecord() {

    let records = [];

    try {

        records =
            JSON.parse(
                localStorage.getItem(
                    RECORDS_KEY
                )
            ) || [];

    } catch (error) {

        records = [];

    }


    const index =
        records.findIndex(
            function(record) {

                return String(
                    record.id
                ) === String(
                    analysisData.id
                );

            }
        );


    if (index >= 0) {

        records[index] = {
            ...records[index],
            ...analysisData,
            ftaData: {
                ...analysisData.ftaData
            },
            analysisResult:
                analysisData.analysisResult || null,
            updatedAt:
                new Date().toISOString()
        };

    } else {

        records.unshift(
            analysisData
        );

    }


    localStorage.setItem(
        RECORDS_KEY,
        JSON.stringify(
            records
        )
    );

}


// =====================================================
// HELPERS
// =====================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =====================================================
// RENDER
// =====================================================

function renderPage() {

    const fta =
        analysisData.ftaData;

    const events =
        fta.basicEvents;


    document.getElementById(
        "analysisTitle"
    ).textContent =
        analysisData.analysisTitle || "-";


    document.getElementById(
        "topEvent"
    ).textContent =
        analysisData.topEvent || "-";


    document.getElementById(
        "department"
    ).textContent =
        analysisData.department ||
        "Not provided";


    document.getElementById(
        "treeTopEvent"
    ).textContent =
        analysisData.topEvent || "-";


    document.getElementById(
        "gateDisplay"
    ).textContent =
        fta.gate || "OR";


    document.getElementById(
        "treeGate"
    ).textContent =
        fta.gate || "OR";


    renderAnalysisStructure();

    renderSafetyOfficerControls();

    renderTree(events);

}



// Single combined table (one row per Basic Event) — replaces the old
// duplicated rendering (a "Safety Controls" card grid and a separate,
// mostly-overlapping "Fault Tree" card grid showing the same events).
function renderSafetyOfficerControls() {

    const container = document.getElementById("safetyOfficerEventControls");
    const count = document.getElementById("safetyControlEventCount");
    const events = Array.isArray(analysisData?.ftaData?.basicEvents) ? analysisData.ftaData.basicEvents : [];

    if (count) count.textContent = `${events.length} EVENTS`;
    if (!container) return;

    if (!events.length) {
        container.innerHTML = `<div class="dt-empty">No Basic Events received from Safety Officer.</div>`;
        return;
    }

    const rows = events.map(function (event, index) {
        const probability =
            event.probability !== null && event.probability !== undefined && event.probability !== ""
                ? Number(event.probability).toExponential(4)
                : "-";

        // Safety Mitigation / Risk Owner / Type of Hazard are no longer
        // shown here — Safety Officer now enters them after this Risk
        // Assessment is complete, on their own Analysis Result page, not
        // before it.
        return `
            <tr>
                <td style="width:70px;"><span class="status-badge status-badge-blue">E-${String(index + 1).padStart(2, "0")}</span></td>
                <td>
                    <div style="font-weight:800;color:var(--ink);">${escapeHtml(event.name || `Basic Event ${index + 1}`)}</div>
                    <div style="color:var(--muted);font-size:11px;margin-top:2px;">${escapeHtml(event.description || "-")}</div>
                </td>
                <td style="color:var(--ac);font-weight:700;">${probability}</td>
                <td style="color:var(--body);max-width:280px;white-space:pre-line;">${escapeHtml(event.existingRiskControl || event.riskControl || "-")}</td>
            </tr>
        `;
    }).join("");

    container.innerHTML = `
        <div class="data-table-scroll">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th><th>Basic Event</th><th>SO Probability</th>
                        <th>Existing Risk Control</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;

}

function renderAnalysisStructure() {

    const fta =
        analysisData.ftaData || {};

    const events =
        Array.isArray(
            fta.basicEvents
        )
            ? fta.basicEvents
            : [];

    const structureText =
        events.length
            ? `${fta.gate || "OR"} Gate · ${events.length} Basic Event${events.length === 1 ? "" : "s"} received`
            : "No Basic Events received";

    const status =
        document.getElementById(
            "analysisStructureStatus"
        );

    if (status) {
        status.textContent =
            structureText;
    }

}


// =====================================================
// TREE
// =====================================================

// The per-event breakdown now lives entirely in the combined table
// rendered by renderSafetyOfficerControls() — this just keeps the two
// gate-label displays (badge + tree diagram) in sync.
function renderTree(events) {

    const gate =
        (
            analysisData.ftaData?.gate ||
            "OR"
        ).toUpperCase();

    document.getElementById(
        "gateDisplay"
    ).textContent =
        gate;

    document.getElementById(
        "treeGate"
    ).textContent =
        gate;

}

// =====================================================
// EVENTS
// =====================================================

const continueRiskBtn =
    document.getElementById(
        "continueRiskBtn"
    );


if (continueRiskBtn) {

    continueRiskBtn.addEventListener(
        "click",
        function() {

            if (!analysisData?.id) {

                Notify.error(
                    "ไม่พบรหัสการวิเคราะห์ (Analysis ID)",
                    "Analysis ID was not found."
                );

                return;

            }

            // Keep the current Analysis synchronized before entering Risk Assessment.
            saveAnalysis();
            updateRecord();

            window.location.href =
                `risk-assessment.html?id=${encodeURIComponent(
                    analysisData.id
                )}`;

        }
    );

}


document
    .getElementById(
        "backBtn"
    )
    .addEventListener(
        "click",
        function() {

            window.location.href =
                "analysis-queue.html";

        }
    );


if (loadAnalysis()) {

    renderPage();

}
