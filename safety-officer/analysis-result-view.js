
// =====================================================
// SAFETY OFFICER — ANALYSIS RESULT VIEW ONLY
// =====================================================

const RECORDS_KEY = "ftaAnalysisRecords";

function readJSON(key) {

    try {

        const raw =
            localStorage.getItem(
                key
            );

        return raw
            ? JSON.parse(raw)
            : null;

    }
    catch (error) {

        console.warn(
            "Unable to read",
            key,
            error
        );

        return null;

    }

}

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// =====================================================
// SAFETY OFFICER — RISK MATRIX (Expert-sourced, read-only here)
//
// The old Weighted-Euclidean-Distance MCDM scoring
// (RI = sqrt(0.70*S^2 + 0.30*L^2), 6-tier band table,
// computeWeightedRiskIndex/getSoRiskBand/SO_RISK_BANDS/
// getSoRiskBandClass/getSoRiskBandTextClass/getSoRiskBandColor/
// buildWeightedRiskScoring) has been removed. Safety Officer no
// longer computes a second, independent risk score — the
// Expert's discrete FAA Risk Matrix result (likelihood, severity,
// riskIndex, riskLevel — via window.RiskMatrix, see risk-matrix.js)
// is the only Risk Index/Level shown on this page. Safety
// Officer's role here is to REVIEW that result and add Safety
// Mitigation, Risk Owner and Type of Hazard (see
// renderSafetyControls() below), not to re-score it.
// =====================================================

// Basic Events grouped by whether the Expert has saved a usable
// (likelihood + severity) assessment for them yet — used by the
// risk table's PENDING rows and the dashboard's "no assessment"
// KPI tile. Each scored item carries RiskMatrix.recomputeIfMissing's
// result so legacy records without a stored riskLevel still work.
function getScoredAndMissing(analysis) {

    const events =
        Array.isArray(analysis?.ftaData?.basicEvents)
            ? analysis.ftaData.basicEvents
            : [];

    const assessments =
        Array.isArray(analysis?.riskAssessments)
            ? analysis.riskAssessments
            : [];

    const riskMap =
        new Map(
            assessments.map(function(item) {
                return [String(item?.eventId || ""), item];
            })
        );

    const scored = [];
    const missing = [];

    events.forEach(function(event, index) {

        const eventId =
            String(event?.id || `E-${String(index + 1).padStart(2, "0")}`);

        const item = riskMap.get(eventId) || null;
        const name = item?.eventName || event?.name || `Basic Event ${index + 1}`;

        const computed =
            window.RiskMatrix ? RiskMatrix.recomputeIfMissing(item) : { available: false };

        if (!item || !computed.available) {
            missing.push({ eventId: eventId, name: name });
            return;
        }

        scored.push({
            eventId: eventId,
            name: name,
            likelihood: Number(item.likelihood),
            severity: Number(item.severity),
            riskIndex: computed.riskIndex,
            riskLevel: computed.riskLevel
        });

    });

    if (window.RiskMatrix) {
        scored.sort(RiskMatrix.compareByRisk);
    }

    return { scored: scored, missing: missing };

}



function loadRecord() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const requestedId =
        params.get("id");

    const records =
        readJSON(
            RECORDS_KEY
        );

    if (
        !Array.isArray(
            records
        ) ||
        records.length === 0
    ) {
        return null;
    }


    // 1. Exact Analysis ID, when supplied.
    if (requestedId) {

        const exact =
            records.find(
                function(record) {

                    return String(
                        record?.id ??
                        record?.analysisData?.id ??
                        ""
                    ) === String(
                        requestedId
                    );

                }
            );

        if (exact) {
            return normalizeViewerRecord(
                exact
            );
        }

    }


    // 2. No ID from Safety Officer Dashboard:
    // choose the latest Analysis with an Expert result.
    const completed =
        records
            .map(
                normalizeViewerRecord
            )
            .filter(
                function(record) {

                    return (
                        record &&
                        (
                            (
                                Array.isArray(
                                    record.riskAssessments
                                ) &&
                                record.riskAssessments.length > 0
                            ) ||
                            Boolean(
                                record.analysisResult
                            )
                        )
                    );

                }
            )
            .sort(
                function(a, b) {

                    const aTime =
                        new Date(
                            a.completedAt ||
                            a.updatedAt ||
                            a.createdAt ||
                            0
                        ).getTime();

                    const bTime =
                        new Date(
                            b.completedAt ||
                            b.updatedAt ||
                            b.createdAt ||
                            0
                        ).getTime();

                    return bTime - aTime;

                }
            );

    return completed[0] || null;

}


function normalizeViewerRecord(
    raw
) {

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

        status:
            source.status ||
            raw.status ||
            "COMPLETED",

        completedAt:
            source.completedAt ||
            raw.completedAt ||
            null,

        updatedAt:
            source.updatedAt ||
            raw.updatedAt ||
            null,

        createdAt:
            source.createdAt ||
            raw.createdAt ||
            null,

        analysisResult:
            source.analysisResult ||
            raw.analysisResult ||
            null,

        ftaData: {

            ...fta,

            basicEvents:
                Array.isArray(
                    fta.basicEvents
                )
                    ? fta.basicEvents
                    : []

        },

        riskAssessments:
            Array.isArray(
                source.riskAssessments
            )
                ? source.riskAssessments
                : (
                    Array.isArray(
                        raw.riskAssessments
                    )
                        ? raw.riskAssessments
                        : []
                )

    };

}




function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );

    if (element) {
        element.textContent =
            value ??
            "-";
    }

}


// Holds the currently-rendered record so EXPORT EXCEL can reuse
// exactly what is on screen without reloading from storage.
let currentViewRecord = null;


