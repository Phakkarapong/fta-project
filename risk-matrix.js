/* =========================================================
   RISK-MATRIX — single source of truth for the ICAO-style
   discrete Likelihood (1-5) x Severity (A-E) risk matrix.
   Shared by every page that needs to compute or display a Risk
   Index/Level/Color (root: "risk-matrix.js", subfolders:
   "../risk-matrix.js").

   This table is safety-critical domain data consumed by three
   different pages (Expert's risk-assessment.html which AUTHORS
   it, Expert's own analysis-result.html, and Safety Officer's
   analysis-result-view.html which must recompute it defensively
   for legacy records) — kept in exactly one place so it cannot
   drift between copies.

   NOTE: expert/risk-assessment.js keeps its own local
   likelihoodData/severityData/faaRiskMatrix/getRiskIndex
   (already correct, already the authoring source, left
   untouched to avoid refactoring a large working file) — its
   values are IDENTICAL to the MATRIX below by construction; if
   you ever change one, change both.
   ========================================================= */

(function (window) {
    "use strict";

    var LIKELIHOOD_DATA = {
        5: { name: "Frequent", description: "Likely to occur many times (has occurred frequently)" },
        4: { name: "Occasional", description: "Likely to occur, but has occurred infrequently" },
        3: { name: "Remote", description: "Unlikely to occur, but possible" },
        2: { name: "Improbable", description: "Very unlikely to occur (not known to have occurred)" },
        1: { name: "Extremely Improbable", description: "Almost inconceivable that the event will occur" }
    };

    var SEVERITY_DATA = {
        5: { code: "A", name: "Catastrophic" },
        4: { code: "B", name: "Hazardous" },
        3: { code: "C", name: "Major" },
        2: { code: "D", name: "Minor" },
        1: { code: "E", name: "Negligible" }
    };

    // MATRIX[likelihood][severityValue] -> "HIGH" | "MEDIUM" | "LOW"
    // Transcribed verbatim from expert/risk-assessment.js's faaRiskMatrix —
    // verified cell-for-cell against the ICAO-style spec table.
    var MATRIX = {
        5: { 5: "HIGH", 4: "HIGH", 3: "HIGH", 2: "MEDIUM", 1: "MEDIUM" },
        4: { 5: "HIGH", 4: "HIGH", 3: "MEDIUM", 2: "MEDIUM", 1: "MEDIUM" },
        3: { 5: "HIGH", 4: "MEDIUM", 3: "MEDIUM", 2: "MEDIUM", 1: "LOW" },
        2: { 5: "MEDIUM", 4: "MEDIUM", 3: "MEDIUM", 2: "LOW", 1: "LOW" },
        1: { 5: "MEDIUM", 4: "LOW", 3: "LOW", 2: "LOW", 1: "LOW" }
    };

    var DESCRIPTION = {
        HIGH: "INTOLERABLE",
        MEDIUM: "TOLERABLE",
        LOW: "ACCEPTABLE"
    };

    var RANK = { HIGH: 0, MEDIUM: 1, LOW: 2 };

    function isValidLikelihood(l) {
        return Number.isFinite(l) && l >= 1 && l <= 5;
    }

    function isValidSeverity(s) {
        return Number.isFinite(s) && s >= 1 && s <= 5;
    }

    function getRiskIndex(likelihood, severity) {
        var l = Number(likelihood);
        var s = Number(severity);
        if (!isValidLikelihood(l) || !isValidSeverity(s)) return "";
        return String(l) + SEVERITY_DATA[s].code;
    }

    function getRiskLevel(likelihood, severity) {
        var l = Number(likelihood);
        var s = Number(severity);
        if (!isValidLikelihood(l) || !isValidSeverity(s)) return null;
        return MATRIX[l][s];
    }

    function getRiskDescription(level) {
        return DESCRIPTION[level] || "";
    }

    // theme.css class names — HIGH consistently resolves to the red
    // "special" classes (not the orange "high" ones some pages used
    // inconsistently before), so a HIGH result always reads as red
    // everywhere: badges, matrix cells, and plain text alike.
    function getRiskLevelClass(level) {
        if (level === "HIGH") return "status-badge-red";
        if (level === "MEDIUM") return "status-badge-amber";
        if (level === "LOW") return "status-badge-green";
        return "status-badge-slate";
    }

    function getRiskLevelTextClass(level) {
        if (level === "HIGH") return "text-risk-special";
        if (level === "MEDIUM") return "text-risk-medium";
        if (level === "LOW") return "text-risk-low";
        return "";
    }

    function getRiskMatrixCellClass(level) {
        if (level === "HIGH") return "risk-special-cell";
        if (level === "MEDIUM") return "risk-medium-cell";
        if (level === "LOW") return "risk-low-cell";
        return "";
    }

    // Resolved hex/rgba for Chart.js (which needs a literal color string,
    // not a CSS class) — read live so it always matches the active theme.
    function getRiskColorVar(level) {
        var cs = getComputedStyle(document.documentElement);
        var token = level === "HIGH" ? "--special"
            : level === "MEDIUM" ? "--medium"
                : level === "LOW" ? "--low"
                    : "--muted";
        return cs.getPropertyValue(token).trim();
    }

    // HIGH -> MEDIUM -> LOW, then likelihood desc, then severity desc.
    // Array.prototype.sort is spec-stable, so equal items keep their
    // original relative order for free — no explicit tie-breaker key
    // needed, and never randomized.
    function compareByRisk(a, b) {
        var ra = RANK[a && a.riskLevel] ?? 3;
        var rb = RANK[b && b.riskLevel] ?? 3;
        if (ra !== rb) return ra - rb;
        var la = Number(a && a.likelihood) || 0;
        var lb = Number(b && b.likelihood) || 0;
        if (lb !== la) return lb - la;
        var sa = Number(a && a.severity) || 0;
        var sb = Number(b && b.severity) || 0;
        return sb - sa;
    }

    // Backward-compat for records saved before this feature existed:
    // if riskLevel/riskIndex are missing but likelihood+severity are
    // present and valid, recompute them; otherwise report unavailable
    // instead of letting a page crash on undefined fields.
    function recomputeIfMissing(item) {
        if (!item) return { available: false };

        if (item.riskLevel && (item.riskIndex || item.referenceScore || item.riskScore)) {
            return {
                available: true,
                riskIndex: item.riskIndex || item.referenceScore || item.riskScore,
                riskLevel: item.riskLevel
            };
        }

        var level = getRiskLevel(item.likelihood, item.severity);
        if (!level) return { available: false };

        return {
            available: true,
            riskIndex: getRiskIndex(item.likelihood, item.severity),
            riskLevel: level
        };
    }

    window.RiskMatrix = {
        LIKELIHOOD_DATA: LIKELIHOOD_DATA,
        SEVERITY_DATA: SEVERITY_DATA,
        MATRIX: MATRIX,
        getRiskIndex: getRiskIndex,
        getRiskLevel: getRiskLevel,
        getRiskDescription: getRiskDescription,
        getRiskLevelClass: getRiskLevelClass,
        getRiskLevelTextClass: getRiskLevelTextClass,
        getRiskMatrixCellClass: getRiskMatrixCellClass,
        getRiskColorVar: getRiskColorVar,
        compareByRisk: compareByRisk,
        recomputeIfMissing: recomputeIfMissing
    };

})(window);
