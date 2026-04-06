// app.js

// State Map
// key: "YYYY-MM-DD", value: { mood, itch, hives, redness, discomfort, sleep, scratch }
const recordData = new Map();
let currentDate = new Date(2026, 2, 30); // Use 2026-03-30 context
let selectedDateKey = formatDate(currentDate);

// DOM Elements
const views = {
    calendar: document.getElementById('calendar-view'),
    record: document.getElementById('record-view')
};

const calendarDaysContainer = document.getElementById('calendar-days');
const currentMonthDisplay = document.getElementById('current-month-display');
const selectedDateText = document.getElementById('selected-date-text');

// Record Elements
const openRecordBtn = document.getElementById('open-record-btn');
const fabAddBtn = document.getElementById('fab-add-btn');
const backBtn = document.getElementById('back-btn');
const saveBtn = document.getElementById('save-btn');

// New Upload Elements
const openUploadSheetBtn = document.getElementById('open-upload-sheet-btn');
const uploadOverlay = document.getElementById('upload-overlay');
const uploadSheet = document.getElementById('upload-sheet');
const btnCamera = document.getElementById('btn-camera');
const btnGallery = document.getElementById('btn-gallery');
const btnCancelUpload = document.getElementById('btn-cancel-upload');
const inputCamera = document.getElementById('input-camera');
const inputGallery = document.getElementById('input-gallery');

// Modal Elements
const analysisModal = document.getElementById('analysis-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const previewImg = document.getElementById('preview-img');
const analysisLoading = document.getElementById('analysis-loading');
const analysisResults = document.getElementById('analysis-results');
const topDiseaseName = document.getElementById('top-disease-name');
const resultBars = document.getElementById('result-bars');
const saveResultBtn = document.getElementById('save-result-btn');

let currentAnalysisResult = null;

// Input Elements
const moodOptions = document.querySelectorAll('.mood-option');
const sliders = {
    itch: document.getElementById('slider-itch'),
    hives: document.getElementById('slider-hives'),
    redness: document.getElementById('slider-redness')
};
const toggles = {
    discomfort: document.querySelectorAll('#group-discomfort .toggle-btn'),
    sleep: document.querySelectorAll('#group-sleep .toggle-btn'),
    scratch: document.querySelectorAll('#group-scratch .toggle-btn')
};

// Form State
let formState = {
    mood: null,
    itch: 1,
    hives: 1,
    redness: 1,
    discomfort: null,
    sleep: null,
    scratch: null
};

// Utils
function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

// 1. Calendar Logic
function renderCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    currentMonthDisplay.textContent = `${year}년 ${month + 1}월`;
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const prevLastDay = new Date(year, month, 0).getDate();
    
    calendarDaysContainer.innerHTML = '';
    
    // Prev Month Days
    for (let x = firstDayIndex; x > 0; x--) {
        const d = prevLastDay - x + 1;
        calendarDaysContainer.appendChild(createDayCell(year, month - 1, d, true));
    }
    
    // Current Month Days
    for (let i = 1; i <= lastDay; i++) {
        calendarDaysContainer.appendChild(createDayCell(year, month, i, false));
    }
    
    // Next Month Drop-in padding
    const totalCells = firstDayIndex + lastDay;
    const nextDays = 42 - totalCells; // 6 rows
    for (let j = 1; j <= nextDays; j++) {
        calendarDaysContainer.appendChild(createDayCell(year, month + 1, j, true));
    }
}