function render() {

    const analysis =
        loadRecord();

    if (!analysis) {

        Notify.error(
            "ไม่พบผลการวิเคราะห์นี้",
            "Analysis result was not found."
        ).then(function () {
            window.location.href =
                "analysis-history.html";
        });

        return;

    }

    currentViewRecord =
        analysis;

    // Mark this analysis as seen by Safety Officer, once. This is what
    // clears the "new result from Expert" notification badge (shell.js's
    // getPendingSoReviewRecords()) and the dashboard banner
    // (safety-officer.html) for this specific record — opening this page
    // for it is what counts as "reviewed", regardless of whether they
    // arrived via the notification or navigated here manually.
    if (analysis.status === "COMPLETED" && !analysis.soViewedAt) {
        analysis.soViewedAt = new Date().toISOString();
        saveSafetyControlsToRecords();
    }

    setText(
        "analysisTitle",
        analysis.analysisTitle ||
        "Untitled Analysis"
    );

    setText(
        "description",
        analysis.description ||
        "-"
    );

    setText(
        "topEvent",
        analysis.topEvent ||
        "-"
    );

    setText(
        "status",
        analysis.status ||
        "COMPLETED"
    );


    const events =
        analysis.ftaData.basicEvents;

    setText(
        "basicEventCount",
        String(
            events.length
        )
    );


    const result =
        analysis.analysisResult ||
        {};

    setText(
        "mainGate",
        result.gate ||
        result.mainGate ||
        analysis.ftaData.gate ||
        "OR"
    );


    const probability =
        Number(
            result.topEventProbability
        );

    setText(
        "ftaPercentage",
        Number.isFinite(
            probability
        )
            ? (
                probability * 100
            ).toFixed(4) + "%"
            : "-"
    );


    renderRisk(
        analysis
    );

    renderSafetyControls(
        analysis
    );

}


