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

        Notify.error(
            "ไม่พบข้อมูลการวิเคราะห์",
            "Analysis data was not found."
        ).then(function () {
            window.location.href =
                "new-analysis.html";
        });

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

    if (events.length === 0) {

        list.innerHTML = `
            <div class="dt-empty">No Basic Events recorded.</div>
        `;

    } else {

        const rows = events.map(
            function (event, index) {
                return `
                    <tr>
                        <td style="width:70px;"><span class="status-badge status-badge-blue">E-${String(index + 1).padStart(2, "0")}</span></td>
                        <td style="font-weight:800;color:var(--ink);">${escapeHtml(event.name)}</td>
                        <td style="color:var(--muted);">${escapeHtml(event.description || "-")}</td>
                    </tr>
                `;
            }
        ).join("");

        list.innerHTML = `
            <div class="data-table-scroll">
                <table class="data-table">
                    <thead><tr><th>ID</th><th>Name</th><th>Description</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;

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
            "px-3 py-1.5 rounded-full border border-jorpro-blue/25 dark:border-jorpro-blueDark/30 text-jorpro-blueBright dark:text-jorpro-blueBrightDark text-[10px] font-bold";

    } else {

        badge.textContent =
            "DRAFT";

        badge.className =
            "px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold";

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

                Notify.warn(
                    "กรุณากรอก Analysis Title และ Top Event",
                    "Analysis Title and Top Event are required."
                );

                return;
            }


            if (!analysisData.department) {

                Notify.warn(
                    "กรุณากรอก Department / Area",
                    "Department / Area is required."
                );

                return;
            }


            if (!analysisData.analysisDate) {

                Notify.warn(
                    "กรุณากรอกวันและเวลาของการวิเคราะห์",
                    "Analysis Date & Time is required."
                );

                return;
            }


            if (events.length === 0) {

                Notify.warn(
                    "กรุณาเพิ่ม Basic Event อย่างน้อย 1 รายการก่อนส่ง",
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

                Notify.warn(
                    "ทุก Basic Event ต้องมีชื่อ",
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


            Notify.success(
                "ส่งข้อมูล FTA ให้ผู้เชี่ยวชาญเรียบร้อยแล้ว",
                "FTA data submitted to Expert successfully."
            ).then(function () {

                // Same folder: safety-officer/analysis-history.html
                window.location.assign(
                    "analysis-history.html"
                );

            });

        }
    );


if (loadAnalysis()) {
    render();
}
