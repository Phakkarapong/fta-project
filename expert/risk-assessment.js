// =====================================================
// SAFETY RISK ASSESSMENT
// =====================================================


function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function riskBadgeClassFor(riskLevel) {
    if (riskLevel === "LOW") return "status-badge-green";
    if (riskLevel === "MEDIUM") return "status-badge-amber";
    if (riskLevel === "HIGH") return "status-badge-red";
    return "status-badge-red";
}


// =====================================================
// RISK LIKELIHOOD
// =====================================================

const likelihoodData = {

    5: {
        name: "Frequent",
        description:
            "Likely to occur many times (has occured frequently)"
    },

    4: {
        name: "Occasional",
        description:
            "Likely to occur sometimes (has occured occasionally)"
    },

    3: {
        name: "Remote",
        description:
            "Unlikely to occur, but possible (has occured rarely)"
    },

    2: {
        name: "Improbable",
        description:
            "Very unlikely to occur (not known to have occured)"
    },

    1: {
        name: "Extremely improbable",
        description:
            "Almost inconceivable that the event will occur"
    }

};


// =====================================================
// RISK SEVERITY / IMPACT
// =====================================================

const severityData = {

    5: {
        code: "A",
        name: "Catastrophic",
        description:
            "Catastrophic consequence"
    },

    4: {
        code: "B",
        name: "Hazardous",
        description:
            "Hazardous consequence"
    },

    3: {
        code: "C",
        name: "Major",
        description:
            "Major consequence"
    },

    2: {
        code: "D",
        name: "Minor",
        description:
            "Minor consequence"
    },

    1: {
        code: "E",
        name: "Negligible",
        description:
            "Negligible consequence"
    }

};


const severityCodes = {
    5: "A",
    4: "B",
    3: "C",
    2: "D",
    1: "E"
};


// =====================================================
// SAFETY RISK INDEX MATRIX
// =====================================================

const faaRiskMatrix = {

    5: {
        5: "HIGH",
        4: "HIGH",
        3: "HIGH",
        2: "MEDIUM",
        1: "MEDIUM"
    },

    4: {
        5: "HIGH",
        4: "HIGH",
        3: "MEDIUM",
        2: "MEDIUM",
        1: "MEDIUM"
    },

    3: {
        5: "HIGH",
        4: "MEDIUM",
        3: "MEDIUM",
        2: "MEDIUM",
        1: "LOW"
    },

    2: {
        5: "MEDIUM",
        4: "MEDIUM",
        3: "MEDIUM",
        2: "LOW",
        1: "LOW"
    },

    1: {
        5: "MEDIUM",
        4: "LOW",
        3: "LOW",
        2: "LOW",
        1: "LOW"
    }

};


function getRiskIndex(likelihood, severity) {

    const code =
        severityCodes[severity];

    if (!code) {
        return "";
    }

    return `${likelihood}${code}`;
}


// =====================================================
// NOTE: Acceptability / mitigation / next review are no longer
// decided by the Expert. The Expert only scores Likelihood and
// Severity to produce the Initial Risk (via faaRiskMatrix above).
// Acceptability, Mitigation and Next Review are the Safety
// Officer's job on the Analysis Result page.
// =====================================================


function getRiskLevelClass(riskLevel) {

    if (riskLevel === "LOW") {
        return "risk-low";
    }

    if (riskLevel === "MEDIUM") {
        return "risk-medium";
    }

    if (riskLevel === "HIGH") {
        return "risk-high";
    }

    return "risk-special";
}


// =====================================================
// CANONICAL ANALYSIS DATA
// =====================================================

const RECORDS_KEY =
    "ftaAnalysisRecords";

const DATA_KEY =
    "ftaAnalysisData";


function readJSON(storage, key) {

    try {

        const value =
            storage.getItem(key);

        return value
            ? JSON.parse(value)
            : null;

    } catch (error) {

        console.error(
            "Cannot read:",
            key,
            error
        );

        return null;

    }

}


function normalizeAnalysis(raw) {

    if (
        !raw ||
        typeof raw !== "object"
    ) {
        return null;
    }

    const source =
        raw.analysisData ||
        raw.analysis ||
        raw;

    const fta =
        source.ftaData ||
        raw.ftaData ||
        {};

    return {
        ...source,

        id:
            source.id ||
            raw.id ||
            "",

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

        description:
            source.description ||
            source.scope ||
            raw.description ||
            raw.scope ||
            "",

        ftaData: {
            ...fta,

            gate:
                (
                    fta.gate ||
                    source.gate ||
                    raw.gate ||
                    "OR"
                ).toUpperCase(),

            basicEvents:
                Array.isArray(
                    fta.basicEvents
                )
                    ? fta.basicEvents
                    : (
                        Array.isArray(
                            source.basicEvents
                        )
                            ? source.basicEvents
                            : []
                    )
        },

        analysisResult:
            source.analysisResult ||
            raw.analysisResult ||
            null
    };

}


