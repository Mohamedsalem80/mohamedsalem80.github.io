function filterWords(words, feedback) {
    if (
        feedback.correctLetters.length !== feedback.correctIndices.length ||
        feedback.misplacedLetters.length !== feedback.misplacedIndices.length
    ) {
        return [];
    }

    const correctByPosition = new Map();
    const correctCounts = new Map();
    const misplacedLetterSet = new Set(feedback.misplacedLetters);

    for (let i = 0; i < feedback.correctLetters.length; i++) {
        const letter = feedback.correctLetters[i];
        const index = feedback.correctIndices[i];
        if (!/^[a-z]$/.test(letter) || index < 0 || index > 4) return [];
        correctByPosition.set(index, letter);
        correctCounts.set(letter, (correctCounts.get(letter) || 0) + 1);
    }

    for (let i = 0; i < feedback.misplacedLetters.length; i++) {
        const letter = feedback.misplacedLetters[i];
        const index = feedback.misplacedIndices[i];
        if (!/^[a-z]$/.test(letter) || index < 0 || index > 4) return [];
    }

    const incorrectLetters = new Set(feedback.incorrectLetters);

    return words.filter(word => {
        if (typeof word !== "string" || word.length !== 5) return false;
        const candidate = word.toLowerCase();

        for (const [index, letter] of correctByPosition) {
            if (candidate[index] !== letter) return false;
        }

        for (let i = 0; i < feedback.misplacedLetters.length; i++) {
            const letter = feedback.misplacedLetters[i];
            const index = feedback.misplacedIndices[i];
            if (!candidate.includes(letter) || candidate[index] === letter) return false;
        }

        for (const letter of incorrectLetters) {
            const count = Array.from(candidate).filter(candidateLetter => candidateLetter === letter).length;
            const knownCount = correctCounts.get(letter) || (misplacedLetterSet.has(letter) ? 1 : 0);
            if (count > knownCount) return false;
        }

        return true;
    });
}

function search(btn) {
    const feedback = {
        correctLetters: [],
        correctIndices: [],
        misplacedLetters: [],
        misplacedIndices: [],
        incorrectLetters: []
    };

    for (let i = 0; i < 5; i++) {
        const correctLetter = document.getElementById("c" + i).value.trim().toLowerCase();
        const misplacedLetters = document.getElementById("m" + i).value.trim().toLowerCase();

        if (/^[a-z]$/.test(correctLetter)) {
            feedback.correctLetters.push(correctLetter);
            feedback.correctIndices.push(i);
        }

        for (const letter of misplacedLetters) {
            if (/^[a-z]$/.test(letter)) {
                feedback.misplacedLetters.push(letter);
                feedback.misplacedIndices.push(i);
            }
        }
    }

    const incorrectLetters = document.getElementById("i0").value.trim().toLowerCase();
    feedback.incorrectLetters = Array.from(incorrectLetters).filter(letter => /^[a-z]$/.test(letter));

    const filteredWords = filterWords(allowedWords, feedback);
    const possibilities = document.getElementById("poss");
    const possibilityCount = document.getElementById("poss-count");

    possibilityCount.textContent = filteredWords.length ? `(${filteredWords.length})` : "(0)";
    possibilities.textContent = filteredWords.length
        ? filteredWords.join(" · ")
        : "No words match these clues. Check the feedback and try again.";

    if (btn) btn.blur();
}

function reset(btn) {
    for (let i = 0; i < 5; i++) {
        document.getElementById("c" + i).value = "";
        document.getElementById("m" + i).value = "";
    }

    document.getElementById("i0").value = "";
    document.getElementById("poss").textContent = "Enter feedback, then search.";
    document.getElementById("poss-count").textContent = "";

    if (btn) btn.blur();
}
