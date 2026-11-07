const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

function harness() {
    const elements = new Map();
    function element(id) {
        if (!elements.has(id)) elements.set(id, { value: '', textContent: '' });
        return elements.get(id);
    }
    const context = vm.createContext({ document: { getElementById: element } });
    const html = fs.readFileSync(path.join(root, 'solver', 'index.html'), 'utf8');
    const scripts = Array.from(html.matchAll(/<script src="([^"]+)"/g), match => match[1]);
    for (const script of scripts) {
        const file = path.resolve(root, 'solver', script.split('?')[0]);
        vm.runInContext(fs.readFileSync(file, 'utf8'), context);
    }
    return {
        context,
        element,
        words: Array.from(vm.runInContext('solverWords', context)),
        answers: Array.from(vm.runInContext('allowedWords', context)),
        allWords: Array.from(vm.runInContext('allWords', context))
    };
}

function feedback(overrides = {}) {
    return {
        correctLetters: [],
        correctIndices: [],
        misplacedLetters: [],
        misplacedIndices: [],
        incorrectLetters: [],
        ...overrides
    };
}

test('game and solver pages use the same new dictionary cache versions', () => {
    const gameHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const solverHtml = fs.readFileSync(path.join(root, 'solver', 'index.html'), 'utf8');
    for (const asset of ['all-words.js', 'answer-words.js']) {
        assert.ok(gameHtml.includes(`src="js/${asset}?v=1.1.1"`));
        assert.ok(solverHtml.includes(`src="../js/${asset}?v=1.1.1"`));
    }
    assert.ok(solverHtml.includes('src="../js/wordl-solver.js?v=1.1.1"'));
});

test('the solver page loads the full dictionary once with common answers first', () => {
    const h = harness();
    const expected = Array.from(new Set(h.answers.concat(h.allWords)));
    assert.deepEqual(h.words, expected);
    assert.equal(h.words.length, 13152);
    assert.equal(new Set(h.words).size, h.words.length);
    assert.deepEqual(h.words.slice(0, h.answers.length), h.answers);
    assert.equal(h.element('dictionary-count').textContent, '13,152');
    h.context.search();
    assert.equal(h.element('poss-count').textContent, '(13152)');
    assert.deepEqual(h.element('poss').textContent.split(' · '), expected);
});

test('previously missing original Wordle answers are in both the game pool and solver', () => {
    const h = harness();
    const answerSet = new Set(h.answers);
    for (const word of ['abase', 'abled', 'bezel', 'bicep', 'boozy']) {
        assert.ok(answerSet.has(word));
        for (let index = 0; index < 5; index++) h.element('c' + index).value = word[index];
        h.context.search();
        assert.equal(h.element('poss').textContent, word);
        assert.equal(h.element('poss-count').textContent, '(1)');
    }
});

test('expanded game dictionaries contain only unique five-letter words and accept every answer', () => {
    const h = harness();
    assert.equal(h.answers.length, 5113);
    assert.equal(h.allWords.length, 13152);
    const acceptedWords = new Set(h.allWords);
    for (const words of [h.answers, h.allWords]) {
        assert.equal(new Set(words).size, words.length);
        assert.ok(words.every(word => /^[a-z]{5}$/.test(word)));
    }
    for (const word of h.answers) assert.ok(acceptedWords.has(word), `Answer is not accepted: ${word}`);
    assert.deepEqual(h.answers.slice(0, 5), ['which', 'there', 'other', 'about', 'first']);
});

test('previously missing original Wordle accepted guesses are also searchable', () => {
    const h = harness();
    const acceptedWords = new Set(h.allWords);
    for (const word of ['abers', 'acros', 'adbot', 'aiyee', 'arroz']) {
        assert.ok(acceptedWords.has(word));
        for (let index = 0; index < 5; index++) h.element('c' + index).value = word[index];
        h.context.search();
        assert.equal(h.element('poss').textContent, word);
        assert.equal(h.element('poss-count').textContent, '(1)');
    }
});

test('green, yellow, and gray clues still filter the expanded dictionary', () => {
    const h = harness();
    h.element('c2').value = 'A';
    h.element('m0').value = 'B';
    h.element('m2').value = 'E';
    h.element('i0').value = 'XYZ';
    h.context.search();
    const matches = h.element('poss').textContent.split(' · ');
    assert.ok(matches.includes('abase'));
    for (const word of matches) {
        assert.equal(word[2], 'a');
        assert.ok(word.includes('b') && word[0] !== 'b');
        assert.ok(word.includes('e') && word[2] !== 'e');
        assert.ok(!/[xyz]/.test(word));
    }
});

test('REBAR remains searchable with the accumulated clues from the reported screenshot', () => {
    const h = harness();
    assert.ok(h.answers.includes('rebar'));
    h.element('c4').value = 'R';
    h.element('m1').value = 'RA';
    h.element('m2').value = 'AE';
    h.element('m3').value = 'E';
    h.element('m4').value = 'E';
    h.context.search();
    assert.ok(h.element('poss').textContent.split(' · ').includes('rebar'));

    h.element('c3').value = 'A';
    h.element('i0').value = 'CNLIGHTFOUDPSWM';
    h.context.search();
    assert.ok(h.element('poss').textContent.split(' · ').includes('rebar'));

    for (let index = 0; index < 5; index++) h.element('c' + index).value = 'REBAR'[index];
    h.context.search();
    assert.equal(h.element('poss').textContent, 'rebar');
    assert.equal(h.element('poss-count').textContent, '(1)');
});

test('existing duplicate-letter gray constraints are preserved', () => {
    const h = harness();
    const clues = feedback({
        correctLetters: ['l'],
        correctIndices: [1],
        incorrectLetters: ['l']
    });
    assert.deepEqual(Array.from(h.context.filterWords(['cleat', 'alley'], clues)), ['cleat']);
});

test('no-match feedback and reset retain their messages and clear the form', () => {
    const h = harness();
    for (let index = 0; index < 5; index++) h.element('c' + index).value = 'z';
    let blurCount = 0;
    const button = { blur() { blurCount++; } };
    h.context.search(button);
    assert.equal(h.element('poss-count').textContent, '(0)');
    assert.equal(h.element('poss').textContent, 'No words match these clues. Check the feedback and try again.');
    h.element('m0').value = 'a';
    h.element('i0').value = 'b';
    h.context.reset(button);
    for (let index = 0; index < 5; index++) {
        assert.equal(h.element('c' + index).value, '');
        assert.equal(h.element('m' + index).value, '');
    }
    assert.equal(h.element('i0').value, '');
    assert.equal(h.element('poss-count').textContent, '');
    assert.equal(h.element('poss').textContent, 'Enter feedback, then search.');
    assert.equal(blurCount, 2);
});
