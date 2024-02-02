var lines = ["one", "two", "three"];
var network = {
    one: ["Helwan", "Ain Helwan", "Helwan University", "Wadi Hof", "Hadayeq Helwan", "El-Maasara", "Tora El-Asmant", "Kozzika", "Tora El-Balad", "Thakanat El-Maadi", "Maadi", "Hadayeq El-Maadi", "Dar El-Salam", "El-Zahraa'", "Mar Girgis", "El-Malek El-Saleh", "AlSayyeda Zeinab", "Saad Zaghloul", "Sadat", "Nasser", "Urabi", "Al Shohadaa", "Ghamra", "El-Demerdash", "Manshiet El-Sadr", "Kobri El-Qobba", "Hammamat El-Qobba", "Saray El-Qobba", "Hadayeq El-Zaitoun", "Helmeyet El-Zaitoun", "El-Matareyya", "Ain Shams", "Ezbet El-Nakhl", "El-Marg", "New El-Marg"],
    two: ["El Mounib", "Sakiat Mekki", "Omm el Misryeen", "Giza", "Faisal", "Cairo University", "Bohooth", "Dokki", "Opera", "Sadat", "Naguib", "Ataba", "Al Shohadaa", "Massara", "Road El-Farag", "Sainte Teresa", "Khalafawy", "Mezallat", "Koliet El-Zeraa", "Shobra El Kheima"],
    three: ["Adly Mansour", "Heykestep","Omar Ibn Al Khattab", "Qebaa", "Hesham Barakat", "El Nozha", "Nadi El Shams", "Alf Maskan", "Heliopolis", "Haroun", "Al Ahram", "Koleyet El Banat", "Cairo Stadium", "Fair Zone", "Abbassiya", "Abdou Pasha", "El Geish", "Bab El Shaaria", "Ataba", "Nasser", "Maspero", "Safaa Hegazy", "Kit Kat", "Sudan St.", "Imbaba", "El Bohy", "El-Qawmia", "Ring Rd.", "Road El farag corr"]
};
var interchangeMatrix = {
    one: {
        two: ["Al Shohadaa", "Sadat"],
        three: ["Nasser"]
    },
    two: {
        one: ["Al Shohadaa", "Sadat"],
        three: ["Ataba"]
    },
    three: {
        one: ["Nasser"],
        two: ["Ataba"]
    }
};
var stations = document.getElementById("stations");
var z112 = document.getElementById("z112");
var sline = document.getElementById("sline");
var eline = document.getElementById("eline");
var cost = document.getElementById("ticketCost");
var cstats = document.getElementById("cstats");
var pickups = document.querySelectorAll("[name=pickup]");
var pickup = "none";
var dropoffs = document.querySelectorAll("[name=dropoff]");
var dropoff = "none";
var pl1 = document.querySelectorAll(".pickupl1");
var pl2 = document.querySelectorAll(".pickupl2");
var pl3 = document.querySelectorAll(".pickupl3");
var dl1 = document.querySelectorAll(".dropoff1");
var dl2 = document.querySelectorAll(".dropoff2");
var dl3 = document.querySelectorAll(".dropoff3");
var slinestr = "one";
var elinestr = "one";
changeSLine(slinestr);
changeELine(elinestr);
sline.addEventListener("input", function(){
    slinestr = sline.value;
    changeSLine(slinestr);
});
eline.addEventListener("input", function(){
    elinestr = eline.value;
    changeELine(elinestr);
});
function changeSLine(line){
    if(line == "one"){
        pl1.forEach(function(ele, key){
            ele.style.display = "inline-block";
            pickup = pl1[0].value;
        });
        pl2.forEach(function(ele, key){
            ele.style.display = "none";
        });
        pl3.forEach(function(ele, key){
            ele.style.display = "none";
        });
    } else if(line == "two"){
        pl1.forEach(function(ele, key){
            ele.style.display = "none";
        });
        pl2.forEach(function(ele, key){
            ele.style.display = "inline-block";
            pickup = pl2[0].value;
        });
        pl3.forEach(function(ele, key){
            ele.style.display = "none";
        });
    } else if(line == "three"){
        pl1.forEach(function(ele, key){
            ele.style.display = "none";
        });
        pl2.forEach(function(ele, key){
            ele.style.display = "none";
        });
        pl3.forEach(function(ele, key){
            ele.style.display = "inline-block";
            pickup = pl3[0].value;
        });
    }
}
function changeELine(line){
    if(line == "one"){
        dl1.forEach(function(ele, key){
            ele.style.display = "inline-block";
            dropoff = dl1[0].value;
        });
        dl2.forEach(function(ele, key){
            ele.style.display = "none";
        });
        dl3.forEach(function(ele, key){
            ele.style.display = "none";
        });
    } else if(line == "two"){
        dl1.forEach(function(ele, key){
            ele.style.display = "none";
        });
        dl2.forEach(function(ele, key){
            ele.style.display = "inline-block";
            dropoff = dl2[0].value;
        });
        dl3.forEach(function(ele, key){
            ele.style.display = "none";
        });
    } else if(line == "three"){
        dl1.forEach(function(ele, key){
            ele.style.display = "none";
        });
        dl2.forEach(function(ele, key){
            ele.style.display = "none";
        });
        dl3.forEach(function(ele, key){
            ele.style.display = "inline-block";
            dropoff = dl3[0].value;
        });
    }
}
pickups.forEach(function(ele, key){
    ele.addEventListener("input", function(e){
        pickup = e.target.value;
    });
});
dropoffs.forEach(function(ele, key){
    ele.addEventListener("input", function(e){
        dropoff = e.target.value;
    });
});
function calculateTicket(btn){
    btn.blur();
    if((pickup == "none") || (dropoff == "none")) {
        stations.innerText = "Please select the stations";
        z112.style.backgroundColor = "#ff3535";
        return;
    };
    if(slinestr == elinestr){
        var totals = destination(slinestr, pickup, dropoff);
        cstats.innerText = totals.length;
        cost.innerText = coster(totals.length);
        stations.innerText = totals.join(" → ");
    } else {
        routes = [];
        var min1 = 1000;
        interchangeMatrix[slinestr][elinestr].forEach(function(ele, key){
            let m = destination(slinestr, pickup, ele);
            let n = destination(elinestr, dropoff, ele);
            if((m.length + n.length) < min1){
                min1 = (m.length + n.length);
                n.pop()
                routes = m.concat(n.reverse());
            }
        });
        var totalCost = coster(min1 - 1);
        cstats.innerText = (min1 - 1);
        cost.innerText = totalCost;
        stations.innerText = routes.join(" → ");
    }
}
function coster(stations){
    if(stations < 10){
        z112.style.backgroundColor = "#F5F574";
        return 6;
    } else if(stations < 17){
        z112.style.backgroundColor = "#CBE6B0";
        return 8;
    } else if(stations < 24){
        z112.style.backgroundColor = "#EE8BB5";
        return 12;
    } else if(stations < 40){
        z112.style.backgroundColor = "#FBE4B1";
        return 15;
    } 
}

function destination(line, start, end){
    if((start == end)) return [start];
    var route = [];
    if(start ==  end) return 1;
    var stats = network[line];
    var found = 0;
    for(var i = 0; i < stats.length; i++){
        if(stats[i] == start || stats[i] == end) found++;
        if(found != 0){
            route.push(stats[i]);
        }
        if(found == 2) break;
    }
    if(stats.indexOf(start) < stats.indexOf(end)){
        return route;
    } else if(stats.indexOf(start) > stats.indexOf(end)){
        return route.reverse();
    } else {
        return [start];
    }
}