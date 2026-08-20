// =====================================================
// EXPERT — ANALYSIS RESULT
// Canonical Analysis Record + Multi-Event Risk Result
// =====================================================

const RECORDS_KEY =
    "ftaAnalysisRecords";

const DATA_KEY =
    "ftaAnalysisData";


function readJSON(storage, key) {

    try {

        const raw =
            storage.getItem(key);

        return raw
            ? JSON.parse(raw)
            : null;

    } catch (error) {

        return null;

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


function formatDateTime(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString(
        "th-TH",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function normalizeRecord(raw) {

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

    const analysisResult =
        source.analysisResult ||
        raw.analysisResult ||
        null;

    const riskAssessments =
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
            );

    const basicEvents =
        Array.isArray(
            fta.basicEvents
        )
            ? fta.basicEvents
            : [];

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

        department:
            source.department ||
            source.departmentArea ||
            source.area ||
            raw.department ||
            raw.departmentArea ||
            raw.area ||
            "",

        analysisDate:
            source.analysisDate ||
            raw.analysisDate ||
            "",

        submittedAt:
            source.submittedAt ||
            raw.submittedAt ||
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
                basicEvents

        },

        analysisResult:
            analysisResult,

        riskAssessments:
            riskAssessments

    };

}


function loadCurrentRecord() {

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


    // Always prefer the exact ID passed from Final Analysis.
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

            return normalizeRecord(
                matched
            );

        }

    }


    // Then current canonical session record.
    const sessionData =
        readJSON(
            sessionStorage,
            DATA_KEY
        );

    if (sessionData) {

        return normalizeRecord(
            sessionData
        );

    }


    // Then local canonical record.
    const localData =
        readJSON(
            localStorage,
            DATA_KEY
        );

    if (localData) {

        return normalizeRecord(
            localData
        );

    }


    return null;

}


const analysis =
    loadCurrentRecord();


function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value || "-";

    }

}


function renderBasicEvents() {

    const container =
        document.getElementById(
            "basicEventResults"
        );

    if (!container) {
        return;
    }

    const events =
        analysis?.ftaData
            ?.basicEvents || [];

    const canonicalProbabilities =
        analysis?.analysisResult
            ?.basicEventProbabilities ||
        {};

    const legacyResult =
        readLegacyFTAResult();

    const probabilities =
        canonicalProbabilities &&
        Object.keys(
            canonicalProbabilities
        ).length
            ? canonicalProbabilities
            : (
                legacyResult.result
                    ?.basicEventProbabilities ||
                {}
            );

    container.innerHTML = "";

    if (!events.length) {

        container.innerHTML =
            `<div class="text-xs text-jorpro-mute">
                No Basic Events
             </div>`;

        return;

    }

    events.forEach(
        function(event, index) {

            const eventId =
                String(
                    event?.id ||
                    `E-${String(index + 1).padStart(2, "0")}`
                );

            const probability =
                probabilities[eventId];

            const percentage =
                Number.isFinite(
                    Number(probability)
                )
                    ? (
                        Number(probability) * 100
                    ).toFixed(4) + "%"
                    : "-";

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "bg-jorpro-canvas border border-jorpro-line rounded-xl p-4";

            card.innerHTML = `
                <div class="text-[10px] font-bold tracking-widest text-jorpro-blue">
                    ${escapeHtml(eventId)}
                </div>

                <div class="text-sm font-semibold text-jorpro-ink mt-2 break-words">
                    ${escapeHtml(
                        event?.name ||
                        `Basic Event ${index + 1}`
                    )}
                </div>

                <div class="text-xs text-jorpro-mute mt-2">
                    Probability
                </div>

                <div class="text-base font-bold text-jorpro-blue">
                    ${escapeHtml(percentage)}
                </div>
            `;

            container.appendChild(
                card
            );

        }
    );

}



function readLegacyFTAResult() {

    const legacyResult =
        readJSON(
            localStorage,
            "ftaAnalysisResult"
        );

    let legacyProbability = null;

    const rawProbability =
        localStorage.getItem(
            "ftaTopProbability"
        );

    if (
        rawProbability !== null &&
        rawProbability !== ""
    ) {

        const parsed =
            Number(
                rawProbability
            );

        if (Number.isFinite(parsed)) {
            legacyProbability = parsed;
        }

    }

    return {

        result:
            legacyResult,

        probability:
            legacyProbability

    };

}