function createDayCell(year, monthIndex, day, isOtherMonth) {
    // Handle month wrap around
    let currentYear = year;
    let currentMonth = monthIndex;
    if (monthIndex < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (monthIndex > 11) {
        currentMonth = 0;
        currentYear++;
    }

    const d = new Date(currentYear, currentMonth, day);
    const dateKey = formatDate(d);
    
    const div = document.createElement('div');
    div.classList.add('day-cell');
    if (isOtherMonth) div.classList.add('other-month');
    
    // Check Today
    const today = new Date();
    if (dateKey === formatDate(today)) {
        div.classList.add('today');
    }
    
    // Check selected
    if (dateKey === selectedDateKey) {
        div.classList.add('selected');
    }
    
    // Check data
    if (recordData.has(dateKey)) {
        div.classList.add('has-data');
    }
    
    div.textContent = day;
    
    const indicator = document.createElement('div');
    indicator.classList.add('day-indicator');
    div.appendChild(indicator);
    
    div.addEventListener('click', () => {
        // Update selection
        document.querySelectorAll('.day-cell.selected').forEach(el => el.classList.remove('selected'));
        div.classList.add('selected');
        
        selectedDateKey = dateKey;
        const clickedDayName = dayNames[d.getDay()];
        selectedDateText.textContent = `${currentMonth + 1}. ${day} (${clickedDayName})`;
        
        updateSummaryCard();
    });
    
    return div;
}

// 2. Summary Panel Logic
function getLabel(level) {
    if(level == 1) return '약함';
    if(level == 2) return '보통';
    if(level == 3) return '심함';
    return '-';
}
function updateSummaryCard() {
    if (recordData.has(selectedDateKey)) {
        const data = recordData.get(selectedDateKey);
        
        let moodStr = "기록됨";
        if(data.mood == 1) moodStr = "매우 나쁨";
        if(data.mood == 2) moodStr = "나쁨";
        if(data.mood == 3) moodStr = "보통";
        if(data.mood == 4) moodStr = "좋음";
        if(data.mood == 5) moodStr = "매우 좋음";
        
        let mlBadge = data.ml_result ? `<div style="margin-top:8px; color:var(--primary); font-size: 0.85rem; font-weight:bold;">📸 분석결과: ${data.ml_result} 유사</div>` : '';
        
        openRecordBtn.innerHTML = `
            <div class="summary-card-content">
                <div style="margin-bottom: 8px;"><strong>기분:</strong> ${moodStr}</div>
                <div><span class="badge">가려움: ${data.itch}</span> <span class="badge">두드러기: ${data.hives}</span> <span class="badge">붉어짐: ${data.redness}</span></div>
                <div style="margin-top:4px;"><span class="badge">일상불편: ${getLabel(data.discomfort)}</span> <span class="badge">수면: ${getLabel(data.sleep)}</span> <span class="badge">긁기: ${getLabel(data.scratch)}</span></div>
                ${mlBadge}
            </div>
        `;
    } else {
        openRecordBtn.innerHTML = `<p class="placeholder-text">몸 상태 없음. 추가하려면 탭 하세요.</p>`;
    }
}

// 3. Navigation
function navigateTo(viewName) {
    Object.values(views).forEach(v => v.classList.remove('active'));
    views[viewName].classList.add('active');
    
    if (viewName === 'record') {
        populateRecordForm();
    } else {
        renderCalendar(currentDate); // Refresh highlights
        updateSummaryCard();
    }
}

openRecordBtn.addEventListener('click', () => navigateTo('record'));
fabAddBtn.addEventListener('click', () => navigateTo('record'));
backBtn.addEventListener('click', () => navigateTo('calendar'));

// 4. Record Form Logic
function populateRecordForm() {
    // Reset Form
    formState = {
        mood: null, itch: 1, hives: 1, redness: 1,
        discomfort: null, sleep: null, scratch: null
    };
    
    // Load from memory if exists
    if (recordData.has(selectedDateKey)) {
        formState = { ...recordData.get(selectedDateKey) };
    }
    
    // Apply Mood
    moodOptions.forEach(opt => {
        opt.classList.remove('selected');
        if (formState.mood && opt.dataset.value == formState.mood) {
            opt.classList.add('selected');
        }
    });
    
    // Apply Sliders
    ['itch', 'hives', 'redness'].forEach(key => {
        sliders[key].value = formState[key] || 1;
        document.getElementById(`${key}-val`).textContent = sliders[key].value;
    });
    
    // Apply Toggles
    ['discomfort', 'sleep', 'scratch'].forEach(key => {
        toggles[key].forEach(btn => {
            btn.classList.remove('selected');
            if (formState[key] && btn.dataset.value == formState[key]) {
                btn.classList.add('selected');
            }
        });
    });
}

// Form Interactions
// Mood
moodOptions.forEach(opt => {
    opt.addEventListener('click', (e) => {
        moodOptions.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        formState.mood = parseInt(opt.dataset.value);
    });
});

// Sliders
Object.keys(sliders).forEach(key => {
    sliders[key].addEventListener('input', (e) => {
        document.getElementById(`${key}-val`).textContent = e.target.value;
        formState[key] = parseInt(e.target.value);
    });
});

// Toggles
Object.keys(toggles).forEach(key => {
    toggles[key].forEach(btn => {
        btn.addEventListener('click', () => {
            toggles[key].forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            formState[key] = parseInt(btn.dataset.value);
        });
    });
});

// Save
saveBtn.addEventListener('click', () => {
    // Preserve ml_result if it exists
    let existingMl = recordData.has(selectedDateKey) ? recordData.get(selectedDateKey).ml_result : null;
    let dataToSave = { ...formState };
    if (existingMl) dataToSave.ml_result = existingMl;
    
    recordData.set(selectedDateKey, dataToSave);
    navigateTo('calendar');
});

// 5. ML Upload & Analysis Logic
function toggleUploadSheet(show) {
    if (show) {
        uploadOverlay.classList.add('active');
        uploadSheet.classList.add('active');
    } else {
        uploadOverlay.classList.remove('active');
        uploadSheet.classList.remove('active');
    }
}

function toggleAnalysisModal(show) {
    if (show) {
        analysisModal.classList.add('active');
    } else {
        analysisModal.classList.remove('active');
        previewImg.style.display = 'none';
        previewImg.src = '';
        analysisLoading.style.display = 'flex';
        analysisResults.style.display = 'none';
        resultBars.innerHTML = '';
        currentAnalysisResult = null;
    }
}

openUploadSheetBtn.addEventListener('click', () => toggleUploadSheet(true));
btnCancelUpload.addEventListener('click', () => toggleUploadSheet(false));
uploadOverlay.addEventListener('click', () => toggleUploadSheet(false));
closeModalBtn.addEventListener('click', () => toggleAnalysisModal(false));

btnCamera.addEventListener('click', () => {
    inputCamera.click();
    toggleUploadSheet(false);
});

btnGallery.addEventListener('click', () => {
    inputGallery.click();
    toggleUploadSheet(false);
});

async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    toggleAnalysisModal(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImg.src = e.target.result;
        previewImg.style.display = 'block';
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('http://localhost:5000/api/analyze', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok && data.results) {
            showAnalysisResults(data.results);
        } else {
            alert(data.error || "분석 중 오류가 발생했습니다.");
            toggleAnalysisModal(false);
        }
    } catch (err) {
        console.error(err);
        alert("백엔드 서버(Flask)와 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.");
        toggleAnalysisModal(false);
    }
    
    e.target.value = ''; // reset input
}

