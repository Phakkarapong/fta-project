
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
// SAFETY OFFICER — WEIGHTED EUCLIDEAN RISK SCORING
//
// RI = sqrt( SEVERITY_WEIGHT * S^2 + LIKELIHOOD_WEIGHT * L^2 )
//
// L and S are taken exactly as scored by the Expert (never
// re-derived or changed here). This is the criteria the Safety
// Officer provided for scoring on this page — a proposed FTA
// Tools banding, not an ICAO standard.
// =====================================================

const SO_SEVERITY_WEIGHT = 0.70;
const SO_LIKELIHOOD_WEIGHT = 0.30;

// Ordered highest RI band first.
const SO_RISK_BANDS = [
    { min: 4.41, max: 5.00, level: "Critical Risk", code: 5,
      action: "ต้องหยุด/ระงับหรือแก้ไขความเสี่ยงทันที ก่อนดำเนินการต่อ" },
    { min: 3.80, max: 4.40, level: "Very High Risk", code: 4,
      action: "ต้องดำเนินมาตรการลดความเสี่ยงโดยเร่งด่วน" },
    { min: 3.21, max: 3.79, level: "High Risk", code: 3,
      action: "ต้องมีมาตรการควบคุมและติดตามอย่างเหมาะสม" },
    { min: 2.61, max: 3.20, level: "Moderate Risk", code: 2,
      action: "ยอมรับได้ภายใต้การควบคุมและควรพิจารณาปรับปรุงมาตรการ" },
    { min: 2.01, max: 2.60, level: "Acceptable (Low Risk)", code: 1,
      action: "ยอมรับได้และติดตามตามความเหมาะสม" },
    { min: 1.41, max: 2.00, level: "No Special Risk", code: 0,
      action: "ไม่มีความเสี่ยงพิเศษ ไม่จำเป็นต้องมีมาตรการเพิ่มเติมนอกเหนือจากการควบคุมปกติ" }
];


function computeWeightedRiskIndex(likelihood, severity) {

    const L = Number(likelihood);
    const S = Number(severity);

    if (
        !Number.isFinite(L) ||
        !Number.isFinite(S) ||
        L < 1 || L > 5 ||
        S < 1 || S > 5
    ) {

        return null;

    }

    const value =
        Math.sqrt(
            SO_SEVERITY_WEIGHT * S * S +
            SO_LIKELIHOOD_WEIGHT * L * L
        );

    return value;

}


function getSoRiskBand(ri) {

    if (
        ri === null ||
        !Number.isFinite(ri)
    ) {

        return null;

    }

    // Clamp tiny floating point overshoot at the theoretical
    // ends of the range (S=L=5 -> 5.00, S=L=1 -> 1.41).
    const clamped =
        Math.min(
            5,
            Math.max(
                1.41,
                ri
            )
        );

    return (
        SO_RISK_BANDS.find(
            function(band) {

                return (
                    clamped >= band.min &&
                    clamped <= band.max
                );

            }
        ) || null
    );

}


function getSoRiskBandClass(band) {

    if (!band) {
        return "bg-jorpro-canvas border border-jorpro-line text-jorpro-slate";
    }

    if (band.code >= 4) {
        return "bg-jorpro-redDim border border-red-500/20 text-jorpro-red";
    }

    if (band.code === 3) {
        return "bg-orange-50 border border-orange-200 text-orange-600";
    }

    if (band.code === 2) {
        return "bg-amber-50 border border-amber-200 text-amber-600";
    }

    if (band.code === 1) {
        return "bg-emerald-50 border border-emerald-200 text-emerald-600";
    }

    return "bg-jorpro-canvas border border-jorpro-line text-jorpro-slate";

}


// Text-only variant (no background/border) for solo stat values.
function getSoRiskBandTextClass(band) {

    if (!band) {
        return "text-jorpro-slate";
    }

    if (band.code >= 4) {
        return "text-jorpro-red";
    }

    if (band.code === 3) {
        return "text-orange-600";
    }

    if (band.code === 2) {
        return "text-amber-600";
    }

    if (band.code === 1) {
        return "text-emerald-600";
    }

    return "text-jorpro-slate";

}


