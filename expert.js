// =====================================================
// EXPERT DASHBOARD
// =====================================================

// FTA ANALYSIS
// Expert should enter through the Analysis Queue.
// The Queue receives PENDING_EXPERT records from Safety Officer.
const ftaAnalysisBtn =
    document.getElementById("ftaAnalysisBtn");

if (ftaAnalysisBtn) {
    ftaAnalysisBtn.addEventListener("click", function () {
        window.location.href = "analysis-queue.html";
    });
}


// RISK ASSESSMENT
const riskAssessmentBtn =
    document.getElementById("riskAssessmentBtn");

if (riskAssessmentBtn) {
    riskAssessmentBtn.addEventListener("click", function () {
        window.location.href = "risk-assessment.html";
    });
}


// RISK CALCULATOR
const riskCalculatorBtn =
    document.getElementById("riskCalculatorBtn");

if (riskCalculatorBtn) {
    riskCalculatorBtn.addEventListener("click", function () {
        window.location.href = "risk-calculator.html";
    });
}


// ANALYSIS RESULT
const resultBtn =
    document.getElementById("resultBtn");

if (resultBtn) {
    resultBtn.addEventListener("click", function () {
        window.location.href = "analysis-result.html";
    });
}


// BACK TO ROLE SELECTION
// expert.html is inside /expert/, so root index is ../index.html
const backBtn = document.getElementById("backBtn");

if (backBtn) {
    backBtn.addEventListener("click", function () {
        window.location.href = "../index.html";
    });
}

// =====================================================
// FINAL EXPERT FLOW — SINGLE ENTRY PATH
// =====================================================
(function enforceExpertFlow() {
    const directRisk = document.getElementById("riskAssessmentBtn");
    const directCalculator = document.getElementById("riskCalculatorBtn");

    if (directRisk) directRisk.style.display = "none";
    if (directCalculator) directCalculator.style.display = "none";
})();
