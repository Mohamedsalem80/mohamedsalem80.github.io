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

    const answerPool = Array.from(new Set(allowedWords
        .map(word => word.toLowerCase())
        .filter(word => /^[a-z]{5}$/.test(word))));
    const acceptedWords = new Set(allWords
        .concat(answerPool)
        .map(word => word.toLowerCase())
        .filter(word => /^[a-z]{5}$/.test(word)));

    let state = createState(selectAnswer());
    let stats = loadStats();
    let muted = readStorage(MUTE_KEY) === 'true';
    let soundBank = null;
    let toastTimer = 0;

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
            return null;
        }
    }

    function writeStorage(key, value) {
        try {
            window.localStorage.setItem(key, value);
        } catch (error) {
            // Storage is optional; gameplay remains fully functional without it.
        }
    }

    function loadStats() {
        const defaults = {
            played: 0,
            wins: 0,
            streak: 0,
            maxStreak: 0,
            distribution: Array(MAX_GUESSES).fill(0)
        };

        try {
            const stored = JSON.parse(readStorage(STORAGE_KEY));
            if (!stored || typeof stored !== 'object') return defaults;

            return {
                played: Number.isFinite(stored.played) ? Math.max(0, stored.played) : 0,
                wins: Number.isFinite(stored.wins) ? Math.max(0, stored.wins) : 0,
                streak: Number.isFinite(stored.streak) ? Math.max(0, stored.streak) : 0,
                maxStreak: Number.isFinite(stored.maxStreak) ? Math.max(0, stored.maxStreak) : 0,
                distribution: Array.from({ length: MAX_GUESSES }, (_, index) => {
                    const value = stored.distribution && stored.distribution[index];
                    return Number.isFinite(value) ? Math.max(0, value) : 0;
                })
            };
        } catch (error) {
            return defaults;
        }
    }

    function saveStats() {
        writeStorage(STORAGE_KEY, JSON.stringify(stats));
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

        const revealDuration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 20 : 960;
        window.setTimeout(() => {
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
        saveStats();
        updateStatsDisplay();
    }

    function finishGame(won) {
        state.phase = won ? 'won' : 'lost';
        setInputDisabled(true);
        recordResult(won);
        updateStatus(won ? `Solved in ${state.guesses.length}` : 'No guesses left');
        resultTitle.textContent = won ? 'Well played.' : 'Round complete.';
        resultMessage.firstChild.textContent = won
            ? `Solved in ${state.guesses.length}. The word was `
            : 'The word was ';
        resultWord.textContent = state.answer.toUpperCase();
        notify(won ? 'You solved it.' : `The word was ${state.answer.toUpperCase()}.`, won ? 'good' : 'bad', 2200);

        window.setTimeout(() => {
            if (typeof resultDialog.showModal === 'function') {
                resultDialog.showModal();
            } else {
                resultDialog.setAttribute('open', '');
            }
        }, 240);
    }

    function handleInput(input) {
        if (state.phase !== 'playing') return false;

        const key = input.toUpperCase();
        if (/^[A-Z]$/.test(key)) {
            if (state.currentGuess.length >= WORD_LENGTH) {
                playSound('invalid');
                return false;
            }
            state.currentGuess += key.toLowerCase();
            updateBoard();
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
        const normalizedOverride = typeof answerOverride === 'string' ? answerOverride.toLowerCase() : '';
        const answer = answerPool.includes(normalizedOverride) ? normalizedOverride : selectAnswer();
        state = createState(answer);
        if (resultDialog.open) resultDialog.close();
        clearBoard();
        updateStatus();
        notify('New game started.', 'default', 1200);
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
        writeStorage(MUTE_KEY, String(muted));
        muteButton.setAttribute('aria-pressed', String(muted));
        muteButton.setAttribute('aria-label', muted ? 'Enable game sounds' : 'Mute game sounds');
        muteButton.title = muted ? 'Enable game sounds' : 'Mute game sounds';
        muteButton.querySelector('.sound-icon').textContent = muted ? '×' : '♪';
        muteButton.querySelector('.control-label').textContent = muted ? 'Muted' : 'Sound';
        notify(muted ? 'Sound muted.' : 'Sound enabled.', 'default', 1100);
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
        button.disabled = true;
        try {
            const canvas = renderBoardCanvas();
            const blob = await canvasBlob(canvas);
            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `wordl-${Date.now()}.png`;
            link.href = objectUrl;
            link.click();
            window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
            notify('Board downloaded.', 'good');
        } catch (error) {
            notify('The board could not be downloaded.', 'bad');
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
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
    }

    async function shareResult() {
        if (state.phase !== 'won' && state.phase !== 'lost') return;
        const score = state.phase === 'won' ? state.guesses.length : 'X';
        const text = `WORDL ${score}/${MAX_GUESSES}\n\n${resultGrid()}`;

        try {
            if (navigator.share) {
                await navigator.share({ title: 'WORDL result', text });
            } else {
                await copyText(text);
                notify('Result copied.', 'good');
            }
        } catch (error) {
            if (error.name !== 'AbortError') notify('The result could not be shared.', 'bad');
        }
    }

    function handleAction(button) {
        const action = button.dataset.action;
        if (action === 'restart') newGame();
        if (action === 'mute') toggleMute();
        if (action === 'download') downloadBoard(button);
        if (action === 'share') shareResult();
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
        if (resultDialog.open) return;

        const target = event.target instanceof Element ? event.target : null;
        const isTextEntry = target && (target.matches('input, select, textarea') || target.isContentEditable);
        const isNativeActivation = target && target.closest('button, a') && (event.key === 'Enter' || event.key === ' ');
        if (isTextEntry || isNativeActivation) return;

        const key = event.key.length === 1 ? event.key.toUpperCase() : event.key.toUpperCase();
        if (!/^[A-Z]$/.test(key) && key !== 'ENTER' && key !== 'BACKSPACE') return;

        event.preventDefault();
        flashKey(key);
        handleInput(key);
    });

    initializeAccessibility();
    updateStatsDisplay();
    updateStatus();
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