inputCamera.addEventListener('change', handleImageUpload);
inputGallery.addEventListener('change', handleImageUpload);

function showAnalysisResults(results) {
    analysisLoading.style.display = 'none';
    analysisResults.style.display = 'block';
    
    if(results.length > 0) {
        topDiseaseName.textContent = results[0].disease;
        currentAnalysisResult = results[0].disease;
        
        resultBars.innerHTML = '';
        results.forEach(res => {
            const html = `
                <div class="result-bar-row">
                    <span class="bar-label">${res.disease}</span>
                    <div class="bar-wrapper">
                        <div class="bar-fill" style="width: ${res.score}%"></div>
                    </div>
                    <span class="bar-score">${res.score.toFixed(1)}%</span>
                </div>
            `;
            resultBars.insertAdjacentHTML('beforeend', html);
        });
    } else {
        topDiseaseName.textContent = "알 수 없음";
    }
}

saveResultBtn.addEventListener('click', () => {
    if (currentAnalysisResult) {
        let existingData = recordData.get(selectedDateKey) || {
            mood: null, itch: 1, hives: 1, redness: 1, discomfort: null, sleep: null, scratch: null
        };
        existingData.ml_result = currentAnalysisResult;
        recordData.set(selectedDateKey, existingData);
        
        updateSummaryCard();
        renderCalendar(currentDate);
    }
    toggleAnalysisModal(false);
});

// Init
renderCalendar(currentDate);
updateSummaryCard();
