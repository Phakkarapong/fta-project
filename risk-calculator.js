// =====================================================
// FAA RISK CALCULATOR
// =====================================================


// =====================================================
// FAA LIKELIHOOD
// =====================================================

const likelihoodData = {

    5: {
        name: "Frequent",
        description: "At least once per week"
    },

    4: {
        name: "Probable",
        description:
            "Less than once per week and at least once in 3 months"
    },

    3: {
        name: "Remote",
        description:
            "Less than once in 3 months and at least once in 3 years"
    },

    2: {
        name: "Extremely Remote",
        description:
            "Less than once in 3 years and at least once in 30 years"
    },

    1: {
        name: "Extremely Improbable",
        description:
            "Less than once in 30 years"
    }

};


// =====================================================
// FAA SEVERITY
// =====================================================

const severityData = {

    5: {
        name: "Catastrophic",
        description:
            "Catastrophic consequence"
    },

    4: {
        name: "Hazardous",
        description:
            "Hazardous consequence"
    },

    3: {
        name: "Major",
        description:
            "Major consequence"
    },

    2: {
        name: "Minor",
        description:
            "Minor consequence"
    },

    1: {
        name: "Minimal",
        description:
            "Minimal consequence"
    }

};


// =====================================================
// FAA RISK MATRIX
// =====================================================

const faaRiskMatrix = {

    5: {
        1: "LOW",
        2: "MEDIUM",
        3: "HIGH",
        4: "HIGH",
        5: "HIGH"
    },

    4: {
        1: "LOW",
        2: "MEDIUM",
        3: "HIGH",
        4: "HIGH",
        5: "HIGH"
    },

    3: {
        1: "LOW",
        2: "MEDIUM",
        3: "MEDIUM",
        4: "HIGH",
        5: "HIGH"
    },

    2: {
        1: "LOW",
        2: "LOW",
        3: "MEDIUM",
        4: "MEDIUM",
        5: "HIGH"
    },

    1: {
        1: "LOW",
        2: "LOW",
        3: "LOW",
        4: "MEDIUM",
        5: "SPECIAL"
    }

};


// =====================================================
// FAA ACCEPTABILITY
// =====================================================

function getAcceptability(riskLevel) {

    if (riskLevel === "LOW") {

        return {
            status: "ACCEPTABLE",
            mitigation: "No mitigation required"
        };

    }

    if (riskLevel === "MEDIUM") {

        return {
            status: "ACCEPTABLE",
            mitigation: "Mitigation recommended"
        };

    }

    if (riskLevel === "HIGH") {

        return {
            status: "UNACCEPTABLE",
            mitigation: "Mitigation required"
        };

    }

    return {
        status: "SPECIAL",
        mitigation:
            "Refer to applicable FAA criteria"
    };

}


// =====================================================
// ELEMENTS
// =====================================================

const probabilityInput =
    document.getElementById(
        "calculatorProbability"
    );

const severityInput =
    document.getElementById(
        "calculatorSeverity"
    );

const probabilityResult =
    document.getElementById(
        "calculatorProbabilityResult"
    );

const severityResult =
    document.getElementById(
        "calculatorSeverityResult"
    );

const scoreResult =
    document.getElementById(
        "calculatorScore"
    );

const levelResult =
    document.getElementById(
        "calculatorLevel"
    );

const acceptabilityResult =
    document.getElementById(
        "calculatorAcceptability"
    );

const mitigationResult =
    document.getElementById(
        "calculatorMitigation"
    );

const matrix =
    document.getElementById(
        "calculatorMatrix"
    );


// =====================================================
// CREATE FAA MATRIX
// =====================================================

function createMatrix() {

    if (!matrix) {
        return;
    }

    matrix.innerHTML = "";


    // =================================================
    // MATRIX GRID
    // =================================================

    matrix.style.display = "grid";

    matrix.style.gridTemplateColumns =
        "70px repeat(5, 1fr)";

    matrix.style.width = "100%";

    matrix.style.maxWidth = "700px";

    matrix.style.margin =
        "20px auto";


    // =================================================
    // CORNER
    // =================================================

    const corner =
        document.createElement("div");

    corner.className =
        "matrix-cell matrix-header";

    corner.textContent =
        "L / S";

    matrix.appendChild(
        corner
    );


    // =================================================
    // SEVERITY HEADER
    // =================================================

    for (
        let severity = 1;
        severity <= 5;
        severity++
    ) {

        const header =
            document.createElement("div");

        header.className =
            "matrix-cell matrix-header";

        header.textContent =
            severity;

        matrix.appendChild(
            header
        );

    }


    // =================================================
    // LIKELIHOOD ROWS
    // =================================================

    for (
        let likelihood = 5;
        likelihood >= 1;
        likelihood--
    ) {


        // =============================================
        // LIKELIHOOD LABEL
        // =============================================

        const label =
            document.createElement("div");

        label.className =
            "matrix-cell matrix-header";

        label.textContent =
            likelihood;

        matrix.appendChild(
            label
        );


        // =============================================
        // RISK CELLS
        // =============================================

        for (
            let severity = 1;
            severity <= 5;
            severity++
        ) {

            const riskLevel =
                faaRiskMatrix[
                    likelihood
                ][
                    severity
                ];


            const cell =
                document.createElement("div");

            cell.className =
                "matrix-cell";

            cell.textContent =
                riskLevel;


            // =========================================
            // COLOR
            // =========================================

            if (
                riskLevel === "LOW"
            ) {

                cell.classList.add(
                    "risk-low-cell"
                );

            }

            else if (
                riskLevel === "MEDIUM"
            ) {

                cell.classList.add(
                    "risk-medium-cell"
                );

            }

            else if (
                riskLevel === "HIGH"
            ) {

                cell.classList.add(
                    "risk-high-cell"
                );

            }

            else {

                cell.classList.add(
                    "risk-special-cell"
                );

            }


            // =========================================
            // SELECTED CELL
            // =========================================

            const selectedLikelihood =
                Number(
                    probabilityInput.value
                );

            const selectedSeverity =
                Number(
                    severityInput.value
                );


            if (

                likelihood ===
                selectedLikelihood

                &&

                severity ===
                selectedSeverity

            ) {

                cell.classList.add(
                    "selected-risk"
                );

            }


            matrix.appendChild(
                cell
            );

        }

    }

}


