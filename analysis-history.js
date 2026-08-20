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

function formatDateTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        hour12: false
    }).format(date);
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
                null
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
            <section class="rounded-2xl bg-slate-900
                            border border-slate-800 p-10 text-center">
                <div class="text-4xl mb-4">📋</div>
                <h3 class="text-lg font-bold text-white">
                    No Analysis History
                </h3>
                <p class="text-sm text-slate-500 mt-2">
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
            "rounded-2xl bg-slate-900 border border-slate-800 p-5 md:p-6";

        card.innerHTML = `
            <div class="flex flex-col lg:flex-row
                        lg:items-start lg:justify-between gap-5">

                <div class="flex-1 min-w-0">

                    <div class="flex flex-wrap items-center gap-2">
                        <span class="px-3 py-1.5 rounded-full
                                     bg-cyan-500/10 border border-cyan-500/20
                                     text-cyan-300 text-[10px] font-bold">
                            ${escapeHtml(
                                record.status || "DRAFT"
                            )}
                        </span>

                        <span class="text-[10px] text-slate-600">
                            #${records.length - index}
                        </span>
                    </div>

                    <h3 class="text-lg md:text-xl font-bold
                               text-white mt-3 break-words">
                        ${escapeHtml(
                            record.analysisTitle ||
                            "Untitled Analysis"
                        )}
                    </h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">

                        <div class="rounded-xl bg-slate-950/60
                                    border border-slate-800 p-3">
                            <div class="text-[10px] tracking-widest
                                        text-slate-500 font-bold">
                                TOP EVENT
                            </div>
                            <div class="text-sm text-cyan-300
                                        font-semibold mt-1">
                                ${escapeHtml(
                                    record.topEvent || "-"
                                )}
                            </div>
                        </div>

                        <div class="rounded-xl bg-slate-950/60
                                    border border-slate-800 p-3">
                            <div class="text-[10px] tracking-widest
                                        text-slate-500 font-bold">
                                DEPARTMENT / AREA
                            </div>
                            <div class="text-sm text-slate-300 mt-1">
                                ${escapeHtml(
                                    record.department || "-"
                                )}
                            </div>
                        </div>

                        <div class="rounded-xl bg-slate-950/60 border border-slate-800 p-3 mt-3">
                            <div class="text-[10px] tracking-widest text-slate-500 font-bold">SUBMITTED DATE & TIME</div>
                            <div class="text-sm text-slate-300 mt-1">
                                ${escapeHtml(formatDateTime(record.submittedAt || record.createdAt))}
                            </div>
                        </div>

                    </div>

                    <div class="mt-4">
                        <div class="text-[10px] tracking-widest
                                    text-slate-500 font-bold mb-2">
                            BASIC EVENTS (${events.length})
                        </div>

                        <div class="flex flex-wrap gap-2">
                            ${
                                events.length
                                    ? events.map(event => `
                                        <span class="px-3 py-1.5 rounded-lg
                                                     bg-slate-950 border
                                                     border-slate-800
                                                     text-xs text-slate-300">
                                            ${escapeHtml(event.name)}
                                        </span>
                                    `).join("")
                                    : `
                                        <span class="text-xs text-amber-300">
                                            No Basic Events
                                        </span>
                                    `
                            }
                        </div>
                    </div>

                </div>

                <button
                    type="button"
                    class="view-record px-4 py-2.5 rounded-xl
                           bg-slate-800 hover:bg-slate-700
                           border border-slate-700
                           text-xs font-bold text-slate-200"
                    data-id="${escapeHtml(record.id)}">
                    VIEW
                </button>

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