function renderRisk(
    analysis
) {

    const events =
        analysis.ftaData.basicEvents;

    const assessments =
        analysis.riskAssessments
            .filter(
                function(item) {

                    return (
                        item?.eventId &&
                        item.eventId !==
                            "TOP_EVENT"
                    );

                }
            );

    const map =
        new Map(
            assessments.map(
                function(item) {

                    return [
                        String(item.eventId),
                        item
                    ];

                }
            )
        );

    const total =
        events.length;

    const completed =
        events.filter(
            function(event, index) {

                const id =
                    String(
                        event?.id ||
                        `E-${String(index + 1).padStart(2, "0")}`
                    );

                return map.has(id);

            }
        ).length;


    const badge =
        document.getElementById(
            "riskCompletionBadge"
        );

    if (badge) {

        badge.textContent =
            `${completed} / ${total} EVENTS`;

        badge.className =
            completed === total && total > 0
                ? "px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                : "px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-xs font-bold text-amber-600 dark:text-amber-400";

    }


    const body =
        document.getElementById(
            "riskAssessmentTableBody"
        );

    if (body) {

        body.innerHTML = "";

        // Ranked HIGH -> MEDIUM -> LOW via RiskMatrix.compareByRisk.
        // Events with no (or an unrecomputable) assessment sort after
        // every ranked one, in their original order — RiskMatrix.
        // recomputeIfMissing() covers legacy records saved before this
        // page tracked riskLevel, so they still rank/display correctly
        // instead of silently dropping to "no data".
        const decorated =
            events.map(function(event, index) {

                const id =
                    String(event?.id || `E-${String(index + 1).padStart(2, "0")}`);

                const item = map.get(id) || null;

                const computed =
                    window.RiskMatrix ? RiskMatrix.recomputeIfMissing(item) : { available: false };

                return {
                    event: event,
                    index: index,
                    item: item,
                    riskIndex: computed.available ? computed.riskIndex : null,
                    riskLevel: computed.available ? computed.riskLevel : null,
                    available: computed.available
                };

            });

        decorated.sort(function(a, b) {
            if (a.available && b.available) {
                return window.RiskMatrix ? RiskMatrix.compareByRisk(a, b) : 0;
            }
            if (a.available && !b.available) return -1;
            if (!a.available && b.available) return 1;
            return 0;
        });

        decorated.forEach(
            function(entry, rankIndex) {

                const event = entry.event;
                const index = entry.index;
                const item = entry.item;
                const rank = String(rankIndex + 1).padStart(2, "0");

                const row =
                    document.createElement("tr");

                if (!entry.available) {

                    row.className =
                        "bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors";

                    row.innerHTML = `
                        <td class="px-4 py-4 text-xs text-jorpro-mute dark:text-jorpro-muteDark">${rank}</td>
                        <td class="px-4 py-4 text-sm font-semibold text-jorpro-ink dark:text-jorpro-inkDark">
                            ${escapeHtml(
                                event?.name ||
                                `Basic Event ${index + 1}`
                            )}
                        </td>

                        <td colspan="4"
                            class="px-4 py-4 text-xs font-semibold text-amber-600 dark:text-amber-400">
                            <span class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
                                <span class="w-1.5 h-1.5 rounded-full bg-amber-300"></span>
                                ${item ? "Risk assessment unavailable" : "PENDING — No Risk Assessment Saved"}
                            </span>
                        </td>
                    `;

                }
                else {

                    const level = entry.riskLevel;

                    const levelStyle =
                        window.RiskMatrix
                            ? RiskMatrix.getRiskLevelClass(level)
                            : "status-badge-slate";

                    // Very low-alpha row tint by risk level — already reads
                    // fine in both themes as-is (translucent overlay), no
                    // dark: variant needed except the transparent/canvas
                    // fallback, chained as dark:hover: so it only applies on
                    // hover (a bare dark:bg-jorpro-canvasDark would apply
                    // unconditionally in dark mode, not just on hover).
                    const rowTone =
                        level === "HIGH"
                            ? "bg-red-500/[0.025] hover:bg-red-500/[0.05]"
                            : level === "MEDIUM"
                                ? "bg-amber-500/[0.02] hover:bg-amber-500/[0.04]"
                                : level === "LOW"
                                    ? "bg-emerald-500/[0.02] hover:bg-emerald-500/[0.04]"
                                    : "bg-transparent hover:bg-jorpro-canvas dark:hover:bg-jorpro-canvasDark";

                    row.className =
                        `${rowTone} transition-colors`;

                    row.innerHTML = `
                        <td class="px-4 py-4 text-xs text-jorpro-mute dark:text-jorpro-muteDark">${rank}</td>
                        <td class="px-4 py-4 text-sm font-semibold text-jorpro-ink dark:text-jorpro-inkDark">
                            ${escapeHtml(
                                event?.name ||
                                `Basic Event ${index + 1}`
                            )}
                        </td>

                        <td class="px-4 py-4 text-xs text-jorpro-slate dark:text-jorpro-slateDark">
                            <span class="inline-flex px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 font-semibold">
                                ${escapeHtml(
                                    `${item.likelihood ?? "-"} - ${item.likelihoodName || ""}`
                                )}
                            </span>
                        </td>

                        <td class="px-4 py-4 text-xs text-jorpro-slate dark:text-jorpro-slateDark">
                            <span class="inline-flex px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 font-semibold">
                                ${escapeHtml(
                                    `${item.severityCode || ""} - ${item.severityName || ""}`
                                )}
                            </span>
                        </td>

                        <td class="px-4 py-4 text-sm font-black">
                            <span class="inline-flex min-w-[46px] justify-center px-2.5 py-1 rounded-lg bg-jorpro-blue/10 dark:bg-jorpro-blueDark/10 border border-jorpro-blue/20 dark:border-jorpro-blueDark/30 text-jorpro-blueBright dark:text-jorpro-blueBrightDark">
                                ${escapeHtml(entry.riskIndex || "-")}
                            </span>
                        </td>

                        <td class="px-4 py-4 text-xs font-black">
                            <span class="status-badge ${levelStyle}">
                                ${escapeHtml(level || "-")}
                            </span>
                        </td>
                    `;

                }

                body.appendChild(row);

            }
        );

    }


    const priorities = {
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1
    };

    let highest = "-";

    assessments.forEach(
        function(item) {

            if (
                (priorities[item.riskLevel] || 0) >
                (priorities[highest] || 0)
            ) {

                highest =
                    item.riskLevel;

            }

        }
    );

    const highestRiskEl =
        document.getElementById(
            "highestRiskLevel"
        );

    if (highestRiskEl) {

        highestRiskEl.textContent =
            highest;

        highestRiskEl.className =
            "text-lg font-black block mt-1 " +
            (
                highest === "HIGH"
                    ? "text-jorpro-red dark:text-jorpro-redDark"
                    : highest === "MEDIUM"
                        ? "text-amber-600 dark:text-amber-400"
                        : highest === "LOW"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-jorpro-slate dark:text-jorpro-slateDark"
            );

    }


    // These now reflect the Expert's Initial Risk Level only.
    // Acceptability is decided later by the Safety Officer.
    const mitigationCount =
        assessments.filter(
            function(item) {

                return (
                    item.riskLevel === "HIGH" ||
                    item.riskLevel === "MEDIUM"
                );

            }
        ).length;

    const mitigationEl =
        document.getElementById(
            "mitigationEventCount"
        );

    if (mitigationEl) {

        mitigationEl.textContent =
            String(mitigationCount);

        mitigationEl.className =
            "text-lg font-black block mt-1 " +
            (
                mitigationCount > 0
                    ? "text-jorpro-red dark:text-jorpro-redDark"
                    : "text-emerald-600 dark:text-emerald-400"
            );

    }


    const overall =
        assessments.some(
            function(item) {

                return item.riskLevel === "HIGH";

            }
        )
            ? "HIGH RISK"
            : (
                completed === total &&
                total > 0
            )
                ? (
                    assessments.some(
                        function(item) {
                            return item.riskLevel ===
                                "MEDIUM";
                        }
                    )
                        ? "MEDIUM RISK"
                        : "LOW RISK"
                )
                : "IN PROGRESS";

    const overallEl =
        document.getElementById(
            "overallAcceptability"
        );

    if (overallEl) {

        overallEl.textContent =
            overall;

        overallEl.className =
            "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-black mt-1 border " +
            (
                overall === "HIGH RISK"
                    ? "bg-jorpro-redDim dark:bg-jorpro-redDimDark border-jorpro-red/25 dark:border-jorpro-redDark/30 text-jorpro-red dark:text-jorpro-redDark"
                    : overall === "MEDIUM RISK"
                        ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400"
                        : overall === "LOW RISK"
                            ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                            : "bg-jorpro-canvas dark:bg-jorpro-canvasDark border-jorpro-line dark:border-jorpro-lineDark text-jorpro-slate dark:text-jorpro-slateDark"
            );

    }

}


// Finds this Basic Event's entry in analysis.riskAssessments (created by
// the Expert), or creates a minimal placeholder if the Expert hasn't
// assessed it yet — Safety Officer must still be able to record
// Mitigation/Owner/Hazard even for an event with no risk data (§22:
// don't block/crash on missing data).
function findOrCreateAssessment(analysis, eventId, eventName) {

    if (!Array.isArray(analysis.riskAssessments)) {
        analysis.riskAssessments = [];
    }

    let entry =
        analysis.riskAssessments.find(function(item) {
            return String(item?.eventId) === String(eventId);
        });

    if (!entry) {
        entry = { eventId: String(eventId), eventName: eventName };
        analysis.riskAssessments.push(entry);
    }

    return entry;

}


