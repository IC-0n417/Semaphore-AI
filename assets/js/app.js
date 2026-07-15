"use strict";

const loader = document.getElementById("loader");
const loaderText = document.getElementById("loaderText");
const systemStatus = document.getElementById("systemStatus");
const systemStatusText = document.getElementById("systemStatusText");
const cameraPlaceholder = document.getElementById("cameraPlaceholder");
const cameraPlaceholderTitle = document.getElementById("cameraPlaceholderTitle");
const cameraPlaceholderText = document.getElementById("cameraPlaceholderText");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const output = document.getElementById("output");
const letterView = document.getElementById("letter-view");
const captureHint = document.getElementById("captureHint");
const progressBar = document.getElementById("progress-bar");
const progressFill = document.getElementById("progress-fill");
const wordBox = document.getElementById("word-box");
const wordView = document.getElementById("word");

const gameToggleBtn = document.getElementById("gameToggleBtn");
const gameModeState = document.getElementById("gameModeState");
const gameBoard = document.getElementById("game-board");
const gameTarget = document.getElementById("game-target");
const gameMessage = document.getElementById("game-message");

let currentWord = "";
let lastDetectedLetter = "";
let holdCount = 0;
const REQUIRED_HOLD = 8;
let lockLetterToken = false;

let useBackCamera = false;
let currentStream = null;
let cameraRunId = 0;
let isModelReady = false;
let pose = null;

const gameWords = ["КОТ", "МОРЕ", "ФЛОТ", "МАЯК", "НЕБО", "ПОРТ", "ЯКОРЬ", "КРАБ", "ШУМ", "ВОЛНА"];
let isGameMode = false;
let targetWord = "";
let currentLetterIndex = 0;
let newWordTimer = null;

const alphabetTargets = [
  { letter: "А", leftAngle: 45, rightAngle: 315 },
  { letter: "Б", leftAngle: 320, rightAngle: 270 },
  { letter: "В", leftAngle: 0, rightAngle: 270 },
  { letter: "Г", leftAngle: 80, rightAngle: 350 },
  { letter: "Д", leftAngle: 90, rightAngle: 40 },
  { letter: "Е/Ё/Э", leftAngle: 5, rightAngle: 240 },
  { letter: "Ж", leftAngle: 85, rightAngle: 230 },
  { letter: "З", leftAngle: 125, rightAngle: 270 },
  { letter: "И/Й", leftAngle: 10, rightAngle: 200 },
  { letter: "К", leftAngle: 110, rightAngle: 55 },
  { letter: "Л", leftAngle: 40, rightAngle: 230 },
  { letter: "М", leftAngle: 110, rightAngle: 300 },
  { letter: "Н", leftAngle: 5, rightAngle: 310 },
  { letter: "О", leftAngle: 50, rightAngle: 355 },
  { letter: "П", leftAngle: 75, rightAngle: 205 },
  { letter: "Р", leftAngle: 170, rightAngle: 270 },
  { letter: "С", leftAngle: 115, rightAngle: 355 },
  { letter: "Т", leftAngle: 90, rightAngle: 260 },
  { letter: "У", leftAngle: 130, rightAngle: 225 },
  { letter: "Ф", leftAngle: 40, rightAngle: 200 },
  { letter: "Х", leftAngle: 315, rightAngle: 230 },
  { letter: "Ц", leftAngle: 40, rightAngle: 270 },
  { letter: "Ч", leftAngle: 100, rightAngle: 320 },
  { letter: "Ш", leftAngle: 120, rightAngle: 195 },
  { letter: "Щ", leftAngle: 170, rightAngle: 230 },
  { letter: "Ь/Ъ", leftAngle: 170, rightAngle: 190 },
  { letter: "Ы", leftAngle: 170, rightAngle: 350 },
  { letter: "Ю", leftAngle: 315, rightAngle: 230 },
  { letter: "Я", leftAngle: 130, rightAngle: 40 }
];

function setSystemStatus(state, text) {
  systemStatus.dataset.state = state;
  systemStatusText.textContent = text;
}

function setLoaderText(text) {
  loaderText.textContent = text;
}

function hideLoader() {
  loader.classList.add("is-hidden");
}

// Не блокируем интерфейс, пока пользователь принимает решение о доступе к камере.
window.setTimeout(() => {
  if (!isModelReady) hideLoader();
}, 1600);

function showCameraPlaceholder(title, text) {
  cameraPlaceholderTitle.textContent = title;
  cameraPlaceholderText.textContent = text;
  cameraPlaceholder.classList.remove("is-hidden");
}

function hideCameraPlaceholder() {
  cameraPlaceholder.classList.add("is-hidden");
}

function openTab(tabId, selectedButton) {
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.hidden = tab.id !== tabId;
  });

  document.querySelectorAll(".tab-btn").forEach((button) => {
    const isSelected = button === selectedButton;
    button.classList.toggle("active", isSelected);
    button.setAttribute("aria-selected", String(isSelected));
  });
}

document.querySelectorAll(".tab-btn").forEach((button) => {
  button.addEventListener("click", () => openTab(button.dataset.tab, button));
});