function loadCanonicalAnalysis() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const requestedId =
        params.get("id");

    const records =
        readJSON(
            localStorage,
            RECORDS_KEY
        );

    // 1. Exact record from URL.
    if (
        requestedId &&
        Array.isArray(records)
    ) {

        const matched =
            records.find(
                function(record) {

                    return String(
                        record?.id
                    ) === String(
                        requestedId
                    );

                }
            );

        if (matched) {
            return normalizeAnalysis(matched);
        }
    }

    // 2. Latest record with completed FTA.
    if (Array.isArray(records)) {

        for (
            let i = records.length - 1;
            i >= 0;
            i--
        ) {

            const candidate =
                normalizeAnalysis(
                    records[i]
                );

            if (
                candidate &&
                candidate.analysisResult &&
                Number.isFinite(
                    Number(
                        candidate.analysisResult
                            ?.topEventProbability
                    )
                )
            ) {
                return candidate;
            }
        }
    }

    // 3. Session handoff.
    const sessionData =
        readJSON(
            sessionStorage,
            DATA_KEY
        );

    if (sessionData) {
        return normalizeAnalysis(
            sessionData
        );
    }

    // 4. Local fallback.
    const localData =
        readJSON(
            localStorage,
            DATA_KEY
        );

    if (localData) {
        return normalizeAnalysis(
            localData
        );
    }

    return null;
}


const currentAnalysis =
    loadCanonicalAnalysis();


const ftaTopProbability =
    currentAnalysis?.analysisResult
        ?.topEventProbability
        ?? null;


const ftaTopEvent =
    currentAnalysis?.topEvent ||
    "";


let events =
    currentAnalysis?.ftaData
        ?.basicEvents ||
    [];

// =====================================================
// ELEMENTS
// =====================================================

const eventSelect =
    document.getElementById(
        "eventSelect"
    );

const probabilityInput =
    document.getElementById(
        "riskProbability"
    );

const severityInput =
    document.getElementById(
        "riskSeverity"
    );

const resultEvent =
    document.getElementById(
        "resultEvent"
    );

const resultProbability =
    document.getElementById(
        "resultProbability"
    );

const resultSeverity =
    document.getElementById(
        "resultSeverity"
    );

const resultScore =
    document.getElementById(
        "resultScore"
    );

const resultLevel =
    document.getElementById(
        "resultLevel"
    );

const matrix =
    document.getElementById(
        "riskAssessmentMatrix"
    );


// =====================================================
// DISPLAY FTA TOP EVENT PROBABILITY
// =====================================================

function displayFTAProbability() {

    if (!ftaTopProbability) {
        return;
    }


    const existing =
        document.getElementById(
            "ftaProbabilityDisplay"
        );


    if (existing) {
        return;
    }


    const container =
        document.createElement(
            "div"
        );


    container.id =
        "ftaProbabilityDisplay";


    container.style.margin =
        "0 0 20px 0";


    container.style.padding =
        "16px";


    container.style.border =
        "1px solid #cbd5e1";


    container.style.borderRadius =
        "8px";


    container.style.background =
        "#f8fafc";


    container.innerHTML = `

        <div
            style="
                font-size:14px;
                font-weight:600;
                margin-bottom:6px;
            "
        >
            FTA Top Event Probability
        </div>

        <div
            style="
                font-size:20px;
                font-weight:700;
                color:#1d4ed8;
            "
        >
            ${(Number(ftaTopProbability) * 100).toFixed(4)}%
        </div>

        ${
            ftaTopEvent
            ? `
                <div
                    style="
                        margin-top:6px;
                        font-size:13px;
                        color:#64748b;
                    "
                >
                    Top Event: ${ftaTopEvent}
                </div>
            `
            : ""
        }

    `;


    // Try to place above the event selector

    if (eventSelect) {

        const parent =
            eventSelect.parentElement;


        if (parent) {

            parent.insertBefore(
                container,
                eventSelect
            );

        }

    }

}


// =====================================================
// LOAD EVENTS INTO SELECT
// =====================================================


