// =====================================================
// SAFETY OFFICER — STEP 1
// NEW ANALYSIS
// =====================================================

const createFtaBtn =
    document.getElementById("createFtaBtn");

const backBtn =
    document.getElementById("backBtn");


function getFieldValue(id) {

    const element =
        document.getElementById(id);

    return element
        ? element.value.trim()
        : "";

}


function createAnalysisId() {

    const now =
        new Date();

    const stamp =
        now.toISOString()
            .replace(/\D/g, "")
            .slice(0, 14);

    return `FTA-${stamp}`;

}


function getWorkspacePath() {

    const path =
        window.location.pathname
            .replace(/\\/g, "/");

    if (
        path.includes(
            "/safety-officer/"
        )
    ) {

        return "fta-workspace.html";

    }

    return "safety-officer/fta-workspace.html";

}


if (createFtaBtn) {

    createFtaBtn.addEventListener(
        "click",
        function (event) {

            event.preventDefault();
            event.stopPropagation();


            const analysisTitle =
                getFieldValue(
                    "analysisTitle"
                );

            const topEvent =
                getFieldValue(
                    "topEvent"
                );

            const description =
                getFieldValue(
                    "description"
                );


            if (
                !analysisTitle ||
                !topEvent
            ) {

                alert(
                    "Please enter Analysis Title and Top Event."
                );

                return;

            }


            const analysisData = {

                id:
                    createAnalysisId(),

                analysisTitle:
                    analysisTitle,

                department:
                    getFieldValue(
                        "department"
                    ),

                officerName:
                    getFieldValue(
                        "officerName"
                    ) ||
                    "Safety Officer",

                topEvent:
                    topEvent,

                description:
                    description,

                ftaData: {

                    gate:
                        "OR",

                    intermediateEvents:
                        [],

                    basicEvents:
                        []

                },

                status:
                    "DRAFT",

                createdBy:
                    "Safety Officer",

                createdAt:
                    new Date().toISOString(),

                submittedAt:
                    null,

                analysisStartedAt:
                    null,

                ftaCompletedAt:
                    null,

                riskAssessmentAt:
                    null,

                completedAt:
                    null,

                expert:
                    null,

                analysisResult:
                    null,

                riskAssessment:
                    null

            };


            const payload =
                JSON.stringify(
                    analysisData
                );


            // Canonical current record.
            sessionStorage.setItem(
                "ftaAnalysisData",
                payload
            );

            localStorage.setItem(
                "ftaAnalysisData",
                payload
            );


            // Canonical record list.
            let records = [];

            try {

                const raw =
                    localStorage.getItem(
                        "ftaAnalysisRecords"
                    );

                records =
                    raw
                        ? JSON.parse(raw)
                        : [];

            } catch (error) {

                records = [];

            }


            if (!Array.isArray(records)) {
                records = [];
            }


            records =
                records.filter(
                    function(record) {

                        return String(
                            record?.id
                        ) !== String(
                            analysisData.id
                        );

                    }
                );


            records.unshift(
                analysisData
            );


            localStorage.setItem(
                "ftaAnalysisRecords",
                JSON.stringify(
                    records
                )
            );


            // Explicitly route into the Safety Officer workspace.
            window.location.assign(
                getWorkspacePath()
            );

        }
    );

}


if (backBtn) {

    backBtn.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            const path =
                window.location.pathname
                    .replace(/\\/g, "/");


            if (
                path.includes(
                    "/safety-officer/"
                )
            ) {

                window.location.assign(
                    "safety-officer.html"
                );

            } else {

                window.location.assign(
                    "safety-officer/safety-officer.html"
                );

            }

        }
    );

}
