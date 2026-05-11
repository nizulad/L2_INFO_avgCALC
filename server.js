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

// State to hold user grades
// Structure: { ACAD: { s1: { 0: { exam: '', td: '', tp: '' } } } }
let userGrades = {
    ACAD: { s1: {}, s2: {} },
    ISIL: { s1: {}, s2: {} }
};

const streamSelect = document.getElementById('stream-select');
const s1Tbody = document.getElementById('s1-tbody');
const s2Tbody = document.getElementById('s2-tbody');

// Initialize
function init() {
    renderTables();
    streamSelect.addEventListener('change', renderTables);
}

function renderTables() {
    const stream = streamSelect.value;
    const s1Modules = data[stream].s1;
    const s2Modules = data[stream].s2;

    renderSemesterTable(s1Modules, s1Tbody, 's1', stream);
    renderSemesterTable(s2Modules, s2Tbody, 's2', stream);

    calculate();
}

function renderSemesterTable(modules, tbody, semester, stream) {
    tbody.innerHTML = '';
    modules.forEach((mod, index) => {
        const tr = document.createElement('tr');

        // Get saved grades if exists
        const saved = userGrades[stream][semester][index] || { exam: '', td: '', tp: '' };

        const tpDisabled = !mod.hasTP ? 'disabled' : '';
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

    // Add event listeners to inputs
    const inputs = tbody.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const val = e.target.value;
            const idx = e.target.dataset.index;
            const type = e.target.dataset.type;
            const sem = e.target.dataset.semester;

            // Initialize if not exists
            if (!userGrades[stream][sem][idx]) {
                userGrades[stream][sem][idx] = { exam: '', td: '', tp: '' };
            }

            // Save grade
            userGrades[stream][sem][idx][type] = val;

            calculate();
        });
    });
}

function calculate() {
    const stream = streamSelect.value;
    const s1Result = calculateSemester(stream, 's1');
    const s2Result = calculateSemester(stream, 's2');

    // Update UI for Semesters
    updateSemesterUI('s1', s1Result);
    updateSemesterUI('s2', s2Result);

    // Annual Calculation
    const annualAvg = (s1Result.avg + s2Result.avg) / 2;
    let annualCredit = 0;

    if (annualAvg >= 10) {
        annualCredit = 60;
    } else {
        annualCredit = s1Result.finalCredit + s2Result.finalCredit;
    }

    // Update Annual UI
    document.getElementById('year-avg').textContent = annualAvg.toFixed(2);
    document.getElementById('year-credit').textContent = annualCredit;

    const decisionEl = document.getElementById('year-decision');
    if (annualAvg >= 10) {
        decisionEl.textContent = "Admis";
        decisionEl.className = "summary-value decision success";
    } else {
        decisionEl.textContent = "Ajourné";
        decisionEl.className = "summary-value decision fail";
    }
}

function calculateSemester(stream, semester) {
    const modules = data[stream][semester];
    const grades = userGrades[stream][semester];

    let totalCoef = 0;
    let weightedSum = 0;
    let acquiredCredits = 0;

    modules.forEach((mod, index) => {
        const modGrades = grades[index] || { exam: '', td: '', tp: '' };

        const exam = parseFloat(modGrades.exam) || 0;
        const td = parseFloat(modGrades.td) || 0;
        const tp = parseFloat(modGrades.tp) || 0;

        let moduleAvg = 0;

        if (mod.hasTP) {
            // Formula: 20% TP + 20% TD + 60% Exam
            moduleAvg = (0.2 * tp) + (0.2 * td) + (0.6 * exam);
        } else {
            // Formula: 40% TD + 60% Exam
            moduleAvg = (0.4 * td) + (0.6 * exam);
        }

        // Update Module Avg in UI
        const avgEl = document.getElementById(`${stream}-${semester}-avg-${index}`);
        if (avgEl) {
            avgEl.textContent = moduleAvg.toFixed(2);
            // Visual feedback for module validation
            avgEl.style.color = moduleAvg >= 10 ? 'var(--success)' : 'var(--danger)';
        }

        weightedSum += moduleAvg * mod.coef;
        totalCoef += mod.coef;

        if (moduleAvg >= 10) {
            acquiredCredits += mod.credit;
        }
    });

    const avg = totalCoef > 0 ? weightedSum / totalCoef : 0;

    // Credit Logic:
    // If Avg >= 10, Credit = 30 (Total for semester)
    // Else, Credit = Sum of credits for modules >= 10

    // Calculate total possible credits for this semester to be safe (usually 30)
    const totalSemesterCredits = modules.reduce((sum, mod) => sum + mod.credit, 0);

    let finalCredit = acquiredCredits;
    if (avg >= 10) {
        finalCredit = totalSemesterCredits;
    }

    return {
        avg: avg,
        finalCredit: finalCredit
    };
}

function updateSemesterUI(semester, result) {
    document.getElementById(`${semester}-avg`).textContent = result.avg.toFixed(2);
    document.getElementById(`${semester}-credit`).textContent = result.finalCredit;
}

// Start
init();
