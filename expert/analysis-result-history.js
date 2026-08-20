
// =====================================================
// EXPERT — ANALYSIS RESULT HISTORY
// SAME INFORMATION AS ANALYSIS RESULT PAGE
// =====================================================

const RECORDS_KEY =
    "ftaAnalysisRecords";


// Keeps the exact set of records currently rendered on screen, so
// EXPORT EXCEL always exports what the user is looking at.
let lastRenderedRecords =
    [];


function readRecords() {

    try {

        const raw =
            localStorage.getItem(
                RECORDS_KEY
            );

        const records =
            raw
                ? JSON.parse(raw)
                : [];

        return Array.isArray(
            records
        )
            ? records
            : [];

    }
    catch (error) {

        return [];

    }

}


function escapeHtml(
    value
) {

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


function formatDateTime(
    value
) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(
            value
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(
            value
        );
    }

    return date.toLocaleString(
        "th-TH",
        {
            year:
                "numeric",
            month:
                "2-digit",
            day:
                "2-digit",
            hour:
                "2-digit",
            minute:
                "2-digit"
        }
    );

}


function normalizeRecord(
    raw
) {

    if (
        !raw ||
        typeof raw !==
            "object"
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

    const basicEvents =
        Array.isArray(
            fta.basicEvents
        )
            ? fta.basicEvents
            : [];

    const assessments =
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

        department:
            source.department ||
            source.departmentArea ||
            source.area ||
            raw.department ||
            raw.departmentArea ||
            raw.area ||
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

        analysisDate:
            source.analysisDate ||
            raw.analysisDate ||
            "",

        submittedAt:
            source.submittedAt ||
            raw.submittedAt ||
            "",

        completedAt:
            source.completedAt ||
            raw.completedAt ||
            source.updatedAt ||
            raw.updatedAt ||
            "",

        ftaData: {

            ...fta,

            gate:
                String(
                    fta.gate ||
                    source.gate ||
                    raw.gate ||
                    "OR"
                ).toUpperCase(),

            basicEvents:
                basicEvents

        },

        analysisResult:
            source.analysisResult ||
            raw.analysisResult ||
            null,

        riskAssessments:
            assessments

    };

}


