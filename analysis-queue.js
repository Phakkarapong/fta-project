// =====================================================
// EXPERT — ANALYSIS QUEUE
// Robust bridge from Safety Officer History/Records
// =====================================================

const RECORDS_KEY = "ftaAnalysisRecords";
const DATA_KEY = "ftaAnalysisData";


function readJSON(key) {

    try {
        const value =
            JSON.parse(
                localStorage.getItem(key)
            );

        return value;

    } catch (error) {

        console.warn(
            `Cannot read ${key}:`,
            error
        );

        return null;

    }

}


function loadRecords() {

    const value =
        readJSON(RECORDS_KEY);

    return Array.isArray(value)
        ? value
        : [];

}


function normalizeRecord(raw) {

    const source =
        raw?.analysisData ||
        raw?.analysis ||
        raw ||
        {};

    const fta =
        source.ftaData ||
        raw?.ftaData ||
        {};

    const rawEvents =
        Array.isArray(fta.basicEvents)
            ? fta.basicEvents
            : Array.isArray(source.basicEvents)
                ? source.basicEvents
                : Array.isArray(raw?.basicEvents)
                    ? raw.basicEvents
                    : [];

    const basicEvents =
        rawEvents.map(
            function(event, index) {

                return {

                    id:
                        event?.id ||
                        `E-${String(
                            index + 1
                        ).padStart(2, "0")}`,

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

                };

            }
        );

    return {

        ...source,

        id:
            source.id ||
            raw?.id ||
            null,

        analysisTitle:
            source.analysisTitle ||
            source.title ||
            raw?.analysisTitle ||
            raw?.title ||
            "",

        topEvent:
            source.topEvent ||
            source.top_event ||
            raw?.topEvent ||
            raw?.top_event ||
            "",

        department:
            source.department ||
            source.departmentArea ||
            source.area ||
            raw?.department ||
            raw?.departmentArea ||
            raw?.area ||
            "",

        officerName:
            source.officerName ||
            source.createdBy ||
            raw?.officerName ||
            raw?.createdBy ||
            "Safety Officer",

        description:
            source.description ||
            source.scope ||
            raw?.description ||
            raw?.scope ||
            "",

        status:
            source.status ||
            raw?.status ||
            "DRAFT",

        submittedAt:
            source.submittedAt ||
            raw?.submittedAt ||
            source.createdAt ||
            raw?.createdAt ||
            null,

        createdAt:
            source.createdAt ||
            raw?.createdAt ||
            null,

        ftaData: {

            ...fta,

            gate:
                fta.gate ||
                source.gate ||
                raw?.gate ||
                "OR",

            basicEvents:
                basicEvents,

            intermediateEvents:
                Array.isArray(
                    fta.intermediateEvents
                )
                    ? fta.intermediateEvents
                    : []

        }

    };

}


function isUsableExpertRecord(record) {

    return Boolean(
        record &&
        record.analysisTitle &&
        record.topEvent &&
        Array.isArray(
            record.ftaData?.basicEvents
        ) &&
        record.ftaData.basicEvents.length > 0
    );

}


function getExpertCandidates() {

    const candidates = [];


    // 1. Canonical records from Safety Officer.
    loadRecords().forEach(
        function(record) {

            const normalized =
                normalizeRecord(record);

            if (
                isUsableExpertRecord(
                    normalized
                )
            ) {

                candidates.push(
                    normalized
                );

            }

        }
    );


    // 2. Current analysis data as a fallback.
    const current =
        normalizeRecord(
            readJSON(DATA_KEY)
        );

    if (
        isUsableExpertRecord(
            current
        )
    ) {

        const alreadyExists =
            candidates.some(
                function(item) {

                    return (
                        item.id &&
                        current.id &&
                        String(item.id) ===
                        String(current.id)
                    );

                }
            );

        if (!alreadyExists) {

            // A record that contains submittedAt
            // or is already pending is eligible.
            if (
                current.status ===
                    "PENDING_EXPERT" ||
                current.status ===
                    "UNDER_ANALYSIS" ||
                current.submittedAt
            ) {

                current.status =
                    current.status ===
                        "UNDER_ANALYSIS"
                        ? "UNDER_ANALYSIS"
                        : "PENDING_EXPERT";

                candidates.push(
                    current
                );

            }

        }

    }


    // 3. Only show work that is actually submitted.
    return candidates.filter(
        function(record) {

            return (
                record.status ===
                    "PENDING_EXPERT" ||
                record.status ===
                    "UNDER_ANALYSIS"
            );

        }
    );

}


