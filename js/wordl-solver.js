function filterWords(words, feedback) {
    var fwords = words;
    fwords = words.filter(word => {
        for (let i = 0; i < feedback.correctLetters.length; i++) {
            if (word[feedback.correctIndices[i]] !== feedback.correctLetters[i]) return false;
        }            
        return true;
    });
    fwords = fwords.filter(word => {
        for (let i = 0; i < feedback.misplacedLetters.length; i++) {
            const misplacedLetter = feedback.misplacedLetters[i];
            const misplacedIndex = feedback.misplacedIndices[i];
            if(!feedback.correctLetters.includes(misplacedLetter)){
                if (!word.includes(misplacedLetter) || word[misplacedIndex] === misplacedLetter) {
                    return false;
                }
            }
        }            
        return true;
    });
    fwords = fwords.filter(word => {
        for (let letter of feedback.incorrectLetters) {
            for(var k = 0; k < 5; k++){
                if((letter == word[k])&&(!feedback.correctIndices.includes(k))){
                    return false;
                }
            }
        }
        return true;
    });
    return fwords;
}
function search(btn) {
var feedback = {
    correctLetters: [],
    correctIndices: [],
    misplacedLetters: [],
    misplacedIndices: [],
    incorrectLetters: []
};
for (var i = 0; i < 5; i++) {
    var cval = document.getElementById("c" + i).value.trim().toLowerCase();
    var mval = document.getElementById("m" + i).value.trim().toLowerCase().split("");

    if (/[a-z]/.test(cval)) {
        feedback.correctLetters.push(cval);
        feedback.correctIndices.push(i);
    }
    mval.forEach(function(key){
        if (/[a-z]/.test(key)) {
            if (!feedback.correctLetters.includes(key)) {
                feedback.misplacedLetters.push(key);
                feedback.misplacedIndices.push(i);
            }
        }
    });
}
var ival = document.getElementById("i0").value.trim().toLowerCase();
if (/[a-z]/.test(ival)) {
    feedback.incorrectLetters.push(...(ival.split("")));
}
var filteredWordList = filterWords(allowedWords, feedback);
document.getElementById("poss").innerText = filteredWordList.join(" - ");
btn.blur();
}
function reset(btn) {
// Clear input fields
for (var i = 0; i < 5; i++) {
    document.getElementById("c" + i).value = "";
    document.getElementById("m" + i).value = "";
}
document.getElementById("i0").value = "";

// Reset possibilities
document.getElementById("poss").innerText = " - ";

// Blur the button
btn.blur();
}