function updateWordView() {
  wordView.textContent = currentWord;
}

function updateProgress(value) {
  const normalizedValue = Math.max(0, Math.min(100, value));
  progressFill.style.width = `${normalizedValue}%`;
  progressBar.setAttribute("aria-valuenow", String(Math.round(normalizedValue)));
}

function resetProgress(message = "Займите положение перед камерой") {
  holdCount = 0;
  lockLetterToken = false;
  lastDetectedLetter = "";
  updateProgress(0);
  captureHint.textContent = message;
}

function flashWordBox() {
  wordBox.classList.add("is-flashing");
  window.setTimeout(() => wordBox.classList.remove("is-flashing"), 280);
}

function setGameMessage(message, state = "neutral") {
  gameMessage.textContent = message;
  gameMessage.dataset.state = state;
}

function updateGameUI() {
  const letters = [...targetWord].map((letter, index) => {
    const element = document.createElement("span");
    element.textContent = letter;

    if (index < currentLetterIndex) {
      element.className = "is-complete";
    } else if (index === currentLetterIndex) {
      element.className = "is-current";
    } else {
      element.className = "is-pending";
    }

    return element;
  });

  gameTarget.replaceChildren(...letters);
}

function startNewWord() {
  if (!isGameMode) return;

  targetWord = gameWords[Math.floor(Math.random() * gameWords.length)];
  currentLetterIndex = 0;
  currentWord = "";
  updateWordView();
  updateGameUI();
  setGameMessage("Покажите первую букву");
}

gameToggleBtn.addEventListener("click", () => {
  isGameMode = !isGameMode;
  gameToggleBtn.setAttribute("aria-pressed", String(isGameMode));
  gameModeState.textContent = isGameMode ? "Включена" : "Выключена";
  gameBoard.hidden = !isGameMode;

  if (newWordTimer) {
    window.clearTimeout(newWordTimer);
    newWordTimer = null;
  }

  if (isGameMode) {
    startNewWord();
  } else {
    currentWord = "";
    updateWordView();
  }
});

function getAngleDiff(firstAngle, secondAngle) {
  const difference = Math.abs(firstAngle - secondAngle) % 360;
  return difference > 180 ? 360 - difference : difference;
}

