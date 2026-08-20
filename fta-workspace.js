// =====================================================
// SAFETY OFFICER — STEP 2
// FTA DATA ENTRY
// =====================================================

const STORAGE_KEY =
    "ftaAnalysisData";

let analysisData = null;
let gate = "OR";

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
            "Analysis data was not found. Please start a new analysis."
        );

        window.location.href =
            "new-analysis.html";

        return false;
    }

    gate =
        analysisData.ftaData?.gate ||
        "OR";

    if (!Array.isArray(
        analysisData.ftaData?.basicEvents
    )) {

        analysisData.ftaData = {
            ...(analysisData.ftaData || {}),
            gate: gate,
            intermediateEvents: [],
            basicEvents: []
        };

    }

    return true;
}


function saveAnalysis() {

    analysisData.createdAt =
        analysisData.createdAt || new Date().toISOString();
    analysisData.submittedAt =
        analysisData.submittedAt || null;
    analysisData.analysisStartedAt =
        analysisData.analysisStartedAt || null;
    analysisData.ftaCompletedAt =
        analysisData.ftaCompletedAt || null;
    analysisData.riskAssessmentAt =
        analysisData.riskAssessmentAt || null;
    analysisData.completedAt =
        analysisData.completedAt || null;

    analysisData.ftaData =
        analysisData.ftaData || {};

    analysisData.ftaData.gate =
        gate;

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


function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function renderPage() {

    document.getElementById(
        "analysisTitleDisplay"
    ).textContent =
        analysisData.analysisTitle || "-";

    document.getElementById(
        "topEventDisplay"
    ).textContent =
        analysisData.topEvent || "-";

    document.getElementById(
        "treeTopEvent"
    ).textContent =
        analysisData.topEvent || "-";

    document.getElementById(
        "treeGate"
    ).textContent =
        gate;

    document.getElementById(
        "gateBtn"
    ).textContent =
        `GATE: ${gate}`;

    renderEvents();

}


function renderEvents() {

    const events =
        analysisData.ftaData.basicEvents;

    const tree =
        document.getElementById(
            "basicEventsContainer"
        );

    const form =
        document.getElementById(
            "eventFormContainer"
        );

    tree.innerHTML = "";
    form.innerHTML = "";

    document.getElementById(
        "eventCount"
    ).textContent =
        `${events.length} EVENTS`;

    events.forEach(
        function(event, index) {

            // =============================================
            // LIVE TREE CARD
            // =============================================

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "rounded-xl border border-slate-200 bg-slate-50 p-4 relative";

            card.innerHTML = `
                <button
                    type="button"
                    class="delete-tree-event absolute top-3 right-3
                           w-7 h-7 rounded-lg
                           bg-red-50 hover:bg-red-100
                           border border-red-200
                           text-red-600 text-xs font-bold"
                    data-index="${index}"
                    title="Delete event">
                    ×
                </button>

                <div class="text-[10px] font-bold tracking-widest text-blue-600 pr-8">
                    BASIC EVENT E-${String(index + 1).padStart(2, "0")}
                </div>

                <div
                    class="live-event-name mt-2 font-bold text-slate-800
                           break-words pr-8"
                    data-index="${index}">
                    ${escapeHtml(
                        event.name ||
                        "Unnamed Event"
                    )}
                </div>

                <p
                    class="live-event-description mt-2 text-xs text-slate-500
                           leading-relaxed break-words"
                    data-index="${index}">
                    ${escapeHtml(
                        event.description ||
                        "No description"
                    )}
                </p>
            `;

            tree.appendChild(card);


            // =============================================
            // EDIT FORM
            // =============================================

            const wrapper =
                document.createElement(
                    "div"
                );

            wrapper.className =
                "p-4 rounded-xl bg-slate-950/60 border border-slate-800";

            wrapper.innerHTML = `
                <div class="flex items-center justify-between gap-3 mb-3">

                    <div class="text-xs font-bold text-cyan-400">
                        E-${String(index + 1).padStart(2, "0")}
                    </div>

                    <button
                        type="button"
                        class="remove-event-btn px-3 py-1.5 rounded-lg
                               bg-red-500/10 border border-red-500/20
                               text-red-300 hover:bg-red-500/20
                               text-[10px] font-bold"
                        data-index="${index}">
                        DELETE EVENT
                    </button>

                </div>

                <label class="block text-xs font-semibold text-slate-300 mb-2">
                    Event Name
                </label>

                <input
                    type="text"
                    class="event-name-input w-full bg-slate-950 border border-slate-800
                           rounded-xl px-3 py-2.5 text-sm text-white
                           focus:outline-none focus:border-cyan-500"
                    data-index="${index}"
                    value="${escapeHtml(
                        event.name || ""
                    )}"
                    placeholder="ชื่อสาเหตุ">

                <label class="block text-xs font-semibold text-slate-300 mt-4 mb-2">
                    Event Description
                </label>

                <textarea
                    class="event-description-input w-full bg-slate-950 border border-slate-800
                           rounded-xl px-3 py-2.5 text-sm text-white
                           focus:outline-none focus:border-cyan-500 resize-none"
                    data-index="${index}"
                    rows="3"
                    placeholder="รายละเอียดของสาเหตุ">${escapeHtml(
                        event.description || ""
                    )}</textarea>
            `;

            form.appendChild(wrapper);

        }
    );

    updateLiveStatus("LIVE EDIT — changes are saved automatically");
}


function updateLiveStatus(message, isSaved = false) {

    const status =
        document.getElementById(
            "liveSaveStatus"
        );

    if (!status) return;

    status.textContent =
        isSaved
            ? "● SAVED — changes saved automatically"
            : `● ${message}`;

    status.className =
        isSaved
            ? "mt-4 text-[10px] font-bold text-emerald-400"
            : "mt-4 text-[10px] font-bold text-cyan-400";

}


function addBasicEvent() {

    analysisData.ftaData.basicEvents.push({

        id:
            `E-${Date.now()}`,

        name:
            "",

        description:
            "",

        probability:
            null

    });

    saveAnalysis();

    renderEvents();

    // Focus the newest event immediately.
    const inputs =
        document.querySelectorAll(
            ".event-name-input"
        );

    const newest =
        inputs[inputs.length - 1];

    if (newest) {
        newest.focus();
    }

}


function removeBasicEvent(index) {

    analysisData.ftaData.basicEvents.splice(
        index,
        1
    );

    saveAnalysis();

    renderEvents();

}


function collectEventInputs() {

    document
        .querySelectorAll(
            ".event-name-input"
        )
        .forEach(
            function(input) {

                const index =
                    Number(
                        input.dataset.index
                    );

                if (
                    analysisData.ftaData.basicEvents[index]
                ) {

                    analysisData
                        .ftaData
                        .basicEvents[index]
                        .name =
                        input.value.trim();

                }

            }
        );

    document
        .querySelectorAll(
            ".event-description-input"
        )
        .forEach(
            function(input) {

                const index =
                    Number(
                        input.dataset.index
                    );

                if (
                    analysisData.ftaData.basicEvents[index]
                ) {

                    analysisData
                        .ftaData
                        .basicEvents[index]
                        .description =
                        input.value.trim();

                }

            }
        );

}


function updateEventLive(index, field, value) {

    const event =
        analysisData.ftaData.basicEvents[index];

    if (!event) return;

    event[field] =
        value;

    saveAnalysis();

    // Update only the changed tree content.
    const nameElement =
        document.querySelector(
            `.live-event-name[data-index="${index}"]`
        );

    const descriptionElement =
        document.querySelector(
            `.live-event-description[data-index="${index}"]`
        );

    if (nameElement && field === "name") {

        nameElement.textContent =
            value ||
            "Unnamed Event";

    }

    if (
        descriptionElement &&
        field === "description"
    ) {

        descriptionElement.textContent =
            value ||
            "No description";

    }

    updateLiveStatus(
        "LIVE EDIT — saving...",
        false
    );

    window.clearTimeout(
        window.__ftaLiveSaveTimer
    );

    window.__ftaLiveSaveTimer =
        window.setTimeout(
            function() {

                saveAnalysis();

                updateLiveStatus(
                    "LIVE EDIT",
                    true
                );

            },
            250
        );

}


document.addEventListener(
    "input",
    function(event) {

        if (
            event.target.matches(
                ".event-name-input"
            )
        ) {

            updateEventLive(
                Number(
                    event.target.dataset.index
                ),
                "name",
                event.target.value
            );

            return;
        }

        if (
            event.target.matches(
                ".event-description-input"
            )
        ) {

            updateEventLive(
                Number(
                    event.target.dataset.index
                ),
                "description",
                event.target.value
            );

        }

    }
);


document
    .getElementById(
        "gateBtn"
    )
    .addEventListener(
        "click",
        function() {

            collectEventInputs();

            gate =
                gate === "OR"
                    ? "AND"
                    : "OR";

            saveAnalysis();

            renderPage();

        }
    );


document
    .getElementById(
        "addEventBtn"
    )
    .addEventListener(
        "click",
        function() {

            collectEventInputs();

            addBasicEvent();

        }
    );


document.addEventListener(
    "click",
    function(event) {

        const button =
            event.target.closest(
                ".remove-event-btn, .delete-tree-event"
            );

        if (!button) {
            return;
        }

        const index =
            Number(
                button.dataset.index
            );

        const eventData =
            analysisData.ftaData.basicEvents[index];

        const eventName =
            eventData?.name ||
            `E-${String(index + 1).padStart(2, "0")}`;

        if (
            !confirm(
                `Delete "${eventName}"?`
            )
        ) {
            return;
        }

        collectEventInputs();

        removeBasicEvent(index);

        updateLiveStatus(
            "EVENT DELETED — changes saved",
            true
        );

    }
);


document
    .getElementById(
        "reviewBtn"
    )
    .addEventListener(
        "click",
        function() {

            collectEventInputs();

            const events =
                analysisData.ftaData.basicEvents;

            for (
                let i = 0;
                i < events.length;
                i++
            ) {

                if (!events[i].name) {

                    alert(
                        `Please enter the name of Basic Event E-${String(i + 1).padStart(2, "0")}.`
                    );

                    return;
                }

            }

            analysisData.status =
                "DRAFT";

            saveAnalysis();

            window.location.href =
                "fta-review.html";

        }
    );


document
    .getElementById(
        "backBtn"
    )
    .addEventListener(
        "click",
        function() {

            collectEventInputs();

            saveAnalysis();

            window.location.href =
                "new-analysis.html";

        }
    );


if (loadAnalysis()) {
    renderPage();
}