function loadEvents() {

    if (!eventSelect) {
        return;
    }

    // -------------------------------------------------
    // TOP EVENT: display separately, not as an option.
    // -------------------------------------------------
    const topEventName =
        document.getElementById(
            "riskTopEventName"
        );

    if (topEventName) {
        topEventName.textContent =
            ftaTopEvent ||
            "Top Event";
    }


    // -------------------------------------------------
    // BASIC EVENTS ONLY
    // -------------------------------------------------
    eventSelect.innerHTML =
        "";

    const basicEvents =
        Array.isArray(
            events
        )
            ? events
            : [];

    basicEvents.forEach(
        function(
            event,
            index
        ) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                event?.id ||
                `E-${String(
                    index + 1
                ).padStart(
                    2,
                    "0"
                )}`;

            option.textContent =
                event?.name ||
                event?.eventName ||
                `Basic Event ${index + 1}`;

            eventSelect.appendChild(
                option
            );

        }
    );


    // Keep the source note, but make it clear that only
    // Basic Events are in the selector.
    const parent =
        eventSelect.parentElement;

    if (
        parent &&
        !parent.querySelector(
            ".event-source-note"
        )
    ) {

        const note =
            document.createElement(
                "div"
            );

        note.className =
            "event-source-note mt-2 text-[10px] text-jorpro-blue dark:text-jorpro-blueDark";

        note.textContent =
            `${basicEvents.length} Basic Event(s) available for Risk Assessment`;

        parent.appendChild(
            note
        );

    }

}



// =====================================================
// CREATE FAA MATRIX
// =====================================================

function createMatrix() {

    if (!matrix) {
        return;
    }

    matrix.innerHTML = "";
    matrix.style.display = "grid";
    matrix.style.gridTemplateColumns = "70px repeat(5, 1fr)";
    matrix.style.width = "100%";
    matrix.style.maxWidth = "700px";
    matrix.style.margin = "20px auto";

    const corner = document.createElement("div");
    corner.className = "matrix-cell matrix-header";
    corner.textContent = "L / S";
    matrix.appendChild(corner);

    for (let severity = 5; severity >= 1; severity--) {

        const header = document.createElement("div");
        header.className = "matrix-cell matrix-header";
        header.textContent = severityCodes[severity];
        matrix.appendChild(header);

    }

    for (let likelihood = 5; likelihood >= 1; likelihood--) {

        const label = document.createElement("div");
        label.className = "matrix-cell matrix-header";
        label.textContent = likelihood;
        matrix.appendChild(label);

        for (let severity = 5; severity >= 1; severity--) {

            const riskLevel =
                faaRiskMatrix[likelihood][severity];

            const riskIndex =
                getRiskIndex(likelihood, severity);

            const cell =
                document.createElement("div");

            cell.className = "matrix-cell";
            cell.textContent = riskIndex;

            if (riskLevel === "LOW") {
                cell.classList.add("risk-low-cell");
            }
            else if (riskLevel === "MEDIUM") {
                cell.classList.add("risk-medium-cell");
            }
            else if (riskLevel === "HIGH") {
                // Via RiskMatrix so HIGH renders red ("risk-special-cell"),
                // consistent with the badge/text colors elsewhere on this
                // page and every other page — not the orange "risk-high-cell".
                cell.classList.add(
                    window.RiskMatrix ? RiskMatrix.getRiskMatrixCellClass("HIGH") : "risk-high-cell"
                );
            }

            const selectedLikelihood =
                Number(
                    probabilityInput
                        ? probabilityInput.value
                        : 0
                );

            const selectedSeverity =
                Number(
                    severityInput
                        ? severityInput.value
                        : 0
                );

            if (
                likelihood === selectedLikelihood &&
                severity === selectedSeverity
            ) {
                cell.classList.add("selected-risk");
            }

            matrix.appendChild(cell);
        }
    }
}


// =====================================================
// CALCULATE ASSESSMENT
// =====================================================

function calculateAssessment() {

    const likelihood =
        Number(
            probabilityInput
                ? probabilityInput.value
                : 0
        );

    const severity =
        Number(
            severityInput
                ? severityInput.value
                : 0
        );

    let selectedEvent = null;

    if (
        eventSelect &&
        eventSelect.value !== "TOP_EVENT"
    ) {
        selectedEvent =
            events.find(
                function(event) {
                    return String(event.id) ===
                        String(eventSelect.value);
                }
            );
    }

    if (
        eventSelect &&
        eventSelect.value === "TOP_EVENT"
    ) {
        if (resultEvent) {
            resultEvent.textContent =
                ftaTopEvent ||
                "Top Event";
        }
    }
    else if (selectedEvent) {
        if (resultEvent) {
            resultEvent.textContent =
                selectedEvent.name;
        }
    }
    else {
        if (resultEvent) {
            resultEvent.textContent = "-";
        }
    }

    if (!likelihood || !severity) {

        if (resultProbability) {
            resultProbability.textContent = "-";
        }

        if (resultSeverity) {
            resultSeverity.textContent = "-";
        }

        if (resultScore) {
            resultScore.textContent = "-";
        }

        if (resultLevel) {
            resultLevel.textContent = "-";
        }

        createMatrix();
        return;
    }

    const likelihoodInfo =
        likelihoodData[likelihood];

    const severityInfo =
        severityData[severity];

    const riskLevel =
        faaRiskMatrix[likelihood][severity];

    const riskIndex =
        getRiskIndex(
            likelihood,
            severity
        );

    if (resultProbability) {
        resultProbability.textContent =
            `${likelihood} - ${likelihoodInfo.name}`;
    }

    if (resultSeverity) {
        resultSeverity.textContent =
            `${severityInfo.code} - ${severityInfo.name}`;
    }

    if (resultScore) {
        resultScore.textContent = riskIndex;
    }

    if (resultLevel) {
        resultLevel.textContent = riskLevel;
        // Base sizing/weight classes + the risk-level color, via
        // RiskMatrix so HIGH renders red consistently with every other
        // page instead of this file's own (previously dead-class) mapping.
        resultLevel.className =
            "text-sm font-bold font-mono " +
            (window.RiskMatrix ? RiskMatrix.getRiskLevelTextClass(riskLevel) : getRiskLevelClass(riskLevel));
    }

    createMatrix();
}


