// =====================================================
// SAFETY OFFICER — STEP 1
// NEW ANALYSIS
// =====================================================

const createFtaBtn =
    document.getElementById("createFtaBtn");

const backBtn =
    document.getElementById("backBtn");


function getValue(id) {

    const el =
        document.getElementById(id);

    return el
        ? el.value.trim()
        : "";

}


function setDefaultDateTime() {

    const input =
        document.getElementById(
            "analysisDate"
        );

    if (!input || input.value) {
        return;
    }

    const now =
        new Date();

    const local =
        new Date(
            now.getTime() -
            now.getTimezoneOffset() * 60000
        );

    input.value =
        local.toISOString()
            .slice(0, 16);

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


if (createFtaBtn) {

    createFtaBtn.addEventListener(
        "click",
        function (event) {

            event.preventDefault();
            event.stopPropagation();

            const analysisTitle =
                getValue("analysisTitle");

            const department =
                getValue("department");

            const analysisDate =
                getValue("analysisDate");

            const topEvent =
                getValue("topEvent");

            const description =
                getValue("description");


            if (
                !analysisTitle ||
                !department ||
                !analysisDate ||
                !topEvent
            ) {

                Notify.warn(
                    "กรุณากรอก Analysis Title, Department / Area, วันเวลา และ Top Event ให้ครบถ้วน",
                    "Please enter Analysis Title, Department / Area, Date & Time, and Top Event."
                );

                return;
            }


            const now =
                new Date();


            const analysisData = {

                id:
                    createAnalysisId(),

                analysisTitle:
                    analysisTitle,

                department:
                    department,

                analysisDate:
                    analysisDate,

                officerName:
                    getValue(
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
                    now.toISOString(),

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


            sessionStorage.setItem(
                "ftaAnalysisData",
                payload
            );

            localStorage.setItem(
                "ftaAnalysisData",
                payload
            );


            let records = [];

            try {

                records =
                    JSON.parse(
                        localStorage.getItem(
                            "ftaAnalysisRecords"
                        )
                    ) || [];

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


            window.location.assign(
                "fta-workspace.html"
            );

        }
    );

}


if (backBtn) {

    backBtn.addEventListener(
        "click",
        function () {

            window.location.assign(
                "safety-officer.html"
            );

        }
    );

}


setDefaultDateTime();
