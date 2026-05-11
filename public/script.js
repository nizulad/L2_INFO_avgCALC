const data = {
    ACAD: {
        s1: [
            { name: "Algorithmique", coef: 3, credit: 6, hasTP: true },
            { name: "Architecture 1", coef: 3, credit: 5, hasTP: false },
            { name: "Système d'informations", coef: 3, credit: 5, hasTP: false },
            { name: "Analyse numérique", coef: 3, credit: 4, hasTP: false },
            { name: "Probabilités", coef: 3, credit: 4, hasTP: false },
            { name: "Logique mathématique", coef: 3, credit: 4, hasTP: false },
            { name: "Anglais 1", coef: 2, credit: 2, hasTP: false }
        ],
        s2: [
            { name: "Théorie des langues", coef: 3, credit: 5, hasTP: false },
            { name: "Architecture 2", coef: 3, credit: 5, hasTP: true },
            { name: "Système d'exploitation", coef: 3, credit: 5, hasTP: true },
            { name: "Programmation objet orienté", coef: 3, credit: 5, hasTP: true },
            { name: "Base de données", coef: 3, credit: 5, hasTP: true },
            { name: "Option au choix", coef: 2, credit: 2, hasTP: false },
            { name: "Anglais 2", coef: 2, credit: 3, hasTP: false }
        ]
    },
    ISIL: {
        s1: [
            { name: "Algorithmique", coef: 3, credit: 5, hasTP: true },
            { name: "Architecture", coef: 3, credit: 4, hasTP: false },
            { name: "Système d'informations", coef: 3, credit: 4, hasTP: false },
            { name: "Analyse numérique", coef: 2, credit: 4, hasTP: false },
            { name: "Probabilités", coef: 2, credit: 4, hasTP: false },
            { name: "Logique mathématique", coef: 2, credit: 4, hasTP: false },
            { name: "Programmation objet orienté", coef: 2, credit: 3, hasTP: true },
            { name: "Anglais", coef: 1, credit: 2, hasTP: false }
        ],
        s2: [
            { name: "Génie logiciel", coef: 3, credit: 5, hasTP: true },
            { name: "Architecture 2", coef: 3, credit: 5, hasTP: true },
            { name: "Système d'exploitation", coef: 3, credit: 4, hasTP: true },
            { name: "Programmation web", coef: 3, credit: 4, hasTP: true },
            { name: "Base de données", coef: 3, credit: 6, hasTP: true },
            { name: "Théorie des graphes", coef: 2, credit: 4, hasTP: false },
            { name: "Anglais 2", coef: 1, credit: 2, hasTP: false }
        ]
    }
};

const BACKEND_URL = 'https://l2info.onrender.com/save';

let userGrades = {
    ACAD: { s1: {}, s2: {} },
    ISIL: { s1: {}, s2: {} }
};

const streamSelect = document.getElementById('stream-select');
const s1Tbody      = document.getElementById('s1-tbody');
const s2Tbody      = document.getElementById('s2-tbody');

// ── Build document logic ─────────────────────────────────────────────────────
function buildDocument(stream) {
    const doc = {
        stream: stream,
        timestamp: new Date().toISOString()
    };
    
    for (const sem of ['s1', 's2']) {
        const grades = userGrades[stream][sem];
        const mods   = data[stream][sem];

        mods.forEach((mod, index) => {
            const g    = grades[index] || {};
            const exam = parseFloat(g.exam) || 0;
            const td   = parseFloat(g.td)   || 0;
            const tp   = parseFloat(g.tp)   || 0;

            const avg = mod.hasTP
                ? (0.2 * tp) + (0.2 * td) + (0.6 * exam)
                : (0.4 * td) + (0.6 * exam);

            doc[mod.name] = parseFloat(avg.toFixed(2));
        });
    }
    return doc;
}

// ── Optimized Save on Exit ───────────────────────────────────────────────────
const performSave = () => {
    const stream = streamSelect.value;
    const payload = buildDocument(stream);
    
    // 1. Try sendBeacon first (Most reliable for exit events)
    if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(BACKEND_URL, blob);
    } else {
        // 2. Fallback to fetch with keepalive
        fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true
        }).catch(() => {});
    }
};

// Handle mobile and modern desktop (Triggered when user switches tabs or closes app)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        performSave();
    }
});

// Fallback for older browsers
window.addEventListener('pagehide', performSave);

// ── Core rendering & calculation ──────────────────────────────────────────────
function init() {
    renderTables();
    streamSelect.addEventListener('change', renderTables);
}

