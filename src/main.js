// 로컬 스토리지 키 정의
const HISTORY_KEY = "calc_history";

// DOM 요소 획득
const display = document.getElementById("display");
const buttonsGrid = document.querySelector(".buttons-grid");
const openHistoryBtn = document.getElementById("openHistoryBtn");
const historyModal = document.getElementById("historyModal");
const historyList = document.getElementById("historyList");
const useFormulaBtn = document.getElementById("useFormulaBtn");
const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const closeHistoryBtn = document.getElementById("closeHistoryBtn");

let selectedIndex = -1;

// 앱 초기화
document.addEventListener("DOMContentLoaded", () => {
  display.focus();
});

// 계산기 버튼 클릭 이벤트
buttonsGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const action = btn.dataset.action;
  handleInput(action);
});

// 키보드 엔터 입력 처리
display.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    calculate();
  }
});

// 입력 처리 로직
function handleInput(char) {
  if (char === "C") {
    display.value = "";
    display.focus();
    return;
  }

  if (char === "DEL") {
    display.value = display.value.slice(0, -1);
    display.focus();
    return;
  }

  if (char === "=") {
    calculate();
    return;
  }

  // 커서 위치에 문자 삽입
  const start = display.selectionStart;
  const end = display.selectionEnd;
  const current = display.value;

  display.value = current.substring(0, start) + char + current.substring(end);
  display.focus();
  display.setSelectionRange(start + char.length, start + char.length);
}

// 계산 및 저장 수행
function calculate() {
  const formula = display.value.trim();
  if (!formula) return;

  try:
    // 수식 안전 계산 (eval 대용 수식 검증)
    const sanitizedFormula = formula.replace(/[^0-9+\-*/().\s]/g, "");
    if (!sanitizedFormula) throw new Error("Invalid Input");
    
    const result = Function(`"use strict"; return (${sanitizedFormula})`)();
    
    if (result === undefined || isNaN(result)) {
      throw new Error("Evaluation Error");
    }

    const record = `${formula} = ${result}`;
    saveToStorage(record);
    display.value = String(result);

    // 모달이 열려 있는 경우 리스트 갱신
    if (!historyModal.classList.contains("hidden")) {
      renderHistoryList();
    }
  } catch (err) {
    display.value = "오류";
  }
}

// 로컬 스토리지 데이터 제어 함수
function getHistory() {
  const data = localStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

function saveToStorage(record) {
  const history = getHistory();
  history.push(record);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function setHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// 기록 모달 조작
openHistoryBtn.addEventListener("click", openHistoryModal);
closeHistoryBtn.addEventListener("click", closeHistoryModal);

function openHistoryModal() {
  historyModal.classList.remove("hidden");
  historyModal.setAttribute("aria-hidden", "false");
  renderHistoryList();
}

function closeHistoryModal() {
  historyModal.classList.add("hidden");
  historyModal.setAttribute("aria-hidden", "true");
  display.focus();
}

// 기록 목록 렌더링
function renderHistoryList() {
  const history = getHistory();
  historyList.innerHTML = "";
  selectedIndex = history.length > 0 ? 0 : -1;

  history.forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = item;
    if (index === selectedIndex) {
      li.classList.add("selected");
    }

    // 클릭 시 선택 처리
    li.addEventListener("click", () => {
      selectHistoryItem(index);
    });

    // 더블 클릭 시 바로 가져오기
    li.addEventListener("dblclick", () => {
      selectHistoryItem(index);
      useFormula();
    });

    historyList.appendChild(li);
  });

  historyList.focus();
}

function selectHistoryItem(index) {
  const items = historyList.querySelectorAll("li");
  items.forEach((li, idx) => {
    if (idx === index) {
      li.classList.add("selected");
    } else {
      li.classList.remove("selected");
    }
  });
  selectedIndex = index;
}

// 모달 내 키보드 단축키 지원 (Enter: 가져오기, Escape: 닫기)
historyList.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    useFormula();
  } else if (e.key === "Escape") {
    e.preventDefault();
    closeHistoryModal();
  }
});

// 선택한 수식 가져오기
useFormulaBtn.addEventListener("click", useFormula);

function useFormula() {
  if (selectedIndex < 0) return;
  const history = getHistory();
  const fullText = history[selectedIndex];
  if (!fullText) return;

  let formulaOnly = fullText;
  if (fullText.includes("=")) {
    formulaOnly = fullText.split("=")[0].trim();
  }

  display.value = formulaOnly;
  closeHistoryModal();

  display.focus();
  display.setSelectionRange(display.value.length, display.value.length);
}

// 선택 항목 삭제
deleteSelectedBtn.addEventListener("click", deleteSelected);

function deleteSelected() {
  if (selectedIndex < 0) return;
  const history = getHistory();

  if (selectedIndex >= 0 && selectedIndex < history.length) {
    history.splice(selectedIndex, 1);
    setHistory(history);
    renderHistoryList();
    
    const itemsCount = historyList.querySelectorAll("li").length;
    if (itemsCount > 0) {
      const newIdx = Math.min(selectedIndex, itemsCount - 1);
      selectHistoryItem(newIdx);
    }
  }
}

// 기록 전체 삭제
clearAllBtn.addEventListener("click", clearAllHistory);

function clearAllHistory() {
  localStorage.removeItem(HISTORY_KEY);
  renderHistoryList();
}