// =====================================================
// CALCULATE RISK
// =====================================================

function calculateRisk() {

    const likelihood =
        Number(
            probabilityInput.value
        );

    const severity =
        Number(
            severityInput.value
        );


    // =================================================
    // EMPTY
    // =================================================

    if (
        !likelihood ||
        !severity
    ) {

        probabilityResult.textContent =
            "-";

        severityResult.textContent =
            "-";

        scoreResult.textContent =
            "-";

        levelResult.textContent =
            "-";


        if (acceptabilityResult) {

            acceptabilityResult.textContent =
                "-";

        }


        if (mitigationResult) {

            mitigationResult.textContent =
                "-";

        }


        createMatrix();

        return;

    }


    // =================================================
    // FAA DATA
    // =================================================

    const likelihoodInfo =
        likelihoodData[
            likelihood
        ];

    const severityInfo =
        severityData[
            severity
        ];

    const riskLevel =
        faaRiskMatrix[
            likelihood
        ][
            severity
        ];

    const acceptability =
        getAcceptability(
            riskLevel
        );


    // =================================================
    // REFERENCE SCORE
    // =================================================

    const referenceScore =
        likelihood *
        severity;


    // =================================================
    // DISPLAY
    // =================================================

    probabilityResult.textContent =
        likelihood +
        " - " +
        likelihoodInfo.name;

    severityResult.textContent =
        severity +
        " - " +
        severityInfo.name;

    scoreResult.textContent =
        referenceScore;

    levelResult.textContent =
        riskLevel;


    // =================================================
    // ACCEPTABILITY
    // =================================================

    if (acceptabilityResult) {

        acceptabilityResult.textContent =
            acceptability.status;

        acceptabilityResult.className =
            "";

        if (
            acceptability.status ===
            "ACCEPTABLE"
        ) {

            acceptabilityResult.classList.add(
                "risk-low"
            );

        }

        else if (
            acceptability.status ===
            "UNACCEPTABLE"
        ) {

            acceptabilityResult.classList.add(
                "risk-high"
            );

        }

        else {

            acceptabilityResult.classList.add(
                "risk-special"
            );

        }

    }


    // =================================================
    // MITIGATION
    // =================================================

    if (mitigationResult) {

        mitigationResult.textContent =
            acceptability.mitigation;

    }


    // =================================================
    // RISK LEVEL COLOR
    // =================================================

    levelResult.className =
        "";

    if (
        riskLevel === "LOW"
    ) {

        levelResult.classList.add(
            "risk-low"
        );

    }

    else if (
        riskLevel === "MEDIUM"
    ) {

        levelResult.classList.add(
            "risk-medium"
        );

    }

    else if (
        riskLevel === "HIGH"
    ) {

        levelResult.classList.add(
            "risk-high"
        );

    }

    else {

        levelResult.classList.add(
            "risk-special"
        );

    }


    // =================================================
    // UPDATE MATRIX
    // =================================================

    createMatrix();

}


// =====================================================
// EVENT LISTENERS
// =====================================================

if (probabilityInput) {

    probabilityInput.addEventListener(
        "change",
        calculateRisk
    );

}


if (severityInput) {

    severityInput.addEventListener(
        "change",
        calculateRisk
    );

}


// =====================================================
// SAVE RESULT
// =====================================================

const saveButton =
    document.getElementById(
        "saveCalculatorBtn"
    );


if (saveButton) {

    saveButton.addEventListener(
        "click",
        function () {

            const likelihood =
                Number(
                    probabilityInput.value
                );

            const severity =
                Number(
                    severityInput.value
                );


            if (
                !likelihood ||
                !severity
            ) {

                alert(
                    "Please select Probability and Severity."
                );

                return;

            }


            const riskLevel =
                faaRiskMatrix[
                    likelihood
                ][
                    severity
                ];


            const acceptability =
                getAcceptability(
                    riskLevel
                );


            const referenceScore =
                likelihood *
                severity;


            // =========================================
            // SAVE
            // =========================================

            localStorage.setItem(
                "calculatorLikelihood",
                likelihood
            );

            localStorage.setItem(
                "calculatorLikelihoodName",
                likelihoodData[
                    likelihood
                ].name
            );

            localStorage.setItem(
                "calculatorSeverity",
                severity
            );

            localStorage.setItem(
                "calculatorSeverityName",
                severityData[
                    severity
                ].name
            );

            localStorage.setItem(
                "calculatorReferenceScore",
                referenceScore
            );

            localStorage.setItem(
                "calculatorRiskLevel",
                riskLevel
            );

            localStorage.setItem(
                "calculatorAcceptability",
                acceptability.status
            );

            localStorage.setItem(
                "calculatorMitigation",
                acceptability.mitigation
            );


            alert(
                "FAA Risk Assessment saved."
            );

        }
    );

}


// =====================================================
// BACK
// =====================================================

const backButton =
    document.getElementById(
        "backBtn"
    );


if (backButton) {

    backButton.addEventListener(
        "click",
        function () {

            window.location.href =
                "expert.html";

        }
    );

}


// =====================================================
// INITIAL LOAD
// =====================================================

createMatrix();