// Debounced persistence for Safety-Officer-entered fields — mirrors the
// live-save pattern already used on fta-workspace.js. Writes the whole
// updated record back into ftaAnalysisRecords (matched by id) plus the
// same ftaAnalysisData mirror the rest of the app keeps in sync.
let __soSaveTimer = null;

function updateSafetyControlsStatus(message, isSaved) {

    const el = document.getElementById("safetyControlsSavedBadge");
    if (!el) return;

    el.textContent = isSaved ? "● SAVED" : `● ${message}`;
    el.className =
        "px-3 py-2 rounded-xl border text-[10px] font-bold " +
        (
            isSaved
                ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "bg-jorpro-canvas dark:bg-jorpro-canvasDark border-jorpro-line dark:border-jorpro-lineDark text-jorpro-mute dark:text-jorpro-muteDark"
        );

}

function saveSafetyControlsToRecords() {

    if (!currentViewRecord?.id) return;

    let records = [];
    try {
        records = JSON.parse(localStorage.getItem(RECORDS_KEY)) || [];
    } catch (error) {
        records = [];
    }
    if (!Array.isArray(records)) records = [];

    const index =
        records.findIndex(function(record) {
            return String(record?.id) === String(currentViewRecord.id);
        });

    const updated = { ...currentViewRecord, updatedAt: new Date().toISOString() };

    if (index >= 0) {
        records[index] = { ...records[index], ...updated };
    } else {
        records.unshift(updated);
    }

    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));

    // Same "current working copy" mirror the rest of the app keeps —
    // harmless to update even though this page never wrote it before.
    try {
        sessionStorage.setItem("ftaAnalysisData", JSON.stringify(updated));
        localStorage.setItem("ftaAnalysisData", JSON.stringify(updated));
    } catch (error) {
        // Non-fatal — the canonical ftaAnalysisRecords write above already succeeded.
    }

}

function updateSafetyControlField(analysis, eventId, eventName, field, value) {

    const entry = findOrCreateAssessment(analysis, eventId, eventName);
    entry[field] = value;

    updateSafetyControlsStatus("SAVING...", false);

    window.clearTimeout(__soSaveTimer);
    __soSaveTimer = window.setTimeout(function() {
        saveSafetyControlsToRecords();
        updateSafetyControlsStatus("SAVED", true);
    }, 250);

}


function renderSafetyControls(
    analysis
) {

    const container =
        document.getElementById(
            "safetyControlsByEvent"
        );

    if (!container) {
        return;
    }

    const events =
        analysis.ftaData.basicEvents;

    container.innerHTML =
        "";

    events.forEach(
        function(
            event,
            index
        ) {

            const eventId =
                event?.id ||
                `E-${String(
                    index + 1
                ).padStart(
                    2,
                    "0"
                )}`;

            const eventName =
                event?.name ||
                `Basic Event ${index + 1}`;

            const existingRiskControl =
                event?.existingRiskControl ||
                event?.riskControl ||
                event?.existing_risk_control ||
                "-";

            const assessment =
                analysis.riskAssessments.find(function(item) {
                    return String(item?.eventId) === String(eventId);
                }) || null;

            // Legacy compat: older records saved these two on the Basic
            // Event itself (before Mitigation/Owner moved to this page) —
            // pre-fill from there once if this event's riskAssessments
            // entry doesn't already have a value, without touching the
            // old field.
            const safetyMitigation =
                assessment?.safetyMitigation ??
                event?.safetyMitigation ??
                event?.safetyOfficerMitigation ??
                "";

            const riskOwner =
                assessment?.riskOwner ??
                event?.riskOwner ??
                "";

            const typeOfHazard =
                assessment?.typeOfHazard ??
                "";

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "rounded-xl border border-jorpro-line dark:border-jorpro-lineDark bg-jorpro-canvas dark:bg-jorpro-canvasDark p-4";

            card.innerHTML = `
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">

                    <div>
                        <div class="text-[10px] font-bold tracking-widest text-jorpro-blue dark:text-jorpro-blueDark">
                            ${escapeHtml(eventId)}
                        </div>

                        <div class="text-sm font-bold text-jorpro-ink dark:text-jorpro-inkDark mt-1">
                            ${escapeHtml(eventName)}
                        </div>
                    </div>

                    <span class="text-[9px] font-bold tracking-widest uppercase text-jorpro-blue dark:text-jorpro-blueDark">
                        SAFETY OFFICER REVIEW
                    </span>

                </div>

                <div class="rounded-lg border border-jorpro-line dark:border-jorpro-lineDark bg-white dark:bg-jorpro-surfaceDark p-3 mb-3">
                    <div class="text-[9px] font-bold tracking-widest text-jorpro-mute dark:text-jorpro-muteDark uppercase">
                        Existing Risk Control
                    </div>
                    <div class="text-xs text-jorpro-slate dark:text-jorpro-slateDark mt-2 whitespace-pre-line break-words">
                        ${escapeHtml(existingRiskControl)}
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">

                    <div class="ui-field" style="margin-bottom:0;">
                        <label class="ui-label">Safety Mitigation (Identify)</label>
                        <textarea class="ui-textarea so-mitigation-input" data-event-id="${escapeHtml(eventId)}" rows="3"
                                  placeholder="Safety mitigation">${escapeHtml(safetyMitigation)}</textarea>
                    </div>

                    <div class="ui-field" style="margin-bottom:0;">
                        <label class="ui-label">Risk Owner</label>
                        <input type="text" class="ui-input so-owner-input" data-event-id="${escapeHtml(eventId)}"
                               value="${escapeHtml(riskOwner)}" placeholder="Risk owner">
                    </div>

                    <div class="ui-field" style="margin-bottom:0;">
                        <label class="ui-label">Type of Hazard</label>
                        <input type="text" class="ui-input so-hazard-input" data-event-id="${escapeHtml(eventId)}"
                               value="${escapeHtml(typeOfHazard)}" placeholder="Type of hazard">
                    </div>

                </div>
            `;

            container.appendChild(
                card
            );

        }
    );

}