function getRiskMap(
    record
) {

    const assessments =
        Array.isArray(
            record?.riskAssessments
        )
            ? record.riskAssessments
            : [];

    return new Map(
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

}


function getTargets(
    record
) {

    const targets = [];

    // Expert Analysis Result History only counts/displays Basic
    // Events here — the Top Event is shown separately above (as
    // context) and must not be mixed into the assessable target
    // list, the completed/total count, or the results table.
    const basicEvents =
        record?.ftaData?.basicEvents ||
        [];


    basicEvents.forEach(
        function(
            event,
            index
        ) {

            targets.push({

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

            });

        }
    );


    return targets;

}


function getFTAProbability(
    record
) {

    const result =
        record?.analysisResult ||
        {};

    const candidates = [
        result?.topEventProbability,
        record?.ftaTopProbability
    ];


    for (
        const candidate of
        candidates
    ) {

        const number =
            Number(
                candidate
            );

        if (
            Number.isFinite(
                number
            )
        ) {

            return (
                number *
                100
            ).toFixed(
                4
            ) + "%";

        }

    }


    return "-";

}


function getHighestRisk(
    assessments
) {

    const rank = {

        LOW: 1,
        MEDIUM: 2,
        HIGH: 3,
        SPECIAL: 4

    };

    let highest =
        "-";


    assessments.forEach(
        function(item) {

            const level =
                String(
                    item?.riskLevel ||
                    ""
                ).toUpperCase();


            if (
                (
                    rank[level] ||
                    0
                ) >
                (
                    rank[highest] ||
                    0
                )
            ) {

                highest =
                    level;

            }

        }
    );


    return highest;

}


// Both helpers below are now based purely on the Expert's Initial
// Risk Level (Likelihood x Severity). Acceptability/Mitigation are
// no longer set by the Expert — they are decided by the Safety
// Officer on the Safety Officer Analysis Result page.
function getMitigationCount(
    assessments
) {

    return assessments.filter(
        function(item) {

            return (
                item?.riskLevel ===
                    "HIGH" ||
                item?.riskLevel ===
                    "MEDIUM"
            );

        }
    ).length;

}


function getOverallAcceptability(
    assessments,
    total,
    completed
) {

    const hasHigh =
        assessments.some(
            function(item) {

                return (
                    item?.riskLevel ===
                    "HIGH"
                );

            }
        );


    const hasMedium =
        assessments.some(
            function(item) {

                return (
                    item?.riskLevel ===
                    "MEDIUM"
                );

            }
        );


    if (
        hasHigh
    ) {

        return "HIGH RISK";

    }


    if (
        completed ===
        total &&
        total > 0
    ) {

        return hasMedium
            ? "MEDIUM RISK"
            : "LOW RISK";

    }


    return "IN PROGRESS";

}


function getRiskClass(
    level
) {

    if (
        level ===
        "HIGH"
    ) {

        return "text-orange-600";

    }

    if (
        level ===
        "MEDIUM"
    ) {

        return "text-yellow-300";

    }

    if (
        level ===
        "LOW"
    ) {

        return "text-emerald-600";

    }

    return "text-jorpro-slate";

}


function getAcceptabilityClass(
    value
) {

    if (
        value ===
        "HIGH RISK"
    ) {

        return "text-jorpro-red";

    }

    if (
        value ===
        "MEDIUM RISK"
    ) {

        return "text-yellow-300";

    }

    if (
        value ===
        "LOW RISK"
    ) {

        return "text-emerald-600";

    }

    return "text-jorpro-slate";

}


function renderSafetyControls(
    record
) {

    const events =
        record?.ftaData?.basicEvents ||
        [];


    if (
        !events.length
    ) {

        return `
            <div class="rounded-xl border border-jorpro-line bg-jorpro-canvas p-4 text-sm text-jorpro-mute">
                No Safety Control data available.
            </div>
        `;

    }


    return events.map(
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


            const control =
                event?.existingRiskControl ||
                event?.riskControl ||
                event?.existing_risk_control ||
                "-";


            const mitigation =
                event?.safetyMitigation ||
                event?.safetyOfficerMitigation ||
                event?.safety_mitigation ||
                "-";


            const owner =
                event?.riskOwner ||
                event?.risk_owner ||
                "-";


            return `
                <div class="rounded-xl border border-jorpro-line bg-jorpro-canvas p-4">

                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">

                        <div>
                            <div class="text-[10px] font-bold tracking-widest text-jorpro-blue">
                                ${escapeHtml(
                                    eventId
                                )}
                            </div>

                            <div class="text-sm font-bold text-jorpro-ink mt-1 break-words">
                                ${escapeHtml(
                                    event?.name ||
                                    event?.eventName ||
                                    `Basic Event ${index + 1}`
                                )}
                            </div>
                        </div>

                        <span class="text-[9px] font-bold tracking-widest text-jorpro-blue uppercase">
                            SAFETY OFFICER SOURCE
                        </span>

                    </div>


                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">

                        <div class="rounded-lg border border-jorpro-line bg-white p-3">

                            <div class="text-[9px] font-bold tracking-widest text-jorpro-mute uppercase">
                                Existing Risk Control (Identify)
                            </div>

                            <div class="text-xs text-jorpro-slate mt-2 whitespace-pre-line break-words">
                                ${escapeHtml(
                                    control
                                )}
                            </div>

                        </div>


                        <div class="rounded-lg border border-jorpro-blue/20 bg-jorpro-blue/5 p-3">

                            <div class="text-[9px] font-bold tracking-widest text-jorpro-blue uppercase">
                                Safety Mitigation (Identify)
                            </div>

                            <div class="text-xs text-jorpro-slate mt-2 whitespace-pre-line break-words">
                                ${escapeHtml(
                                    mitigation
                                )}
                            </div>

                        </div>


                        <div class="rounded-lg border border-jorpro-line bg-white p-3">

                            <div class="text-[9px] font-bold tracking-widest text-jorpro-mute uppercase">
                                Risk Owner
                            </div>

                            <div class="text-xs text-jorpro-slate mt-2 break-words">
                                ${escapeHtml(
                                    owner
                                )}
                            </div>

                        </div>

                    </div>

                </div>
            `;

        }
    ).join("");

}


