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

        alert(
            "No Analysis data was received from Analysis Queue."
        );

        window.location.href =
            "analysis-queue.html";

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

        alert(
            "FTA Analysis received incomplete data from Analysis Queue."
        );

        window.location.href =
            "analysis-queue.html";

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



function renderSafetyOfficerControls() {

    const container = document.getElementById("safetyOfficerEventControls");
    const count = document.getElementById("safetyControlEventCount");
    const events = Array.isArray(analysisData?.ftaData?.basicEvents) ? analysisData.ftaData.basicEvents : [];

    if (count) count.textContent = `${events.length} EVENTS`;
    if (!container) return;
    container.innerHTML = "";

    if (!events.length) {
        container.innerHTML = `<div class="text-sm text-jorpro-mute">No Basic Events received.</div>`;
        return;
    }

    events.forEach(function(event,index) {
        const card=document.createElement("div");
        card.className="rounded-xl border border-cyan-500/15 bg-jorpro-canvas p-4";
        card.innerHTML = `
            <div class="flex items-start justify-between gap-3">
                <div><div class="text-[10px] font-bold tracking-widest text-jorpro-blue">E-${String(index+1).padStart(2,"0")}</div><div class="text-sm font-bold text-jorpro-ink mt-1">${escapeHtml(event.name || `Basic Event ${index+1}`)}</div></div>
                <span class="text-[9px] uppercase tracking-widest text-jorpro-blue">Safety Officer</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                <div class="rounded-lg bg-white border border-jorpro-line p-3"><div class="text-[9px] uppercase tracking-widest text-jorpro-mute font-bold">Existing Risk Control (Identify)</div><div class="text-xs text-jorpro-slate mt-2 whitespace-pre-line break-words">${escapeHtml(event.existingRiskControl || event.riskControl || "-")}</div></div>
                <div class="rounded-lg bg-white border border-jorpro-line p-3"><div class="text-[9px] uppercase tracking-widest text-jorpro-mute font-bold">Safety Mitigation (Identify)</div><div class="text-xs text-jorpro-slate mt-2 whitespace-pre-line break-words">${escapeHtml(event.safetyMitigation || event.safetyOfficerMitigation || "-")}</div></div>
                <div class="rounded-lg bg-white border border-jorpro-line p-3"><div class="text-[9px] uppercase tracking-widest text-jorpro-mute font-bold">Risk Owner</div><div class="text-xs text-jorpro-slate mt-2 break-words">${escapeHtml(event.riskOwner || "-")}</div></div>
            </div>`;
        container.appendChild(card);
    });

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

function renderTree(events) {

    const container =
        document.getElementById(
            "treeEvents"
        );

    container.innerHTML = "";

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


    if (events.length === 0) {

        container.innerHTML = `
            <div class="col-span-full
                        p-6 rounded-xl
                        bg-slate-50
                        border border-dashed
                        border-slate-300
                        text-center
                        text-sm text-amber-600">
                No Basic Events received from Safety Officer.
            </div>
        `;

        return;
    }


    events.forEach(
        function(event, index) {

            const probability =
                event.probability !== null &&
                event.probability !== undefined &&
                event.probability !== ""
                    ? Number(event.probability)
                    : null;


            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "rounded-xl border border-slate-200 " +
                "bg-slate-50 p-4";


            card.innerHTML = `
                <div class="text-[10px]
                            font-bold tracking-widest
                            text-jorpro-blue">
                    E-${String(index + 1).padStart(2, "0")}
                </div>

                <div class="font-bold
                            text-jorpro-ink
                            mt-2 break-words">
                    ${escapeHtml(
                        event.name ||
                        "Unnamed Event"
                    )}
                </div>

                <p class="text-xs
                          text-jorpro-mute
                          mt-2
                          leading-relaxed
                          break-words">
                    ${escapeHtml(
                        event.description ||
                        "-"
                    )}
                </p>

                <div class="mt-3 pt-3
                            border-t border-slate-200
                            text-xs">

                    <span class="text-jorpro-mute">
                        Safety Officer Probability:
                    </span>

                    <strong class="ml-1
                                   text-jorpro-blue">
                        ${
                            probability !== null
                                ? probability.toExponential(4)
                                : "Not assigned"
                        }
                    </strong>

                </div>
            `;

            container.appendChild(
                card
            );

        }
    );

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

                alert(
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
