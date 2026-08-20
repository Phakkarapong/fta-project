
// =====================================================
// SAFETY OFFICER DASHBOARD
// =====================================================

const newAnalysisBtn =
    document.getElementById(
        "newAnalysisBtn"
    );

if (newAnalysisBtn) {

    newAnalysisBtn.addEventListener(
        "click",
        function() {

            window.location.href =
                "new-analysis.html";

        }
    );

}


const historyBtn =
    document.getElementById(
        "historyBtn"
    );

if (historyBtn) {

    historyBtn.addEventListener(
        "click",
        function() {

            window.location.href =
                "analysis-history.html";

        }
    );

}


const analysisResultBtn =
    document.getElementById(
        "analysisResultBtn"
    );

if (analysisResultBtn) {

    analysisResultBtn.addEventListener(
        "click",
        function() {

            // Open the read-only Safety Officer result page.
            // The page itself selects the latest completed Expert result.
            window.location.href =
                "analysis-result-view.html";

        }
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

            window.location.href =
                "../index.html";

        }
    );

}