function renderRecord(
    record,
    index
) {

    const targets =
        getTargets(
            record
        );


    const riskMap =
        getRiskMap(
            record
        );


    const assessments =
        Array.from(
            riskMap.values()
        ).filter(
            function(item) {

                return (
                    item?.eventId &&
                    item.eventId !==
                        "TOP_EVENT"
                );

            }
        );


    const completed =
        targets.filter(
            function(target) {

                return riskMap.has(
                    String(
                        target.id
                    )
                );

            }
        ).length;


    // targets now holds Basic Events only, so this is a plain
    // Basic Event count (e.g. 3/3), never inflated by the Top Event.
    const total =
        targets.length;


    const highest =
        getHighestRisk(
            assessments
        );


    const mitigationCount =
        getMitigationCount(
            assessments
        );


    const overall =
        getOverallAcceptability(
            assessments,
            total,
            completed
        );


    const probability =
        getFTAProbability(
            record
        );


    const ftaGate =
        record?.analysisResult?.gate ||
        record?.analysisResult?.mainGate ||
        record?.ftaData?.gate ||
        "OR";


    const tableRows =
        targets.map(
            function(target) {

                const item =
                    riskMap.get(
                        String(
                            target.id
                        )
                    );


                if (
                    !item
                ) {

                    return `
                        <tr class="bg-amber-50 border-t border-jorpro-line">

                            <td class="px-4 py-4 text-sm font-semibold text-jorpro-ink">
                                ${escapeHtml(
                                    target.name
                                )}
                            </td>

                            <td colspan="5"
                                class="px-4 py-4 text-xs font-semibold text-amber-600">
                                PENDING — No Risk Assessment Saved
                            </td>

                        </tr>
                    `;

                }


                return `
                    <tr class="border-t border-jorpro-line">

                        <td class="px-4 py-4 text-sm font-semibold text-jorpro-ink">
                            ${escapeHtml(
                                item?.eventName ||
                                target.name
                            )}
                        </td>

                        <td class="px-4 py-4 text-xs text-jorpro-slate">
                            ${escapeHtml(
                                `${item.likelihood ?? "-"} - ${item.likelihoodName || ""}`
                            )}
                        </td>

                        <td class="px-4 py-4 text-xs text-jorpro-slate">
                            ${escapeHtml(
                                `${item.severity ?? "-"} - ${item.severityName || ""}`
                            )}
                        </td>

                        <td class="px-4 py-4 text-sm font-black text-jorpro-blueBright">
                            ${escapeHtml(
                                item.riskIndex ??
                                item.referenceScore ??
                                "-"
                            )}
                        </td>

                        <td class="px-4 py-4 text-sm font-black ${getRiskClass(
                            item.riskLevel
                        )}">
                            ${escapeHtml(
                                item.riskLevel ||
                                "-"
                            )}
                        </td>

                        <td class="px-4 py-4 text-xs">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-jorpro-blue/10 border border-jorpro-blue/20 text-jorpro-blueBright font-bold">
                                <span class="w-1.5 h-1.5 rounded-full bg-jorpro-blueBright"></span>
                                PENDING SO SCORING
                            </span>
                        </td>

                    </tr>
                `;

            }
        ).join("");


    return `
        <article class="rounded-2xl bg-white border border-jorpro-line shadow-xl overflow-hidden">

            <div class="p-6 md:p-8">

                <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

                    <div class="min-w-0">

                        <div class="flex flex-wrap items-center gap-2">

                            <span class="px-3 py-1.5 rounded-full bg-jorpro-blue/10
                                         border border-jorpro-blue/20
                                         text-jorpro-blueBright text-[10px] font-bold">
                                ${escapeHtml(
                                    record.status ||
                                    "COMPLETED"
                                )}
                            </span>

                            <span class="text-[10px] text-jorpro-mute">
                                #${index + 1}
                            </span>

                        </div>


                        <h2 class="text-xl md:text-2xl font-extrabold text-jorpro-ink mt-3 break-words">
                            ${escapeHtml(
                                record.analysisTitle ||
                                "Untitled Analysis"
                            )}
                        </h2>


                        <p class="text-xs text-jorpro-mute mt-2">
                            ${escapeHtml(
                                record.description ||
                                "-"
                            )}
                        </p>

                    </div>


                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 lg:min-w-[360px]">

                        <div class="rounded-xl bg-jorpro-canvas border border-jorpro-line p-3">
                            <div class="text-[9px] tracking-widest text-jorpro-mute font-bold">
                                TOP EVENT
                            </div>
                            <div class="text-sm text-jorpro-blueBright font-semibold mt-1 break-words">
                                ${escapeHtml(
                                    record.topEvent ||
                                    "-"
                                )}
                            </div>
                        </div>


                        <div class="rounded-xl bg-jorpro-canvas border border-jorpro-line p-3">
                            <div class="text-[9px] tracking-widest text-jorpro-mute font-bold">
                                DEPARTMENT / AREA
                            </div>
                            <div class="text-sm text-jorpro-slate mt-1 break-words">
                                ${escapeHtml(
                                    record.department ||
                                    "-"
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            class="delete-result-btn
                                   px-4 py-3 rounded-xl
                                   bg-jorpro-redDim hover:bg-red-500/20
                                   border border-jorpro-red/25 hover:border-red-400/50
                                   text-jorpro-red text-[10px] font-bold
                                   tracking-wider self-stretch sm:self-end"
                            data-id="${escapeHtml(
                                record?.id || ""
                            )}">
                            DELETE
                        </button>

                    </div>

                </div>


                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">

                    <div class="rounded-xl bg-jorpro-canvas border border-jorpro-line p-4">
                        <div class="text-[10px] text-jorpro-mute">
                            FTA Top Event Probability
                        </div>
                        <div class="text-lg font-black text-jorpro-blueBright mt-1">
                            ${escapeHtml(
                                probability
                            )}
                        </div>
                    </div>


                    <div class="rounded-xl bg-jorpro-canvas border border-jorpro-line p-4">
                        <div class="text-[10px] text-jorpro-mute">
                            Main Gate
                        </div>
                        <div class="text-lg font-black text-jorpro-ink mt-1">
                            ${escapeHtml(
                                ftaGate
                            )}
                        </div>
                    </div>


                    <div class="rounded-xl bg-jorpro-canvas border border-jorpro-line p-4">
                        <div class="text-[10px] text-jorpro-mute">
                            Completed Events
                        </div>
                        <div class="text-lg font-black text-jorpro-ink mt-1">
                            ${completed} / ${total}
                        </div>
                    </div>

                </div>


                <div class="mt-3 rounded-xl border border-jorpro-blue/20 bg-jorpro-blue/5 p-4">
                    <div class="text-[10px] font-bold tracking-widest text-jorpro-blue uppercase mb-2">
                        SAFETY OFFICER SCORING
                    </div>

                    <p class="text-xs text-jorpro-slate">
                        Acceptability, Mitigation and Next Review for these ${assessments.length} Event(s) are pending Safety Officer scoring on the Safety Officer Analysis Result page.
                    </p>
                </div>


                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">

                    <div class="rounded-xl bg-jorpro-canvas border border-jorpro-line p-4">

                        <div class="text-[11px] text-jorpro-mute">
                            Highest Risk
                        </div>

                        <div class="text-lg font-black mt-1 ${getRiskClass(
                            highest
                        )}">
                            ${escapeHtml(
                                highest
                            )}
                        </div>

                    </div>


                    <div class="rounded-xl bg-jorpro-canvas border border-jorpro-line p-4">

                        <div class="text-[11px] text-jorpro-mute">
                            Events Needing SO Review
                        </div>

                        <div class="text-lg font-black text-amber-600 mt-1">
                            ${mitigationCount}
                        </div>

                    </div>


                    <div class="rounded-xl bg-jorpro-canvas border border-jorpro-line p-4">

                        <div class="text-[11px] text-jorpro-mute">
                            Overall Initial Risk
                        </div>

                        <div class="text-lg font-black mt-1 ${getAcceptabilityClass(
                            overall
                        )}">
                            ${escapeHtml(
                                overall
                            )}
                        </div>

                    </div>

                </div>


                <div class="mt-5 rounded-xl border border-jorpro-line overflow-hidden">

                    <div class="px-4 py-3 bg-white text-[10px] font-bold tracking-widest
                                text-jorpro-mute uppercase">
                        FAA Risk Assessment Result
                    </div>


                    <div class="overflow-x-auto">

                        <table class="min-w-[980px] w-full text-left">

                            <thead class="bg-jorpro-canvas">

                                <tr class="text-[10px] uppercase tracking-wider text-jorpro-mute">

                                    <th class="px-4 py-3">Event</th>
                                    <th class="px-4 py-3">Likelihood</th>
                                    <th class="px-4 py-3">Severity</th>
                                    <th class="px-4 py-3">Risk Index</th>
                                    <th class="px-4 py-3">Initial Risk Level</th>
                                    <th class="px-4 py-3">Safety Officer Scoring</th>

                                </tr>

                            </thead>


                            <tbody>
                                ${tableRows}
                            </tbody>

                        </table>

                    </div>

                </div>


                <div class="mt-5 rounded-xl border border-jorpro-line bg-jorpro-canvas p-4">

                    <div class="text-[10px] font-bold tracking-widest text-jorpro-mute uppercase mb-3">
                        SAFETY CONTROLS — MITIGATION &amp; RISK OWNERSHIP
                    </div>

                    <div class="space-y-3">
                        ${renderSafetyControls(
                            record
                        )}
                    </div>

                </div>


                <div class="mt-4 text-[10px] text-jorpro-mute flex flex-wrap gap-4">

                    <span>
                        Analysis Date:
                        <strong class="text-jorpro-slate">
                            ${escapeHtml(
                                formatDateTime(
                                    record.analysisDate
                                )
                            )}
                        </strong>
                    </span>

                    <span>
                        Submitted:
                        <strong class="text-jorpro-slate">
                            ${escapeHtml(
                                formatDateTime(
                                    record.submittedAt
                                )
                            )}
                        </strong>
                    </span>

                    <span>
                        Updated:
                        <strong class="text-jorpro-slate">
                            ${escapeHtml(
                                formatDateTime(
                                    record.completedAt
                                )
                            )}
                        </strong>
                    </span>

                </div>

            </div>

        </article>
    `;

}


