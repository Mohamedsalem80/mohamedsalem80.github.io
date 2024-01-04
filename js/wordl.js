const pick = allowedWords[Math.floor(Math.random() * 2310)];
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

function colorFillTiles(scheme, row){
    const rowEle = document.querySelectorAll(".tiles-row")[row];
    const tileEles = rowEle.querySelectorAll(".tile");
    tileEles.forEach(function(key, index){
        key.classList.add("scheme-"+scheme[index]);
    });
}

function checkWord() {
    if(allWords.includes(words[tryCnt].join("").toLowerCase())){
        var test = (pick+"").toUpperCase();
        result = [];
        for(var i = 0; i < 5; i++){
            flag = 0;
            for(var j = 0; j < 5; j++){
                if(test[j] == words[tryCnt][i]){
                    if(i === j){
                        flag = 2;
                        test = test.split('');
                        test[j] = flag + "";
                        test = test.join('');
                        break;
                    } else {
                        flag = 1;
                        test = test.split('');
                        test[j] = flag + "";
                        test = test.join('');
                    }
                }
            }
            result.push(flag);
        }
        colorFillTiles(result, tryCnt);
        if(result.join("") === "22222"){
            window.alert("You won!");
            tryCnt = 10;
            letCnt = 10;
        } else {
            if(tryCnt > 4){
                console.log("ended");
                tryCnt = 10;
                letCnt = 10;
                window.alert("You Lost!.\nThe word is "+pick);
            } else {
                tryCnt++;
                letCnt = 0;
            }
        }
    } else {
        window.alert("Not a real word!");
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