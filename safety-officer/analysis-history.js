// =====================================================
// SAFETY OFFICER — ANALYSIS HISTORY / CANONICAL BRIDGE
// =====================================================

const RECORDS_KEY = "ftaAnalysisRecords";
const DATA_KEY = "ftaAnalysisData";

function loadRecords() {
    try {
        const value = JSON.parse(
            localStorage.getItem(RECORDS_KEY)
        );
        return Array.isArray(value) ? value : [];
    } catch (error) {
        console.warn("Unable to load analysis records:", error);
        return [];
    }
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function normalizeRecord(record) {
    const source =
        record?.analysisData ||
        record?.analysis ||
        record ||
        {};

    const ftaSource =
        source.ftaData ||
        record?.ftaData ||
        {};

    const basicEvents =
        Array.isArray(ftaSource.basicEvents)
            ? ftaSource.basicEvents
            : Array.isArray(source.basicEvents)
                ? source.basicEvents
                : Array.isArray(record?.basicEvents)
                    ? record.basicEvents
                    : [];

    const normalizedEvents =
        basicEvents.map((event, index) => ({
            id:
                event?.id ||
                `E-${String(index + 1).padStart(2, "0")}`,
            name:
                event?.name ||
                event?.eventName ||
                `Basic Event ${index + 1}`,
            description:
                event?.description ||
                event?.detail ||
                "",
            probability:
                event?.probability ??
                null,

            existingRiskControl:
                event?.existingRiskControl ||
                event?.riskControl ||
                event?.existing_risk_control ||
                "",

            safetyMitigation:
                event?.safetyMitigation ||
                event?.safetyOfficerMitigation ||
                event?.safety_mitigation ||
                "",

            riskOwner:
                event?.riskOwner ||
                event?.risk_owner ||
                ""
        }));

    return {
        ...source,

        id:
            source.id ||
            record?.id ||
            `FTA-${Date.now()}`,

        analysisTitle:
            source.analysisTitle ||
            source.title ||
            record?.analysisTitle ||
            record?.title ||
            "",

        topEvent:
            source.topEvent ||
            source.top_event ||
            record?.topEvent ||
            record?.top_event ||
            "",

        department:
            source.department ||
            source.departmentArea ||
            source.area ||
            source.department_area ||
            record?.department ||
            record?.departmentArea ||
            record?.area ||
            "",

        officerName:
            source.officerName ||
            source.createdBy ||
            record?.officerName ||
            record?.createdBy ||
            "Safety Officer",

        description:
            source.description ||
            source.scope ||
            record?.description ||
            record?.scope ||
            "",

        ftaData: {
            ...ftaSource,

            gate:
                ftaSource.gate ||
                source.gate ||
                record?.gate ||
                "OR",

            basicEvents:
                normalizedEvents,

            intermediateEvents:
                Array.isArray(ftaSource.intermediateEvents)
                    ? ftaSource.intermediateEvents
                    : []
        },

        status:
            source.status ||
            record?.status ||
            "DRAFT",

        createdAt:
            source.createdAt ||
            record?.createdAt ||
            null,

        submittedAt:
            source.submittedAt ||
            record?.submittedAt ||
            null,

        analysisResult:
            source.analysisResult ||
            record?.analysisResult ||
            null,

        riskAssessment:
            source.riskAssessment ||
            record?.riskAssessment ||
            null,

        riskAssessments:
            Array.isArray(
                source.riskAssessments
            )
                ? source.riskAssessments
                : (
                    Array.isArray(
                        record?.riskAssessments
                    )
                        ? record.riskAssessments
                        : []
                ),

        analysisResult:
            source.analysisResult ||
            record?.analysisResult ||
            null
    };
}

function saveCanonical(record) {
    const canonical = normalizeRecord(record);

    sessionStorage.setItem(
        DATA_KEY,
        JSON.stringify(canonical)
    );

    localStorage.setItem(
        DATA_KEY,
        JSON.stringify(canonical)
    );

    return canonical;
}

function renderHistory() {
    const list = document.getElementById("historyList");
    const count = document.getElementById("recordCount");
    const records = loadRecords();

    if (count) {
        count.textContent =
            `${records.length} RECORD${records.length === 1 ? "" : "S"}`;
    }

    if (!list) return;

    list.innerHTML = "";

    if (!records.length) {
        list.innerHTML = `
            <section class="rounded-2xl bg-white
                            border border-jorpro-line p-10 text-center">
                <div class="text-4xl mb-4">📋</div>
                <h3 class="text-lg font-bold text-jorpro-ink">
                    No Analysis History
                </h3>
                <p class="text-sm text-jorpro-mute mt-2">
                    ยังไม่มีประวัติการวิเคราะห์
                </p>
            </section>
        `;
        return;
    }

    records.forEach((rawRecord, index) => {
        const record = normalizeRecord(rawRecord);
        const events = record.ftaData.basicEvents;

        const card = document.createElement("section");

        card.className =
            "rounded-2xl bg-white border border-jorpro-line p-5 md:p-6";

        card.innerHTML = `
            <div class="flex flex-col lg:flex-row
                        lg:items-start lg:justify-between gap-5">

                <div class="flex-1 min-w-0">

                    <div class="flex flex-wrap items-center gap-2">
                        <span class="px-3 py-1.5 rounded-full
                                     bg-jorpro-blue/10 border border-jorpro-blue/20
                                     text-jorpro-blueBright text-[10px] font-bold">
                            ${escapeHtml(
                                record.status || "DRAFT"
                            )}
                        </span>

                        <span class="text-[10px] text-jorpro-slate">
                            #${records.length - index}
                        </span>
                    </div>

                    <h3 class="text-lg md:text-xl font-bold
                               text-jorpro-ink mt-3 break-words">
                        ${escapeHtml(
                            record.analysisTitle ||
                            "Untitled Analysis"
                        )}
                    </h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">

                        <div class="rounded-xl bg-jorpro-canvas
                                    border border-jorpro-line p-3">
                            <div class="text-[10px] tracking-widest
                                        text-jorpro-mute font-bold">
                                TOP EVENT
                            </div>
                            <div class="text-sm text-jorpro-blueBright
                                        font-semibold mt-1">
                                ${escapeHtml(
                                    record.topEvent || "-"
                                )}
                            </div>
                        </div>

                        <div class="rounded-xl bg-jorpro-canvas
                                    border border-jorpro-line p-3">
                            <div class="text-[10px] tracking-widest
                                        text-jorpro-mute font-bold">
                                DEPARTMENT / AREA
                            </div>
                            <div class="text-sm text-jorpro-slate mt-1">
                                ${escapeHtml(
                                    record.department || "-"
                                )}
                            </div>
                        </div>

                    </div>

                    <div class="mt-4">
                        <div class="text-[10px] tracking-widest
                                    text-jorpro-mute font-bold mb-2">
                            BASIC EVENTS (${events.length})
                        </div>

                        <div class="flex flex-wrap gap-2">
                            ${
                                events.length
                                    ? events.map(event => `
                                        <span class="px-3 py-1.5 rounded-lg
                                                     bg-jorpro-canvas border
                                                     border-jorpro-line
                                                     text-xs text-jorpro-slate">
                                            ${escapeHtml(event.name)}
                                        </span>
                                    `).join("")
                                    : `
                                        <span class="text-xs text-amber-600">
                                            No Basic Events
                                        </span>
                                    `
                            }
                        </div>
                    </div>


                    <div class="mt-4 rounded-xl
                                border border-jorpro-blue/20
                                bg-jorpro-blue/5 p-4">

                        <div class="text-[10px] tracking-widest
                                    text-jorpro-blue font-bold mb-3">
                            NEXT REVIEW
                        </div>

                        <div class="space-y-2">

                            ${
                                Array.isArray(
                                    record.riskAssessments
                                ) &&
                                record.riskAssessments.length
                                    ? record.riskAssessments.map(
                                        function(item) {
                                            return `
                                                <div class="flex flex-col sm:flex-row
                                                            sm:items-center sm:justify-between
                                                            gap-2 rounded-lg
                                                            border border-jorpro-line
                                                            bg-jorpro-canvas px-3 py-2">

                                                    <span class="text-xs font-semibold text-jorpro-ink break-words">
                                                        ${escapeHtml(
                                                            item?.eventName ||
                                                            item?.eventId ||
                                                            "-"
                                                        )}
                                                    </span>

                                                    <span class="text-xs font-bold text-jorpro-blueBright whitespace-nowrap">
                                                        Next Review: ${escapeHtml(
                                                            item?.nextReview ||
                                                            "-"
                                                        )}
                                                    </span>

                                                </div>
                                            `;
                                        }
                                    ).join("")
                                    : `
                                        <div class="text-xs text-jorpro-mute">
                                            No Next Review data
                                        </div>
                                    `
                            }

                        </div>

                    </div>

                </div>

                <div class="flex lg:flex-col gap-2 shrink-0">

                    <button
                        type="button"
                        class="view-record px-4 py-2.5 rounded-xl
                               bg-jorpro-canvas hover:bg-slate-100
                               border border-jorpro-line
                               text-xs font-bold text-jorpro-slate"
                        data-id="${escapeHtml(record.id)}">
                        VIEW
                    </button>

                    <button
                        type="button"
                        class="delete-record px-4 py-2.5 rounded-xl
                               bg-jorpro-redDim hover:bg-red-500/20
                               border border-jorpro-red/25 hover:border-red-400/50
                               text-xs font-bold text-jorpro-red"
                        data-id="${escapeHtml(record.id)}">
                        DELETE
                    </button>

                </div>

            </div>
        `;

        list.appendChild(card);
    });
}

document.addEventListener("click", function (event) {
    const viewBtn =
        event.target.closest(".view-record");

    if (!viewBtn) return;

    const id = viewBtn.dataset.id;

    const records = loadRecords();

    const rawRecord =
        records.find(
            record =>
                String(
                    record?.id ??
                    record?.analysisData?.id
                ) === String(id)
        );

    if (!rawRecord) {
        alert("Analysis record not found.");
        return;
    }

    const canonical =
        saveCanonical(rawRecord);

    // Persist the canonical record back into history too.
    const normalizedRecords =
        records.map(record => {
            const normalized =
                normalizeRecord(record);

            return String(normalized.id) ===
                String(canonical.id)
                ? canonical
                : normalized;
        });

    localStorage.setItem(
        RECORDS_KEY,
        JSON.stringify(normalizedRecords)
    );

    window.location.href =
        "fta-review.html";
});

document.addEventListener("click", function (event) {
    const deleteBtn =
        event.target.closest(".delete-record");

    if (!deleteBtn) return;

    const id = String(deleteBtn.dataset.id || "");

    if (!id) return;

    const confirmed = window.confirm(
        "Delete this Analysis record?\n\nThis will remove the saved Analysis History entry from this browser."
    );

    if (!confirmed) return;

    const records = loadRecords();

    const filtered = records.filter(record => {
        const recordId = String(
            record?.id ??
            record?.analysisData?.id ??
            ""
        );
        return recordId !== id;
    });

    localStorage.setItem(
        RECORDS_KEY,
        JSON.stringify(filtered)
    );

    // Clear the canonical "current analysis" too, but only when it
    // is the same record that was just deleted.
    [localStorage, sessionStorage].forEach(storage => {
        try {
            const raw = storage.getItem(DATA_KEY);
            if (!raw) return;

            const current = JSON.parse(raw);

            if (String(current?.id || "") === id) {
                storage.removeItem(DATA_KEY);
            }
        } catch (error) {
            console.warn("Unable to clear current analysis:", error);
        }
    });

    renderHistory();
});

const backBtn =
    document.getElementById("backBtn");

if (backBtn) {
    backBtn.addEventListener(
        "click",
        function () {
            window.location.href =
                "safety-officer.html";
        }
    );
}

renderHistory();