function renderHistory() {

    const container =
        document.getElementById(
            "historyList"
        );

    const empty =
        document.getElementById(
            "emptyResultHistory"
        );

    const count =
        document.getElementById(
            "resultCount"
        );


    if (!container) {
        return;
    }


    const records =
        readRecords()
            .map(
                normalizeRecord
            )
            .filter(
                function(record) {

                    return (
                        record &&
                        (
                            record?.savedToHistory === true ||
                            record?.status === "COMPLETED" ||
                            Array.isArray(
                                record?.riskAssessments
                            ) &&
                            record.riskAssessments.length > 0
                        )
                    );

                }
            )
            .sort(
                function(a, b) {

                    const aTime =
                        new Date(
                            a?.historySavedAt ||
                            a?.completedAt ||
                            a?.updatedAt ||
                            a?.createdAt ||
                            0
                        ).getTime();

                    const bTime =
                        new Date(
                            b?.historySavedAt ||
                            b?.completedAt ||
                            b?.updatedAt ||
                            b?.createdAt ||
                            0
                        ).getTime();

                    return (
                        bTime -
                        aTime
                    );

                }
            );


    lastRenderedRecords =
        records;


    if (count) {

        count.textContent =
            `${records.length} RESULT${records.length === 1 ? "" : "S"}`;

    }


    container.innerHTML =
        "";


    if (!records.length) {

        if (empty) {
            empty.classList.remove(
                "hidden"
            );
        }

        return;

    }


    if (empty) {

        empty.classList.add(
            "hidden"
        );

    }


    records.forEach(
        function(
            record,
            index
        ) {

            container.insertAdjacentHTML(
                "beforeend",
                renderRecord(
                    record,
                    index
                )
            );

        }
    );

}