function saveRecords(records) {

    localStorage.setItem(
        RECORDS_KEY,
        JSON.stringify(
            records
        )
    );

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



function startAnalysisById(id) {

    const queue =
        getExpertCandidates();

    const selected =
        queue.find(
            function(record) {

                return String(
                    record.id
                ) === String(id);

            }
        );


    if (!selected) {

        alert(
            "Analysis record not found."
        );

        return false;

    }


    selected.status =
        "UNDER_ANALYSIS";

    selected.expert =
        selected.expert ||
        "Expert";

    const now = new Date().toISOString();

    selected.updatedAt = now;
    selected.analysisStartedAt =
        selected.analysisStartedAt || now;


    const records =
        loadRecords();


    const recordIndex =
        records.findIndex(
            function(record) {

                return String(
                    normalizeRecord(record).id
                ) === String(
                    selected.id
                );

            }
        );


    if (recordIndex >= 0) {

        records[recordIndex] =
            selected;

    } else {

        records.unshift(
            selected
        );

    }


    saveRecords(
        records
    );


    const payload =
        JSON.stringify(
            selected
        );


    sessionStorage.setItem(
        DATA_KEY,
        payload
    );

    localStorage.setItem(
        DATA_KEY,
        payload
    );


    // Explicitly pass the selected analysis id.
    const target =
        "fta-analysis.html?id=" +
        encodeURIComponent(
            selected.id
        );


    window.location.assign(
        target
    );


    return false;

}

function renderQueue() {

    const list =
        document.getElementById(
            "queueList"
        );

    if (!list) return;


    const queue =
        getExpertCandidates();


    list.innerHTML = "";


    if (queue.length === 0) {

        list.innerHTML = `
            <section class="rounded-2xl
                            bg-slate-900
                            border border-slate-800
                            p-10 text-center">

                <div class="text-4xl mb-4">📋</div>

                <h3 class="text-lg font-bold text-white">
                    No Pending Analysis
                </h3>

                <p class="text-sm text-slate-500 mt-2">
                    ไม่มีข้อมูลที่ส่งจาก Safety Officer
                </p>

            </section>
        `;

        return;

    }


    queue.forEach(
        function(record) {

            const events =
                record.ftaData.basicEvents;


            const card =
                document.createElement(
                    "section"
                );

            card.className =
                "rounded-2xl bg-slate-900 " +
                "border border-slate-800 p-5 md:p-6";


            card.innerHTML = `

                <div class="flex flex-col
                            lg:flex-row
                            lg:justify-between
                            gap-6">

                    <div class="flex-1 min-w-0">

                        <div class="flex flex-wrap
                                    items-center gap-2">

                            <span class="px-3 py-1.5 rounded-full
                                         bg-cyan-500/10
                                         border border-cyan-500/20
                                         text-cyan-300
                                         text-[10px] font-bold">
                                ${escapeHtml(
                                    record.status
                                )}
                            </span>

                            <span class="px-3 py-1.5 rounded-full
                                         bg-slate-800
                                         border border-slate-700
                                         text-slate-400
                                         text-[10px] font-bold">
                                ${events.length} BASIC EVENTS
                            </span>

                        </div>


                        <h3 class="text-xl font-extrabold
                                   text-white mt-3 break-words">
                            ${escapeHtml(
                                record.analysisTitle
                            )}
                        </h3>


                        <div class="grid grid-cols-1
                                    md:grid-cols-2 gap-3 mt-4">

                            <div class="rounded-xl
                                        bg-slate-950/60
                                        border border-slate-800 p-3">

                                <div class="text-[10px]
                                            tracking-widest
                                            text-slate-500 font-bold">
                                    TOP EVENT
                                </div>

                                <div class="text-sm text-cyan-300
                                            font-bold mt-1 break-words">
                                    ${escapeHtml(
                                        record.topEvent
                                    )}
                                </div>

                            </div>


                            <div class="rounded-xl
                                        bg-slate-950/60
                                        border border-slate-800 p-3">

                                <div class="text-[10px]
                                            tracking-widest
                                            text-slate-500 font-bold">
                                    DEPARTMENT / AREA
                                </div>

                                <div class="text-sm text-slate-300
                                            mt-1 break-words">
                                    ${escapeHtml(
                                        record.department ||
                                        "-"
                                    )}
                                </div>

                            </div>

                        </div>


                        <div class="mt-5">

                            <div class="text-[10px]
                                        tracking-widest
                                        text-slate-500
                                        font-bold mb-2">
                                BASIC EVENTS
                            </div>


                            <div class="grid grid-cols-1
                                        md:grid-cols-2
                                        lg:grid-cols-3 gap-3">

                                ${events.map(
                                    function(
                                        event,
                                        index
                                    ) {

                                        return `
                                            <div class="
                                                rounded-xl
                                                bg-slate-950
                                                border border-slate-800
                                                p-3">

                                                <div class="
                                                    text-[10px]
                                                    font-bold
                                                    text-cyan-400">
                                                    E-${
                                                        String(
                                                            index + 1
                                                        ).padStart(
                                                            2,
                                                            "0"
                                                        )
                                                    }
                                                </div>

                                                <div class="
                                                    text-sm
                                                    font-bold
                                                    text-white
                                                    mt-1 break-words">
                                                    ${escapeHtml(
                                                        event.name
                                                    )}
                                                </div>

                                                <div class="
                                                    text-xs
                                                    text-slate-500
                                                    mt-1 break-words">
                                                    ${escapeHtml(
                                                        event.description ||
                                                        "-"
                                                    )}
                                                </div>

                                            </div>
                                        `;

                                    }
                                ).join("")}

                            </div>

                        </div>

                    </div>


                    <button
                        type="button"
                        class="start-analysis
                               w-full lg:w-auto
                               lg:min-w-[170px]
                               h-fit px-5 py-3 rounded-xl
                               bg-gradient-to-r
                               from-cyan-500 to-blue-600
                               text-white text-xs font-bold"
                        data-id="${escapeHtml(
                                record.id
                            )}"
                            onclick="return startAnalysisById(this.dataset.id);">
                        START ANALYSIS →
                    </button>

                </div>
            `;


            list.appendChild(
                card
            );

        }
    );

}


document.addEventListener(
    "click",
    function(event) {

        const button =
            event.target.closest(
                ".start-analysis"
            );

        if (!button) {
            return;
        }

        event.preventDefault();

        startAnalysisById(
            button.dataset.id
        );

    }
);


const backBtn =
    document.getElementById(
        "backBtn"
    );

if (backBtn) {

    backBtn.addEventListener(
        "click",
        function() {

            window.location.href =
                "expert.html";

        }
    );

}


renderQueue();