function drawJoint(point) {
  if (point.visibility <= 0.5) return;

  const x = point.x * canvas.width;
  const y = point.y * canvas.height;

  ctx.beginPath();
  ctx.arc(x, y, 8, 0, 2 * Math.PI);
  ctx.fillStyle = "rgba(36, 87, 214, 0.2)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, 4, 0, 2 * Math.PI);
  ctx.fillStyle = "#7fa0ff";
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function addDetectedCharacter(bestLetter) {
  const detectedCharacter = bestLetter.split("/")[0];

  if (isGameMode) {
    if (detectedCharacter !== targetWord[currentLetterIndex]) {
      setGameMessage("Другая буква. Повторите", "error");
      return;
    }

    currentWord += detectedCharacter;
    currentLetterIndex += 1;
    updateGameUI();

    if (currentLetterIndex >= targetWord.length) {
      setGameMessage("Слово собрано", "success");
      newWordTimer = window.setTimeout(startNewWord, 2500);
    } else {
      setGameMessage("Верно. Следующая буква", "success");
    }
  } else {
    currentWord += detectedCharacter;
  }

  updateWordView();
  flashWordBox();
}

function onResults(results) {
  if (!isModelReady) {
    isModelReady = true;
    hideLoader();
    hideCameraPlaceholder();
    setSystemStatus("ready", "Система готова");
    output.textContent = "Камера подключена";
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  if (!results.poseLandmarks) {
    letterView.textContent = "—";
    output.textContent = "Человек не обнаружен";
    resetProgress("Встаньте перед камерой");
    return;
  }

  const landmarks = results.poseLandmarks;
  const leftShoulder = landmarks[11];
  const leftWrist = landmarks[15];
  const rightShoulder = landmarks[12];
  const rightWrist = landmarks[16];

  drawJoint(leftShoulder);
  drawJoint(leftWrist);
  drawJoint(rightShoulder);
  drawJoint(rightWrist);

  const armsAreVisible = [leftShoulder, leftWrist, rightShoulder, rightWrist]
    .every((point) => point.visibility > 0.5);

  if (!armsAreVisible) {
    letterView.textContent = "—";
    output.textContent = "Руки находятся вне кадра";
    resetProgress("Отойдите немного дальше");
    return;
  }

  const leftDeltaX = leftWrist.x - leftShoulder.x;
  const leftDeltaY = leftWrist.y - leftShoulder.y;
  let leftAngle = Math.atan2(leftDeltaX, leftDeltaY) * 180 / Math.PI;
  if (leftAngle < 0) leftAngle += 360;

  const rightDeltaX = rightWrist.x - rightShoulder.x;
  const rightDeltaY = rightWrist.y - rightShoulder.y;
  let rightAngle = Math.atan2(rightDeltaX, rightDeltaY) * 180 / Math.PI;
  if (rightAngle < 0) rightAngle += 360;

  let bestLetter = null;
  let minimumError = Infinity;
  const tolerance = 25;

  alphabetTargets.forEach((target) => {
    const leftError = getAngleDiff(leftAngle, target.leftAngle);
    const rightError = getAngleDiff(rightAngle, target.rightAngle);

    if (leftError <= tolerance && rightError <= tolerance) {
      const totalError = leftError + rightError;
      if (totalError < minimumError) {
        minimumError = totalError;
        bestLetter = target.letter;
      }
    }
  });

  output.textContent = "Поза определена";

  if (!bestLetter) {
    letterView.textContent = "—";
    resetProgress("Скорректируйте положение рук");
    return;
  }

  letterView.textContent = bestLetter;

  if (bestLetter !== lastDetectedLetter) {
    lastDetectedLetter = bestLetter;
    holdCount = 0;
    lockLetterToken = false;
    updateProgress(0);
    captureHint.textContent = "Удерживайте знак";
    return;
  }

  if (lockLetterToken) {
    captureHint.textContent = "Знак добавлен. Смените позу";
    return;
  }

  holdCount += 1;
  updateProgress(holdCount / REQUIRED_HOLD * 100);
  captureHint.textContent = "Удерживайте знак";

  if (holdCount >= REQUIRED_HOLD) {
    addDetectedCharacter(bestLetter);
    holdCount = 0;
    lockLetterToken = true;
    updateProgress(100);
    captureHint.textContent = "Знак добавлен. Смените позу";
  }
}

async function detectFrame(runId) {
  if (runId !== cameraRunId) return;

  if (video.readyState >= 2) {
    try {
      await pose.send({ image: video });
    } catch (error) {
      console.error("Ошибка обработки кадра:", error);
      output.textContent = "Не удалось обработать кадр. Перезапустите страницу.";
      setSystemStatus("error", "Ошибка модели");
      hideLoader();
      return;
    }
  }

  window.requestAnimationFrame(() => detectFrame(runId));
}

async function startCamera() {
  const runId = ++cameraRunId;
  setSystemStatus("loading", "Подключение камеры");
  setLoaderText("Ожидание доступа к камере");
  showCameraPlaceholder("Ожидание доступа к камере", "Разрешите использование камеры в браузере");

  if (currentStream) {
    currentStream.getTracks().forEach((track) => track.stop());
  }

  canvas.classList.toggle("mirror", !useBackCamera);

  if (!navigator.mediaDevices?.getUserMedia) {
    const message = "Браузер не поддерживает доступ к камере или страница открыта без защищенного соединения.";
    output.textContent = message;
    showCameraPlaceholder("Камера недоступна", "Откройте сайт по HTTPS или через localhost");
    setSystemStatus("error", "Камера недоступна");
    hideLoader();
    return;
  }

  try {
    currentStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: useBackCamera ? "environment" : "user",
        width: { ideal: 1280 },
        height: { ideal: 960 }
      },
      audio: false
    });

    video.srcObject = currentStream;
    await video.play();

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    setLoaderText("Загрузка модели распознавания");
    output.textContent = "Камера подключена. Загружается модель распознавания…";
    detectFrame(runId);
  } catch (error) {
    console.error("Ошибка доступа к камере:", error);
    const permissionDenied = error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError";
    const title = permissionDenied ? "Нет доступа к камере" : "Не удалось подключить камеру";
    const text = permissionDenied
      ? "Разрешите доступ в настройках браузера и перезагрузите страницу"
      : "Проверьте подключение камеры и повторите попытку";

    output.textContent = `${title}. ${text}.`;
    showCameraPlaceholder(title, text);
    setSystemStatus("error", "Требуется камера");
    hideLoader();
  }
}

document.getElementById("flipBtn").addEventListener("click", () => {
  useBackCamera = !useBackCamera;
  startCamera();
});

document.getElementById("spaceBtn").addEventListener("click", () => {
  currentWord += " ";
  updateWordView();
});

document.getElementById("backspaceBtn").addEventListener("click", () => {
  currentWord = currentWord.slice(0, -1);
  updateWordView();
});

document.getElementById("clearBtn").addEventListener("click", () => {
  currentWord = "";
  updateWordView();
});

if (typeof Pose === "undefined") {
  output.textContent = "Не удалось загрузить модель распознавания. Проверьте подключение к интернету.";
  showCameraPlaceholder("Модель не загружена", "Проверьте подключение к интернету и обновите страницу");
  setSystemStatus("error", "Ошибка загрузки");
  hideLoader();
} else {
  try {
    pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });
    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    pose.onResults(onResults);
    startCamera();
  } catch (error) {
    console.error("Ошибка инициализации модели:", error);
    output.textContent = "Не удалось инициализировать модель распознавания.";
    showCameraPlaceholder("Ошибка модели", "Обновите страницу и повторите попытку");
    setSystemStatus("error", "Ошибка модели");
    hideLoader();
  }
}

window.addEventListener("beforeunload", () => {
  if (currentStream) {
    currentStream.getTracks().forEach((track) => track.stop());
  }
});