// =====================================================
// EVENT LISTENERS
// =====================================================

if (eventSelect) {

    eventSelect.addEventListener(
        "change",
        calculateAssessment
    );

}


if (probabilityInput) {

    probabilityInput.addEventListener(
        "change",
        calculateAssessment
    );

}


if (severityInput) {

    severityInput.addEventListener(
        "change",
        calculateAssessment
    );

}


// =====================================================

// =====================================================
// EVENT ASSESSMENT WORKFLOW
// =====================================================

const RISK_ASSESSMENTS_KEY = "riskAssessments";

let savedAssessments = [];


function loadSavedAssessments() {

    try {
        const raw =
            localStorage.getItem(
                RISK_ASSESSMENTS_KEY
            );

        savedAssessments =
            raw ? JSON.parse(raw) : [];

    } catch (error) {
        savedAssessments = [];
    }

    if (!Array.isArray(savedAssessments)) {
        savedAssessments = [];
    }

    if (currentAnalysis?.id) {

        savedAssessments =
            savedAssessments.filter(
                function (item) {
                    return String(
                        item?.analysisId || ""
                    ) === String(
                        currentAnalysis.id
                    );
                }
            );

    }

}



function getAssessmentTargets() {

    // Risk Assessment is performed on Basic Events only.
    // Top Event is intentionally excluded from the assessment count.
    return (
        Array.isArray(
            events
        )
            ? events
            : []
    ).map(
        function (
            event,
            index
        ) {

            return {

                id:
                    String(
                        event?.id ||
                        `E-${String(
                            index + 1
                        ).padStart(
                            2,
                            "0"
                        )}`
                    ),

                name:
                    event?.name ||
                    event?.eventName ||
                    `Basic Event ${index + 1}`

            };

        }
    );

}




function renderAssessmentStatus() {

    const list =
        document.getElementById(
            "savedEventList"
        );

    const progress =
        document.getElementById(
            "assessmentProgress"
        );

    const finishBtn =
        document.getElementById(
            "finishBtn"
        );

    const targets =
        getAssessmentTargets();

    const savedIds =
        new Set(
            savedAssessments.map(
                function (item) {
                    return String(
                        item.eventId
                    );
                }
            )
        );

    // Per-event assessed/pending detail now lives entirely in the single
    // table rendered by renderFinalAssessmentSummary() below — this list
    // no longer duplicates it (was a second, simpler card list showing
    // the same assessed/pending state a third time on this page).
    if (list) {
        list.innerHTML = "";
    }

    const assessedIds =
        new Set(
            savedAssessments.map(
                function (item) {
                    return String(
                        item?.eventId ||
                        ""
                    );
                }
            )
        );

    const completed =
        targets.filter(
            function (target) {
                return assessedIds.has(
                    String(
                        target.id
                    )
                );
            }
        ).length;

    const total =
        targets.length;

    if (progress) {
        progress.textContent =
            `Assessed ${completed} of ${total} Events.`;
    }

    if (finishBtn) {

        finishBtn.disabled =
            completed < total;

        finishBtn.style.opacity =
            completed < total
                ? "0.45"
                : "1";

    }

    renderFinalAssessmentSummary();

}


