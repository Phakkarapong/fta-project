// =====================================================
// ANALYSIS REVIEW - STEP 3
// =====================================================

const STORAGE_KEY = "ftaAnalysisData";

function loadAnalysisData() {
    try {
        const sessionData = sessionStorage.getItem(STORAGE_KEY);
        if (sessionData) return JSON.parse(sessionData);
    } catch (error) {
        console.warn("Session data error:", error);
    }

    try {
        const localData = localStorage.getItem(STORAGE_KEY);
        if (localData) return JSON.parse(localData);
    } catch (error) {
        console.warn("Local data error:", error);
    }

    return {
        analysisTitle: localStorage.getItem("analysisTitle") || "",
        topEvent: localStorage.getItem("topEvent") || "",
        description: localStorage.getItem("description") || "",
        mainGate: localStorage.getItem("mainGateType") || "OR",
        basicEvents: []
    };
}

function saveAnalysisData(data) {
    const payload = {
        ...data,
        updatedAt: new Date().toISOString()
    };

    sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(payload)
    );

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(payload)
    );

    return payload;
}

const data = loadAnalysisData();

const analysisTitle = document.getElementById("analysisTitle");
const topEvent = document.getElementById("topEvent");
const description = document.getElementById("description");
const eventCount = document.getElementById("eventCount");
const gateType = document.getElementById("gateType");
const eventList = document.getElementById("eventList");
const probabilityList = document.getElementById("probabilityList");
const resultCard = document.getElementById("resultCard");
const resultGate = document.getElementById("resultGate");
const topProbability = document.getElementById("topProbability");
const topPercentage = document.getElementById("topPercentage");
const calculationMessage = document.getElementById("calculationMessage");
const reviewStatus = document.getElementById("reviewStatus");

const events =
    Array.isArray(data.basicEvents)
        ? data.basicEvents
        : (Array.isArray(data.events) ? data.events : []);

const gate =
    (
        data.mainGate ||
        data.gate ||
        localStorage.getItem("mainGateType") ||
        "OR"
    ).toUpperCase();

if (analysisTitle) {
    analysisTitle.textContent = data.analysisTitle || "-";
}

if (topEvent) {
    topEvent.textContent = data.topEvent || "-";
}

if (description) {
    description.textContent = data.description || "-";
}

if (eventCount) {
    eventCount.textContent = events.length;
}

if (gateType) {
    gateType.textContent = gate;
}

if (eventList) {
    eventList.innerHTML = "";

    if (events.length === 0) {
        eventList.innerHTML =
            `<div class="review-event">
                <div class="review-event-number">!</div>
                <div class="review-event-information">
                    <strong>No Basic Events</strong>
                    <span>ยังไม่มี Basic Event จาก Fault Tree Workspace</span>
                </div>
            </div>`;
    } else {
        events.forEach(function (event, index) {
            const row = document.createElement("div");
            row.className = "review-event";

            const number = document.createElement("div");
            number.className = "review-event-number";
            number.textContent = index + 1;

            const info = document.createElement("div");
            info.className = "review-event-information";

            const name = document.createElement("strong");
            name.textContent =
                event.name ||
                event.label ||
                `Event ${index + 1}`;

            const prob = document.createElement("span");
            prob.textContent =
                event.probability !== null &&
                event.probability !== undefined
                    ? `Probability: ${event.probability}`
                    : "Probability: Enter below";

            info.appendChild(name);
            info.appendChild(prob);

            row.appendChild(number);
            row.appendChild(info);

            eventList.appendChild(row);
        });
    }
}

if (probabilityList) {
    probabilityList.innerHTML = "";

    events.forEach(function (event, index) {
        const wrapper = document.createElement("div");

        const label = document.createElement("label");
        label.textContent =
            event.name ||
            event.label ||
            `Event ${index + 1}`;

        const input = document.createElement("input");
        input.type = "number";
        input.step = "0.000001";
        input.min = "0";
        input.max = "1";
        input.id = `probability-${index}`;
        input.value =
            event.probability !== null &&
            event.probability !== undefined
                ? event.probability
                : "";
        input.placeholder = "0.000001";

        wrapper.appendChild(label);
        wrapper.appendChild(input);

        probabilityList.appendChild(wrapper);
    });
}

