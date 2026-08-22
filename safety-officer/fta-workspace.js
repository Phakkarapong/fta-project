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

        Notify.error(
            "ไม่พบข้อมูลการวิเคราะห์ กรุณาเริ่มการวิเคราะห์ใหม่",
            "Analysis data was not found."
        ).then(function () {
            window.location.href =
                "new-analysis.html";
        });

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


// Single data table (one row per Basic Event) replaces the old dual
// rendering (a read-only "live tree" card grid duplicating an editable
// card list below it). Each row's "แก้ไข" action reveals a detail row
// directly below it containing the same edit fields as before — same
// input classes/data-index attributes, so collectEventInputs() keeps
// working unchanged; it just reads whichever inputs are in the DOM,
// visible or not.
function renderEvents() {

    const events =
        analysisData.ftaData.basicEvents;

    const container =
        document.getElementById(
            "eventFormContainer"
        );

    if (!container) return;

    document.getElementById(
        "eventCount"
    ).textContent =
        `${events.length} EVENTS`;

    if (!events.length) {
        container.innerHTML =
            '<div class="dt-empty">ยังไม่มี Basic Event — กด "+ ADD BASIC EVENT" เพื่อเริ่มต้น</div>';
        updateLiveStatus("LIVE EDIT — changes are saved automatically");
        return;
    }

    const rowsHtml = events.map(function (event, index) {

        const idLabel =
            `E-${String(index + 1).padStart(2, "0")}`;

        return `
            <tr class="dt-row" data-summary-index="${index}">
                <td style="width:70px;"><span class="status-badge status-badge-blue">${idLabel}</span></td>
                <td>
                    <div class="live-event-name" style="font-weight:800;color:var(--ink);" data-index="${index}">
                        ${escapeHtml(event.name || "Unnamed Event")}
                    </div>
                </td>
                <td>
                    <div class="live-event-description" style="color:var(--muted);font-size:12px;" data-index="${index}">
                        ${escapeHtml(event.description || "No description")}
                    </div>
                </td>
                <td class="text-right">
                    <div class="dt-action-group">
                        <button type="button" class="dt-action-btn dt-action-btn-primary toggle-edit-row" data-index="${index}">
                            <span class="dt-action-icon">${window.Icon ? window.Icon("edit", "", 12) : ""}</span><span>แก้ไข</span>
                        </button>
                        <button type="button" class="dt-action-btn dt-action-btn-danger remove-event-btn" data-index="${index}">
                            <span class="dt-action-icon">${window.Icon ? window.Icon("trash", "", 12) : ""}</span><span>ลบ</span>
                        </button>
                    </div>
                </td>
            </tr>
            <tr class="hidden" data-detail-index="${index}">
                <td colspan="4" style="background:var(--canvas);">
                    <div style="padding:16px 4px;">

                        <div class="ui-field">
                            <label class="ui-label">Event Name</label>
                            <input type="text" class="event-name-input ui-input" data-index="${index}"
                                   value="${escapeHtml(event.name || "")}" placeholder="ชื่อสาเหตุ">
                        </div>

                        <div class="ui-field">
                            <label class="ui-label">Event Description</label>
                            <textarea class="event-description-input ui-textarea" data-index="${index}" rows="2"
                                      placeholder="รายละเอียดของสาเหตุ">${escapeHtml(event.description || "")}</textarea>
                        </div>

                        <div class="ui-field" style="margin-bottom:0;">
                            <label class="ui-label">Existing Risk Control</label>
                            <textarea class="event-risk-control-input ui-textarea" data-index="${index}" rows="3"
                                      placeholder="Existing risk control">${escapeHtml(event.existingRiskControl || event.riskControl || "")}</textarea>
                        </div>

                        <!-- Safety Mitigation / Risk Owner / Type of Hazard are no
                             longer collected here — they belong to Safety Officer
                             → Analysis Result, entered after the Expert's Risk
                             Assessment is complete, not before it. -->

                    </div>
                </td>
            </tr>
        `;
    }).join("");

    container.innerHTML = `
        <div class="data-table-scroll">
            <table class="data-table">
                <thead>
                    <tr><th>ID</th><th>Name</th><th>Description</th><th class="text-right">Actions</th></tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        </div>
    `;

    updateLiveStatus("LIVE EDIT — changes are saved automatically");
}


// Toggle a row's detail (edit-fields) row open/closed.
document.addEventListener("click", function (event) {
    const btn = event.target.closest(".toggle-edit-row");
    if (!btn) return;

    const index = btn.dataset.index;
    const detailRow = document.querySelector(`tr[data-detail-index="${index}"]`);
    if (detailRow) detailRow.classList.toggle("hidden");
});


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
            ? "mt-4 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"
            : "mt-4 text-[10px] font-bold text-jorpro-blue dark:text-jorpro-blueDark";

}


function addBasicEvent() {

    analysisData.ftaData.basicEvents.push({

        id:
            `E-${Date.now()}`,

        name:
            "",

        description:
            "",

        existingRiskControl:
            "",

        // Safety Mitigation / Risk Owner / Type of Hazard are entered later,
        // by Safety Officer, on the Analysis Result page — not here.

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

                    analysisData.ftaData.basicEvents[index].description =
                        input.value.trim();

                }

            }
        );

    document.querySelectorAll(".event-risk-control-input").forEach(function(input) {
        const index = Number(input.dataset.index);
        if (analysisData.ftaData.basicEvents[index]) {
            analysisData.ftaData.basicEvents[index].existingRiskControl = input.value.trim();
        }
    });

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

        if (event.target.matches(".event-description-input")) {
            updateEventLive(Number(event.target.dataset.index), "description", event.target.value);
            return;
        }

        if (event.target.matches(".event-risk-control-input")) {
            updateEventLive(Number(event.target.dataset.index), "existingRiskControl", event.target.value);
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
    async function(event) {

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

        const confirmed =
            await Notify.confirmDelete({
                title: `ลบ "${eventName}"?`,
                text: "การลบ Basic Event นี้ไม่สามารถย้อนกลับได้"
            });

        if (!confirmed) {
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

                    Notify.warn(
                        `กรุณากรอกชื่อของ Basic Event E-${String(i + 1).padStart(2, "0")}`,
                        "Please enter the name of the Basic Event."
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