// Live-save the three Safety-Officer-editable fields — delegated to the
// container (rebuilt on every render()) rather than bound per-input.
document.addEventListener("input", function(event) {

    const el = event.target;
    const eventId = el.dataset ? el.dataset.eventId : null;
    if (!eventId || !currentViewRecord) return;

    const eventName =
        (currentViewRecord.ftaData.basicEvents.find(function(e) {
            return String(e?.id) === String(eventId);
        }) || {}).name || eventId;

    if (el.matches(".so-mitigation-input")) {
        updateSafetyControlField(currentViewRecord, eventId, eventName, "safetyMitigation", el.value);
    } else if (el.matches(".so-owner-input")) {
        updateSafetyControlField(currentViewRecord, eventId, eventName, "riskOwner", el.value);
    } else if (el.matches(".so-hazard-input")) {
        updateSafetyControlField(currentViewRecord, eventId, eventName, "typeOfHazard", el.value);
    }

});


document
    .getElementById(
        "backBtn"
    )
    .addEventListener(
        "click",
        function() {

            window.location.href =
                "safety-officer.html";

        }
    );


// =====================================================
// EXPORT TO EXCEL — "HAZARD IDENTIFICATION AND RISK ASSESSMENT
// WORK SHEET", one row per Basic Event, plus a reference
// "Risk Matrix" sheet. Built with ExcelJS (see the <script> tag
// in analysis-result-view.html for why, over the already-present
// SheetJS CDN).
//
// Consequence / Residual Risk (Probability, Severity, Risk
// Level/Index) / Next Review have no backing field anywhere in
// this app yet — those columns are always left blank rather than
// guessed at (§21/§27.3/§27.8: never fabricate data). If those
// fields are added to the data model later, this function already
// has a place to read them from (see the comments at each one).
// =====================================================

const EXCEL_RISK_FILL = {
    HIGH:   { argb: "FFFF0000" }, // red
    MEDIUM: { argb: "FFFFC000" }, // amber/yellow
    LOW:    { argb: "FF92D050" }  // green
};

const EXCEL_RISK_FONT_COLOR = {
    HIGH:   { argb: "FFFFFFFF" }, // white text on red
    MEDIUM: { argb: "FF000000" },
    LOW:    { argb: "FF000000" }
};

// Same event decoration + HIGH->MEDIUM->LOW ranking renderRisk() uses on
// screen (including RiskMatrix.recomputeIfMissing() for legacy records),
// rebuilt here so the exported "No." order and Risk Level/Color always
// match what's currently on screen (§27.8).
function buildHazardAssessmentRows(analysis) {

    if (!analysis) return [];

    const events =
        Array.isArray(analysis.ftaData?.basicEvents)
            ? analysis.ftaData.basicEvents
            : [];

    const assessments =
        Array.isArray(analysis.riskAssessments)
            ? analysis.riskAssessments
            : [];

    const map =
        new Map(
            assessments.map(function(item) {
                return [String(item?.eventId || ""), item];
            })
        );

    const decorated =
        events.map(function(event, index) {

            const eventId =
                String(event?.id || `E-${String(index + 1).padStart(2, "0")}`);

            const item = map.get(eventId) || null;

            const computed =
                window.RiskMatrix ? RiskMatrix.recomputeIfMissing(item) : { available: false };

            return {
                event: event,
                item: item,
                index: index,
                available: computed.available,
                riskIndex: computed.available ? computed.riskIndex : null,
                riskLevel: computed.available ? computed.riskLevel : null
            };

        });

    decorated.sort(function(a, b) {
        if (a.available && b.available) {
            return window.RiskMatrix ? RiskMatrix.compareByRisk(a, b) : 0;
        }
        if (a.available && !b.available) return -1;
        if (!a.available && b.available) return 1;
        return 0;
    });

    return decorated.map(function(entry, rankIndex) {

        const event = entry.event;
        const item = entry.item;

        return {
            no: rankIndex + 1,

            hazardIdentification:
                item?.eventName || event?.name || `Basic Event ${entry.index + 1}`,

            // No "Consequence" field exists anywhere in the data model —
            // left blank on purpose (see the note above the fill colors).
            consequence: "",

            typeOfHazard: item?.typeOfHazard || "",

            existingRiskControl:
                event?.existingRiskControl ||
                event?.riskControl ||
                event?.existing_risk_control ||
                "",

            initialProbability: entry.available ? (item.likelihood ?? "") : "",
            initialSeverity: entry.available ? (item.severityCode || "") : "",
            initialRiskIndex: entry.available ? entry.riskIndex : "",
            initialRiskLevel: entry.available ? entry.riskLevel : "",

            safetyMitigation: item?.safetyMitigation || "",
            riskOwner: item?.riskOwner || "",

            // Residual Risk isn't assessed anywhere in the app yet —
            // left blank (§27.3: "ห้ามคำนวณหรือสร้างค่าปลอม").
            residualProbability: "",
            residualSeverity: "",
            residualRiskIndex: "",
            residualRiskLevel: "",

            // No "Next Review" field exists anywhere in the data model —
            // left blank.
            nextReview: ""
        };

    });

}