function renderFTA() {

    const canonicalResult =
        analysis?.analysisResult ||
        null;

    const legacy =
        readLegacyFTAResult();


    const result =
        canonicalResult ||
        legacy.result ||
        null;


    let probability =
        Number(
            result?.topEventProbability
        );


    if (
        !Number.isFinite(
            probability
        )
        &&
        Number.isFinite(
            Number(
                legacy.probability
            )
        )
    ) {

        probability =
            Number(
                legacy.probability
            );

    }


    const gate =
        result?.gate ||
        result?.mainGate ||
        analysis?.ftaData?.gate ||
        "OR";


    setText(
        "mainGate",
        gate
    );


    if (
        Number.isFinite(
            probability
        )
    ) {

        setText(
            "ftaProbability",
            probability.toFixed(8)
        );


        setText(
            "ftaPercentage",
            (
                probability * 100
            ).toFixed(4) + "%"
        );

    } else {

        setText(
            "ftaProbability",
            "-"
        );


        setText(
            "ftaPercentage",
            "-"
        );

    }

}





function renderSafetyControlsByEvent() {

    const container =
        document.getElementById(
            "safetyControlsByEvent"
        );

    const count =
        document.getElementById(
            "safetyControlsEventCount"
        );

    if (!container) {
        return;
    }

    const events =
        Array.isArray(
            analysis?.ftaData?.basicEvents
        )
            ? analysis.ftaData.basicEvents
            : [];

    if (count) {
        count.textContent =
            `${events.length} EVENTS`;
    }

    container.innerHTML = "";

    if (!events.length) {

        container.innerHTML =
            `
            <div class="rounded-xl border border-jorpro-line bg-jorpro-canvas p-5 text-sm text-jorpro-mute">
                No Basic Event Safety Control data found.
            </div>
            `;

        return;
    }

    events.forEach(
        function(event, index) {

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

                        <div class="text-sm font-bold text-jorpro-ink mt-1 break-words">
                            ${escapeHtml(
                                event?.name ||
                                event?.eventName ||
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


function renderRiskAssessments() {

    const assessments =
        Array.isArray(
            analysis?.riskAssessments
        )
            ? analysis.riskAssessments
            : [];

    const tableBody =
        document.getElementById(
            "riskAssessmentTableBody"
        );

    const badge =
        document.getElementById(
            "riskCompletionBadge"
        );

    const highestRisk =
        document.getElementById(
            "highestRiskLevel"
        );

    const mitigationCount =
        document.getElementById(
            "mitigationEventCount"
        );

    const overallAcceptability =
        document.getElementById(
            "overallAcceptability"
        );

    const pendingPanel =
        document.getElementById(
            "riskPendingPanel"
        );

    const pendingList =
        document.getElementById(
            "riskPendingList"
        );


    // Basic Events only — the Top Event is shown separately as
    // context and must not be counted/listed as an assessable target.
    const targets = [

        ...(
            analysis?.ftaData?.basicEvents || []
        ).map(
            function(event, index) {

                return {

                    id:
                        String(
                            event?.id ||
                            `E-${String(index + 1).padStart(2, "0")}`
                        ),

                    name:
                        event?.name ||
                        `Basic Event ${index + 1}`

                };

            }
        )

    ];


    const savedMap =
        new Map(
            assessments.map(
                function(item) {

                    return [
                        String(
                            item.eventId
                        ),
                        item
                    ];

                }
            )
        );


    if (badge) {

        badge.textContent =
            `${assessments.length} / ${targets.length} EVENTS`;

    }


    if (tableBody) {

        tableBody.innerHTML = "";


        targets.forEach(
            function(target) {

                const item =
                    savedMap.get(
                        String(
                            target.id
                        )
                    );


                const row =
                    document.createElement(
                        "tr"
                    );


                if (!item) {

                    row.className =
                        "bg-amber-50";

                    row.innerHTML = `
                        <td class="px-4 py-3 text-sm text-jorpro-ink">
                            ${escapeHtml(target.name)}
                        </td>
                        <td colspan="5"
                            class="px-4 py-3 text-xs text-amber-600 font-bold">
                            PENDING — No Risk Assessment Saved
                        </td>
                        <td class="px-4 py-3 text-xs text-jorpro-mute">
                            -
                        </td>
                    `;

                } else {

                    const riskClass =
                        item.riskLevel === "HIGH"
                            ? "text-orange-600"
                            : item.riskLevel === "MEDIUM"
                                ? "text-yellow-300"
                                : item.riskLevel === "LOW"
                                    ? "text-emerald-600"
                                    : "text-jorpro-red";


                    row.innerHTML = `
                        <td class="px-4 py-3 text-sm font-semibold text-jorpro-ink">
                            ${escapeHtml(
                                item.eventName ||
                                target.name
                            )}
                        </td>

                        <td class="px-4 py-3 text-xs text-jorpro-slate">
                            ${escapeHtml(
                                `${item.likelihood ?? "-"} - ${item.likelihoodName || ""}`
                            )}
                        </td>

                        <td class="px-4 py-3 text-xs text-jorpro-slate">
                            ${escapeHtml(
                                `${item.severity ?? "-"} - ${item.severityName || ""}`
                            )}
                        </td>

                        <td class="px-4 py-3 text-sm font-bold text-jorpro-blue">
                            ${escapeHtml(
                                item.riskIndex ??
                                item.riskScore ??
                                item.referenceScore ??
                                "-"
                            )}
                        </td>

                        <td class="px-4 py-3 text-sm font-bold ${riskClass}">
                            ${escapeHtml(
                                item.riskLevel ||
                                "-"
                            )}
                        </td>

                        <td class="px-4 py-3 text-xs">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-jorpro-blue/10 border border-jorpro-blue/20 text-jorpro-blueBright font-bold">
                                <span class="w-1.5 h-1.5 rounded-full bg-jorpro-blueBright"></span>
                                PENDING SO SCORING
                            </span>
                        </td>
                    `;

                }


                tableBody.appendChild(
                    row
                );

            }
        );

    }


    const pendingTargets =
        targets.filter(
            function(target) {

                return !savedMap.has(
                    String(
                        target.id
                    )
                );

            }
        );


    if (pendingPanel && pendingList) {

        if (
            pendingTargets.length
        ) {

            pendingPanel.classList.remove(
                "hidden"
            );

            pendingList.innerHTML = "";


            pendingTargets.forEach(
                function(target, index) {

                    const item =
                        document.createElement(
                            "div"
                        );

                    item.className =
                        "flex items-center gap-3 rounded-lg border border-amber-200 bg-jorpro-canvas px-3 py-2";

                    item.innerHTML = `
                        <span class="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center text-[11px] font-bold">
                            ${String(index + 1).padStart(2, "0")}
                        </span>

                        <div class="text-sm text-jorpro-slate">
                            ${escapeHtml(
                                target.name
                            )}
                        </div>

                        <span class="ml-auto text-[10px] font-bold tracking-wider text-amber-600">
                            PENDING
                        </span>
                    `;

                    pendingList.appendChild(
                        item
                    );

                }
            );

        } else {

            pendingPanel.classList.add(
                "hidden"
            );

            pendingList.innerHTML =
                "";

        }

    }


    const riskRanks = {
        LOW: 1,
        MEDIUM: 2,
        HIGH: 3,
        SPECIAL: 4
    };


    let highest =
        "LOW";


    assessments.forEach(
        function(item) {

            const level =
                String(
                    item.riskLevel ||
                    ""
                ).toUpperCase();


            if (
                (riskRanks[level] || 0) >
                (riskRanks[highest] || 0)
            ) {

                highest =
                    level;

            }

        }
    );


    if (!assessments.length) {

        highest = "-";

    }


    // Events Needing SO Review / Overall Initial Risk are now
    // derived purely from riskLevel (Likelihood x Severity).
    // Acceptability is decided later by the Safety Officer.
    const mitigationEvents =
        assessments.filter(
            function(item) {

                return (
                    item.riskLevel === "HIGH" ||
                    item.riskLevel === "MEDIUM"
                );

            }
        ).length;


    const hasHigh =
        assessments.some(
            function(item) {
                return item.riskLevel === "HIGH";
            }
        );

    const hasMedium =
        assessments.some(
            function(item) {
                return item.riskLevel === "MEDIUM";
            }
        );

    const allComplete =
        targets.length > 0 &&
        assessments.length === targets.length;

    const overall =
        hasHigh
            ? "HIGH RISK"
            : allComplete
                ? (
                    hasMedium
                        ? "MEDIUM RISK"
                        : "LOW RISK"
                )
                : "IN PROGRESS";


    if (highestRisk) {
        setText(
            "highestRiskLevel",
            highest
        );
    }


    if (mitigationCount) {
        mitigationCount.textContent =
            String(
                mitigationEvents
            );
    }


    if (overallAcceptability) {

        overallAcceptability.textContent =
            overall;

        overallAcceptability.className =
            "text-lg font-black block mt-1 " +
            (
                overall ===
                "LOW RISK"
                    ? "text-emerald-600"
                    : overall ===
                        "HIGH RISK"
                        ? "text-jorpro-red"
                        : "text-amber-600"
            );

    }

}


function renderFinalStatus() {

    const assessments =
        Array.isArray(
            analysis?.riskAssessments
        )
            ? analysis.riskAssessments
            : [];

    const finalStatus =
        document.getElementById(
            "finalStatus"
        );

    const finalMessage =
        document.getElementById(
            "finalMessage"
        );


    if (!finalStatus) {
        return;
    }


    // Basic Events only — see note in the earlier targets build
    // above; Top Event must not count toward completion.
    const targets =
        [
            ...(
                analysis?.ftaData
                    ?.basicEvents || []
            ).map(
                function(event, index) {

                    return {

                        id:
                            String(
                                event?.id ||
                                `E-${String(index + 1).padStart(2, "0")}`
                            )

                    };

                }
            )
        ];


    const complete =
        targets.length > 0 &&
        assessments.length ===
            targets.length;


    // Based on the Expert's Initial Risk Level only. The Safety
    // Officer decides the final Acceptability afterward.
    const hasHigh =
        assessments.some(
            function(item) {
                return item.riskLevel === "HIGH";
            }
        );

    const hasMedium =
        assessments.some(
            function(item) {
                return item.riskLevel === "MEDIUM";
            }
        );


    if (complete && hasHigh) {

        finalStatus.textContent =
            "HIGH INITIAL RISK";

        finalStatus.style.color =
            "#f87171";

        finalMessage.textContent =
            "One or more Events have a High Initial Risk. Awaiting Safety Officer scoring (Acceptability, Mitigation, Next Review) on the Safety Officer Analysis Result page.";

    }
    else if (complete && hasMedium) {

        finalStatus.textContent =
            "MEDIUM INITIAL RISK";

        finalStatus.style.color =
            "#fbbf24";

        finalMessage.textContent =
            "All Events have been scored. Awaiting Safety Officer final scoring on the Safety Officer Analysis Result page.";

    }
    else if (complete) {

        finalStatus.textContent =
            "LOW INITIAL RISK";

        finalStatus.style.color =
            "#4ade80";

        finalMessage.textContent =
            "All Events have been scored with Low Initial Risk. Awaiting Safety Officer final confirmation.";

    }
    else {

        finalStatus.textContent =
            "IN PROGRESS";

        finalStatus.style.color =
            "#fbbf24";

        finalMessage.textContent =
            `Initial Risk scored for ${assessments.length} of ${targets.length} Events.`;

    }

}


function renderPage() {

    if (!analysis) {

        alert(
            "Analysis Result data was not found."
        );

        window.location.assign(
            "expert.html"
        );

        return;

    }


    setText(
        "analysisTitle",
        analysis.analysisTitle
    );

    setText(
        "topEvent",
        analysis.topEvent
    );

    setText(
        "description",
        analysis.description
    );

    setText(
        "department",
        analysis.department
    );

    setText(
        "analysisDate",
        formatDateTime(
            analysis.analysisDate
        )
    );

    setText(
        "submittedAt",
        formatDateTime(
            analysis.submittedAt
        )
    );


    renderBasicEvents();

    renderFTA();

    renderSafetyControlsByEvent();
    renderRiskAssessments();

    renderFinalStatus();

}


renderPage();


// =====================================================
// NAVIGATION
// =====================================================

const backBtn =
    document.getElementById(
        "backBtn"
    );


if (backBtn) {

    backBtn.addEventListener(
        "click",
        function() {

            const id =
                analysis?.id ||
                "";

            window.location.assign(
                id
                    ? "risk-assessment.html?id=" +
                      encodeURIComponent(
                          id
                      )
                    : "risk-assessment.html"
            );

        }
    );

}


const dashboardBtn =
    document.getElementById(
        "dashboardBtn"
    );


if (dashboardBtn) {

    dashboardBtn.addEventListener(
        "click",
        function() {

            window.location.assign(
                "expert.html"
            );

        }
    );

}