function saveCanonicalRiskData() {

    localStorage.setItem(
        RISK_ASSESSMENTS_KEY,
        JSON.stringify(
            savedAssessments
        )
    );

    if (!currentAnalysis?.id) {
        return;
    }

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

    if (!Array.isArray(records)) {
        records = [];
    }

    const index =
        records.findIndex(
            function (record) {
                return String(
                    record?.id
                ) === String(
                    currentAnalysis.id
                );
            }
        );

    const updated =
        {
            ...currentAnalysis,
            riskAssessments:
                savedAssessments,
            updatedAt:
                new Date().toISOString()
        };

    if (index >= 0) {
        records[index] = {
            ...records[index],
            ...updated
        };
    } else {
        records.unshift(updated);
    }

    localStorage.setItem(
        RECORDS_KEY,
        JSON.stringify(records)
    );

    sessionStorage.setItem(
        DATA_KEY,
        JSON.stringify(updated)
    );

    localStorage.setItem(
        DATA_KEY,
        JSON.stringify(updated)
    );

}



// =====================================================
// FINAL EVENT SUMMARY UI
// =====================================================

function renderFinalAssessmentSummary() {

    const targets =
        getAssessmentTargets();

    const counter =
        document.getElementById(
            "finalAssessmentCounter"
        );

    const table =
        document.getElementById(
            "finalAssessmentTable"
        );

    const overall =
        document.getElementById(
            "finalAssessmentOverall"
        );

    const ready =
        document.getElementById(
            "finalAssessmentReady"
        );

    const finishBtn =
        document.getElementById(
            "finishBtn"
        );


    const pendingPanel =
        document.getElementById(
            "pendingEventsPanel"
        );

    const pendingList =
        document.getElementById(
            "pendingEventsList"
        );

    if (counter) {

        const assessedIds =
            new Set(
                savedAssessments.map(
                    function (item) {
                        return String(
                            item?.eventId ||
                            ""
                        );
                    }
                )
            );

        const completedCount =
            targets.filter(
                function (target) {
                    return assessedIds.has(
                        String(
                            target.id
                        )
                    );
                }
            ).length;

        counter.textContent =
            `${completedCount} / ${targets.length} EVENTS ASSESSED`;

    }

    if (!table) {
        return;
    }

    // One real table (was: a card-grid duplicating #savedEventList above,
    // plus a separate "pending" list below repeating the same events again).
    // Each row's "ประเมิน" action jumps to the scoring panel with that
    // event preselected.
    //
    // Ranked HIGH -> MEDIUM -> LOW via RiskMatrix.compareByRisk (assessed
    // events only — an event with no assessment yet has no risk to rank
    // by, so PENDING rows sort after all assessed ones, keeping their own
    // relative order).
    const decorated = targets.map(
        function (target) {
            const assessment =
                savedAssessments.find(
                    function (item) {
                        return String(item.eventId) === String(target.id);
                    }
                );
            return { target: target, assessment: assessment || null };
        }
    );

    decorated.sort(function (a, b) {
        if (a.assessment && b.assessment) {
            return window.RiskMatrix ? RiskMatrix.compareByRisk(a.assessment, b.assessment) : 0;
        }
        if (a.assessment && !b.assessment) return -1;
        if (!a.assessment && b.assessment) return 1;
        return 0;
    });

    const rowsHtml = decorated.map(
        function (entry, index) {

            const target = entry.target;
            const assessment = entry.assessment;
            const assessed = !!assessment;
            const riskClass = assessed ? riskBadgeClassFor(assessment.riskLevel) : "status-badge-slate";

            return `
                <tr>
                    <td style="width:36px;color:var(--muted);">${String(index + 1).padStart(2, "0")}</td>
                    <td style="font-weight:800;color:var(--ink);">${escapeHtml(target.name)}</td>
                    <td><span class="status-badge ${assessed ? "status-badge-green" : "status-badge-amber"}">${assessed ? "ASSESSED" : "PENDING"}</span></td>
                    <td>${assessed ? escapeHtml(`${assessment.likelihood} - ${assessment.likelihoodName}`) : "-"}</td>
                    <td>${assessed ? escapeHtml(`${assessment.severity} - ${assessment.severityName}`) : "-"}</td>
                    <td style="font-weight:800;color:var(--ac);">${assessed ? escapeHtml(assessment.referenceScore) : "-"}</td>
                    <td>${assessed ? `<span class="status-badge ${riskClass}">${escapeHtml(assessment.riskLevel)}</span>` : "-"}</td>
                    <td class="text-right">
                        <button type="button" class="dt-action-btn dt-action-btn-primary select-assessment-target" data-id="${escapeHtml(target.id)}">
                            ${window.Icon ? window.Icon("edit", "", 12) : ""}<span>ประเมิน</span>
                        </button>
                    </td>
                </tr>
            `;
        }
    ).join("");

    table.innerHTML = `
        <div class="data-table-scroll">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Rank</th><th>Event</th><th>Status</th><th>Likelihood</th><th>Severity</th>
                        <th>Score</th><th>Risk Level</th><th class="text-right">Action</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        </div>
    `;

    if (pendingPanel) {
        pendingPanel.classList.add("hidden");
    }
    if (pendingList) {
        pendingList.innerHTML = "";
    }


    const allComplete =
        targets.length > 0 &&
        savedAssessments.length === targets.length;


    // Overview is now based on the Initial Risk Level (Likelihood
    // x Severity) only. Acceptability is decided later by the
    // Safety Officer, not derived automatically here.
    const highCount =
        savedAssessments.filter(
            function(item) {
                return item.riskLevel === "HIGH";
            }
        ).length;

    const mediumCount =
        savedAssessments.filter(
            function(item) {
                return item.riskLevel === "MEDIUM";
            }
        ).length;


    if (overall) {

        overall.classList.remove(
            "hidden"
        );

        if (!allComplete) {

            overall.className =
                "rounded-xl p-4 border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10";

            overall.innerHTML = `
                <div class="text-xs font-bold text-amber-600 dark:text-amber-400">
                    IN PROGRESS
                </div>
                <div class="text-xs text-jorpro-slate dark:text-jorpro-slateDark mt-1">
                    ยังประเมินไม่ครบ ${targets.length - savedAssessments.length} Event
                </div>
            `;

        } else if (highCount > 0) {

            overall.className =
                "rounded-xl p-4 border border-jorpro-red/25 dark:border-jorpro-redDark/30 bg-red-500/5 dark:bg-jorpro-redDark/10";

            overall.innerHTML = `
                <div class="text-xs font-bold text-jorpro-red dark:text-jorpro-redDark">
                    INITIAL RISK OVERVIEW · HIGH RISK PRESENT
                </div>
                <div class="text-xs text-jorpro-slate dark:text-jorpro-slateDark mt-1">
                    พบ ${highCount} Event ที่มี Initial Risk ระดับ High รอ Safety Officer พิจารณาลงคะแนนขั้นสุดท้าย
                </div>
            `;

        } else if (mediumCount > 0) {

            overall.className =
                "rounded-xl p-4 border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10";

            overall.innerHTML = `
                <div class="text-xs font-bold text-amber-600 dark:text-amber-400">
                    INITIAL RISK OVERVIEW · MEDIUM RISK PRESENT
                </div>
                <div class="text-xs text-jorpro-slate dark:text-jorpro-slateDark mt-1">
                    ทุก Event ประเมินครบแล้ว รอ Safety Officer ลงคะแนน Acceptability และ Mitigation ขั้นสุดท้าย
                </div>
            `;

        } else {

            overall.className =
                "rounded-xl p-4 border border-emerald-200 dark:border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10";

            overall.innerHTML = `
                <div class="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    INITIAL RISK OVERVIEW · LOW RISK
                </div>
                <div class="text-xs text-jorpro-slate dark:text-jorpro-slateDark mt-1">
                    ทุก Event อยู่ในระดับ Initial Risk ต่ำ รอ Safety Officer ยืนยันผลขั้นสุดท้าย
                </div>
            `;

        }

    }


    if (ready) {

        ready.classList.toggle(
            "hidden",
            !allComplete
        );

    }


    if (finishBtn) {

        finishBtn.disabled =
            !allComplete;

        finishBtn.style.opacity =
            allComplete
                ? "1"
                : "0.45";

        finishBtn.style.cursor =
            allComplete
                ? "pointer"
                : "not-allowed";

    }

}

