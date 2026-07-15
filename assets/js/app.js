    'use strict';

    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => Array.from(document.querySelectorAll(selector));

    const elements = {
      loader: $('#loader'),
      loaderText: $('#loaderText'),
      logo: $('#flotiliaLogo'),
      logoFallback: $('#logoFallback'),
      video: $('#video'),
      canvas: $('#canvas'),
      statusDot: $('#statusDot'),
      statusText: $('#statusText'),
      cameraModeBadge: $('#cameraModeBadge'),
      letterView: $('#letterView'),
      anglesView: $('#anglesView'),
      calibrationView: $('#calibrationView'),
      confidenceView: $('#confidenceView'),
      progressFill: $('#progressFill'),
      wordView: $('#wordView'),
      wordLabel: $('#wordLabel'),
      modeLabel: $('#modeLabel'),
      gameToggleBtn: $('#gameToggleBtn'),
      gameTarget: $('#gameTarget'),
      gameMessage: $('#gameMessage'),
      spaceBtn: $('#spaceBtn'),
      backspaceBtn: $('#backspaceBtn'),
      clearBtn: $('#clearBtn'),
      flipBtn: $('#flipBtn'),
      pauseBtn: $('#pauseBtn'),
      copyBtn: $('#copyBtn'),
      copyAnglesBtn: $('#copyAnglesBtn'),
      holdRange: $('#holdRange'),
      toleranceRange: $('#toleranceRange'),
      holdValue: $('#holdValue'),
      toleranceValue: $('#toleranceValue'),
      profileMini: $('#profileMini'),
      xpMini: $('#xpMini'),
      playerName: $('#playerName'),
      campSelect: $('#campSelect'),
      squadInput: $('#squadInput'),
      saveProfileBtn: $('#saveProfileBtn'),
      resetProfileBtn: $('#resetProfileBtn'),
      lettersStat: $('#lettersStat'),
      wordsStat: $('#wordsStat'),
      readStat: $('#readStat'),
      streakStat: $('#streakStat'),
      leaderboard: $('#leaderboard'),
      exportBtn: $('#exportBtn'),
      resetRatingBtn: $('#resetRatingBtn'),
      alphabetGrid: $('#alphabetGrid'),
      readingCanvas: $('#readingCanvas'),
      readingStepView: $('#readingStepView'),
      readingDots: $('#readingDots'),
      readingTypedView: $('#readingTypedView'),
      readingModeLabel: $('#readingModeLabel'),
      readingAngleView: $('#readingAngleView'),
      letterAnswerBox: $('#letterAnswerBox'),
      wordAnswerBox: $('#wordAnswerBox'),
      readingLetterInput: $('#readingLetterInput'),
      readingAnswer: $('#readingAnswer'),
      checkReadingLetterBtn: $('#checkReadingLetterBtn'),
      checkReadingWordBtn: $('#checkReadingWordBtn'),
      readLettersBtn: $('#readLettersBtn'),
      readWordBtn: $('#readWordBtn'),
      prevReadBtn: $('#prevReadBtn'),
      nextReadBtn: $('#nextReadBtn'),
      newReadWordBtn: $('#newReadWordBtn'),
      toggleHintBtn: $('#toggleHintBtn'),
      readingMessage: $('#readingMessage'),
      toast: $('#toast')
    };

    const ctx = elements.canvas.getContext('2d');
    const readCtx = elements.readingCanvas.getContext('2d');

    const STORAGE_KEYS = {
      profile: 'artekSemaphore.profile.v5',
      stats: 'artekSemaphore.stats.v5',
      camps: 'artekSemaphore.camps.v5'
    };

    const camps = [
      'Морской', 'Полевой', 'Речной', 'Янтарный', 'Хрустальный', 'Озёрный',
      'Лазурный', 'Лесной', 'Кипарисный', 'Парусный', 'Воздушный'
    ];

    const gameWords = ['МОРЕ', 'ФЛОТ', 'МАЯК', 'НЕБО', 'ПОРТ', 'ЯКОРЬ', 'ВОЛНА', 'АРТЕК', 'ПАРУС', 'СИГНАЛ'];
    const readingWords = ['МОРЕ', 'ФЛОТ', 'МАЯК', 'АРТЕК', 'ВОЛНА', 'ПАРУС', 'КАТЕР', 'СИГНАЛ', 'ЯКОРЬ'];

    // Угол считается так же, как в распознавании: 0° — вниз, 90° — вправо, 180° — вверх, 270° — влево.
    // Эту таблицу удобно править через кнопку «Углы» в интерфейсе.
    const alphabetTargets = [
      { letter: 'А', leftAngle: 45, rightAngle: 315 },
      { letter: 'Б', leftAngle: 320, rightAngle: 270 },
      { letter: 'В', leftAngle: 0, rightAngle: 270 },
      { letter: 'Г', leftAngle: 80, rightAngle: 350 },
      { letter: 'Д', leftAngle: 90, rightAngle: 40 },
      { letter: 'Е/Ё/Э', leftAngle: 5, rightAngle: 240 },
      { letter: 'Ж', leftAngle: 85, rightAngle: 230 },
      { letter: 'З', leftAngle: 125, rightAngle: 270 },
      { letter: 'И/Й', leftAngle: 10, rightAngle: 200 },
      { letter: 'К', leftAngle: 110, rightAngle: 55 },
      { letter: 'Л', leftAngle: 40, rightAngle: 230 },
      { letter: 'М', leftAngle: 110, rightAngle: 300 },
      { letter: 'Н', leftAngle: 5, rightAngle: 310 },
      { letter: 'О', leftAngle: 50, rightAngle: 355 },
      { letter: 'П', leftAngle: 75, rightAngle: 205 },
      { letter: 'Р', leftAngle: 170, rightAngle: 270 },
      { letter: 'С', leftAngle: 115, rightAngle: 355 },
      { letter: 'Т', leftAngle: 90, rightAngle: 260 },
      { letter: 'У', leftAngle: 130, rightAngle: 225 },
      { letter: 'Ф', leftAngle: 40, rightAngle: 200 },
      { letter: 'Х', leftAngle: 315, rightAngle: 230 },
      { letter: 'Ц', leftAngle: 40, rightAngle: 270 },
      { letter: 'Ч', leftAngle: 100, rightAngle: 320 },
      { letter: 'Ш', leftAngle: 120, rightAngle: 195 },
      { letter: 'Щ', leftAngle: 170, rightAngle: 230 },
      { letter: 'Ь/Ъ', leftAngle: 170, rightAngle: 190 },
      { letter: 'Ы', leftAngle: 170, rightAngle: 350 },
      { letter: 'Ю', leftAngle: 315, rightAngle: 230 },
      { letter: 'Я', leftAngle: 130, rightAngle: 40 }
    ];

    const alphabetByChar = new Map();
    for (const item of alphabetTargets) {
      for (const char of item.letter.split('/')) alphabetByChar.set(char, item);
    }

    const state = {
      profile: null,
      stats: createStats(),
      campScores: {},
      text: '',
      gameMode: false,
      targetWord: '',
      targetIndex: 0,
      useBackCamera: false,
      stream: null,
      pose: null,
      aiReady: false,
      processingFrame: false,
      lastPoseSentAt: 0,
      detectionLoopActive: false,
      cameraPaused: false,
      candidate: null,
      stableSince: 0,
      acceptedPose: null,
      lastAngles: null,
      lastClosest: null,
      readingWord: '',
      readingIndex: 0,
      readingMode: 'letters',
      readingSlots: [],
      readingMistakes: 0,
      readingReveal: false,
      readingSolved: false,
      solvedReadingWords: new Set()
    };

    function createStats() {
      return { xp: 0, letters: 0, words: 0, reading: 0, streak: 0, bestStreak: 0 };
    }

    function safeJsonParse(value, fallback) {
      try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
    }

    function saveLocal() {
      localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(state.profile));
      localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(state.stats));
      localStorage.setItem(STORAGE_KEYS.camps, JSON.stringify(state.campScores));
    }

    function loadLocal() {
      state.profile = safeJsonParse(localStorage.getItem(STORAGE_KEYS.profile), null);
      state.stats = { ...createStats(), ...safeJsonParse(localStorage.getItem(STORAGE_KEYS.stats), {}) };
      state.campScores = safeJsonParse(localStorage.getItem(STORAGE_KEYS.camps), {});
      for (const camp of camps) if (!Number.isFinite(state.campScores[camp])) state.campScores[camp] = 0;
    }

    function renderCampOptions() {
      elements.campSelect.replaceChildren();
      for (const camp of camps) {
        const option = document.createElement('option');
        option.value = camp;
        option.textContent = camp;
        elements.campSelect.append(option);
      }
    }

    function renderProfile() {
      const name = state.profile?.name || 'Гость';
      elements.profileMini.textContent = state.profile?.camp ? `${name} • ${state.profile.camp}` : name;
      elements.xpMini.textContent = state.stats.xp;
      elements.lettersStat.textContent = state.stats.letters;
      elements.wordsStat.textContent = state.stats.words;
      elements.readStat.textContent = state.stats.reading;
      elements.streakStat.textContent = state.stats.bestStreak;

      if (state.profile) {
        elements.playerName.value = state.profile.name || '';
        elements.campSelect.value = state.profile.camp || camps[0];
        elements.squadInput.value = state.profile.squad || '';
      }
    }

    function saveProfile() {
      const name = elements.playerName.value.trim() || 'Участник';
      const camp = elements.campSelect.value || camps[0];
      const squad = elements.squadInput.value.trim();
      state.profile = { name, camp, squad, updatedAt: new Date().toISOString() };
      saveLocal();
      renderProfile();
      renderLeaderboard();
      showToast('Профиль сохранён');
    }

    function resetProfile() {
      state.profile = null;
      elements.playerName.value = '';
      elements.squadInput.value = '';
      saveLocal();
      renderProfile();
      renderLeaderboard();
      showToast('Профиль сброшен');
    }

    function award(points, type = 'letter') {
      state.stats.xp += points;
      state.stats.streak += 1;
      state.stats.bestStreak = Math.max(state.stats.bestStreak, state.stats.streak);
      if (type === 'letter') state.stats.letters += 1;
      if (type === 'word') state.stats.words += 1;
      if (type === 'reading') state.stats.reading += 1;

      if (state.profile?.camp) {
        state.campScores[state.profile.camp] = (state.campScores[state.profile.camp] || 0) + points;
      }
      saveLocal();
      renderProfile();
      renderLeaderboard();
    }

    function renderLeaderboard() {
      const rows = camps
        .map((camp) => ({ camp, score: state.campScores[camp] || 0 }))
        .sort((a, b) => b.score - a.score || a.camp.localeCompare(b.camp, 'ru'));
      elements.leaderboard.replaceChildren();
      for (const [index, row] of rows.entries()) {
        const div = document.createElement('div');
        div.className = 'leader-row';
        div.innerHTML = `
          <div class="leader-place">${index + 1}</div>
          <div><div class="leader-name">${row.camp}</div><div class="leader-note">${row.camp === state.profile?.camp ? 'твой лагерь' : 'лагерь'}</div></div>
          <div class="leader-score">${row.score} XP</div>`;
        elements.leaderboard.append(div);
      }
    }

    function exportResults() {
      const data = {
        exportedAt: new Date().toISOString(),
        profile: state.profile,
        stats: state.stats,
        camps: state.campScores
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'artek-semaphore-results.json';
      a.click();
      URL.revokeObjectURL(url);
    }

    function resetRating() {
      state.campScores = Object.fromEntries(camps.map((camp) => [camp, 0]));
      saveLocal();
      renderLeaderboard();
      showToast('Рейтинг очищен');
    }

    function hideLoader() {
      elements.loader.classList.add('hidden');
    }

    function safeHideLoaderAfterDelay(ms = 4500) {
      window.setTimeout(() => {
        if (!state.aiReady) {
          hideLoader();
          if (elements.statusText.textContent === 'Запуск камеры') {
            setStatus('Камера запущена, модель догружается', '');
          }
        }
      }, ms);
    }

    function setStatus(text, mode = '') {
      elements.statusText.textContent = text;
      elements.statusDot.className = `dot ${mode}`;
    }

    function showToast(text) {
      elements.toast.textContent = text;
      elements.toast.classList.add('show');
      clearTimeout(showToast.timer);
      showToast.timer = window.setTimeout(() => elements.toast.classList.remove('show'), 1400);
    }

    function getHoldMs() { return Number(elements.holdRange.value); }
    function getTolerance() { return Number(elements.toleranceRange.value); }

    function initPose() {
      if (typeof Pose === 'undefined') {
        hideLoader();
        setStatus('MediaPipe не загрузился', 'error');
        elements.gameMessage.textContent = 'Проверь интернет: модель Pose загружается через CDN.';
        return false;
      }
      state.pose = new Pose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
      state.pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.55,
        minTrackingConfidence: 0.55
      });
      state.pose.onResults(onPoseResults);
      return true;
    }

    async function startCamera() {
      if (state.stream) state.stream.getTracks().forEach((track) => track.stop());
      state.cameraPaused = false;
      elements.pauseBtn.textContent = 'Пауза';
      elements.canvas.classList.toggle('mirror', !state.useBackCamera);
      elements.cameraModeBadge.textContent = state.useBackCamera ? 'Задняя' : 'Фронтальная';
      setStatus('Запуск камеры', '');
      elements.loaderText.textContent = 'Запускаем камеру. Если модель распознавания грузится долго, интерфейс всё равно откроется.';

      try {
        state.stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: state.useBackCamera ? 'environment' : 'user', width: { ideal: 960 }, height: { ideal: 720 } },
          audio: false
        });

        elements.video.srcObject = state.stream;

        const metadataReady = new Promise((resolve) => {
          if (elements.video.readyState >= 1 && elements.video.videoWidth) {
            resolve();
            return;
          }
          elements.video.onloadedmetadata = resolve;
        });
        const metadataTimeout = new Promise((resolve) => window.setTimeout(resolve, 1200));
        const playPromise = elements.video.play();

        await Promise.race([metadataReady, metadataTimeout]);
        resizeMainCanvas();
        await playPromise;

        if (!state.detectionLoopActive) {
          state.detectionLoopActive = true;
          requestAnimationFrame(detectFrame);
        }

        hideLoader();
        setStatus(state.pose ? 'Камера активна' : 'Камера без модели', state.pose ? 'ready' : '');
      } catch (error) {
        hideLoader();
        setStatus('Ошибка камеры', 'error');
        elements.gameMessage.textContent = 'Разреши доступ к камере и открой сайт по HTTPS или на localhost.';
        console.warn(error);
      }
    }

    function resizeMainCanvas() {
      const w = elements.video.videoWidth || 960;
      const h = elements.video.videoHeight || 720;
      elements.canvas.width = w;
      elements.canvas.height = h;
    }

    async function detectFrame(now = performance.now()) {
      if (!state.cameraPaused && state.pose && !state.processingFrame && elements.video.readyState >= 2) {
        const delay = 1000 / 24;
        if (now - state.lastPoseSentAt >= delay) {
          state.processingFrame = true;
          state.lastPoseSentAt = now;
          try { await state.pose.send({ image: elements.video }); }
          catch (error) { console.warn(error); }
          finally { state.processingFrame = false; }
        }
      }
      requestAnimationFrame(detectFrame);
    }

    function togglePause() {
      state.cameraPaused = !state.cameraPaused;
      elements.pauseBtn.textContent = state.cameraPaused ? 'Продолжить' : 'Пауза';
      setStatus(state.cameraPaused ? 'Пауза' : 'Камера активна', state.cameraPaused ? '' : 'ready');
    }

    function onPoseResults(results) {
      if (!state.aiReady) {
        state.aiReady = true;
        hideLoader();
        setStatus('Распознаю', 'ready');
      }

      if (!elements.canvas.width || !elements.canvas.height) resizeMainCanvas();
      ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
      ctx.drawImage(results.image, 0, 0, elements.canvas.width, elements.canvas.height);

      const landmarks = results.poseLandmarks;
      if (!landmarks) {
        noPose('Плечи и кисти не найдены');
        return;
      }

      const ls = landmarks[11];
      const rs = landmarks[12];
      const lw = landmarks[15];
      const rw = landmarks[16];
      const pointsVisible = [ls, rs, lw, rw].every((point) => point && point.visibility > 0.50);

      if (!pointsVisible) {
        noPose('Отойди дальше: нужны плечи и кисти');
        return;
      }

      const leftAngle = calcArmAngle(ls, lw);
      const rightAngle = calcArmAngle(rs, rw);
      state.lastAngles = { left: leftAngle, right: rightAngle };

      drawDetectedArm(ls, lw, leftAngle, 'L');
      drawDetectedArm(rs, rw, rightAngle, 'R');

      const closest = findClosest(leftAngle, rightAngle);
      state.lastClosest = closest;
      elements.anglesView.textContent = `L: ${Math.round(leftAngle)}° • R: ${Math.round(rightAngle)}°`;
      elements.calibrationView.textContent = closest
        ? `${closest.letter}: ΔL ${Math.round(closest.errL)}° • ΔR ${Math.round(closest.errR)}°`
        : 'Ближайшая буква: —';

      if (closest) {
        const maxError = Math.max(closest.errL, closest.errR);
        const quality = Math.max(0, Math.round(100 - (closest.total / (getTolerance() * 2)) * 100));
        elements.confidenceView.textContent = maxError <= getTolerance() ? `${quality}%` : `мимо допуска (${Math.round(maxError)}°)`;
      }

      if (closest && closest.errL <= getTolerance() && closest.errR <= getTolerance()) {
        elements.letterView.textContent = closest.letter;
        captureCandidate(closest.letter);
      } else {
        elements.letterView.textContent = '?';
        resetCapture(false);
      }
    }

    function noPose(text) {
      elements.letterView.textContent = '—';
      elements.confidenceView.textContent = text;
      resetCapture(false);
    }

    function calcArmAngle(shoulder, wrist) {
      const dx = wrist.x - shoulder.x;
      const dy = wrist.y - shoulder.y;
      let angle = Math.atan2(dx, dy) * 180 / Math.PI;
      if (angle < 0) angle += 360;
      return angle;
    }

    function angleDiff(a, b) {
      const diff = Math.abs(a - b) % 360;
      return diff > 180 ? 360 - diff : diff;
    }

    function findClosest(leftAngle, rightAngle) {
      let best = null;
      for (const target of alphabetTargets) {
        const errL = angleDiff(leftAngle, target.leftAngle);
        const errR = angleDiff(rightAngle, target.rightAngle);
        const total = errL + errR;
        if (!best || total < best.total) best = { ...target, errL, errR, total };
      }
      return best;
    }

    function captureCandidate(letter) {
      const now = performance.now();
      if (state.acceptedPose === letter) {
        elements.progressFill.style.width = '0%';
        return;
      }
      if (state.candidate !== letter) {
        state.candidate = letter;
        state.stableSince = now;
      }
      const progress = Math.min(1, (now - state.stableSince) / getHoldMs());
      elements.progressFill.style.width = `${Math.round(progress * 100)}%`;
      if (progress >= 1) {
        acceptLetter(letter);
        state.acceptedPose = letter;
        state.candidate = null;
        state.stableSince = 0;
        elements.progressFill.style.width = '100%';
      }
    }

    function resetCapture(keepAccepted) {
      state.candidate = null;
      state.stableSince = 0;
      if (!keepAccepted) state.acceptedPose = null;
      elements.progressFill.style.width = '0%';
    }

    function primaryChar(group) { return group.split('/')[0]; }
    function groupContains(group, char) { return group.split('/').includes(char); }

    function acceptLetter(group) {
      const char = primaryChar(group);
      if (state.gameMode) {
        const expected = state.targetWord[state.targetIndex];
        if (groupContains(group, expected)) {
          state.text += expected;
          state.targetIndex += 1;
          award(5, 'letter');
          elements.gameMessage.textContent = state.targetIndex >= state.targetWord.length ? 'Слово собрано.' : `Верно. Теперь «${state.targetWord[state.targetIndex]}».`;
          elements.gameMessage.style.color = 'var(--accent-2)';
          renderGameTarget();
          if (state.targetIndex >= state.targetWord.length) {
            award(25, 'word');
            window.setTimeout(startGameWord, 1500);
          }
        } else {
          state.stats.streak = 0;
          saveLocal();
          renderProfile();
          elements.gameMessage.textContent = `Нужна «${expected}», распознано «${char}».`;
          elements.gameMessage.style.color = 'var(--danger)';
        }
      } else {
        state.text += char;
        award(2, 'letter');
      }
      renderText();
    }

    function renderText() { elements.wordView.textContent = state.text; }

    function toggleGameMode() {
      state.gameMode = !state.gameMode;
      state.text = '';
      renderText();
      elements.modeLabel.textContent = state.gameMode ? 'тренировка' : 'обычный режим';
      elements.wordLabel.textContent = state.gameMode ? 'Ваш ответ' : 'Собранный текст';
      elements.gameToggleBtn.textContent = state.gameMode ? 'Выключить' : 'Тренировка';
      if (state.gameMode) startGameWord();
      else {
        state.targetWord = '';
        state.targetIndex = 0;
        elements.gameTarget.replaceChildren();
        elements.gameMessage.textContent = 'В обычном режиме буквы добавляются в текст.';
        elements.gameMessage.style.color = 'var(--accent-2)';
      }
    }

    function startGameWord() {
      state.targetWord = randomItem(gameWords);
      state.targetIndex = 0;
      state.text = '';
      renderText();
      elements.gameMessage.textContent = `Покажи букву «${state.targetWord[0]}».`;
      elements.gameMessage.style.color = 'var(--accent-2)';
      renderGameTarget();
    }

    function renderGameTarget() {
      elements.gameTarget.replaceChildren();
      for (let i = 0; i < state.targetWord.length; i += 1) {
        const span = document.createElement('span');
        span.className = 'game-letter';
        if (i < state.targetIndex) span.classList.add('done');
        if (i === state.targetIndex) span.classList.add('current');
        span.textContent = state.targetWord[i];
        elements.gameTarget.append(span);
      }
    }

    function randomItem(array) { return array[Math.floor(Math.random() * array.length)]; }

    function drawDetectedArm(shoulder, wrist, angle, label) {
      const w = elements.canvas.width;
      const h = elements.canvas.height;
      const sx = shoulder.x * w;
      const sy = shoulder.y * h;
      const wx = wrist.x * w;
      const wy = wrist.y * h;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(4, w * .006);
      ctx.strokeStyle = 'rgba(40, 210, 177, .82)';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(wx, wy);
      ctx.stroke();
      ctx.fillStyle = '#f5c542';
      circle(sx, sy, Math.max(5, w * .007));
      ctx.fillStyle = '#28d2b1';
      circle(wx, wy, Math.max(6, w * .008));
      drawCameraLabel(wx, wy, `${label}: ${Math.round(angle)}°`);
      ctx.restore();
    }

    function circle(x, y, radius) {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawCameraLabel(x, y, text) {
      ctx.save();
      ctx.font = `900 ${Math.max(15, elements.canvas.width * .022)}px ui-monospace, Consolas, monospace`;
      const pad = 9;
      const width = ctx.measureText(text).width + pad * 2;
      const height = 30;
      const bx = Math.max(8, Math.min(elements.canvas.width - width - 8, x + 12));
      const by = Math.max(8, Math.min(elements.canvas.height - height - 8, y - 42));
      ctx.fillStyle = 'rgba(0,0,0,.62)';
      ctx.strokeStyle = 'rgba(245,197,66,.42)';
      roundRect(ctx, bx, by, width, height, 9);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f5c542';
      ctx.fillText(text, bx + pad, by + 22);
      ctx.restore();
    }

    function roundRect(context, x, y, width, height, radius) {
      const r = Math.min(radius, width / 2, height / 2);
      context.beginPath();
      context.moveTo(x + r, y);
      context.arcTo(x + width, y, x + width, y + height, r);
      context.arcTo(x + width, y + height, x, y + height, r);
      context.arcTo(x, y + height, x, y, r);
      context.arcTo(x, y, x + width, y, r);
      context.closePath();
    }

    async function copyText() {
      try {
        await navigator.clipboard.writeText(state.text);
        showToast('Текст скопирован');
      } catch {
        showToast('Не удалось скопировать');
      }
    }

    async function copyAngles() {
      if (!state.lastAngles) {
        showToast('Сначала покажи руки в камеру');
        return;
      }
      const text = `{ letter: '${state.lastClosest?.letter || '—'}', leftAngle: ${Math.round(state.lastAngles.left)}, rightAngle: ${Math.round(state.lastAngles.right)} }`;
      try {
        await navigator.clipboard.writeText(text);
        showToast('Углы скопированы');
      } catch {
        console.log(text);
        showToast('Углы выведены в консоль');
      }
    }

    function normalizeAnswer(value) {
      return value.trim().toUpperCase().replace(/Ё/g, 'Е').replace(/Й/g, 'И').replace(/[ЪЬ]/g, 'Ь').replace(/\s+/g, '');
    }

    function startReadingWord() {
      state.readingWord = randomItem(readingWords);
      state.readingIndex = 0;
      state.readingSlots = Array(state.readingWord.length).fill('');
      state.readingMistakes = 0;
      state.readingReveal = false;
      state.readingSolved = false;
      elements.readingAnswer.value = '';
      elements.readingLetterInput.value = '';
      elements.readingMessage.textContent = state.readingMode === 'letters' ? 'Прочитай первую букву.' : 'Листай буквы и введи слово целиком.';
      elements.readingMessage.style.color = 'var(--accent-2)';
      renderReadingMode();
      renderReading();
    }

    function renderReadingMode() {
      const letters = state.readingMode === 'letters';
      elements.readingModeLabel.textContent = letters ? 'по буквам' : 'слово целиком';
      elements.readLettersBtn.classList.toggle('active', letters);
      elements.readWordBtn.classList.toggle('active', !letters);
      elements.letterAnswerBox.style.display = letters ? 'block' : 'none';
      elements.wordAnswerBox.style.display = letters ? 'none' : 'block';
    }

    function setReadingMode(mode) {
      state.readingMode = mode;
      renderReadingMode();
      renderReading();
    }

    function renderReading() {
      if (!state.readingWord) return;
      const letter = state.readingWord[state.readingIndex];
      const target = alphabetByChar.get(letter);
      elements.readingStepView.textContent = `буква ${state.readingIndex + 1}/${state.readingWord.length}`;
      if (target) {
        elements.readingAngleView.textContent = state.readingReveal
          ? `${target.letter}: L ${target.leftAngle}° • R ${target.rightAngle}°`
          : `L ${target.leftAngle}° • R ${target.rightAngle}°`;
        drawSemaphoreCard(target, letter);
      }
      renderReadingDots();
    }

    function renderReadingDots() {
      elements.readingDots.replaceChildren();
      for (let i = 0; i < state.readingWord.length; i += 1) {
        const dot = document.createElement('div');
        dot.className = 'read-dot';
        if (i === state.readingIndex && !state.readingSolved) dot.classList.add('current');
        if (state.readingSlots[i]) dot.classList.add('done');
        dot.textContent = state.readingSlots[i] || (i + 1);
        elements.readingDots.append(dot);
      }
      const typed = state.readingSlots.map((item) => item || '·').join('');
      elements.readingTypedView.textContent = typed.includes('·') ? typed : state.readingWord;
    }

    function moveReading(delta) {
      state.readingIndex = Math.max(0, Math.min(state.readingWord.length - 1, state.readingIndex + delta));
      elements.readingLetterInput.value = '';
      renderReading();
    }

    function checkReadingLetter() {
      const raw = normalizeAnswer(elements.readingLetterInput.value);
      const answer = raw[0] || '';
      const expected = state.readingWord[state.readingIndex];
      const target = alphabetByChar.get(expected);
      if (!answer) {
        elements.readingMessage.textContent = 'Введи букву.';
        elements.readingMessage.style.color = 'var(--accent)';
        return;
      }
      if (target && groupContains(target.letter, answer)) {
        state.readingSlots[state.readingIndex] = expected;
        elements.readingLetterInput.value = '';
        elements.readingMessage.textContent = `Верно: ${expected}.`;
        elements.readingMessage.style.color = 'var(--accent-2)';
        if (state.readingSlots.every(Boolean)) {
          finishReading();
        } else {
          const next = state.readingSlots.findIndex((slot, index) => !slot && index > state.readingIndex);
          state.readingIndex = next >= 0 ? next : state.readingSlots.findIndex((slot) => !slot);
        }
      } else {
        state.readingMistakes += 1;
        state.stats.streak = 0;
        saveLocal();
        renderProfile();
        elements.readingMessage.textContent = `Пока нет. Ты ввёл «${answer}».`;
        elements.readingMessage.style.color = 'var(--danger)';
      }
      renderReading();
    }

    function checkReadingWord() {
      const answer = normalizeAnswer(elements.readingAnswer.value);
      const expected = normalizeAnswer(state.readingWord);
      if (!answer) {
        elements.readingMessage.textContent = 'Введи слово.';
        elements.readingMessage.style.color = 'var(--accent)';
        return;
      }
      if (answer === expected) {
        state.readingSlots = state.readingWord.split('');
        finishReading();
      } else {
        state.readingMistakes += 1;
        state.stats.streak = 0;
        saveLocal();
        renderProfile();
        elements.readingMessage.textContent = `Пока нет: «${answer}» не совпало.`;
        elements.readingMessage.style.color = 'var(--danger)';
      }
      renderReading();
    }

    function finishReading() {
      if (state.readingSolved) return;
      state.readingSolved = true;
      const bonus = Math.max(12, 30 - state.readingMistakes * 3);
      if (!state.solvedReadingWords.has(state.readingWord)) {
        state.solvedReadingWords.add(state.readingWord);
        award(bonus, 'reading');
      }
      elements.readingMessage.textContent = `Слово прочитано: ${state.readingWord}.`;
      elements.readingMessage.style.color = 'var(--accent-2)';
    }

    function toggleReadingHint() {
      state.readingReveal = !state.readingReveal;
      elements.toggleHintBtn.textContent = state.readingReveal ? 'Скрыть' : 'Подсказка';
      renderReading();
    }

    function drawSemaphoreCard(target, currentLetter) {
      const canvas = elements.readingCanvas;
      const w = canvas.width;
      const h = canvas.height;
      readCtx.clearRect(0, 0, w, h);
      drawPaperBackground(w, h);

      const cx = w / 2;
      const headY = h * 0.27;
      const shoulderY = h * 0.39;
      const bodyBottom = h * 0.72;
      const shoulderGap = 34;
      const armLength = Math.min(w, h) * 0.30;

      const orderedAngles = orderAnglesForCleanFigure(target.leftAngle, target.rightAngle);
      const leftShoulder = { x: cx - shoulderGap, y: shoulderY };
      const rightShoulder = { x: cx + shoulderGap, y: shoulderY };
      const leftHand = pointFromSemaphoreAngle(leftShoulder, orderedAngles[0], armLength);
      const rightHand = pointFromSemaphoreAngle(rightShoulder, orderedAngles[1], armLength);

      readCtx.save();
      readCtx.lineCap = 'round';
      readCtx.lineJoin = 'round';
      readCtx.strokeStyle = '#111';
      readCtx.fillStyle = '#111';

      readCtx.lineWidth = 18;
      readCtx.beginPath();
      readCtx.moveTo(cx, shoulderY - 8);
      readCtx.lineTo(cx, bodyBottom);
      readCtx.stroke();

      readCtx.lineWidth = 12;
      readCtx.beginPath();
      readCtx.moveTo(cx - 28, bodyBottom - 4);
      readCtx.lineTo(cx - 58, bodyBottom + 82);
      readCtx.moveTo(cx + 28, bodyBottom - 4);
      readCtx.lineTo(cx + 58, bodyBottom + 82);
      readCtx.stroke();

      readCtx.lineWidth = 12;
      readCtx.beginPath();
      readCtx.moveTo(leftShoulder.x, leftShoulder.y);
      readCtx.lineTo(leftHand.x, leftHand.y);
      readCtx.moveTo(rightShoulder.x, rightShoulder.y);
      readCtx.lineTo(rightHand.x, rightHand.y);
      readCtx.stroke();

      readCtx.beginPath();
      readCtx.arc(cx, headY, 32, 0, Math.PI * 2);
      readCtx.fill();

      drawChartFlag(leftHand, orderedAngles[0]);
      drawChartFlag(rightHand, orderedAngles[1]);

      readCtx.textAlign = 'center';
      if (state.readingReveal) {
        readCtx.fillStyle = '#111';
        readCtx.font = '900 92px system-ui, sans-serif';
        readCtx.fillText(currentLetter, cx, h - 74);
        readCtx.font = '800 24px system-ui, sans-serif';
        readCtx.fillStyle = '#555';
        readCtx.fillText(`L ${target.leftAngle}° • R ${target.rightAngle}°`, cx, h - 38);
      } else {
        readCtx.fillStyle = '#666';
        readCtx.font = '800 28px system-ui, sans-serif';
        readCtx.fillText('прочитай букву по флажкам', cx, h - 48);
      }
      readCtx.restore();
    }

    function drawPaperBackground(w, h) {
      readCtx.fillStyle = '#f3f4f6';
      readCtx.fillRect(0, 0, w, h);
      readCtx.fillStyle = '#e1e4e8';
      readCtx.fillRect(0, 0, w, 76);
      readCtx.fillStyle = '#111';
      readCtx.font = '900 28px system-ui, sans-serif';
      readCtx.textAlign = 'left';
      readCtx.fillText('SEMAPHORE', 34, 48);
      readCtx.textAlign = 'right';
      readCtx.fillStyle = '#777';
      readCtx.font = '800 18px system-ui, sans-serif';
      readCtx.fillText('режим чтения', w - 34, 48);
      readCtx.strokeStyle = '#d2d6dc';
      readCtx.lineWidth = 2;
      readCtx.beginPath();
      readCtx.moveTo(0, 76);
      readCtx.lineTo(w, 76);
      readCtx.stroke();
    }

    function orderAnglesForCleanFigure(angleA, angleB) {
      const xA = Math.sin(angleA * Math.PI / 180);
      const xB = Math.sin(angleB * Math.PI / 180);
      return xA <= xB ? [angleA, angleB] : [angleB, angleA];
    }

    function pointFromSemaphoreAngle(origin, angleDeg, length) {
      const rad = angleDeg * Math.PI / 180;
      return {
        x: origin.x + Math.sin(rad) * length,
        y: origin.y + Math.cos(rad) * length
      };
    }

    function drawChartFlag(hand, angleDeg) {
      const rad = angleDeg * Math.PI / 180;
      const unit = { x: Math.sin(rad), y: Math.cos(rad) };
      const normal = { x: Math.cos(rad), y: -Math.sin(rad) };
      const poleEnd = { x: hand.x + unit.x * 52, y: hand.y + unit.y * 52 };
      const outer = { x: poleEnd.x + unit.x * 32, y: poleEnd.y + unit.y * 32 };
      const p1 = { x: poleEnd.x + normal.x * 28 - unit.x * 8, y: poleEnd.y + normal.y * 28 - unit.y * 8 };
      const p2 = { x: poleEnd.x - normal.x * 28 - unit.x * 8, y: poleEnd.y - normal.y * 28 - unit.y * 8 };

      readCtx.save();
      readCtx.strokeStyle = '#111';
      readCtx.lineWidth = 5;
      readCtx.lineCap = 'round';
      readCtx.beginPath();
      readCtx.moveTo(hand.x, hand.y);
      readCtx.lineTo(poleEnd.x, poleEnd.y);
      readCtx.stroke();

      readCtx.beginPath();
      readCtx.moveTo(outer.x, outer.y);
      readCtx.lineTo(p1.x, p1.y);
      readCtx.lineTo(p2.x, p2.y);
      readCtx.closePath();
      readCtx.fillStyle = '#fff';
      readCtx.fill();
      readCtx.lineWidth = 3;
      readCtx.stroke();

      readCtx.beginPath();
      readCtx.moveTo(outer.x, outer.y);
      readCtx.lineTo(p1.x, p1.y);
      readCtx.lineTo((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
      readCtx.closePath();
      readCtx.fillStyle = '#111';
      readCtx.fill();
      readCtx.restore();
    }

    function renderAlphabetGrid() {
      elements.alphabetGrid.replaceChildren();
      for (const item of alphabetTargets) {
        const div = document.createElement('div');
        div.className = 'alphabet-item';
        div.innerHTML = `<b>${item.letter}</b><span>L ${item.leftAngle}° • R ${item.rightAngle}°</span>`;
        elements.alphabetGrid.append(div);
      }
    }

    function bindEvents() {
      $$('.tab-btn').forEach((button) => {
        button.addEventListener('click', () => {
          $$('.tab-btn').forEach((btn) => btn.classList.remove('active'));
          $$('.tab-content').forEach((tab) => tab.classList.remove('active'));
          button.classList.add('active');
          $(`#${button.dataset.tab}`).classList.add('active');
          if (button.dataset.tab === 'readingTab') renderReading();
        });
      });

      elements.logo.addEventListener('error', () => {
        elements.logo.style.display = 'none';
        elements.logoFallback.style.display = 'block';
      });

      elements.gameToggleBtn.addEventListener('click', toggleGameMode);
      elements.spaceBtn.addEventListener('click', () => { state.text += ' '; renderText(); });
      elements.backspaceBtn.addEventListener('click', () => { state.text = state.text.slice(0, -1); renderText(); });
      elements.clearBtn.addEventListener('click', () => { state.text = ''; renderText(); });
      elements.flipBtn.addEventListener('click', () => { state.useBackCamera = !state.useBackCamera; startCamera(); });
      elements.pauseBtn.addEventListener('click', togglePause);
      elements.copyBtn.addEventListener('click', copyText);
      elements.copyAnglesBtn.addEventListener('click', copyAngles);
      elements.holdRange.addEventListener('input', () => { elements.holdValue.textContent = `${getHoldMs()} мс`; });
      elements.toleranceRange.addEventListener('input', () => { elements.toleranceValue.textContent = `${getTolerance()}°`; });

      elements.saveProfileBtn.addEventListener('click', saveProfile);
      elements.resetProfileBtn.addEventListener('click', resetProfile);
      elements.exportBtn.addEventListener('click', exportResults);
      elements.resetRatingBtn.addEventListener('click', resetRating);

      elements.readLettersBtn.addEventListener('click', () => setReadingMode('letters'));
      elements.readWordBtn.addEventListener('click', () => setReadingMode('word'));
      elements.prevReadBtn.addEventListener('click', () => moveReading(-1));
      elements.nextReadBtn.addEventListener('click', () => moveReading(1));
      elements.newReadWordBtn.addEventListener('click', startReadingWord);
      elements.toggleHintBtn.addEventListener('click', toggleReadingHint);
      elements.checkReadingLetterBtn.addEventListener('click', checkReadingLetter);
      elements.checkReadingWordBtn.addEventListener('click', checkReadingWord);
      elements.readingLetterInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') checkReadingLetter(); });
      elements.readingAnswer.addEventListener('keydown', (event) => { if (event.key === 'Enter') checkReadingWord(); });
    }

    function init() {
      loadLocal();
      renderCampOptions();
      renderProfile();
      renderLeaderboard();
      renderAlphabetGrid();
      bindEvents();
      startReadingWord();
      elements.holdValue.textContent = `${getHoldMs()} мс`;
      elements.toleranceValue.textContent = `${getTolerance()}°`;

      if (!navigator.mediaDevices?.getUserMedia) {
        hideLoader();
        setStatus('Камера не поддерживается', 'error');
        elements.gameMessage.textContent = 'Открой сайт в современном браузере по HTTPS.';
        return;
      }

      safeHideLoaderAfterDelay();
      if (initPose()) startCamera();
    }

    init();
