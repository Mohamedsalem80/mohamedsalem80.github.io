var pick = allowedWords[Math.floor(Math.random() * 2310)];
var letCnt = 0;
var tryCnt = 0;
var words = [[],[],[],[],[],[]];
const volumeSoundDefault = 0.75;
var volumeSound = 0.75;
const keys = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "Backspace", "A", "S", "D", "F", "G", "H", "J", "K", "L", "Enter", "Z", "X", "C", "V", "B", "N", "M"];

function Mute(){
    var eleMute = document.getElementById("mute");
    if(volumeSound != 0){
        volumeSound = 0;
        eleMute.innerText = "Unmute";
    } else {
        volumeSound = volumeSoundDefault;
        eleMute.innerText = "Mute";
    }
}

function playClickSound1() {
    if (volumeSound != 0) {
        var audio = new Audio('sound/click-sound-1.mp3');
        audio.volume = volumeSound;
        audio.play();
    }
}

function playClickSound2() {
    if (volumeSound != 0) {
        var audio = new Audio('sound/click-sound-2.mp3');
        audio.volume = volumeSound;
        audio.play();
    }
}

function playClickSound3() {
    if (volumeSound != 0) {
        var audio = new Audio('sound/click-sound-3.mp3');
        audio.volume = volumeSound;
        audio.play();
    }
}

function saveElementAsImage(elementId, filename) {
    const element = document.getElementById(elementId);

    // Use html2canvas to capture the element
    html2canvas(element).then(canvas => {
        // Convert the canvas to a data URL
        const dataUrl = canvas.toDataURL('image/png');

        // Create a link element to download the image
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename || 'element_image.png';

        // Trigger a click event to download the image
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

function fillTile(row, col, letter){
    const rowEle = document.querySelectorAll(".tiles-row")[row];
    const tileEle = rowEle.querySelectorAll(".tile")[col];
    tileEle.innerHTML = letter;
}

function colorFillTiles(scheme, row, blocked){
    const rowEle = document.querySelectorAll(".tiles-row")[row];
    const tileEles = rowEle.querySelectorAll(".tile");
    tileEles.forEach(function(key, index){
        key.classList.add("scheme-"+scheme[index]);
    });
    blocked.forEach(function(key, index){
        document.getElementById(key).classList.add("blocked");
    });
}

function playWord(main, word){
    var result = [0, 0, 0, 0, 0];
    var blocked = [];
    for(var i = 0; i < 5; i++){
        for(var j = 0; j < 5; j++){
            if((i == j) && (word[i] == main[j])){
                result[i] = 2;
                main[j] = 2;
            } else if(word[i] == main[j] && (result[i] == 0)){
                if(word[j] == main[j]){
                    result[j] = 2;
                    main[j] = 2;
                    continue;
                } else {
                    result[i] = 1;
                    main[j] = 1;
                    continue;
                }
            }
        }
        if(result[i] == 0) blocked.push(word[i]);
    }
    return [result, blocked];
}

function checkWord() {
    if(allWords.includes(words[tryCnt].join("").toLowerCase())){
        var test = (pick+"").toUpperCase().split("");
        var query = playWord(test, words[tryCnt]);
        var result = query[0];
        colorFillTiles(result, tryCnt, query[1]);
        if(result.join("") === "22222"){
            notify('🎉 You won! 🎉', 60000, "good");
            tryCnt = 10;
            letCnt = 10;
        } else {
            if(tryCnt > 4){
                tryCnt = 10;
                letCnt = 10;
                notify('Sorry 😢, but you Lost!.\nThe word is "' + pick + '"', 30000, "bad");
            } else {
                tryCnt++;
                letCnt = 0;
            }
        }
    } else {
        notify('⚠ Not a real word!', 3000, "warn");
    }
}

keys.forEach((key, index) => {
    document.getElementById(keys[index]).addEventListener("click", function (event) {
        var keyPressEvent = new KeyboardEvent('keydown', {
            key: event.srcElement.id,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(keyPressEvent);
        setTimeout(function () {
            var keyUpEvent = new KeyboardEvent('keyup', {
                key: event.srcElement.id,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(keyUpEvent);
        }, 1);
    });
});

window.addEventListener("keydown", ({ key }) => {
    if (keys.includes(key.toUpperCase())) {
        document.getElementById(key.toUpperCase()).classList.add("active");
    }
    if(keys.includes(key)){
        document.getElementById(key).classList.add("active");
    }
});

window.addEventListener("keyup", ({ key }) => {
    if (keys.includes(key.toUpperCase())) {
        document.getElementById(key.toUpperCase()).classList.remove("active");
    }
    if (keys.includes(key)) {
        document.getElementById(key).classList.remove("active");
    }
});

document.addEventListener('keyup', function(event) {
    if((letCnt > 4 || tryCnt > 5) && !keys.includes(event.key)){
        playClickSound3();
    } else if(event.key === "Backspace" && letCnt === 0){
        playClickSound3();
    } else if(event.key === "Enter" && letCnt != 5){
        playClickSound3();
    } else {
        if (keys.includes(event.key.toUpperCase())) {
            playClickSound1();
            fillTile(tryCnt, letCnt, event.key.toUpperCase());
            words[tryCnt][letCnt++] = event.key.toUpperCase();
        }else if (keys.includes(event.key)) {
            playClickSound2();
            if(event.key === "Backspace") {
                words[tryCnt][letCnt--] = "";
                fillTile(tryCnt, letCnt, "");
            } else if(event.key === "Enter"){
                checkWord();
            }
        }
        
    }
});
function downloadGame(){
    saveElementAsImage('game', 'wordl.png');
}

function resetGame(btn) {
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 5; j++) {
            fillTile(i, j, "");
            words[i][j] = "";
        }
    }
    letCnt = 0;
    tryCnt = 0;
    const tileEles = document.querySelectorAll(".tile");
    const keyEles = document.querySelectorAll(".keyboard__key");
    const toastContainer = document.getElementById('toast-container');
    toastContainer.innerText = "";
    tileEles.forEach(tile => {
        tile.classList.remove("scheme-0", "scheme-1", "scheme-2");
    });
    keyEles.forEach(key => {
        key.classList.remove("blocked");
    });
    pick = allowedWords[Math.floor(Math.random() * 2310)];

    btn.blur();
}

function notify(message, duration, style) {
    message = message ? message : "";
    duration = duration ? duration : 3000;
    style = style ? style : "default";
    showToast(message, style, duration);
}

function showToast(message, style = "default", duration = 3000) {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + style;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.add('hide');
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 350);
        }, duration);
    }, 100);
}