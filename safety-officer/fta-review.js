// =====================================================
// SAFETY OFFICER — STEP 3
// FTA REVIEW / SUBMIT TO EXPERT
// =====================================================

const STORAGE_KEY =
    "ftaAnalysisData";

const RECORDS_KEY =
    "ftaAnalysisRecords";

let analysisData = null;


function loadAnalysis() {

    try {

        analysisData =
            JSON.parse(
                sessionStorage.getItem(
                    STORAGE_KEY
                )
            );

    } catch (error) {

        analysisData = null;

    }

    if (!analysisData) {

        try {

            analysisData =
                JSON.parse(
                    localStorage.getItem(
                        STORAGE_KEY
                    )
                );

        } catch (error) {

            analysisData = null;

        }

    }

    if (!analysisData) {

        alert(
            "Analysis data was not found."
        );

        window.location.href =
            "new-analysis.html";

        return false;
    }

    return true;
}


function saveCurrent() {

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


function loadRecords() {

    try {

        return JSON.parse(
            localStorage.getItem(
                RECORDS_KEY
            )
        ) || [];

    } catch (error) {

        return [];

    }

}


function saveRecords(records) {

    localStorage.setItem(
        RECORDS_KEY,
        JSON.stringify(
            records
        )
    );

}


function render() {

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
        analysisData.department || "-";

    document.getElementById(
        "officerName"
    ).textContent =
        analysisData.officerName || "-";

    const submittedAtEl =
        document.getElementById(
            "submittedAt"
        );

    if (submittedAtEl) {
        submittedAtEl.textContent =
            formatDateTime(
                analysisData.submittedAt
            );
    }

    document.getElementById(
        "description"
    ).textContent =
        analysisData.description || "-";

    const fta =
        analysisData.ftaData || {};

    document.getElementById(
        "gate"
    ).textContent =
        fta.gate || "OR";

    document.getElementById(
        "treeTopEvent"
    ).textContent =
        analysisData.topEvent || "-";

    const events =
        Array.isArray(
            fta.basicEvents
        )
            ? fta.basicEvents
            : [];

    document.getElementById(
        "eventCount"
    ).textContent =
        `${events.length} EVENTS`;

    const list =
        document.getElementById(
            "eventList"
        );

    list.innerHTML = "";

    if (events.length === 0) {

        list.innerHTML = `
            <div class="col-span-full p-6 rounded-xl
                        bg-jorpro-canvas border border-dashed border-jorpro-line
                        text-center text-sm text-jorpro-mute">
                No Basic Events recorded.
            </div>
        `;

    } else {

        events.forEach(
            function(event, index) {

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "rounded-xl border border-jorpro-line bg-jorpro-canvas p-4";

                card.innerHTML = `
                    <div class="text-[10px] font-bold tracking-widest text-jorpro-blue">
                        E-${String(index + 1).padStart(2, "0")}
                    </div>

                    <div class="font-bold text-jorpro-ink mt-2 break-words">
                        ${escapeHtml(
                            event.name
                        )}
                    </div>

                    <p class="text-xs text-jorpro-mute mt-2 leading-relaxed break-words">
                        ${escapeHtml(
                            event.description ||
                            "-"
                        )}
                    </p>
                `;

                list.appendChild(card);

            }
        );

    }

    const badge =
        document.getElementById(
            "statusBadge"
        );

    if (
        analysisData.status ===
        "PENDING_EXPERT"
    ) {

        badge.textContent =
            "PENDING EXPERT";

        badge.className =
            "px-3 py-1.5 rounded-full border border-jorpro-blue/25 text-jorpro-blueBright text-[10px] font-bold";

    } else {

        badge.textContent =
            "DRAFT";

        badge.className =
            "px-3 py-1.5 rounded-full border border-amber-200 text-amber-600 text-[10px] font-bold";

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


document
    .getElementById(
        "backBtn"
    )
    .addEventListener(
        "click",
        function() {

            window.location.href =
                "fta-workspace.html";

        }
    );


document
    .getElementById(
        "submitBtn"
    )
    .addEventListener(
        "click",
        function() {

            const fta =
                analysisData.ftaData ||
                {};

            const events =
                Array.isArray(
                    fta.basicEvents
                )
                    ? fta.basicEvents
                    : [];


            if (
                !analysisData.analysisTitle ||
                !analysisData.topEvent
            ) {

                alert(
                    "Analysis Title and Top Event are required."
                );

                return;
            }


            if (!analysisData.department) {

                alert(
                    "Department / Area is required."
                );

                return;
            }


            if (!analysisData.analysisDate) {

                alert(
                    "Analysis Date & Time is required."
                );

                return;
            }


            if (events.length === 0) {

                alert(
                    "Please add at least one Basic Event before submitting."
                );

                return;
            }


            const invalidEvent =
                events.find(
                    function(event) {
                        return !event ||
                               !event.name;
                    }
                );


            if (invalidEvent) {

                alert(
                    "Every Basic Event must have a name."
                );

                return;
            }


            // ---------------------------------------------
            // SUBMISSION TIMESTAMP
            // This is the real time the Safety Officer
            // pressed SUBMIT.
            // ---------------------------------------------

            const submittedAt =
                new Date().toISOString();


            analysisData.status =
                "PENDING_EXPERT";


            analysisData.submittedAt =
                submittedAt;


            analysisData.expert =
                null;


            analysisData.analysisResult =
                null;


            analysisData.riskAssessment =
                null;


            analysisData.analysisStartedAt =
                null;


            analysisData.ftaCompletedAt =
                null;


            analysisData.riskAssessmentAt =
                null;


            analysisData.completedAt =
                null;


            analysisData.updatedAt =
                submittedAt;


            // ---------------------------------------------
            // CANONICAL CURRENT RECORD
            // ---------------------------------------------

            saveCurrent();


            // ---------------------------------------------
            // CANONICAL HISTORY RECORD
            // ---------------------------------------------

            let records =
                loadRecords();


            if (!Array.isArray(records)) {

                records = [];

            }


            const record = {

                ...analysisData,

                analysisDate:
                    analysisData.analysisDate,

                department:
                    analysisData.department,

                submittedAt:
                    submittedAt,

                submittedBy:
                    analysisData.officerName ||
                    "Safety Officer",

                status:
                    "PENDING_EXPERT",

                updatedAt:
                    submittedAt

            };


            const existingIndex =
                records.findIndex(
                    function(item) {

                        return String(
                            item?.id
                        ) === String(
                            record.id
                        );

                    }
                );


            if (existingIndex >= 0) {

                records[
                    existingIndex
                ] = {

                    ...records[
                        existingIndex
                    ],

                    ...record

                };

            } else {

                records.unshift(
                    record
                );

            }


            saveRecords(
                records
            );


            // ---------------------------------------------
            // CLEAR STALE EXPERT HANDOFF
            // ---------------------------------------------

            sessionStorage.setItem(
                "ftaAnalysisData",
                JSON.stringify(
                    record
                )
            );


            localStorage.setItem(
                "ftaAnalysisData",
                JSON.stringify(
                    record
                )
            );


            alert(
                "FTA data submitted to Expert successfully."
            );


            // Same folder: safety-officer/analysis-history.html
            window.location.assign(
                "analysis-history.html"
            );

        }
    );


if (loadAnalysis()) {
    render();
}