function sanitizeFilenamePart(value, fallback) {
    const cleaned =
        String(value || "")
            .replace(/[\\/:*?"<>|]+/g, "_")
            .replace(/\s+/g, "_")
            .replace(/_+/g, "_")
            .replace(/(^_+|_+$)/g, "")
            .slice(0, 60);
    return cleaned || fallback;
}

function formatExcelDate(value) {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    const pad = function(n) { return String(n).padStart(2, "0"); };
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function buildHazardWorkbook(analysis) {

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "JorproA — FTA TOOLS (ICAO)";
    workbook.created = new Date();

    const rows = buildHazardAssessmentRows(analysis);

    // ---------------------------------------------------
    // Sheet 1 — "Risk Assessment"
    // ---------------------------------------------------
    const sheet = workbook.addWorksheet("Risk Assessment", {
        views: [{ state: "frozen", ySplit: 6 }] // freeze through the header row
    });

    const columns = [
        { header: "No.", width: 6 },
        { header: "Hazard Identification", width: 28 },
        { header: "Consequence", width: 22 },
        { header: "Type of Hazard", width: 18 },
        { header: "Existing Risk Control (Identify)", width: 28 },
        { header: "Initial Risk\nProbability", width: 12 },
        { header: "Initial Risk\nSeverity", width: 12 },
        { header: "Initial Risk\nRisk Level / Risk Index", width: 16 },
        { header: "Safety Mitigation (Identify)", width: 28 },
        { header: "Risk Owner", width: 18 },
        { header: "Residual Risk\nProbability", width: 12 },
        { header: "Residual Risk\nSeverity", width: 12 },
        { header: "Residual Risk\nRisk Level / Risk Index", width: 16 },
        { header: "Next Review", width: 16 }
    ];

    sheet.columns = columns.map(function(c) { return { width: c.width }; });

    // --- Title block (rows 1-4, merged across all 14 columns) ---
    const lastColLetter = sheet.getColumn(columns.length).letter;

    sheet.mergeCells(`A1:${lastColLetter}1`);
    sheet.getCell("A1").value = "HAZARD IDENTIFICATION AND RISK ASSESSMENT WORK SHEET";
    sheet.getCell("A1").font = { bold: true, size: 14 };
    sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };

    sheet.mergeCells(`A2:${lastColLetter}2`);
    sheet.getCell("A2").value =
        `Title of Risk Assessment: ${analysis?.analysisTitle || "-"}`;
    sheet.getCell("A2").font = { bold: true };

    sheet.mergeCells(`A3:${lastColLetter}3`);
    sheet.getCell("A3").value =
        `Date: ${formatExcelDate(analysis?.completedAt || analysis?.analysisDate || analysis?.createdAt) || "-"}`;

    sheet.mergeCells(`A4:${lastColLetter}4`);
    // Only real, already-tracked names go here (Safety Officer's) — this
    // app doesn't record a specific Expert's name anywhere, so it's never
    // invented (§27.1: pull from real Analysis data, never hard-code).
    sheet.getCell("A4").value =
        `Risk Assessment Participants: ${analysis?.officerName || "-"}`;

    sheet.getRow(5).height = 6; // thin spacer row

    // --- Header row (row 6) ---
    const headerRowNumber = 6;
    const headerRow = sheet.getRow(headerRowNumber);
    headerRow.values = columns.map(function(c) { return c.header; });
    headerRow.eachCell(function(cell) {
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.border = {
            top: { style: "thin" }, left: { style: "thin" },
            bottom: { style: "thin" }, right: { style: "thin" }
        };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    });
    headerRow.height = 30;

    // --- Data rows ---
    rows.forEach(function(r) {

        const row = sheet.addRow([
            r.no,
            r.hazardIdentification,
            r.consequence,
            r.typeOfHazard,
            r.existingRiskControl,
            r.initialProbability,
            r.initialSeverity,
            r.initialRiskIndex,
            r.safetyMitigation,
            r.riskOwner,
            r.residualProbability,
            r.residualSeverity,
            r.residualRiskIndex,
            r.nextReview
        ]);

        row.eachCell({ includeEmpty: true }, function(cell, colNumber) {
            cell.border = {
                top: { style: "thin" }, left: { style: "thin" },
                bottom: { style: "thin" }, right: { style: "thin" }
            };
            cell.alignment = { vertical: "top", wrapText: true };
            // Long free-text columns read better left-aligned; short
            // coded columns (No./Probability/Severity/Risk Level) read
            // better centered.
            if ([1, 6, 7, 8].indexOf(colNumber) !== -1) {
                cell.alignment.horizontal = "center";
            }
        });

        // Color the Initial Risk Level/Index cell (col 8) by HIGH/MEDIUM/LOW
        // — the one place §27.4 requires a risk color, "ไม่ต้องใช้สีอื่นแทน".
        if (r.initialRiskLevel && EXCEL_RISK_FILL[r.initialRiskLevel]) {
            const cell = row.getCell(8);
            cell.fill = { type: "pattern", pattern: "solid", fgColor: EXCEL_RISK_FILL[r.initialRiskLevel] };
            cell.font = { bold: true, color: EXCEL_RISK_FONT_COLOR[r.initialRiskLevel] };
        }

    });

    // ---------------------------------------------------
    // Sheet 2 — "Risk Matrix" (static ICAO reference table, computed
    // live from window.RiskMatrix so it can never drift from the actual
    // logic the app uses — not a separately hand-typed copy).
    // ---------------------------------------------------
    const matrixSheet = workbook.addWorksheet("Risk Matrix");
    matrixSheet.columns = [{ width: 12 }, { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 }];

    matrixSheet.mergeCells("A1:F1");
    matrixSheet.getCell("A1").value = "FAA RISK MATRIX (Likelihood x Severity)";
    matrixSheet.getCell("A1").font = { bold: true, size: 13 };
    matrixSheet.getCell("A1").alignment = { horizontal: "center" };

    const severityCols = ["A", "B", "C", "D", "E"];
    const matrixHeaderRow = matrixSheet.getRow(3);
    matrixHeaderRow.values = ["Likelihood"].concat(severityCols);
    matrixHeaderRow.eachCell(function(cell) {
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center" };
        cell.border = {
            top: { style: "thin" }, left: { style: "thin" },
            bottom: { style: "thin" }, right: { style: "thin" }
        };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    });

    if (window.RiskMatrix) {
        [5, 4, 3, 2, 1].forEach(function(likelihood, i) {

            const row = matrixSheet.getRow(4 + i);
            row.getCell(1).value = likelihood;
            row.getCell(1).font = { bold: true };
            row.getCell(1).alignment = { horizontal: "center" };

            [5, 4, 3, 2, 1].forEach(function(severityValue, j) {

                const level = RiskMatrix.getRiskLevel(likelihood, severityValue);
                const index = RiskMatrix.getRiskIndex(likelihood, severityValue);
                const cell = row.getCell(2 + j);

                cell.value = index;
                cell.alignment = { horizontal: "center" };
                cell.border = {
                    top: { style: "thin" }, left: { style: "thin" },
                    bottom: { style: "thin" }, right: { style: "thin" }
                };

                if (level && EXCEL_RISK_FILL[level]) {
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: EXCEL_RISK_FILL[level] };
                    cell.font = { bold: true, color: EXCEL_RISK_FONT_COLOR[level] };
                }

            });

        });
    }

    return workbook;

}

const exportExcelBtn =
    document.getElementById(
        "exportExcelBtn"
    );

if (exportExcelBtn) {

    exportExcelBtn.addEventListener(
        "click",
        async function() {

            if (typeof ExcelJS === "undefined") {

                Notify.error(
                    "ไม่สามารถโหลดไลบรารี Excel ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่"
                );

                return;

            }

            if (!currentViewRecord) {

                Notify.error(
                    "ไม่พบผลการวิเคราะห์ให้ Export"
                );

                return;

            }

            const hasBasicEvents =
                Array.isArray(currentViewRecord.ftaData?.basicEvents) &&
                currentViewRecord.ftaData.basicEvents.length > 0;

            if (!hasBasicEvents) {

                Notify.error(
                    "ไม่มีข้อมูล Basic Events ให้ Export"
                );

                return;

            }

            try {

                const workbook = await buildHazardWorkbook(currentViewRecord);
                const buffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob([buffer], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                });

                const stamp = formatExcelDate(new Date());
                const safeTitle = sanitizeFilenamePart(currentViewRecord.analysisTitle, "Analysis");
                const filename = `FTA_Risk_Assessment_${safeTitle}_${stamp}.xlsx`;

                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

            } catch (error) {

                console.error("Excel export failed:", error);

                Notify.error(
                    "ไม่สามารถสร้างไฟล์ Excel ได้ กรุณาลองใหม่อีกครั้ง"
                );

            }

        }
    );

}