// =====================================================
// EXPORT TO EXCEL — one row per Basic Event, across every
// Analysis currently shown in the history list.
// =====================================================

function buildExportRows(
    records
) {

    const rows = [];


    records.forEach(
        function(record) {

            const targets =
                getTargets(
                    record
                );

            const riskMap =
                getRiskMap(
                    record
                );

            const basicEvents =
                record?.ftaData?.basicEvents ||
                [];

            const eventById =
                new Map(
                    basicEvents.map(
                        function(
                            event,
                            index
                        ) {

                            const id =
                                String(
                                    event?.id ||
                                    `E-${String(
                                        index + 1
                                    ).padStart(
                                        2,
                                        "0"
                                    )}`
                                );

                            return [
                                id,
                                event
                            ];

                        }
                    )
                );


            targets.forEach(
                function(target) {

                    const item =
                        riskMap.get(
                            String(
                                target.id
                            )
                        ) ||
                        null;

                    const event =
                        eventById.get(
                            String(
                                target.id
                            )
                        ) ||
                        {};

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
                            record.analysisTitle ||
                            "Untitled Analysis",

                        "Top Event":
                            record.topEvent ||
                            "-",

                        "Department / Area":
                            record.department ||
                            "-",

                        "Status":
                            record.status ||
                            "COMPLETED",

                        "Basic Event ID":
                            target.id,

                        "Basic Event Name":
                            item?.eventName ||
                            target.name,

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

                        "Initial Risk Level":
                            item?.riskLevel ||
                            (item ? "-" : "PENDING"),

                        "Safety Officer Scoring Status":
                            item
                                ? "PENDING SO SCORING"
                                : "NOT YET ASSESSED BY EXPERT",

                        "Existing Risk Control":
                            control,

                        "Safety Mitigation (Safety Officer)":
                            mitigationSO,

                        "Risk Owner":
                            owner,

                        "Analysis Date":
                            formatDateTime(
                                record.analysisDate
                            ),

                        "Submitted At":
                            formatDateTime(
                                record.submittedAt
                            ),

                        "Updated At":
                            formatDateTime(
                                record.completedAt
                            )

                    });

                }
            );

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

                window.alert(
                    "ไม่สามารถโหลดไลบรารี Excel ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่"
                );

                return;

            }


            const rows =
                buildExportRows(
                    lastRenderedRecords
                );

            if (!rows.length) {

                window.alert(
                    "ไม่มีข้อมูล Basic Events ให้ Export"
                );

                return;

            }


            const worksheet =
                XLSX.utils.json_to_sheet(
                    rows
                );

            // Reasonable column widths so the sheet is readable
            // without manual resizing in Excel.
            worksheet["!cols"] =
                Object.keys(
                    rows[0]
                ).map(
                    function(key) {

                        const longText =
                            /Control|Mitigation|Title|Name/.test(
                                key
                            );

                        return {
                            wch:
                                longText
                                    ? 32
                                    : 16
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

            const filename =
                `JorproA-Analysis-Result-History-${stamp.getFullYear()}${pad(
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


document.addEventListener(
    "click",
    function(event) {

        const button =
            event.target.closest(
                ".delete-result-btn"
            );

        if (!button) {
            return;
        }

        const id =
            String(
                button.dataset.id ||
                ""
            );

        if (!id) {
            return;
        }

        const confirmed =
            window.confirm(
                "Delete this Analysis Result from History?\n\nThis will remove the saved Analysis record from this browser."
            );

        if (!confirmed) {
            return;
        }

        const records =
            readRecords();

        const filtered =
            records.filter(
                function(record) {

                    const recordId =
                        String(
                            record?.id ??
                            record?.analysisData?.id ??
                            ""
                        );

                    return (
                        recordId !== id
                    );

                }
            );

        localStorage.setItem(
            RECORDS_KEY,
            JSON.stringify(
                filtered
            )
        );

        // Clear canonical current analysis only when it is the
        // same Analysis that was deleted.
        try {

            const currentRaw =
                localStorage.getItem(
                    "ftaAnalysisData"
                );

            if (currentRaw) {

                const current =
                    JSON.parse(
                        currentRaw
                    );

                if (
                    String(
                        current?.id ||
                        ""
                    ) === id
                ) {

                    localStorage.removeItem(
                        "ftaAnalysisData"
                    );

                }

            }

        }
        catch (error) {

            console.warn(
                "Unable to clear local current analysis:",
                error
            );

        }

        try {

            const sessionRaw =
                sessionStorage.getItem(
                    "ftaAnalysisData"
                );

            if (sessionRaw) {

                const currentSession =
                    JSON.parse(
                        sessionRaw
                    );

                if (
                    String(
                        currentSession?.id ||
                        ""
                    ) === id
                ) {

                    sessionStorage.removeItem(
                        "ftaAnalysisData"
                    );

                }

            }

        }
        catch (error) {

            console.warn(
                "Unable to clear session current analysis:",
                error
            );

        }

        renderHistory();

    }
);


const refreshBtn =
    document.getElementById(
        "refreshBtn"
    );

if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        renderHistory
    );

}


const backBtn =
    document.getElementById(
        "backBtn"
    );

if (backBtn) {

    backBtn.addEventListener(
        "click",
        function() {

            window.location.assign(
                "expert.html"
            );

        }
    );

}


renderHistory();