// =====================================================
// SAVE EVENT — SINGLE DEFINITIVE HANDLER
// =====================================================

const saveRiskBtn =
    document.getElementById(
        "saveRiskBtn"
    );

if (saveRiskBtn) {

    saveRiskBtn.addEventListener(
        "click",
        function (event) {

            event.preventDefault();
            event.stopPropagation();

            const eventId =
                eventSelect
                    ? eventSelect.value
                    : "";

            const likelihood =
                Number(
                    probabilityInput
                        ? probabilityInput.value
                        : 0
                );

            const severity =
                Number(
                    severityInput
                        ? severityInput.value
                        : 0
                );

            if (
                !eventId ||
                !likelihood ||
                !severity
            ) {

                Notify.warn(
                    "กรุณาเลือก Event, Likelihood และ Severity",
                    "Please select Event, Likelihood and Severity."
                );

                return;

            }

            const targets =
                getAssessmentTargets();

            const target =
                targets.find(
                    function (item) {
                        return String(
                            item.id
                        ) === String(
                            eventId
                        );
                    }
                );

            const selectedEvent =
                eventId === "TOP_EVENT"
                    ? null
                    : events.find(
                        function (item, index) {

                            const stableId =
                                String(
                                    item?.id ||
                                    `E-${String(index + 1).padStart(2, "0")}`
                                );

                            return (
                                stableId ===
                                String(eventId)
                            );

                        }
                    );

            const riskLevel =
                faaRiskMatrix[
                    likelihood
                ]?.[
                    severity
                ];

            if (!riskLevel) {

                Notify.error(
                    "ไม่สามารถคำนวณช่องใน Risk Matrix ที่เลือกได้",
                    "Unable to calculate the selected Risk Matrix cell."
                );

                return;

            }

            const assessment = {

                analysisId:
                    currentAnalysis?.id ||
                    "",

                eventId:
                    String(eventId),

                eventName:
                    target?.name ||
                    (
                        eventId === "TOP_EVENT"
                            ? (
                                ftaTopEvent ||
                                "Top Event"
                            )
                            : (
                                selectedEvent?.name ||
                                "Event"
                            )
                    ),

                ftaTopEventProbability:
                    ftaTopProbability !== null
                        ? Number(
                            ftaTopProbability
                        )
                        : null,

                likelihood:
                    likelihood,

                likelihoodName:
                    likelihoodData[
                        likelihood
                    ].name,

                severity:
                    severity,

                severityCode:
                    severityData[
                        severity
                    ].code,

                severityName:
                    severityData[
                        severity
                    ].name,

                riskIndex:
                    getRiskIndex(
                        likelihood,
                        severity
                    ),

                riskScore:
                    getRiskIndex(
                        likelihood,
                        severity
                    ),

                referenceScore:
                    getRiskIndex(
                        likelihood,
                        severity
                    ),

                riskLevel:
                    riskLevel,

                // Acceptability, Mitigation and Next Review are no
                // longer set by the Expert — they are decided by
                // the Safety Officer on the Analysis Result page.

                standard:
                    "FAA",

                assessedAt:
                    new Date().toISOString()

            };

            const existingIndex =
                savedAssessments.findIndex(
                    function (item) {
                        return String(
                            item.eventId
                        ) ===
                        String(
                            eventId
                        );
                    }
                );

            if (existingIndex >= 0) {

                savedAssessments[
                    existingIndex
                ] = assessment;

            } else {

                savedAssessments.push(
                    assessment
                );

            }

            // Non-blocking toast — fires on every event save, so a
            // blocking modal here would get in the way of scoring the
            // next event quickly.
            Notify.toast(
                "✓ " + assessment.eventName + " — " + assessment.riskLevel
            );

            try {

                saveCanonicalRiskData();

            } catch (error) {

                console.error(
                    "Risk Assessment save error:",
                    error
                );

            }

            try {

                renderAssessmentStatus();

            } catch (error) {

                console.error(
                    "Risk Assessment status render error:",
                    error
                );

            }

            if (eventSelect) {
                eventSelect.value = "";
            }

            if (probabilityInput) {
                probabilityInput.value = "";
            }

            if (severityInput) {
                severityInput.value = "";
            }

            try {
                calculateAssessment();
            } catch (error) {
                console.warn(
                    "Assessment reset display error:",
                    error
                );
            }

        },
        false
    );

}