// =====================================================
// RISK DASHBOARD — Chart.js visual summary (doughnut / bubble),
// built from the same getScoredAndMissing() data as the risk
// table and the Excel export, so all three always agree.
// =====================================================

let dashboardDoughnutChart = null;
let dashboardScatterChart = null;


function destroyDashboardCharts() {

    [
        dashboardDoughnutChart,
        dashboardScatterChart
    ].forEach(
        function(chart) {

            if (chart) {
                chart.destroy();
            }

        }
    );

    dashboardDoughnutChart = null;
    dashboardScatterChart = null;

}


function renderDashboardCharts(
    analysis
) {

    setText(
        "dashboardAnalysisTitle",
        analysis?.analysisTitle ||
        "Untitled Analysis"
    );

    const result =
        getScoredAndMissing(
            analysis
        );

    const scored =
        result.scored;

    const emptyState =
        document.getElementById(
            "dashboardEmptyState"
        );

    destroyDashboardCharts();

    if (!scored.length) {

        if (emptyState) {
            emptyState.classList.remove(
                "hidden"
            );
        }

        [
            "kpiScoredCount",
            "kpiHighestRisk",
            "kpiHighCount",
            "kpiAvgRi"
        ].forEach(
            function(id) {
                setText(id, "-");
            }
        );

        return;

    }

    if (emptyState) {
        emptyState.classList.add(
            "hidden"
        );
    }

    // Chart.js bakes plain color strings into its config at creation
    // time — read theme.css's current tokens live (not cached) so
    // grid lines / borders / legend text match whichever theme is
    // active right now, in sync with RiskMatrix.getRiskColorVar().
    const chartTheme =
        getComputedStyle(
            document.documentElement
        );

    const themeGrid =
        chartTheme.getPropertyValue("--border").trim();

    const themeSurface =
        chartTheme.getPropertyValue("--surface").trim();

    const themeInk =
        chartTheme.getPropertyValue("--ink").trim();

    const themeMuted =
        chartTheme.getPropertyValue("--muted").trim();

    if (
        typeof Chart ===
        "undefined"
    ) {

        if (emptyState) {

            emptyState.classList.remove(
                "hidden"
            );

            emptyState.textContent =
                "ไม่สามารถโหลดไลบรารีกราฟ (Chart.js) ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่";

        }

        return;

    }


    // -------------------------------------------------
    // KPIs
    // -------------------------------------------------

    let highestLevel =
        null;

    scored.forEach(
        function(item) {

            if (
                !window.RiskMatrix
            ) {
                return;
            }

            if (
                !highestLevel ||
                RiskMatrix.compareByRisk(item, { riskLevel: highestLevel }) < 0
            ) {

                highestLevel =
                    item.riskLevel;

            }

        }
    );

    const highCount =
        scored.filter(
            function(item) {
                return item.riskLevel === "HIGH";
            }
        ).length;

    setText(
        "kpiScoredCount",
        `${scored.length} / ${analysis?.ftaData?.basicEvents?.length || scored.length}`
    );

    setText(
        "kpiHighestRisk",
        highestLevel ||
        "-"
    );

    setText(
        "kpiHighCount",
        String(highCount)
    );

    setText(
        "kpiAvgRi",
        String(result.missing.length)
    );


    // -------------------------------------------------
    // Doughnut chart — count of Events per Risk Level
    // (HIGH / MEDIUM / LOW, via RiskMatrix — no more 6-tier
    // weighted band).
    // -------------------------------------------------

    const doughnutCanvas =
        document.getElementById(
            "dashboardDoughnutChart"
        );

    if (doughnutCanvas && window.RiskMatrix) {

        const levelOrder =
            ["HIGH", "MEDIUM", "LOW"];

        const counts =
            levelOrder.map(
                function(level) {

                    return scored.filter(
                        function(item) {
                            return item.riskLevel === level;
                        }
                    ).length;

                }
            );

        // Drop levels with zero Events so the legend stays clean.
        const filteredLabels = [];
        const filteredCounts = [];
        const filteredColors = [];

        levelOrder.forEach(
            function(level, index) {

                if (counts[index] > 0) {

                    filteredLabels.push(level);
                    filteredCounts.push(counts[index]);
                    filteredColors.push(RiskMatrix.getRiskColorVar(level));

                }

            }
        );

        dashboardDoughnutChart = new Chart(
            doughnutCanvas,
            {
                type: "doughnut",
                data: {
                    labels: filteredLabels,
                    datasets: [{
                        data: filteredCounts,
                        backgroundColor: filteredColors,
                        borderColor: themeSurface,
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "62%",
                    plugins: {
                        legend: {
                            position: "bottom",
                            labels: { boxWidth: 10, font: { size: 10 }, color: themeInk }
                        }
                    }
                }
            }
        );

    }


    // -------------------------------------------------
    // Bubble chart — Likelihood (x) vs Severity (y). Radius is
    // fixed per risk level (not a continuous score — Risk Index
    // is now a matrix cell like "5A", not a number) so higher-risk
    // points still stand out visually.
    // -------------------------------------------------

    const scatterCanvas =
        document.getElementById(
            "dashboardScatterChart"
        );

    const bubbleRadius = { HIGH: 14, MEDIUM: 10, LOW: 7 };

    if (scatterCanvas && window.RiskMatrix) {

        dashboardScatterChart = new Chart(
            scatterCanvas,
            {
                type: "bubble",
                data: {
                    datasets: [{
                        label: "Basic Events",
                        data: scored.map(
                            function(item) {

                                return {
                                    x: item.likelihood,
                                    y: item.severity,
                                    r: bubbleRadius[item.riskLevel] || 8,
                                    name: item.name,
                                    riskIndex: item.riskIndex,
                                    riskLevel: item.riskLevel
                                };

                            }
                        ),
                        backgroundColor: scored.map(
                            function(item) {

                                return RiskMatrix.getRiskColorVar(item.riskLevel) + "B3";

                            }
                        ),
                        borderColor: scored.map(
                            function(item) {

                                return RiskMatrix.getRiskColorVar(item.riskLevel);

                            }
                        ),
                        borderWidth: 1.5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            min: 0,
                            max: 6,
                            ticks: { stepSize: 1, color: themeMuted },
                            grid: { color: themeGrid },
                            title: { display: true, text: "Likelihood (L)", color: themeInk }
                        },
                        y: {
                            min: 0,
                            max: 6,
                            ticks: { stepSize: 1, color: themeMuted },
                            grid: { color: themeGrid },
                            title: { display: true, text: "Severity (S)", color: themeInk }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {

                                    const raw =
                                        context.raw;

                                    return [
                                        raw.name,
                                        `L=${raw.x}  S=${raw.y}  Risk Index=${raw.riskIndex}`,
                                        raw.riskLevel || ""
                                    ];

                                }
                            }
                        }
                    }
                }
            }
        );

    }

}


function openDashboard() {

    const modal =
        document.getElementById(
            "dashboardModal"
        );

    if (!modal) {
        return;
    }

    renderDashboardCharts(
        currentViewRecord
    );

    modal.classList.remove(
        "hidden"
    );

    document.body.style.overflow =
        "hidden";

}


function closeDashboard() {

    const modal =
        document.getElementById(
            "dashboardModal"
        );

    if (!modal) {
        return;
    }

    modal.classList.add(
        "hidden"
    );

    document.body.style.overflow =
        "";

}


const dashboardBtn =
    document.getElementById(
        "dashboardBtn"
    );

if (dashboardBtn) {

    dashboardBtn.addEventListener(
        "click",
        openDashboard
    );

}


const dashboardCloseBtn =
    document.getElementById(
        "dashboardCloseBtn"
    );

if (dashboardCloseBtn) {

    dashboardCloseBtn.addEventListener(
        "click",
        closeDashboard
    );

}


const dashboardModalEl =
    document.getElementById(
        "dashboardModal"
    );

if (dashboardModalEl) {

    // Click on the dim backdrop (not the card itself) closes it.
    dashboardModalEl.addEventListener(
        "click",
        function(event) {

            if (event.target === dashboardModalEl) {
                closeDashboard();
            }

        }
    );

}


document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape" &&
            dashboardModalEl &&
            !dashboardModalEl.classList.contains("hidden")
        ) {

            closeDashboard();

        }

    }
);


// The dashboard's charts bake resolved var(--x) hex colors into their
// Chart.js datasets at creation time, so an already-open chart won't
// recolor itself just because [data-theme] changed. Redraw it when
// the toggle fires, but only if the dashboard is actually open.
document.addEventListener(
    "themechange",
    function() {

        if (
            dashboardModalEl &&
            !dashboardModalEl.classList.contains("hidden") &&
            currentViewRecord
        ) {

            renderDashboardCharts(
                currentViewRecord
            );

        }

    }
);


render();