function renderTables() {
    const stream = streamSelect.value;
    renderSemesterTable(data[stream].s1, s1Tbody, 's1', stream);
    renderSemesterTable(data[stream].s2, s2Tbody, 's2', stream);
    calculate();
}

function renderSemesterTable(modules, tbody, semester, stream) {
    tbody.innerHTML = '';
    modules.forEach((mod, index) => {
        const tr    = document.createElement('tr');
        const saved = userGrades[stream][semester][index] || { exam: '', td: '', tp: '' };
        const tpDisabled    = !mod.hasTP ? 'disabled' : '';
        const tpPlaceholder = !mod.hasTP ? '-' : '';

        tr.innerHTML = `
            <td>${mod.name}</td>
            <td>${mod.coef}</td>
            <td>${mod.credit}</td>
            <td class="grade-cell">
                <input type="number" min="0" max="20" step="0.01" placeholder="Exam"
                       value="${saved.exam}" data-index="${index}" data-type="exam" data-semester="${semester}">
            </td>
            <td class="grade-cell">
                <input type="number" min="0" max="20" step="0.01" placeholder="TD"
                       value="${saved.td}" data-index="${index}" data-type="td" data-semester="${semester}">
            </td>
            <td class="grade-cell">
                <input type="number" min="0" max="20" step="0.01" placeholder="${tpPlaceholder}"
                       value="${saved.tp}" data-index="${index}" data-type="tp" data-semester="${semester}" ${tpDisabled}>
            </td>
            <td class="module-avg" id="${stream}-${semester}-avg-${index}">0.00</td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', (e) => {
            const idx  = e.target.dataset.index;
            const type = e.target.dataset.type;
            const sem  = e.target.dataset.semester;

            if (!userGrades[stream][sem][idx]) {
                userGrades[stream][sem][idx] = { exam: '', td: '', tp: '' };
            }
            userGrades[stream][sem][idx][type] = e.target.value;
            calculate();
        });
    });
}

function calculate() {
    const stream   = streamSelect.value;
    const s1Result = calculateSemester(stream, 's1');
    const s2Result = calculateSemester(stream, 's2');

    updateSemesterUI('s1', s1Result);
    updateSemesterUI('s2', s2Result);

    const annualAvg    = (s1Result.avg + s2Result.avg) / 2;
    const annualCredit = annualAvg >= 10
        ? 60
        : s1Result.finalCredit + s2Result.finalCredit;

    document.getElementById('year-avg').textContent    = annualAvg.toFixed(2);
    document.getElementById('year-credit').textContent = annualCredit;

    const decisionEl = document.getElementById('year-decision');
    if (annualAvg >= 10) {
        decisionEl.textContent = "Admis";
        decisionEl.className   = "summary-value decision success";
    } else {
        decisionEl.textContent = "Ajourné";
        decisionEl.className   = "summary-value decision fail";
    }
}

function calculateSemester(stream, semester) {
    const modules = data[stream][semester];
    const grades  = userGrades[stream][semester];
    let totalCoef = 0, weightedSum = 0, acquiredCredits = 0;

    modules.forEach((mod, index) => {
        const g    = grades[index] || {};
        const exam = parseFloat(g.exam) || 0;
        const td   = parseFloat(g.td)   || 0;
        const tp   = parseFloat(g.tp)   || 0;

        const moduleAvg = mod.hasTP
            ? (0.2 * tp) + (0.2 * td) + (0.6 * exam)
            : (0.4 * td) + (0.6 * exam);

        const avgEl = document.getElementById(`${stream}-${semester}-avg-${index}`);
        if (avgEl) {
            avgEl.textContent = moduleAvg.toFixed(2);
            avgEl.style.color = moduleAvg >= 10 ? 'var(--success)' : 'var(--danger)';
        }

        weightedSum     += moduleAvg * mod.coef;
        totalCoef       += mod.coef;
        if (moduleAvg >= 10) acquiredCredits += mod.credit;
    });

    const avg         = totalCoef > 0 ? weightedSum / totalCoef : 0;
    const totalCreds  = modules.reduce((s, m) => s + m.credit, 0);
    const finalCredit = avg >= 10 ? totalCreds : acquiredCredits;

    return { avg, finalCredit };
}

function updateSemesterUI(semester, result) {
    document.getElementById(`${semester}-avg`).textContent    = result.avg.toFixed(2);
    document.getElementById(`${semester}-credit`).textContent = result.finalCredit;
}

init();