// =====================================================
// FINAL ANALYSIS
// =====================================================

const finishBtn =
    document.getElementById(
        "finishBtn"
    );

if (finishBtn) {

    finishBtn.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            const targets =
                getAssessmentTargets();

            const savedIds =
                new Set(
                    savedAssessments.map(
                        function (item) {
                            return String(
                                item.eventId
                            );
                        }
                    )
                );

            const missing =
                targets.filter(
                    function (target) {
                        return !savedIds.has(
                            String(
                                target.id
                            )
                        );
                    }
                );

            if (missing.length > 0) {

                Notify.warn(
                    `กรุณาประเมินอีก ${missing.length} Event(s) ที่เหลือก่อนสรุปผลการวิเคราะห์`,
                    `Please complete ${missing.length} remaining Event(s) before Final Analysis.`
                );

                return;

            }

            const completedAt =
                new Date().toISOString();

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

            if (!Array.isArray(records)) {
                records = [];
            }

            const completedAnalysis =
                {
                    ...currentAnalysis,
                    riskAssessments:
                        savedAssessments,
                    status:
                        "COMPLETED",
                    completedAt:
                        completedAt,
                    updatedAt:
                        completedAt
                };

            const index =
                records.findIndex(
                    function (record) {
                        return String(
                            record?.id
                        ) === String(
                            currentAnalysis?.id
                        );
                    }
                );

            if (index >= 0) {

                records[index] = {
                    ...records[index],
                    ...completedAnalysis
                };

            } else {

                records.unshift(
                    completedAnalysis
                );

            }

            localStorage.setItem(
                RECORDS_KEY,
                JSON.stringify(records)
            );

            sessionStorage.setItem(
                DATA_KEY,
                JSON.stringify(
                    completedAnalysis
                )
            );

            localStorage.setItem(
                DATA_KEY,
                JSON.stringify(
                    completedAnalysis
                )
            );

            const resultTarget =
                completedAnalysis?.id
                    ? "analysis-result.html?id=" +
                      encodeURIComponent(
                          completedAnalysis.id
                      )
                    : "analysis-result.html";

            window.location.assign(
                resultTarget
            );

        }
    );

}


