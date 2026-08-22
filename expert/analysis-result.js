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


// renderBasicEvents() (per-Basic-Event Probability card grid),
// readLegacyFTAResult() (its only other caller was renderFTA(), removed
// earlier) and renderFTA() (Main Gate / Top Event Probability /
// Probability % card) have all been removed — FTA probability display
// is no longer part of this page.





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
            <div class="rounded-xl border border-jorpro-line dark:border-jorpro-lineDark bg-jorpro-canvas dark:bg-jorpro-canvasDark p-5 text-sm text-jorpro-mute dark:text-jorpro-muteDark">
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

            // Safety Mitigation / Risk Owner / Type of Hazard are no longer
            // shown here — Safety Officer enters them after this Risk
            // Assessment is complete, on the Safety Officer Analysis Result
            // page, not before it.

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

                        <div class="text-sm font-bold text-jorpro-ink dark:text-jorpro-inkDark mt-1 break-words">
                            ${escapeHtml(
                                event?.name ||
                                event?.eventName ||
                                `Basic Event ${index + 1}`
                            )}
                        </div>
                    </div>

                    <span class="text-[9px] font-bold tracking-widest uppercase text-jorpro-blue dark:text-jorpro-blueDark">
                        SAFETY OFFICER SOURCE
                    </span>

                </div>

                <div class="grid grid-cols-1 gap-3">

                    <div class="rounded-lg border border-jorpro-line dark:border-jorpro-lineDark bg-white dark:bg-jorpro-surfaceDark p-3">
                        <div class="text-[9px] font-bold tracking-widest text-jorpro-mute dark:text-jorpro-muteDark uppercase">
                            Existing Risk Control (Identify)
                        </div>

                        <div class="text-xs text-jorpro-slate dark:text-jorpro-slateDark mt-2 whitespace-pre-line break-words">
                            ${escapeHtml(
                                existingRiskControl
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

        // Ranked HIGH -> MEDIUM -> LOW via RiskMatrix.compareByRisk —
        // events with no saved assessment yet have no risk to rank by,
        // so they sort after all assessed ones, in their original order.
        const decorated =
            targets.map(function(target) {
                return {
                    target: target,
                    item: savedMap.get(String(target.id)) || null
                };
            });

        decorated.sort(function(a, b) {
            if (a.item && b.item) {
                return window.RiskMatrix ? RiskMatrix.compareByRisk(a.item, b.item) : 0;
            }
            if (a.item && !b.item) return -1;
            if (!a.item && b.item) return 1;
            return 0;
        });

        decorated.forEach(
            function(entry, index) {

                const target = entry.target;
                const item = entry.item;
                const rank = String(index + 1).padStart(2, "0");


                const row =
                    document.createElement(
                        "tr"
                    );


                if (!item) {

                    row.className =
                        "bg-amber-50 dark:bg-amber-500/10";

                    row.innerHTML = `
                        <td class="px-4 py-3 text-xs text-jorpro-mute dark:text-jorpro-muteDark">${rank}</td>
                        <td class="px-4 py-3 text-sm text-jorpro-ink dark:text-jorpro-inkDark">
                            ${escapeHtml(target.name)}
                        </td>
                        <td colspan="5"
                            class="px-4 py-3 text-xs text-amber-600 dark:text-amber-400 font-bold">
                            PENDING — No Risk Assessment Saved
                        </td>
                        <td class="px-4 py-3 text-xs text-jorpro-mute dark:text-jorpro-muteDark">
                            -
                        </td>
                    `;

                } else {

                    // Via RiskMatrix so HIGH/MEDIUM/LOW render red/amber/green
                    // consistently with every other page (this used to be an
                    // ad-hoc orange/pale-yellow/emerald/red mix).
                    const riskClass =
                        window.RiskMatrix
                            ? RiskMatrix.getRiskLevelTextClass(item.riskLevel)
                            : "text-jorpro-slate dark:text-jorpro-slateDark";


                    row.innerHTML = `
                        <td class="px-4 py-3 text-xs text-jorpro-mute dark:text-jorpro-muteDark">${rank}</td>
                        <td class="px-4 py-3 text-sm font-semibold text-jorpro-ink dark:text-jorpro-inkDark">
                            ${escapeHtml(
                                item.eventName ||
                                target.name
                            )}
                        </td>

                        <td class="px-4 py-3 text-xs text-jorpro-slate dark:text-jorpro-slateDark">
                            ${escapeHtml(
                                `${item.likelihood ?? "-"} - ${item.likelihoodName || ""}`
                            )}
                        </td>

                        <td class="px-4 py-3 text-xs text-jorpro-slate dark:text-jorpro-slateDark">
                            ${escapeHtml(
                                `${item.severity ?? "-"} - ${item.severityName || ""}`
                            )}
                        </td>

                        <td class="px-4 py-3 text-sm font-bold text-jorpro-blue dark:text-jorpro-blueDark">
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
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-jorpro-blue/10 dark:bg-jorpro-blueDark/10 border border-jorpro-blue/20 dark:border-jorpro-blueDark/30 text-jorpro-blueBright dark:text-jorpro-blueBrightDark font-bold">
                                <span class="w-1.5 h-1.5 rounded-full bg-jorpro-blueBright dark:bg-jorpro-blueBrightDark"></span>
                                PENDING REVIEW
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
                        "flex items-center gap-3 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-jorpro-canvas dark:bg-jorpro-canvasDark px-3 py-2";

                    item.innerHTML = `
                        <span class="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[11px] font-bold">
                            ${String(index + 1).padStart(2, "0")}
                        </span>

                        <div class="text-sm text-jorpro-slate dark:text-jorpro-slateDark">
                            ${escapeHtml(
                                target.name
                            )}
                        </div>

                        <span class="ml-auto text-[10px] font-bold tracking-wider text-amber-600 dark:text-amber-400">
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
                    ? "text-emerald-600 dark:text-emerald-400"
                    : overall ===
                        "HIGH RISK"
                        ? "text-jorpro-red dark:text-jorpro-redDark"
                        : "text-amber-600 dark:text-amber-400"
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


    // theme.css's .text-risk-* utilities (var(--low/--medium/--high))
    // stand in for the old inline style="color:#hex", which was baked
    // to a fixed light-mode hex and stayed that color even in dark
    // mode. Clear whichever one is currently set before applying the
    // new one — this function re-runs on every render, and classes
    // (unlike a plain assignment to .style.color) accumulate instead
    // of overwriting each other.
    // "text-risk-special" (red) is what a HIGH result maps to via
    // RiskMatrix.getRiskLevelTextClass — used directly here (not
    // "text-risk-high", which theme.css defines as orange) so HIGH
    // renders the same red everywhere on the site, not just here.
    finalStatus.classList.remove(
        "text-risk-special",
        "text-risk-medium",
        "text-risk-low"
    );

    if (complete && hasHigh) {

        finalStatus.textContent =
            "HIGH INITIAL RISK";

        finalStatus.classList.add(
            "text-risk-special"
        );

        finalMessage.textContent =
            "One or more Events have a High Initial Risk. Awaiting Safety Officer review (Safety Mitigation, Risk Owner, Type of Hazard) on the Safety Officer Analysis Result page.";

    }
    else if (complete && hasMedium) {

        finalStatus.textContent =
            "MEDIUM INITIAL RISK";

        finalStatus.classList.add(
            "text-risk-medium"
        );

        finalMessage.textContent =
            "All Events have been scored. Awaiting Safety Officer review on the Safety Officer Analysis Result page.";

    }
    else if (complete) {

        finalStatus.textContent =
            "LOW INITIAL RISK";

        finalStatus.classList.add(
            "text-risk-low"
        );

        finalMessage.textContent =
            "All Events have been scored with Low Initial Risk. Awaiting Safety Officer final confirmation.";

    }
    else {

        finalStatus.textContent =
            "IN PROGRESS";

        finalStatus.classList.add(
            "text-risk-medium"
        );

        finalMessage.textContent =
            `Initial Risk scored for ${assessments.length} of ${targets.length} Events.`;

    }

}


function renderPage() {

    if (!analysis) {

        Notify.error(
            "ไม่พบข้อมูลผลการวิเคราะห์",
            "Analysis Result data was not found."
        ).then(function () {
            window.location.assign(
                "expert.html"
            );
        });

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