function calculateFTA() {
    if (events.length === 0) {
        alert(
            "No Basic Events were received from Fault Tree Workspace."
        );
        return;
    }

    const probabilities = [];

    events.forEach(function (_, index) {
        const input =
            document.getElementById(
                `probability-${index}`
            );

        const value =
            input ? Number(input.value) : NaN;

        if (
            Number.isFinite(value) &&
            value >= 0 &&
            value <= 1
        ) {
            probabilities.push(value);
        }
    });

    if (probabilities.length !== events.length) {
        alert(
            "Please enter a valid probability (0-1) for every Basic Event."
        );
        return;
    }

    let result;

    if (gate === "AND") {
        result = probabilities.reduce(
            (total, value) => total * value,
            1
        );
    } else {
        result =
            1 -
            probabilities.reduce(
                (total, value) => total * (1 - value),
                1
            );
    }

    const updatedEvents =
        events.map(function (event, index) {
            const input =
                document.getElementById(
                    `probability-${index}`
                );

            return {
                ...event,
                probability: Number(input.value)
            };
        });

    const updatedData =
        saveAnalysisData({
            ...data,
            mainGate: gate,
            gate: gate,
            basicEvents: updatedEvents,
            events: updatedEvents,
            topProbability: result,
            reviewStatus: "CALCULATED"
        });

    // Compatibility for the existing Risk Assessment page.
    localStorage.setItem(
        "analysisTitle",
        updatedData.analysisTitle || ""
    );
    localStorage.setItem(
        "topEvent",
        updatedData.topEvent || ""
    );
    localStorage.setItem(
        "description",
        updatedData.description || ""
    );
    localStorage.setItem(
        "mainGateType",
        gate
    );
    localStorage.setItem(
        "ftaTopProbability",
        String(result)
    );
    localStorage.setItem(
        "ftaAnalysisResult",
        JSON.stringify({
            mainGate: gate,
            topEvent: updatedData.topEvent || "",
            topProbability: result,
            events: updatedEvents
        })
    );

    if (resultGate) {
        resultGate.textContent = gate;
    }

    if (topProbability) {
        topProbability.textContent =
            result.toExponential(4);
    }

    if (topPercentage) {
        topPercentage.textContent =
            (result * 100).toFixed(4) + "%";
    }

    if (calculationMessage) {
        calculationMessage.textContent =
            `FTA calculation completed using ${gate} gate.`;
    }

    if (resultCard) {
        resultCard.style.display = "block";
    }

    if (reviewStatus) {
        reviewStatus.textContent =
            "Analysis data loaded and FTA probability calculated successfully.";
    }
}

const calculateBtn =
    document.getElementById("calculateBtn");

if (calculateBtn) {
    calculateBtn.addEventListener(
        "click",
        calculateFTA
    );
}

const riskBtn =
    document.getElementById("riskBtn");

if (riskBtn) {
    riskBtn.addEventListener(
        "click",
        function () {
            const current = loadAnalysisData();

            if (!current.topEvent) {
                alert("Top Event data is missing.");
                return;
            }

            window.location.href =
                "risk-assessment.html";
        }
    );
}

const confirmBtn =
    document.getElementById("confirmAnalysisBtn");

if (confirmBtn) {
    confirmBtn.addEventListener(
        "click",
        function () {
            const current = loadAnalysisData();

            saveAnalysisData({
                ...current,
                reviewStatus: "CONFIRMED",
                reviewedAt: new Date().toISOString()
            });

            if (reviewStatus) {
                reviewStatus.textContent =
                    "Analysis confirmed successfully.";
            }
        }
    );
}

const backBtn =
    document.getElementById("backBtn");

if (backBtn) {
    backBtn.addEventListener(
        "click",
        function () {
            window.location.href =
                "safety-officer/fta-workspace.html";
        }
    );
}

if (reviewStatus) {
    reviewStatus.textContent =
        data.topEvent
            ? "Analysis data loaded successfully. Review the Fault Tree and enter event probabilities."
            : "No analysis data found. Please return to New Analysis.";
}