// Solid hex color per SO Risk Level code, for Chart.js series.
function getSoRiskBandColor(code) {

    const colors = {
        5: "#C21F2E",
        4: "#EA580C",
        3: "#F59E0B",
        2: "#FACC15",
        1: "#34D399",
        0: "#94A3B8"
    };

    return (
        colors[code] ||
        "#94A3B8"
    );

}


// Builds the ranked Weighted Risk Scoring list for one Analysis:
// Basic Events with usable L/S, sorted by RI desc, tie-broken by
// Severity desc (per the Safety Officer's stated ranking rule).
// Events the Expert has not yet scored are returned separately so
// the UI can say what's missing instead of guessing a score.
function buildWeightedRiskScoring(
    analysis
) {

    const events =
        Array.isArray(
            analysis?.ftaData?.basicEvents
        )
            ? analysis.ftaData.basicEvents
            : [];

    const assessments =
        Array.isArray(
            analysis?.riskAssessments
        )
            ? analysis.riskAssessments
            : [];

    const riskMap =
        new Map(
            assessments.map(
                function(item) {

                    return [
                        String(
                            item?.eventId ||
                            ""
                        ),
                        item
                    ];

                }
            )
        );

    const scored = [];
    const missing = [];

    events.forEach(
        function(
            event,
            index
        ) {

            const eventId =
                String(
                    event?.id ||
                    `E-${String(
                        index + 1
                    ).padStart(
                        2,
                        "0"
                    )}`
                );

            const item =
                riskMap.get(
                    eventId
                ) ||
                null;

            const name =
                item?.eventName ||
                event?.name ||
                `Basic Event ${index + 1}`;

            if (
                !item ||
                !Number.isFinite(
                    Number(item.likelihood)
                ) ||
                !Number.isFinite(
                    Number(item.severity)
                )
            ) {

                missing.push({
                    eventId: eventId,
                    name: name
                });

                return;

            }

            const ri =
                computeWeightedRiskIndex(
                    item.likelihood,
                    item.severity
                );

            const band =
                getSoRiskBand(
                    ri
                );

            scored.push({
                eventId: eventId,
                name: name,
                likelihood: Number(item.likelihood),
                severity: Number(item.severity),
                riskIndex: ri,
                band: band
            });

        }
    );

    scored.sort(
        function(a, b) {

            if (b.riskIndex !== a.riskIndex) {
                return b.riskIndex - a.riskIndex;
            }

            // Tie-break: higher Severity takes priority first,
            // then higher Likelihood.
            if (b.severity !== a.severity) {
                return b.severity - a.severity;
            }

            return b.likelihood - a.likelihood;

        }
    );

    scored.forEach(
        function(
            item,
            index
        ) {

            item.priority =
                index + 1;

        }
    );

    return {
        scored: scored,
        missing: missing
    };

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

    renderWeightedRiskScoring(
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
                ? "px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-600"
                : "px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-600";

    }


    const body =
        document.getElementById(
            "riskAssessmentTableBody"
        );

    if (body) {

        body.innerHTML = "";

        events.forEach(
            function(event, index) {

                const id =
                    String(
                        event?.id ||
                        `E-${String(index + 1).padStart(2, "0")}`
                    );

                const item =
                    map.get(id);

                const row =
                    document.createElement("tr");

                if (!item) {

                    row.className =
                        "bg-amber-50 hover:bg-amber-100 transition-colors";

                    row.innerHTML = `
                        <td class="px-4 py-4 text-sm font-semibold text-jorpro-ink">
                            ${escapeHtml(
                                event?.name ||
                                `Basic Event ${index + 1}`
                            )}
                        </td>

                        <td colspan="6"
                            class="px-4 py-4 text-xs font-semibold text-amber-600">
                            <span class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200">
                                <span class="w-1.5 h-1.5 rounded-full bg-amber-300"></span>
                                PENDING — No Risk Assessment Saved
                            </span>
                        </td>
                    `;

                }
                else {

                    const level =
                        String(
                            item.riskLevel ||
                            ""
                        ).toUpperCase();

                    const levelStyle =
                        level === "HIGH"
                            ? "bg-jorpro-redDim border border-red-500/20 text-jorpro-red"
                            : level === "MEDIUM"
                                ? "bg-amber-50 border border-amber-200 text-amber-600"
                                : level === "LOW"
                                    ? "bg-emerald-50 border border-emerald-200 text-emerald-600"
                                    : "bg-jorpro-canvas border border-jorpro-line text-jorpro-slate";

                    const rowTone =
                        level === "HIGH"
                            ? "bg-red-500/[0.025] hover:bg-red-500/[0.05]"
                            : level === "MEDIUM"
                                ? "bg-amber-500/[0.02] hover:bg-amber-500/[0.04]"
                                : level === "LOW"
                                    ? "bg-emerald-500/[0.02] hover:bg-emerald-500/[0.04]"
                                    : "bg-transparent hover:bg-jorpro-canvas";

                    row.className =
                        `${rowTone} transition-colors`;

                    row.innerHTML = `
                        <td class="px-4 py-4 text-sm font-semibold text-jorpro-ink">
                            ${escapeHtml(
                                event?.name ||
                                `Basic Event ${index + 1}`
                            )}
                        </td>

                        <td class="px-4 py-4 text-xs text-jorpro-slate">
                            <span class="inline-flex px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 font-semibold">
                                ${escapeHtml(
                                    `${item.likelihood ?? "-"} - ${item.likelihoodName || ""}`
                                )}
                            </span>
                        </td>

                        <td class="px-4 py-4 text-xs text-jorpro-slate">
                            <span class="inline-flex px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 font-semibold">
                                ${escapeHtml(
                                    `${item.severityCode || ""} - ${item.severityName || ""}`
                                )}
                            </span>
                        </td>

                        <td class="px-4 py-4 text-sm font-black">
                            <span class="inline-flex min-w-[46px] justify-center px-2.5 py-1 rounded-lg bg-jorpro-blue/10 border border-jorpro-blue/20 text-jorpro-blueBright">
                                ${escapeHtml(
                                    item.riskIndex ||
                                    item.referenceScore ||
                                    "-"
                                )}
                            </span>
                        </td>

                        <td class="px-4 py-4 text-xs font-black">
                            <span class="inline-flex px-3 py-1.5 rounded-full ${levelStyle}">
                                ${escapeHtml(
                                    item.riskLevel ||
                                    "-"
                                )}
                            </span>
                        </td>

                        <td class="px-4 py-4 text-xs">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-jorpro-blue/10 border border-jorpro-blue/20 text-jorpro-blueBright font-bold">
                                <span class="w-1.5 h-1.5 rounded-full bg-jorpro-blueBright"></span>
                                SEE WEIGHTED SCORING ↓
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
                    ? "text-jorpro-red"
                    : highest === "MEDIUM"
                        ? "text-amber-600"
                        : highest === "LOW"
                            ? "text-emerald-600"
                            : "text-jorpro-slate"
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
                    ? "text-jorpro-red"
                    : "text-emerald-600"
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
                    ? "bg-jorpro-redDim border-jorpro-red/25 text-jorpro-red"
                    : overall === "MEDIUM RISK"
                        ? "bg-amber-50 border-amber-200 text-amber-600"
                        : overall === "LOW RISK"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                            : "bg-jorpro-canvas border-jorpro-line text-jorpro-slate"
            );

    }

}


function renderWeightedRiskScoring(
    analysis
) {

    const highestEl =
        document.getElementById(
            "soHighestRiskLevel"
        );

    const highCountEl =
        document.getElementById(
            "soHighPriorityCount"
        );

    const scoredCountEl =
        document.getElementById(
            "soScoredCount"
        );

    const tableBody =
        document.getElementById(
            "soRiskScoringTableBody"
        );

    if (!tableBody) {
        return;
    }

    const events =
        Array.isArray(
            analysis?.ftaData?.basicEvents
        )
            ? analysis.ftaData.basicEvents
            : [];

    const result =
        buildWeightedRiskScoring(
            analysis
        );

    const scored =
        result.scored;

    const missing =
        result.missing;


    if (scoredCountEl) {

        scoredCountEl.textContent =
            `${scored.length} / ${events.length}`;

    }


    let highestBand =
        null;

    scored.forEach(
        function(item) {

            if (
                !highestBand ||
                (item.band?.code || 0) >
                    (highestBand.code || 0)
            ) {

                highestBand =
                    item.band;

            }

        }
    );

    if (highestEl) {

        highestEl.textContent =
            highestBand
                ? highestBand.level
                : "-";

        highestEl.className =
            "text-lg font-black block mt-1 " +
            getSoRiskBandTextClass(
                highestBand
            );

    }


    const highCount =
        scored.filter(
            function(item) {

                return (
                    item.band &&
                    item.band.code >= 3
                );

            }
        ).length;

    if (highCountEl) {

        highCountEl.textContent =
            String(
                highCount
            );

        highCountEl.className =
            "text-lg font-black block mt-1 " +
            (
                highCount > 0
                    ? "text-jorpro-red"
                    : "text-emerald-600"
            );

    }


    tableBody.innerHTML = "";

    if (
        !scored.length &&
        !missing.length
    ) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="px-4 py-6 text-center text-xs text-jorpro-mute">
                    No Basic Events found for this Analysis.
                </td>
            </tr>
        `;

        return;

    }

    scored.forEach(
        function(item) {

            const bandClass =
                getSoRiskBandClass(
                    item.band
                );

            const row =
                document.createElement(
                    "tr"
                );

            row.innerHTML = `
                <td class="px-4 py-4 text-sm font-black text-jorpro-blueBright">
                    #${item.priority}
                </td>

                <td class="px-4 py-4 text-sm font-semibold text-jorpro-ink">
                    ${escapeHtml(item.name)}
                </td>

                <td class="px-4 py-4 text-xs text-jorpro-slate">
                    ${escapeHtml(item.likelihood)}
                </td>

                <td class="px-4 py-4 text-xs text-jorpro-slate">
                    ${escapeHtml(item.severity)}
                </td>

                <td class="px-4 py-4 text-[11px] text-jorpro-mute font-mono">
                    0.70 / 0.30
                </td>

                <td class="px-4 py-4 text-sm">
                    <div class="font-black text-jorpro-ink">
                        ${item.riskIndex.toFixed(2)}
                    </div>
                    <div class="text-[10px] text-jorpro-mute font-mono mt-0.5">
                        √(0.70×${item.severity}² + 0.30×${item.likelihood}²)
                    </div>
                </td>

                <td class="px-4 py-4 text-xs">
                    <span class="inline-flex px-3 py-1.5 rounded-full font-black ${bandClass}">
                        ${escapeHtml(item.band ? `${item.band.level} (${item.band.code})` : "-")}
                    </span>
                </td>

                <td class="px-4 py-4 text-xs text-jorpro-slate whitespace-pre-line max-w-[260px]">
                    ${escapeHtml(item.band ? item.band.action : "-")}
                </td>
            `;

            tableBody.appendChild(
                row
            );

        }
    );

    missing.forEach(
        function(item) {

            const row =
                document.createElement(
                    "tr"
                );

            row.className =
                "bg-amber-50";

            row.innerHTML = `
                <td class="px-4 py-4 text-xs text-amber-600 font-bold">
                    —
                </td>

                <td class="px-4 py-4 text-sm font-semibold text-jorpro-ink">
                    ${escapeHtml(item.name)}
                </td>

                <td colspan="6" class="px-4 py-4 text-xs font-semibold text-amber-600">
                    ข้อมูลไม่เพียงพอ — รอ Expert ประเมิน Likelihood/Severity ก่อนจึงจะคำนวณ RI ได้
                </td>
            `;

            tableBody.appendChild(
                row
            );

        }
    );

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

            const existingRiskControl =
                event?.existingRiskControl ||
                event?.riskControl ||
                event?.existing_risk_control ||
                "-";

            const safetyMitigation =
                event?.safetyMitigation ||
                event?.safetyOfficerMitigation ||
                event?.safety_mitigation ||
                "-";

            const riskOwner =
                event?.riskOwner ||
                event?.risk_owner ||
                "-";

            const eventId =
                event?.id ||
                `E-${String(
                    index + 1
                ).padStart(
                    2,
                    "0"
                )}`;

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "rounded-xl border border-jorpro-line bg-jorpro-canvas p-4";

            card.innerHTML = `
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">

                    <div>
                        <div class="text-[10px] font-bold tracking-widest text-jorpro-blue">
                            ${escapeHtml(eventId)}
                        </div>

                        <div class="text-sm font-bold text-jorpro-ink mt-1">
                            ${escapeHtml(
                                event?.name ||
                                `Basic Event ${index + 1}`
                            )}
                        </div>
                    </div>

                    <span class="text-[9px] font-bold tracking-widest uppercase text-jorpro-blue">
                        SAFETY OFFICER SOURCE
                    </span>

                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">

                    <div class="rounded-lg border border-jorpro-line bg-white p-3">
                        <div class="text-[9px] font-bold tracking-widest text-jorpro-mute uppercase">
                            Existing Risk Control (Identify)
                        </div>
                        <div class="text-xs text-jorpro-slate mt-2 whitespace-pre-line break-words">
                            ${escapeHtml(
                                existingRiskControl
                            )}
                        </div>
                    </div>

                    <div class="rounded-lg border border-jorpro-blue/20 bg-jorpro-blue/5 p-3">
                        <div class="text-[9px] font-bold tracking-widest text-jorpro-blue uppercase">
                            Safety Mitigation (Identify)
                        </div>
                        <div class="text-xs text-jorpro-slate mt-2 whitespace-pre-line break-words">
                            ${escapeHtml(
                                safetyMitigation
                            )}
                        </div>
                    </div>

                    <div class="rounded-lg border border-jorpro-line bg-white p-3">
                        <div class="text-[9px] font-bold tracking-widest text-jorpro-mute uppercase">
                            Risk Owner
                        </div>
                        <div class="text-xs text-jorpro-slate mt-2 break-words">
                            ${escapeHtml(
                                riskOwner
                            )}
                        </div>
                    </div>

                </div>
            `;

            container.appendChild(
                card
            );

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
                "safety-officer.html";

        }
    );


// =====================================================
// EXPORT TO EXCEL — one row per Basic Event of this Analysis.
// =====================================================

function buildExportRows(
    analysis
) {

    const rows = [];

    if (!analysis) {
        return rows;
    }

    const events =
        analysis.ftaData?.basicEvents ||
        [];

    const assessments =
        Array.isArray(
            analysis.riskAssessments
        )
            ? analysis.riskAssessments
            : [];

    const riskMap =
        new Map(
            assessments.map(
                function(item) {

                    return [
                        String(
                            item?.eventId ||
                            ""
                        ),
                        item
                    ];

                }
            )
        );

    // Priority / RI / SO Risk Level per Event, keyed by eventId,
    // computed the same way as the on-screen Weighted Risk
    // Scoring table so the export always matches what's shown.
    const soResult =
        buildWeightedRiskScoring(
            analysis
        );

    const soMap =
        new Map(
            soResult.scored.map(
                function(item) {

                    return [
                        item.eventId,
                        item
                    ];

                }
            )
        );

    events.forEach(
        function(
            event,
            index
        ) {

            const eventId =
                String(
                    event?.id ||
                    `E-${String(
                        index + 1
                    ).padStart(
                        2,
                        "0"
                    )}`
                );

            const item =
                riskMap.get(
                    eventId
                ) ||
                null;

            const soItem =
                soMap.get(
                    eventId
                ) ||
                null;

            const control =
                event?.existingRiskControl ||
                event?.riskControl ||
                event?.existing_risk_control ||
                "-";

            const mitigationSO =
                event?.safetyMitigation ||
                event?.safetyOfficerMitigation ||
                event?.safety_mitigation ||
                "-";

            const owner =
                event?.riskOwner ||
                event?.risk_owner ||
                "-";

            rows.push({

                "Analysis Title":
                    analysis.analysisTitle ||
                    "Untitled Analysis",

                "Top Event":
                    analysis.topEvent ||
                    "-",

                "Status":
                    analysis.status ||
                    "COMPLETED",

                "Basic Event ID":
                    eventId,

                "Basic Event Name":
                    item?.eventName ||
                    event?.name ||
                    `Basic Event ${index + 1}`,

                "Likelihood":
                    item
                        ? (item.likelihood ?? "-")
                        : "-",

                "Likelihood Name":
                    item?.likelihoodName ||
                    "-",

                "Severity":
                    item
                        ? (item.severity ?? "-")
                        : "-",

                "Severity Name":
                    item?.severityName ||
                    "-",

                "Risk Index":
                    item
                        ? (item.riskIndex ?? item.referenceScore ?? "-")
                        : "-",

                "Initial Risk Level (Expert, FAA Matrix)":
                    item?.riskLevel ||
                    (item ? "-" : "PENDING"),

                "SO Priority":
                    soItem
                        ? soItem.priority
                        : "-",

                "SO Weighted Risk Index (RI)":
                    soItem
                        ? Number(
                            soItem.riskIndex.toFixed(2)
                        )
                        : "-",

                "SO Risk Level":
                    soItem?.band
                        ? `${soItem.band.level} (${soItem.band.code})`
                        : (
                            item
                                ? "INSUFFICIENT DATA"
                                : "NOT YET ASSESSED BY EXPERT"
                        ),

                "SO Recommended Action":
                    soItem?.band?.action ||
                    "-",

                "Existing Risk Control":
                    control,

                "Safety Mitigation (Safety Officer)":
                    mitigationSO,

                "Risk Owner":
                    owner

            });

        }
    );

    return rows;

}


const exportExcelBtn =
    document.getElementById(
        "exportExcelBtn"
    );

if (exportExcelBtn) {

    exportExcelBtn.addEventListener(
        "click",
        function() {

            if (
                typeof XLSX ===
                "undefined"
            ) {

                Notify.error(
                    "ไม่สามารถโหลดไลบรารี Excel ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่"
                );

                return;

            }


            const rows =
                buildExportRows(
                    currentViewRecord
                );

            if (!rows.length) {

                Notify.error(
                    "ไม่มีข้อมูล Basic Events ให้ Export"
                );

                return;

            }


            const worksheet =
                XLSX.utils.json_to_sheet(
                    rows
                );

            worksheet["!cols"] =
                Object.keys(
                    rows[0]
                ).map(
                    function(key) {

                        const longText =
                            /Control|Mitigation|Title|Name|Action|Risk Level/.test(
                                key
                            );

                        return {
                            wch:
                                longText
                                    ? 32
                                    : 18
                        };

                    }
                );


            const workbook =
                XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Basic Events"
            );


            const stamp =
                new Date();

            const pad =
                function(n) {
                    return String(
                        n
                    ).padStart(
                        2,
                        "0"
                    );
                };

            const safeTitle =
                String(
                    currentViewRecord?.analysisTitle ||
                    "Analysis"
                )
                    .replace(
                        /[^a-z0-9]+/gi,
                        "-"
                    )
                    .replace(
                        /(^-+|-+$)/g,
                        ""
                    )
                    .slice(
                        0,
                        40
                    ) ||
                "Analysis";

            const filename =
                `JorproA-SO-${safeTitle}-${stamp.getFullYear()}${pad(
                    stamp.getMonth() + 1
                )}${pad(
                    stamp.getDate()
                )}-${pad(
                    stamp.getHours()
                )}${pad(
                    stamp.getMinutes()
                )}.xlsx`;

            XLSX.writeFile(
                workbook,
                filename
            );

        }
    );

}


// =====================================================
// RISK DASHBOARD — Chart.js visual summary (bar / doughnut /
// bubble), built from the same buildWeightedRiskScoring() data
// as the table and the Excel export, so all three always agree.
// =====================================================

let dashboardBarChart = null;
let dashboardDoughnutChart = null;
let dashboardScatterChart = null;


function destroyDashboardCharts() {

    [
        dashboardBarChart,
        dashboardDoughnutChart,
        dashboardScatterChart
    ].forEach(
        function(chart) {

            if (chart) {
                chart.destroy();
            }

        }
    );

    dashboardBarChart = null;
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
        buildWeightedRiskScoring(
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

    let highestBand =
        null;

    scored.forEach(
        function(item) {

            if (
                !highestBand ||
                (item.band?.code || 0) >
                    (highestBand.code || 0)
            ) {

                highestBand =
                    item.band;

            }

        }
    );

    const highCount =
        scored.filter(
            function(item) {
                return (
                    item.band &&
                    item.band.code >= 3
                );
            }
        ).length;

    const avgRi =
        scored.reduce(
            function(sum, item) {
                return sum + item.riskIndex;
            },
            0
        ) / scored.length;

    setText(
        "kpiScoredCount",
        `${scored.length} / ${analysis?.ftaData?.basicEvents?.length || scored.length}`
    );

    setText(
        "kpiHighestRisk",
        highestBand?.level ||
        "-"
    );

    setText(
        "kpiHighCount",
        String(highCount)
    );

    setText(
        "kpiAvgRi",
        avgRi.toFixed(2)
    );


    // -------------------------------------------------
    // Bar chart — Risk Index per Basic Event, ranked, colored
    // by SO Risk Level band.
    // -------------------------------------------------

    const barCanvas =
        document.getElementById(
            "dashboardBarChart"
        );

    if (barCanvas) {

        dashboardBarChart = new Chart(
            barCanvas,
            {
                type: "bar",
                data: {
                    labels: scored.map(
                        function(item) {
                            return item.name;
                        }
                    ),
                    datasets: [{
                        label: "Risk Index (RI)",
                        data: scored.map(
                            function(item) {
                                return Number(
                                    item.riskIndex.toFixed(2)
                                );
                            }
                        ),
                        backgroundColor: scored.map(
                            function(item) {
                                return getSoRiskBandColor(
                                    item.band?.code
                                );
                            }
                        ),
                        borderRadius: 6,
                        maxBarThickness: 36
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: "y",
                    scales: {
                        x: {
                            min: 0,
                            max: 5,
                            grid: { color: "#E2E7EF" },
                            title: { display: true, text: "Risk Index (RI)" }
                        },
                        y: {
                            grid: { display: false }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                afterLabel: function(context) {

                                    const item =
                                        scored[context.dataIndex];

                                    return item?.band
                                        ? `${item.band.level} (code ${item.band.code})`
                                        : "";

                                }
                            }
                        }
                    }
                }
            }
        );

    }


    // -------------------------------------------------
    // Doughnut chart — count of Events per SO Risk Level.
    // -------------------------------------------------

    const doughnutCanvas =
        document.getElementById(
            "dashboardDoughnutChart"
        );

    if (doughnutCanvas) {

        const levelOrder =
            [5, 4, 3, 2, 1, 0];

        const counts =
            levelOrder.map(
                function(code) {

                    return scored.filter(
                        function(item) {
                            return (
                                item.band?.code === code
                            );
                        }
                    ).length;

                }
            );

        const labels =
            levelOrder.map(
                function(code) {

                    const match =
                        SO_RISK_BANDS.find(
                            function(band) {
                                return band.code === code;
                            }
                        );

                    return match?.level || String(code);

                }
            );

        // Drop levels with zero Events so the legend stays clean.
        const filteredLabels = [];
        const filteredCounts = [];
        const filteredColors = [];

        levelOrder.forEach(
            function(code, index) {

                if (counts[index] > 0) {

                    filteredLabels.push(
                        labels[index]
                    );

                    filteredCounts.push(
                        counts[index]
                    );

                    filteredColors.push(
                        getSoRiskBandColor(code)
                    );

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
                        borderColor: "#FFFFFF",
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
                            labels: { boxWidth: 10, font: { size: 10 } }
                        }
                    }
                }
            }
        );

    }


    // -------------------------------------------------
    // Bubble chart — Likelihood (x) vs Severity (y), bubble
    // radius scaled by Risk Index.
    // -------------------------------------------------

    const scatterCanvas =
        document.getElementById(
            "dashboardScatterChart"
        );

    if (scatterCanvas) {

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
                                    r: 6 + item.riskIndex * 3,
                                    name: item.name,
                                    ri: item.riskIndex,
                                    band: item.band
                                };

                            }
                        ),
                        backgroundColor: scored.map(
                            function(item) {

                                return getSoRiskBandColor(
                                    item.band?.code
                                ) + "B3";

                            }
                        ),
                        borderColor: scored.map(
                            function(item) {

                                return getSoRiskBandColor(
                                    item.band?.code
                                );

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
                            ticks: { stepSize: 1 },
                            grid: { color: "#E2E7EF" },
                            title: { display: true, text: "Likelihood (L)" }
                        },
                        y: {
                            min: 0,
                            max: 6,
                            ticks: { stepSize: 1 },
                            grid: { color: "#E2E7EF" },
                            title: { display: true, text: "Severity (S)" }
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
                                        `L=${raw.x}  S=${raw.y}  RI=${raw.ri.toFixed(2)}`,
                                        raw.band?.level || ""
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


render();
