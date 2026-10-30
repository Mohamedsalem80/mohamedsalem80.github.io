(function () {
    'use strict';

    const WORD_LENGTH = 5;
    const MAX_GUESSES = 6;
    const STORAGE_KEY = 'mivex.wordl.stats.v2';
    const MUTE_KEY = 'mivex.wordl.muted';
    const SCORE_RANK = { absent: 1, present: 2, correct: 3 };
    const SOUND_FILES = {
        type: 'sound/click-sound-1.mp3',
        remove: 'sound/click-sound-2.mp3',
        invalid: 'sound/click-sound-3.mp3'
    };

    const rows = Array.from(document.querySelectorAll('.tiles-row'));
    const tiles = rows.map(row => Array.from(row.querySelectorAll('.tile')));
    const keyButtons = Array.from(document.querySelectorAll('[data-key]'));
    const actionButtons = Array.from(document.querySelectorAll('[data-action]'));
    const board = document.getElementById('game');
    const boardFrame = document.querySelector('.board-frame');
    const toastContainer = document.getElementById('toast-container');
    const roundStatus = document.getElementById('roundStatus');
    const gameMessage = document.getElementById('gameMessage');
    const attemptSteps = Array.from(document.querySelectorAll('#attemptTrack span'));
    const muteButton = document.getElementById('mute');
    const resultDialog = document.getElementById('resultDialog');
    const resultTitle = document.getElementById('resultTitle');
    const resultMessage = document.getElementById('resultMessage');
    const resultWord = document.getElementById('resultWord');
    const currentYear = document.getElementById('currentYear');
    const gameMenu = document.getElementById('gameMenu');
    const restartDialog = document.getElementById('restartDialog');
    const saveStatus = document.getElementById('saveStatus');
    const sharePreview = document.getElementById('sharePreview');
    const shareFeedback = document.getElementById('shareFeedback');
    const viewResult = document.getElementById('viewResult');
    const dialogs = Array.from(document.querySelectorAll('dialog'));

    const answerPool = Array.from(new Set(allowedWords
        .map(word => word.toLowerCase())
        .filter(word => /^[a-z]{5}$/.test(word))));
    const acceptedWords = new Set(allWords
        .concat(answerPool)
        .map(word => word.toLowerCase())
        .filter(word => /^[a-z]{5}$/.test(word)));

    let storageProblem = '';
    const savedData = loadSavedData();
    let stats = loadStats(savedData);
    let state = loadRound(savedData && savedData.round) || createState(selectAnswer());
    let muted = readStorage(MUTE_KEY) === 'true';
    let soundBank = null;
    let toastTimer = 0;
    let revealTimer = 0;
    let resultTimer = 0;

    function createState(answer) {
        return {
            answer,
            currentGuess: '',
            guesses: [],
            evaluations: [],
            phase: 'playing'
        };
    }

    function randomIndex(maximum) {
        if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
            const values = new Uint32Array(1);
            window.crypto.getRandomValues(values);
            return Math.floor((values[0] / 4294967296) * maximum);
        }

        return Math.floor(Math.random() * maximum);
    }

    function selectAnswer() {
        return answerPool[randomIndex(answerPool.length)];
    }

    function readStorage(key) {
        try {
            return window.localStorage.getItem(key);
        } catch (error) {
            storageProblem = 'Browser storage is unavailable. Progress and scores cannot be saved.';
            return null;
        }
    }

    function writeStorage(key, value) {
        try {
            window.localStorage.setItem(key, value);
            return true;
        } catch (error) {
            storageProblem = 'Could not save on this browser. Keep this page open to retain your progress.';
            updateSaveStatus();
            return false;
        }
    }

    function loadSavedData() {
        const raw = readStorage(STORAGE_KEY);
        if (!raw) return null;
        try {
            const stored = JSON.parse(raw);
            if (!stored || typeof stored !== 'object' || Array.isArray(stored)) {
                throw new Error('Invalid saved data.');
            }
            return stored;
        } catch (error) {
            storageProblem = 'Saved data could not be read. New progress will replace it.';
            return null;
        }
    }

    function loadStats(stored) {
        const defaults = {
            played: 0,
            wins: 0,
            streak: 0,
            maxStreak: 0,
            distribution: Array(MAX_GUESSES).fill(0)
        };

        if (!stored) return defaults;

        const count = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;
        const played = count(stored.played);
        const wins = Math.min(played, count(stored.wins));
        const streak = Math.min(wins, count(stored.streak));
        return {
            played,
            wins,
            streak,
            maxStreak: Math.max(streak, Math.min(wins, count(stored.maxStreak))),
            distribution: Array.from({ length: MAX_GUESSES }, (_, index) => {
                const value = stored.distribution && stored.distribution[index];
                return Math.min(wins, count(value));
            })
        };
    }

    function loadRound(round) {
        if (!round) return null;
        const valid = answerPool.includes(round.answer)
            && Array.isArray(round.guesses) && round.guesses.length <= MAX_GUESSES
            && round.guesses.every(guess => typeof guess === 'string' && acceptedWords.has(guess))
            && new Set(round.guesses).size === round.guesses.length
            && !round.guesses.slice(0, -1).includes(round.answer)
            && typeof round.currentGuess === 'string' && /^[a-z]{0,5}$/.test(round.currentGuess);
        if (!valid) {
            storageProblem = 'The saved round could not be restored. Your completed scores are still available.';
            return null;
        }
        const restored = createState(round.answer);
        restored.guesses = round.guesses.slice();
        restored.evaluations = restored.guesses.map(guess => scoreGuess(restored.answer, guess));
        restored.phase = restored.guesses.includes(restored.answer) ? 'won'
            : restored.guesses.length === MAX_GUESSES ? 'lost' : 'playing';
        restored.currentGuess = restored.phase === 'playing' ? round.currentGuess : '';
        return restored;
    }

    function updateSaveStatus() {
        const message = storageProblem || 'Progress and scores saved on this browser only.';
        saveStatus.textContent = message;
        document.getElementById('resultSaveStatus').textContent = message;
        saveStatus.classList.toggle('save-warning', Boolean(storageProblem));
    }

    function saveProgress() {
        // Keep the result and counters in one write so a reload cannot count a round twice.
        if (writeStorage(STORAGE_KEY, JSON.stringify({ ...stats, round: state }))) {
            storageProblem = '';
        }
        updateSaveStatus();
    }

    function winRate() {
        return stats.played ? Math.round((stats.wins / stats.played) * 100) : 0;
    }

    function updateStatsDisplay() {
        document.getElementById('playedStat').textContent = stats.played;
        document.getElementById('winRateStat').textContent = `${winRate()}%`;
        document.getElementById('streakStat').textContent = stats.streak;
        document.getElementById('resultPlayed').textContent = stats.played;
        document.getElementById('resultWinRate').textContent = `${winRate()}%`;
        document.getElementById('resultStreak').textContent = stats.streak;
        document.getElementById('totalPlayed').textContent = stats.played;
        document.getElementById('totalWins').textContent = stats.wins;
        document.getElementById('totalWinRate').textContent = `${winRate()}%`;
        document.getElementById('totalStreak').textContent = stats.streak;
        document.getElementById('bestStreak').textContent = stats.maxStreak;
        const distribution = document.getElementById('guessDistribution');
        distribution.replaceChildren();
        const maximum = Math.max(1, ...stats.distribution);
        stats.distribution.forEach((count, index) => {
            const row = document.createElement('div');
            row.className = 'distribution-row';
            const label = document.createElement('span');
            label.textContent = String(index + 1);
            const bar = document.createElement('span');
            bar.className = 'distribution-bar';
            bar.style.width = `${Math.max(8, (count / maximum) * 100)}%`;
            bar.textContent = String(count);
            row.setAttribute('aria-label', `${index + 1} ${index ? 'guesses' : 'guess'}: ${count} wins`);
            row.append(label, bar);
            distribution.appendChild(row);
        });
    }

    function scoreGuess(answer, guess) {
        const result = Array(WORD_LENGTH).fill('absent');
        const remaining = answer.split('');

        for (let index = 0; index < WORD_LENGTH; index += 1) {
            if (guess[index] === answer[index]) {
                result[index] = 'correct';
                remaining[index] = null;
            }
        }

        for (let index = 0; index < WORD_LENGTH; index += 1) {
            if (result[index] === 'correct') continue;

            const matchIndex = remaining.indexOf(guess[index]);
            if (matchIndex !== -1) {
                result[index] = 'present';
                remaining[matchIndex] = null;
            }
        }

        return result;
    }

    function initializeAccessibility() {
        rows.forEach((row, rowIndex) => {
            row.setAttribute('role', 'row');
            tiles[rowIndex].forEach((tile, columnIndex) => {
                tile.setAttribute('role', 'gridcell');
                tile.setAttribute('aria-label', `Row ${rowIndex + 1}, column ${columnIndex + 1}, empty`);
            });
        });
    }

    function updateBoard() {
        const rowIndex = state.guesses.length;
        if (rowIndex >= MAX_GUESSES) return;

        tiles[rowIndex].forEach((tile, columnIndex) => {
            const letter = state.currentGuess[columnIndex] || '';
            tile.textContent = letter.toUpperCase();
            tile.classList.toggle('has-letter', Boolean(letter));
            tile.setAttribute('aria-label', `Row ${rowIndex + 1}, column ${columnIndex + 1}, ${letter ? letter.toUpperCase() : 'empty'}`);
        });
    }

    function updateStatus(message) {
        const activeGuess = Math.min(state.guesses.length + 1, MAX_GUESSES);
        roundStatus.textContent = state.phase === 'won' || state.phase === 'lost'
            ? 'Round complete'
            : `Guess ${activeGuess} of ${MAX_GUESSES}`;
        gameMessage.textContent = message || (state.phase === 'playing' ? 'Five letters' : 'Checking word');

        rows.forEach((row, index) => {
            row.classList.toggle('is-current', state.phase === 'playing' && index === state.guesses.length);
        });

        attemptSteps.forEach((step, index) => {
            step.classList.toggle('is-used', index < state.guesses.length);
            step.classList.toggle('is-current', state.phase === 'playing' && index === state.guesses.length);
        });
    }

    function setInputDisabled(disabled) {
        keyButtons.forEach(button => {
            button.disabled = disabled;
        });
        board.setAttribute('aria-busy', disabled && state.phase === 'revealing' ? 'true' : 'false');
    }

    function updateKeyboard(guess, evaluation) {
        guess.split('').forEach((letter, index) => {
            const key = document.getElementById(letter.toUpperCase());
            const nextState = evaluation[index];
            const currentState = key.dataset.state;

            if (!currentState || SCORE_RANK[nextState] > SCORE_RANK[currentState]) {
                key.dataset.state = nextState;
            }
        });
    }

    function revealGuess(rowIndex, guess, evaluation) {
        tiles[rowIndex].forEach((tile, index) => {
            tile.classList.remove('has-letter');
            tile.classList.add(`is-${evaluation[index]}`, 'is-revealing');
            tile.style.setProperty('--reveal-delay', `${index * 90}ms`);
            tile.setAttribute('aria-label', `Row ${rowIndex + 1}, column ${index + 1}, ${guess[index].toUpperCase()}, ${evaluation[index]}`);
        });
    }

    function shakeCurrentRow() {
        const row = rows[state.guesses.length];
        if (!row) return;
        row.classList.remove('is-shaking');
        void row.offsetWidth;
        row.classList.add('is-shaking');
        row.addEventListener('animationend', () => row.classList.remove('is-shaking'), { once: true });
    }

    function submitGuess() {
        if (state.currentGuess.length !== WORD_LENGTH) {
            notify('Enter five letters.', 'warn');
            shakeCurrentRow();
            playSound('invalid');
            return;
        }

        const guess = state.currentGuess.toLowerCase();
        if (!acceptedWords.has(guess)) {
            notify('Word not found.', 'warn');
            shakeCurrentRow();
            playSound('invalid');
            return;
        }

        if (state.guesses.includes(guess)) {
            notify('You already tried that word.', 'warn');
            shakeCurrentRow();
            playSound('invalid');
            return;
        }

        const rowIndex = state.guesses.length;
        const evaluation = scoreGuess(state.answer, guess);
        state.phase = 'revealing';
        state.guesses.push(guess);
        state.evaluations.push(evaluation);
        setInputDisabled(true);
        updateStatus('Checking word');
        revealGuess(rowIndex, guess, evaluation);
        state.currentGuess = '';
        if (evaluation.every(score => score === 'correct') || state.guesses.length === MAX_GUESSES) {
            recordResult(evaluation.every(score => score === 'correct'));
        } else {
            saveProgress();
        }

        const revealDuration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 20 : 960;
        revealTimer = window.setTimeout(() => {
            updateKeyboard(guess, evaluation);

            if (evaluation.every(score => score === 'correct')) {
                finishGame(true);
                return;
            }

            if (state.guesses.length === MAX_GUESSES) {
                finishGame(false);
                return;
            }

            state.currentGuess = '';
            state.phase = 'playing';
            setInputDisabled(false);
            updateStatus();
        }, revealDuration);
    }

    function recordResult(won) {
        stats.played += 1;
        if (won) {
            stats.wins += 1;
            stats.streak += 1;
            stats.maxStreak = Math.max(stats.maxStreak, stats.streak);
            stats.distribution[state.guesses.length - 1] += 1;
        } else {
            stats.streak = 0;
        }
        saveProgress();
        updateStatsDisplay();
    }

    function finishGame(won) {
        state.phase = won ? 'won' : 'lost';
        setInputDisabled(true);
        updateStatus(won ? `Solved in ${state.guesses.length}` : 'No guesses left');
        prepareResult();
        notify(won ? 'You solved it.' : `The word was ${state.answer.toUpperCase()}.`, won ? 'good' : 'bad', 2200);

        resultTimer = window.setTimeout(() => {
            if (!dialogs.some(dialog => dialog.open)) openDialog(resultDialog);
        }, 240);
    }

    function prepareResult() {
        const won = state.phase === 'won';
        resultTitle.textContent = won ? 'Well played.' : 'Round complete.';
        resultMessage.firstChild.textContent = won
            ? `Solved in ${state.guesses.length}. The word was `
            : 'The word was ';
        resultWord.textContent = state.answer.toUpperCase();
        sharePreview.value = resultText();
        shareFeedback.textContent = '';
        viewResult.hidden = false;
    }

    function handleInput(input) {
        if (state.phase !== 'playing' || dialogs.some(dialog => dialog.open) || gameMenu.open) return false;

        const key = input.toUpperCase();
        if (/^[A-Z]$/.test(key)) {
            if (state.currentGuess.length >= WORD_LENGTH) {
                playSound('invalid');
                return false;
            }
            state.currentGuess += key.toLowerCase();
            updateBoard();
            saveProgress();
            playSound('type');
            return true;
        }

        if (key === 'BACKSPACE') {
            if (!state.currentGuess) {
                playSound('invalid');
                return false;
            }
            state.currentGuess = state.currentGuess.slice(0, -1);
            updateBoard();
            saveProgress();
            playSound('remove');
            return true;
        }

        if (key === 'ENTER') {
            submitGuess();
            return true;
        }

        return false;
    }

    function flashKey(key) {
        const keyButton = document.getElementById(key.toUpperCase());
        if (!keyButton) return;
        keyButton.classList.add('active');
        window.setTimeout(() => keyButton.classList.remove('active'), 90);
    }

    function clearBoard() {
        tiles.flat().forEach((tile, index) => {
            const rowIndex = Math.floor(index / WORD_LENGTH);
            const columnIndex = index % WORD_LENGTH;
            tile.textContent = '';
            tile.className = 'letter-cell tile';
            tile.style.removeProperty('--reveal-delay');
            tile.setAttribute('aria-label', `Row ${rowIndex + 1}, column ${columnIndex + 1}, empty`);
        });

        keyButtons.forEach(button => {
            button.disabled = false;
            button.classList.remove('active');
            delete button.dataset.state;
        });
    }

    function newGame(answerOverride) {
        window.clearTimeout(revealTimer);
        window.clearTimeout(resultTimer);
        const normalizedOverride = typeof answerOverride === 'string' ? answerOverride.toLowerCase() : '';
        const answer = answerPool.includes(normalizedOverride) ? normalizedOverride : selectAnswer();
        state = createState(answer);
        dialogs.forEach(dialog => {
            if (dialog.open) dialog.close();
        });
        viewResult.hidden = true;
        clearBoard();
        setInputDisabled(false);
        updateStatus();
        saveProgress();
        board.focus({ preventScroll: true });
        notify('New game started.', 'default', 1200);
    }

    function openDialog(dialog) {
        gameMenu.open = false;
        if (!dialog.open) dialog.showModal();
    }

    function requestRestart() {
        if (state.phase === 'revealing') {
            notify('Wait for your word to finish revealing.', 'warn');
        } else if (state.phase === 'playing' && (state.currentGuess || state.guesses.length)) {
            document.getElementById('restartDescription').textContent = storageProblem
                ? 'Your current guesses will be cleared. Completed scores and your streak stay in this page, but browser saving is unavailable.'
                : 'Your current guesses will be cleared. Completed scores and your streak will stay saved.';
            openDialog(restartDialog);
        } else {
            newGame();
        }
    }

    function initializeSounds() {
        if (soundBank) return soundBank;
        soundBank = Object.fromEntries(Object.entries(SOUND_FILES).map(([name, source]) => {
            const audio = new Audio(source);
            audio.preload = 'auto';
            return [name, audio];
        }));
        return soundBank;
    }

    function playSound(name) {
        if (muted) return;
        const source = initializeSounds()[name];
        if (!source) return;
        const audio = source.cloneNode();
        audio.volume = 0.55;
        const playback = audio.play();
        if (playback && typeof playback.catch === 'function') playback.catch(() => {});
    }

    function toggleMute() {
        muted = !muted;
        const saved = writeStorage(MUTE_KEY, String(muted));
        muteButton.setAttribute('aria-pressed', String(muted));
        muteButton.setAttribute('aria-label', muted ? 'Enable game sounds' : 'Mute game sounds');
        muteButton.title = muted ? 'Enable game sounds' : 'Mute game sounds';
        muteButton.querySelector('.sound-icon').textContent = muted ? '×' : '♪';
        muteButton.querySelector('.control-label').textContent = muted ? 'Muted' : 'Sound';
        notify(`${muted ? 'Sound muted.' : 'Sound enabled.'}${saved ? '' : ' This preference could not be saved.'}`, saved ? 'default' : 'warn', 2200);
    }

    function notify(message, style = 'default', duration = 1800) {
        window.clearTimeout(toastTimer);
        toastContainer.replaceChildren();
        const toast = document.createElement('div');
        toast.className = `toast toast-${style}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        window.requestAnimationFrame(() => toast.classList.add('show'));
        toastTimer = window.setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        }, duration);
    }

    function roundedRectangle(context, x, y, width, height, radius) {
        const safeRadius = Math.min(radius, width / 2, height / 2);
        context.beginPath();
        context.moveTo(x + safeRadius, y);
        context.lineTo(x + width - safeRadius, y);
        context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
        context.lineTo(x + width, y + height - safeRadius);
        context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
        context.lineTo(x + safeRadius, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
        context.lineTo(x, y + safeRadius);
        context.quadraticCurveTo(x, y, x + safeRadius, y);
        context.closePath();
    }

    function renderBoardCanvas() {
        const scale = 2;
        const padding = { top: 36, right: 36, bottom: 60, left: 36 };
        const frameRect = boardFrame.getBoundingClientRect();
        const logicalWidth = Math.ceil(frameRect.width + padding.left + padding.right);
        const logicalHeight = Math.ceil(frameRect.height + padding.top + padding.bottom);
        const canvas = document.createElement('canvas');
        canvas.width = logicalWidth * scale;
        canvas.height = logicalHeight * scale;

        const context = canvas.getContext('2d');
        context.scale(scale, scale);
        context.fillStyle = '#08090a';
        context.fillRect(0, 0, logicalWidth, logicalHeight);

        context.save();
        context.shadowColor = 'rgba(0, 0, 0, 0.48)';
        context.shadowBlur = 30;
        context.shadowOffsetY = 18;
        roundedRectangle(context, padding.left, padding.top, frameRect.width, frameRect.height, 8);
        context.fillStyle = '#141618';
        context.fill();
        context.restore();

        roundedRectangle(context, padding.left, padding.top, frameRect.width, frameRect.height, 8);
        context.fillStyle = '#141618';
        context.fill();
        context.lineWidth = 1;
        context.strokeStyle = 'rgba(233, 185, 73, 0.58)';
        context.stroke();

        tiles.flat().forEach(tile => {
            const tileRect = tile.getBoundingClientRect();
            const tileStyle = getComputedStyle(tile);
            const x = padding.left + tileRect.left - frameRect.left;
            const y = padding.top + tileRect.top - frameRect.top;
            roundedRectangle(context, x, y, tileRect.width, tileRect.height, 6);
            context.fillStyle = tileStyle.backgroundColor === 'rgba(0, 0, 0, 0)'
                ? '#15181c'
                : tileStyle.backgroundColor;
            context.fill();
            context.lineWidth = Math.max(1, parseFloat(tileStyle.borderWidth) || 1);
            context.strokeStyle = tileStyle.borderColor;
            context.stroke();

            if (tile.textContent) {
                context.fillStyle = tileStyle.color;
                context.font = `${tileStyle.fontWeight} ${tileStyle.fontSize} ${tileStyle.fontFamily}`;
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                context.fillText(tile.textContent, x + (tileRect.width / 2), y + (tileRect.height / 2) + 1);
            }
        });

        context.fillStyle = '#e9b949';
        context.font = 'bold 16px sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        const score = state.phase === 'won' ? `${state.guesses.length}/${MAX_GUESSES}`
            : state.phase === 'lost' ? `X/${MAX_GUESSES}` : 'In progress';
        context.fillText(`WORDL · ${score}`, logicalWidth / 2, logicalHeight - 28);
        return canvas;
    }

    function canvasBlob(canvas) {
        return new Promise((resolve, reject) => {
            canvas.toBlob(blob => {
                if (blob) resolve(blob);
                else reject(new Error('Could not encode the board image.'));
            }, 'image/png');
        });
    }

    async function downloadBoard(button) {
        if (state.phase === 'revealing') {
            notify('Wait for your word to finish revealing.', 'warn');
            return;
        }
        button.disabled = true;
        try {
            const canvas = renderBoardCanvas();
            const blob = await canvasBlob(canvas);
            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `wordl-${Date.now()}.png`;
            link.href = objectUrl;
            (resultDialog.open ? resultDialog : document.body).appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
            notify('Board downloaded.', 'good');
            if (resultDialog.open) shareFeedback.textContent = 'Board image downloaded (includes letters).';
        } catch (error) {
            notify('The board could not be downloaded.', 'bad');
            if (resultDialog.open) shareFeedback.textContent = 'Image download failed. You can still copy the result.';
        } finally {
            button.disabled = false;
        }
    }

    function resultGrid() {
        const symbols = { correct: '🟩', present: '🟨', absent: '⬛' };
        return state.evaluations
            .map(evaluation => evaluation.map(score => symbols[score]).join(''))
            .join('\n');
    }

    async function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        }

        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        resultDialog.appendChild(textarea);
        textarea.select();
        try {
            if (!document.execCommand('copy')) throw new Error('Clipboard copy was refused.');
        } finally {
            textarea.remove();
        }
    }

    function resultText() {
        const score = state.phase === 'won' ? state.guesses.length : 'X';
        return `WORDL ${score}/${MAX_GUESSES}\n\n${resultGrid()}\n\nhttps://mohamedsalem80.github.io/wordl/`;
    }

    async function copyResult(button) {
        if (state.phase !== 'won' && state.phase !== 'lost') return;
        button.disabled = true;
        try {
            await copyText(resultText());
            shareFeedback.textContent = 'Result copied. Paste it into a message or post.';
            notify('Result copied.', 'good');
        } catch (error) {
            sharePreview.focus();
            sharePreview.select();
            shareFeedback.textContent = 'Clipboard unavailable. Select and copy the result above manually.';
        } finally {
            button.disabled = false;
        }
    }

    async function shareResult(button) {
        if (state.phase !== 'won' && state.phase !== 'lost') return;
        if (!navigator.share) {
            await copyResult(button);
            return;
        }
        button.disabled = true;
        try {
            await navigator.share({ title: 'WORDL result', text: resultText() });
            shareFeedback.textContent = 'Result shared.';
        } catch (error) {
            shareFeedback.textContent = error.name === 'AbortError'
                ? 'Sharing canceled. Your result is still here.'
                : 'Sharing unavailable. Use Copy result or copy the preview manually.';
        } finally {
            button.disabled = false;
        }
    }

    function handleAction(button) {
        const action = button.dataset.action;
        if (gameMenu.contains(button)) {
            gameMenu.open = false;
            gameMenu.querySelector('summary').focus();
        }
        if (action === 'restart') requestRestart();
        if (action === 'confirm-restart') newGame();
        if (action === 'cancel-restart') restartDialog.close();
        if (action === 'statistics') openDialog(document.getElementById('statsDialog'));
        if (action === 'help') openDialog(document.getElementById('helpDialog'));
        if (action === 'view-result') openDialog(resultDialog);
        if (action === 'close-dialog') button.closest('dialog').close();
        if (action === 'mute') toggleMute();
        if (action === 'download') downloadBoard(button);
        if (action === 'share') shareResult(button);
        if (action === 'copy') copyResult(button);
        if (action === 'close-result' && resultDialog.open) resultDialog.close();
    }

    keyButtons.forEach(button => {
        button.addEventListener('click', () => handleInput(button.dataset.key));
    });

    actionButtons.forEach(button => {
        button.addEventListener('click', () => handleAction(button));
    });

    document.addEventListener('keydown', event => {
        if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
        if (event.key === 'Escape' && gameMenu.open) {
            gameMenu.open = false;
            gameMenu.querySelector('summary').focus();
            event.preventDefault();
            return;
        }
        if (dialogs.some(dialog => dialog.open) || gameMenu.open) return;

        const target = event.target instanceof Element ? event.target : null;
        const isTextEntry = target && (target.matches('input, select, textarea') || target.isContentEditable);
        const isNativeActivation = target && target.closest('button, a, summary') && (event.key === 'Enter' || event.key === ' ');
        if (isTextEntry || isNativeActivation) return;

        const key = event.key.length === 1 ? event.key.toUpperCase() : event.key.toUpperCase();
        if (!/^[A-Z]$/.test(key) && key !== 'ENTER' && key !== 'BACKSPACE') return;

        event.preventDefault();
        flashKey(key);
        if (handleInput(key)) board.focus({ preventScroll: true });
    });

    document.addEventListener('click', event => {
        if (!gameMenu.contains(event.target)) gameMenu.open = false;
    }, true);

    gameMenu.addEventListener('focusout', event => {
        if (!gameMenu.contains(event.relatedTarget)) gameMenu.open = false;
    });

    initializeAccessibility();
    state.guesses.forEach((guess, index) => {
        tiles[index].forEach((tile, column) => { tile.textContent = guess[column].toUpperCase(); });
        revealGuess(index, guess, state.evaluations[index]);
        tiles[index].forEach(tile => tile.classList.remove('is-revealing'));
        updateKeyboard(guess, state.evaluations[index]);
    });
    updateBoard();
    setInputDisabled(state.phase !== 'playing');
    updateStatsDisplay();
    updateStatus(state.phase === 'won' ? `Solved in ${state.guesses.length}`
        : state.phase === 'lost' ? 'No guesses left'
        : state.guesses.length || state.currentGuess ? 'Saved round resumed' : '');
    if (state.phase === 'won' || state.phase === 'lost') prepareResult();
    if (!storageProblem && (!savedData || !savedData.round)) saveProgress();
    updateSaveStatus();
    if (!navigator.share) document.querySelector('[data-action="share"]').hidden = true;
    muteButton.setAttribute('aria-pressed', String(muted));
    muteButton.setAttribute('aria-label', muted ? 'Enable game sounds' : 'Mute game sounds');
    muteButton.querySelector('.sound-icon').textContent = muted ? '×' : '♪';
    muteButton.querySelector('.control-label').textContent = muted ? 'Muted' : 'Sound';
    currentYear.textContent = new Date().getFullYear();

    window.wordlGame = Object.freeze({
        input: handleInput,
        newGame,
        scoreGuess,
        getState: () => ({
            phase: state.phase,
            currentGuess: state.currentGuess,
            guesses: state.guesses.slice(),
            evaluations: state.evaluations.map(evaluation => evaluation.slice()),
            answerPoolSize: answerPool.length,
            acceptedWordCount: acceptedWords.size
        })
    });
}());