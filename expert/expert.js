// =====================================================
// EXPERT DASHBOARD
// =====================================================

// ANALYSIS
// Expert enters the Analysis step through the Queue.
const ftaAnalysisBtn =
    document.getElementById(
        "ftaAnalysisBtn"
    );

if (ftaAnalysisBtn) {

    ftaAnalysisBtn.addEventListener(
        "click",
        function () {

            window.location.href =
                "analysis-queue.html";

        }
    );

}


// RISK ASSESSMENT
// Important: Risk is Step 2.
// The dashboard button must NOT skip Analysis.
// It opens Analysis Queue first.
const riskAssessmentBtn =
    document.getElementById(
        "riskAssessmentBtn"
    );

if (riskAssessmentBtn) {

    riskAssessmentBtn.addEventListener(
        "click",
        function () {

            window.location.href =
                "analysis-queue.html";

        }
    );

}


// RISK CALCULATOR
const riskCalculatorBtn =
    document.getElementById(
        "riskCalculatorBtn"
    );

if (riskCalculatorBtn) {

    riskCalculatorBtn.addEventListener(
        "click",
        function () {

            window.location.href =
                "risk-calculator.html";

        }
    );

}


// ANALYSIS RESULT
const resultBtn =
    document.getElementById(
        "resultBtn"
    );

if (resultBtn) {

    resultBtn.addEventListener(
        "click",
        function () {

            window.location.href =
                "analysis-result.html";

        }
    );

}


// ANALYSIS RESULT HISTORY
const resultHistoryBtn =
    document.getElementById(
        "resultHistoryBtn"
    );

if (resultHistoryBtn) {

    resultHistoryBtn.addEventListener(
        "click",
        function () {

            window.location.href =
                "analysis-result-history.html";

        }
    );

}


// BACK TO ROLE SELECTION
const backBtn =
    document.getElementById(
        "backBtn"
    );

if (backBtn) {

    backBtn.addEventListener(
        "click",
        function () {

            window.location.href =
                "../index.html";

        }
    );

}