// =====================================================
// BACK
// =====================================================

const backBtn =
    document.getElementById(
        "backBtn"
    );

if (backBtn) {

    backBtn.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            window.location.assign(
                "expert.html"
            );

        }
    );

}



// =====================================================
// REFRESH / CLEAR CURRENT EVENT
// =====================================================


function clearCurrentRiskEventInputs() {

    const eventSelectEl =
        document.getElementById(
            "eventSelect"
        );

    const probability =
        document.getElementById(
            "riskProbability"
        );

    const severity =
        document.getElementById(
            "riskSeverity"
        );

    const selectedEventId =
        eventSelectEl?.value || "";


    // -------------------------------------------------
    // 1. Clear current unsaved Likelihood / Severity.
    // -------------------------------------------------
    if (probability) {
        probability.value = "";
    }

    if (severity) {
        severity.value = "";
    }


    // -------------------------------------------------
    // 2. IMPORTANT:
    // If an Event was already saved, remove that Event's
    // saved Risk Assessment so the Summary changes from
    // e.g. 2/3 -> 1/3.
    // -------------------------------------------------
    if (
        selectedEventId &&
        selectedEventId !== "TOP_EVENT"
    ) {

        const before =
            savedAssessments.length;

        savedAssessments =
            savedAssessments.filter(
                function(item) {

                    return String(
                        item?.eventId ||
                        ""
                    ) !== String(
                        selectedEventId
                    );

                }
            );

        const removed =
            before !==
            savedAssessments.length;


        if (removed) {

            try {

                saveCanonicalRiskData();

            }
            catch (error) {

                console.error(
                    "Clear Event save error:",
                    error
                );

            }

        }

    }


    // -------------------------------------------------
    // 3. Clear current matrix selection.
    // -------------------------------------------------
    document
        .querySelectorAll(
            "#riskAssessmentMatrix .selected-risk"
        )
        .forEach(
            function(cell) {
                cell.classList.remove(
                    "selected-risk"
                );
            }
        );


    // -------------------------------------------------
    // 4. Reset selector so user can choose again.
    // -------------------------------------------------
    if (eventSelectEl) {
        eventSelectEl.value = "";
    }


    // -------------------------------------------------
    // 5. Recalculate UI + Summary immediately.
    // -------------------------------------------------
    try {

        calculateAssessment();

    }
    catch (error) {

        console.warn(
            "Clear Event recalculation warning:",
            error
        );

    }

    try {

        renderAssessmentStatus();

    }
    catch (error) {

        console.warn(
            "Clear Event status refresh warning:",
            error
        );

    }

    try {

        renderFinalAssessmentSummary();

    }
    catch (error) {

        console.warn(
            "Clear Event summary refresh warning:",
            error
        );

    }

}



function refreshCurrentRiskAssessment() {

    // Reload the exact current page / Analysis ID.
    // This intentionally does not erase the saved riskAssessments.
    const url =
        new URL(
            window.location.href
        );

    url.searchParams.set(
        "_refresh",
        Date.now().toString()
    );

    window.location.replace(
        url.toString()
    );

}



const clearRiskEventBtn =
    document.getElementById(
        "clearRiskEventBtn"
    );

if (clearRiskEventBtn) {

    clearRiskEventBtn.addEventListener(
        "click",
        function() {

            clearCurrentRiskEventInputs();

        }
    );

}


const refreshRiskAssessmentBtn =
    document.getElementById(
        "refreshRiskAssessmentBtn"
    );

if (refreshRiskAssessmentBtn) {

    refreshRiskAssessmentBtn.addEventListener(
        "click",
        function() {

            refreshCurrentRiskAssessment();

        }
    );

}


// Row action from the assessment table — pre-select that event in the
// scoring panel above and scroll it into view.
document.addEventListener("click", function (event) {
    const btn = event.target.closest(".select-assessment-target");
    if (!btn) return;

    const select = document.getElementById("eventSelect");
    if (!select) return;

    select.value = btn.dataset.id;
    select.dispatchEvent(new Event("change"));
    select.scrollIntoView({ behavior: "smooth", block: "center" });
});


// =====================================================
// INITIAL LOAD
// =====================================================

loadSavedAssessments();

loadEvents();

displayFTAProbability();

createMatrix();

renderAssessmentStatus();
renderFinalAssessmentSummary();
