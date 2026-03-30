// Cairo Metro Network Data
var lines = ["one", "two", "three"];
var network = {
    one: ["Helwan", "Ain Helwan", "Helwan University", "Wadi Hof", "Hadayeq Helwan", "Elmasraa", "Tura El-Asmant", "Kozzika", "Tura El-Balad", "Sakanat El-Maadi", "Maadi", "Hadayeq El-Maadi", "Dar El-Salam", "El-Zahraa", "Mar Girgis", "El-Malek El-Saleh", "Al-Sayeda Zeinab", "Saad Zaghloul", "Sadat", "Nasser", "Urabi", "Al Shohadaa", "Ghamra", "El-Demerdash", "Manshiet El-Sadr", "Kobri El-Qobba", "Hammamat El-Qobba", "Saray El-Qobba", "Hadayeq El-Zaitoun", "Helmeyet El-Zaitoun", "El-Matareyya", "Ain Shams", "Ezbet El-Nakhl", "El-Marg", "New El-Marg"],
    two: ["El Monib", "Sakiat Mekky", "Omm El-Masryeen", "Giza", "Faisal", "Cairo University", "Bohooth", "Dokki", "Opera", "Sadat", "Mohamed Naguib", "Ataba", "Al Shohadaa", "Masarra", "Rod El-Farag", "St. Teresa", "Khalafawy", "Mezallat", "Koliet El-Zeraa", "Shubra Al Khaimah"],
    three: ["Adly Mansour", "Heykestep","Omar Ibn Al Khattab", "Qebaa", "Hesham Barakat", "El Nozha", "Nadi El Shams", "Alf Maskan", "Heliopolis", "Haroun", "Al Ahram", "Koleyet El Banat", "Cairo Stadium", "Fair Zone", "Abbassiya", "Abdou Pasha", "El Geish", "Bab El Shaaria", "Ataba", "Nasser", "Maspero", "Safaa Hegazy", "Kit Kat", "Sudan St.", "Imbaba", "El Bohy", "El-Qawmia", "Ring Rd.", "Rod El Farag Corridor"]
};

// Planner representation of Line 3 (branched after Kit Kat).
var lineThreeRouteSegments = [
    ["Adly Mansour", "Heykestep", "Omar Ibn Al Khattab", "Qebaa", "Hesham Barakat", "El Nozha", "Nadi El Shams", "Alf Maskan", "Heliopolis", "Haroun", "Al Ahram", "Koleyet El Banat", "Cairo Stadium", "Fair Zone", "Abbassiya", "Abdou Pasha", "El Geish", "Bab El Shaaria", "Ataba", "Nasser", "Maspero", "Safaa Hegazy", "Kit Kat"],
    ["Kit Kat", "Sudan St.", "Imbaba", "El Bohy", "El-Qawmia", "Ring Rd.", "Rod El Farag Corridor"],
    ["Kit Kat", "Tawfikia", "Wadi El Nile", "Gamat El Dowal", "Boulak El Dakrour", "Cairo University"]
];

// Interchange stations between lines
var interchangeMatrix = {
    one: {
        one: network["one"],
        two: ["Al Shohadaa", "Sadat"],
        three: ["Nasser"]
    },
    two: {
        one: ["Al Shohadaa", "Sadat"],
        two: network["two"],
        three: ["Ataba"]
    },
    three: {
        one: ["Nasser"],
        two: ["Ataba"],
        three: network["three"]
    }
};

// DOM Elements
var stations = document.getElementById("stations");
var z112 = document.getElementById("resultsContainer");
var sline = document.getElementById("sline");
var eline = document.getElementById("eline");
var cost = document.getElementById("ticketCost");
var elderlyCost = document.getElementById("elderlyCost");
var specialNeedsCost = document.getElementById("specialNeedsCost");
var estimatedTime = document.getElementById("estimatedTime");
var transferGuide = document.getElementById("transferGuide");
var cstats = document.getElementById("cstats");
var startTravelBtn = document.getElementById("startTravelBtn");
var travelStatus = document.getElementById("travelStatus");
var travelSpeed = document.getElementById("travelSpeed");
var currentLat = document.getElementById("currentLat");
var currentLng = document.getElementById("currentLng");
var destLat = document.getElementById("destLat");
var destLng = document.getElementById("destLng");
var currentLocationLink = document.getElementById("currentLocationLink");
var destLocationLink = document.getElementById("destLocationLink");
var coordResult = document.getElementById("coordResult");
var pickups = document.querySelectorAll("[name=pickup]");
var dropoffs = document.querySelectorAll("[name=dropoff]");
var pl1 = document.querySelectorAll(".pickupl1");
var pl2 = document.querySelectorAll(".pickupl2");
var pl3 = document.querySelectorAll(".pickupl3");
var dl1 = document.querySelectorAll(".dropoff1");
var dl2 = document.querySelectorAll(".dropoff2");
var dl3 = document.querySelectorAll(".dropoff3");

// State variables
var pickup = "none";
var dropoff = "none";
var slinestr = "one";
var elinestr = "one";
var travelWatchId = null;
var travelTickId = null;
var travelState = null;
var stationAreaByKey = {};
var stationBoundsByKey = {};
var showStationAreasOverlay = true;

var TRAVEL_CONFIG = {
    arrivalRadiusKm: 0.08,
    staleGpsMs: 7000,
    fallbackTickMs: 1200,
    maxBacktrackKm: 0.08,
    defaultSpeedKmh: 28,
    minFallbackSpeedKmh: 18,
    maxFallbackSpeedKmh: 40,
    maxSyntheticAdvanceWithoutGpsKm: 1.4,
    gpsRecoveryAccuracyMeters: 75,
    gpsRecoveryBacktrackKm: 2.5,
    recoverySamplesRequired: 2,
    stationAreaRadiusKm: 0.22,
    curveSamplesPerSegment: 8
};

function activateTab(tabId, updateHash) {
    var tabButtons = document.querySelectorAll(".tab-btn[data-tab-target]");
    var tabPanels = document.querySelectorAll(".tab-panel");
    var found = false;

    if (!document.getElementById(tabId)) {
        tabId = "tab-planner";
    }

    tabButtons.forEach(function(btn) {
        var isActive = btn.getAttribute("data-tab-target") === tabId;
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-selected", isActive ? "true" : "false");
        btn.setAttribute("tabindex", isActive ? "0" : "-1");
        if (isActive) {
            found = true;
        }
    });

    tabPanels.forEach(function(panel) {
        var isActive = panel.id === tabId;
        panel.classList.toggle("active", isActive);
        if (isActive) {
            panel.removeAttribute("hidden");
        } else {
            panel.setAttribute("hidden", "hidden");
        }
    });

    if (updateHash && found) {
        history.replaceState(null, "", "#" + tabId);
    }

    if (tabId === "tab-info" && window.metroMapState && window.metroMapState.map) {
        setTimeout(function() {
            window.metroMapState.map.invalidateSize();
        }, 150);
    }
}

function initTabs() {
    var tabButtons = document.querySelectorAll(".tab-btn[data-tab-target]");
    var navTabLinks = document.querySelectorAll("[data-tab-link]");
    var initialTab = window.location.hash ? window.location.hash.replace("#", "") : "tab-planner";

    tabButtons.forEach(function(btn) {
        btn.addEventListener("click", function() {
            activateTab(btn.getAttribute("data-tab-target"), true);
        });
    });

    navTabLinks.forEach(function(link) {
        link.addEventListener("click", function(event) {
            var target = link.getAttribute("data-tab-link");
            if (!target) return;
            event.preventDefault();
            activateTab(target, true);
        });
    });

    window.addEventListener("hashchange", function() {
        var hashTab = window.location.hash ? window.location.hash.replace("#", "") : "tab-planner";
        activateTab(hashTab, false);
    });

    activateTab(initialTab, false);
}

function initPlannerControls() {
    sline.value = slinestr;
    eline.value = elinestr;
    changeSLine(slinestr);
    changeELine(elinestr);

    function onStartLineChange() {
        slinestr = sline.value || "one";
        changeSLine(slinestr);
    }

    function onEndLineChange() {
        elinestr = eline.value || "one";
        changeELine(elinestr);
    }

    // Support both events to avoid browser inconsistencies on select elements.
    sline.addEventListener("change", onStartLineChange);
    sline.addEventListener("input", onStartLineChange);
    eline.addEventListener("change", onEndLineChange);
    eline.addEventListener("input", onEndLineChange);

    pickups.forEach(function(ele){
        ele.addEventListener("change", function(e){
            pickup = e.target.value;
        });
    });

    dropoffs.forEach(function(ele){
        ele.addEventListener("change", function(e){
            dropoff = e.target.value;
        });
    });
}

// Initialize
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPlannerControls);
    document.addEventListener("DOMContentLoaded", initTabs);
} else {
    initPlannerControls();
    initTabs();
}

function changeSLine(line){
    if(line !== "one" && line !== "two" && line !== "three") line = "one";

    if(line == "one"){
        pl1.forEach(function(ele){
            ele.style.display = "block";
            ele.disabled = false;
        });
        pl2.forEach(function(ele){
            ele.style.display = "none";
            ele.disabled = true;
        });
        pl3.forEach(function(ele){
            ele.style.display = "none";
            ele.disabled = true;
        });
    } else if(line == "two"){
        pl1.forEach(function(ele){
            ele.style.display = "none";
            ele.disabled = true;
        });
        pl2.forEach(function(ele){
            ele.style.display = "block";
            ele.disabled = false;
        });
        pl3.forEach(function(ele){
            ele.style.display = "none";
            ele.disabled = true;
        });
    } else if(line == "three"){
        pl1.forEach(function(ele){
            ele.style.display = "none";
            ele.disabled = true;
        });
        pl2.forEach(function(ele){
            ele.style.display = "none";
            ele.disabled = true;
        });
        pl3.forEach(function(ele){
            ele.style.display = "block";
            ele.disabled = false;
        });
    }

    // Always read pickup from the visible line select.
    var activePickup = getActivePickupSelect(line);
    if (activePickup && activePickup.selectedIndex === 0 && activePickup.options.length > 1) {
        activePickup.selectedIndex = 1;
    }
    pickup = activePickup ? activePickup.value : "";
}

function changeELine(line){
    if(line !== "one" && line !== "two" && line !== "three") line = "one";

    if(line == "one"){
        dl1.forEach(function(ele){
            ele.style.display = "block";
            ele.disabled = false;
        });
        dl2.forEach(function(ele){
            ele.style.display = "none";
            ele.disabled = true;
        });
        dl3.forEach(function(ele){
            ele.style.display = "none";
            ele.disabled = true;
        });
    } else if(line == "two"){
        dl1.forEach(function(ele){
            ele.style.display = "none";
            ele.disabled = true;
        });
        dl2.forEach(function(ele){
            ele.style.display = "block";
            ele.disabled = false;
        });
        dl3.forEach(function(ele){
            ele.style.display = "none";
            ele.disabled = true;
        });
    } else if(line == "three"){
        dl1.forEach(function(ele){
            ele.style.display = "none";
            ele.disabled = true;
        });
        dl2.forEach(function(ele){
            ele.style.display = "none";
            ele.disabled = true;
        });
        dl3.forEach(function(ele){
            ele.style.display = "block";
            ele.disabled = false;
        });
    }

    // Always read dropoff from the visible line select.
    var activeDropoff = getActiveDropoffSelect(line);
    if (activeDropoff && activeDropoff.selectedIndex === 0 && activeDropoff.options.length > 1) {
        activeDropoff.selectedIndex = 1;
    }
    dropoff = activeDropoff ? activeDropoff.value : "";
}

function getActivePickupSelect(line){
    if(line === "one") return pl1[0] || null;
    if(line === "two") return pl2[0] || null;
    return pl3[0] || null;
}

function getActiveDropoffSelect(line){
    if(line === "one") return dl1[0] || null;
    if(line === "two") return dl2[0] || null;
    return dl3[0] || null;
}

function resetForm(){
    slinestr = "one";
    elinestr = "one";
    sline.value = "one";
    eline.value = "one";

    pl1.forEach(function(ele){ ele.selectedIndex = 0; });
    pl2.forEach(function(ele){ ele.selectedIndex = 0; });
    pl3.forEach(function(ele){ ele.selectedIndex = 0; });
    dl1.forEach(function(ele){ ele.selectedIndex = 0; });
    dl2.forEach(function(ele){ ele.selectedIndex = 0; });
    dl3.forEach(function(ele){ ele.selectedIndex = 0; });

    changeSLine(slinestr);
    changeELine(elinestr);

    pickup = "";
    dropoff = "";
    cstats.innerText = "0";
    cost.innerText = "-";
    elderlyCost.innerText = "-";
    specialNeedsCost.innerText = "-";
    estimatedTime.innerText = "-";
    transferGuide.innerText = "";
    stations.textContent = "";
    stations.classList.remove('show');
    document.getElementById('stationsList').innerHTML = "";
    z112.classList.remove('show');
    stopTravelMode(true);
    clearMapHighlights();
    if (window.metroMapState && window.metroMapState.travelLayer) {
        window.metroMapState.travelLayer.clearLayers();
    }
    if (travelStatus) {
        travelStatus.innerText = 'Travel mode is off.';
    }
    if (travelSpeed) {
        travelSpeed.innerText = 'Speed: -- km/h';
    }
}

function normalizeStationName(name) {
    return String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function lineIdToPlannerValue(lineId) {
    if (lineId === 'Line 1') return 'one';
    if (lineId === 'Line 2') return 'two';
    return 'three';
}

function plannerStationName(lineId, stationName) {
    var aliases = {
        'Line 1': {
            'Hadayek Helwan': 'Hadayeq Helwan',
            'El-Maasara': 'Elmasraa',
            'Tora El-Asmant': 'Tura El-Asmant',
            'Tora El-Balad': 'Tura El-Balad',
            'Hadayek El-Maadi': 'Hadayeq El-Maadi',
            'Al-Shohadaa': 'Al Shohadaa'
        },
        'Line 2': {
            'El-Mounib': 'El Monib',
            'El Giza': 'Giza',
            'El Bohoth': 'Bohooth',
            'Attaba': 'Ataba',
            'Road El-Farag': 'Rod El-Farag',
            'Kolleyyet El-Zeraa': 'Koliet El-Zeraa',
            'Shubra El-Kheima': 'Shubra Al Khaimah',
            'Al-Shohadaa': 'Al Shohadaa'
        },
        'Line 3': {
            'El Haykestep': 'Heykestep',
            'Omar Ibn El-Khattab': 'Omar Ibn Al Khattab',
            'Qobaa': 'Qebaa',
            'El-Nozha': 'El Nozha',
            'Nadi El-Shams': 'Nadi El Shams',
            'Heliopolis Square': 'Heliopolis',
            'Al-Ahram': 'Al Ahram',
            'Stadium': 'Cairo Stadium',
            'Abbassia': 'Abbassiya',
            'Attaba': 'Ataba',
            'Sudan': 'Sudan St.',
            'Ring Road': 'Ring Rd.',
            'Rod al-Farag Corridor': 'Rod El Farag Corridor'
        }
    };

    if (aliases[lineId] && aliases[lineId][stationName]) {
        return aliases[lineId][stationName];
    }
    return stationName;
}

function haversineKm(lat1, lng1, lat2, lng2) {
    var R = 6371;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLng = (lng2 - lng1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function stationKey(lineId, plannerName) {
    return normalizeStationName(lineId) + '|' + normalizeStationName(plannerName);
}

function stationAreaRadiusFor(stationObj) {
    if (!stationObj) return TRAVEL_CONFIG.stationAreaRadiusKm;

    if (Number.isFinite(stationObj.areaRadiusKm) && stationObj.areaRadiusKm > 0) {
        return stationObj.areaRadiusKm;
    }

    var directKey = stationKey(stationObj.lineId || '', stationObj.plannerName || stationObj.name || '');
    if (Number.isFinite(stationAreaByKey[directKey])) {
        return stationAreaByKey[directKey];
    }

    return TRAVEL_CONFIG.stationAreaRadiusKm;
}

function parseLineIdFromStopAreaName(nameText) {
    var txt = String(nameText || '');
    var m = txt.match(/line\s*(\d+)/i);
    if (!m) return null;
    if (m[1] === '1') return 'Line 1';
    if (m[1] === '2') return 'Line 2';
    if (m[1] === '3') return 'Line 3';
    return null;
}

function stationAreaColor(lineId) {
    if (lineId === 'Line 1') return '#2E86DE';
    if (lineId === 'Line 2') return '#E74C3C';
    return '#27AE60';
}

function renderStationAreasOverlay() {
    if (!window.metroMapState || !window.metroMapState.stationAreaLayer) return;

    var layer = window.metroMapState.stationAreaLayer;
    layer.clearLayers();

    if (!showStationAreasOverlay) return;

    var stations = window.metroGeoStations || [];
    stations.forEach(function(st) {
        var key = stationKey(st.lineId, st.plannerName);
        var radiusKm = stationAreaRadiusFor(st);
        var color = stationAreaColor(st.lineId);

        L.circle([st.lat, st.lng], {
            radius: radiusKm * 1000,
            color: color,
            weight: 1,
            opacity: 0.55,
            fillColor: color,
            fillOpacity: 0.08,
            interactive: false
        }).addTo(layer);

        var bounds = stationBoundsByKey[key];
        if (bounds) {
            L.rectangle([[bounds.minLat, bounds.minLng], [bounds.maxLat, bounds.maxLng]], {
                color: color,
                weight: 1,
                opacity: 0.65,
                dashArray: '4,4',
                fillOpacity: 0.03,
                interactive: false
            }).addTo(layer);
        }
    });
}

function addStationAreaToggleControl(map) {
    if (!map || typeof L === 'undefined') return;

    var ToggleControl = L.Control.extend({
        options: { position: 'topright' },
        onAdd: function() {
            var container = L.DomUtil.create('div', 'leaflet-bar');
            var button = L.DomUtil.create('a', '', container);
            button.href = '#';
            button.title = 'Toggle station area bounds';
            button.setAttribute('role', 'button');
            button.setAttribute('aria-label', 'Toggle station area bounds');
            button.style.width = '32px';
            button.style.height = '32px';
            button.style.lineHeight = '32px';
            button.style.textAlign = 'center';
            button.style.fontWeight = '700';
            button.style.fontFamily = 'system-ui, sans-serif';
            button.textContent = 'A';

            function refresh() {
                button.style.background = showStationAreasOverlay ? '#1e483f' : '#ffffff';
                button.style.color = showStationAreasOverlay ? '#ffffff' : '#1e483f';
            }

            refresh();

            L.DomEvent.on(button, 'click', function(e) {
                L.DomEvent.stop(e);
                showStationAreasOverlay = !showStationAreasOverlay;
                refresh();
                renderStationAreasOverlay();
            });

            return container;
        }
    });

    map.addControl(new ToggleControl());
}

function loadStationAreasFromInternet() {
    if (!window.metroGeoStations || window.metroGeoStations.length === 0) return;

    var query = '[out:json][timeout:25];(relation["public_transport"="stop_area"](30.0,31.1,30.2,31.4););out tags bb;';
    var endpoint = 'https://overpass.kumi.systems/api/interpreter';
    var body = 'data=' + encodeURIComponent(query);

    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: body
    })
        .then(function(res) {
            if (!res.ok) throw new Error('Overpass HTTP ' + res.status);
            return res.json();
        })
        .then(function(data) {
            var elements = (data && data.elements) ? data.elements : [];
            if (!elements.length) return;

            var updated = 0;

            elements.forEach(function(rel) {
                if (!rel || !rel.bounds) return;

                var b = rel.bounds;
                var minLat = Number(b.minlat);
                var minLng = Number(b.minlon);
                var maxLat = Number(b.maxlat);
                var maxLng = Number(b.maxlon);
                if (!Number.isFinite(minLat) || !Number.isFinite(minLng) || !Number.isFinite(maxLat) || !Number.isFinite(maxLng)) return;

                var centerLat = (minLat + maxLat) / 2;
                var centerLng = (minLng + maxLng) / 2;
                var cornerRadiusKm = Math.max(
                    haversineKm(centerLat, centerLng, minLat, minLng),
                    haversineKm(centerLat, centerLng, minLat, maxLng),
                    haversineKm(centerLat, centerLng, maxLat, minLng),
                    haversineKm(centerLat, centerLng, maxLat, maxLng)
                );
                var inferredRadiusKm = clampValue(cornerRadiusKm * 0.9, 0.12, 0.55);

                var tags = rel.tags || {};
                var nameEn = tags['name:en'] || tags.int_name || tags.name || '';
                var inferredLineId = parseLineIdFromStopAreaName(nameEn);

                var nearest = null;
                var nearestDist = Number.MAX_VALUE;
                (window.metroGeoStations || []).forEach(function(st) {
                    if (inferredLineId && st.lineId !== inferredLineId) {
                        return;
                    }
                    var dist = haversineKm(centerLat, centerLng, st.lat, st.lng);
                    if (dist < nearestDist) {
                        nearest = st;
                        nearestDist = dist;
                    }
                });

                if (!nearest || nearestDist > 0.7) return;

                var key = stationKey(nearest.lineId, nearest.plannerName);
                stationAreaByKey[key] = inferredRadiusKm;
                nearest.areaRadiusKm = inferredRadiusKm;
                stationBoundsByKey[key] = {
                    minLat: minLat,
                    minLng: minLng,
                    maxLat: maxLat,
                    maxLng: maxLng
                };
                updated += 1;
            });

            if (updated > 0) {
                window.stationAreaCoverage = {
                    source: 'OSM Overpass stop_area bounds',
                    updatedStations: updated,
                    loadedAt: Date.now()
                };
                renderStationAreasOverlay();
            }
        })
        .catch(function() {
            // Keep fallback static radius when network or CORS is unavailable.
        });
}

function estimateBoundsFromRadius(lat, lng, radiusKm) {
    var latDelta = radiusKm / 111.32;
    var cosLat = Math.cos((lat * Math.PI) / 180);
    var safeCosLat = Math.max(0.15, Math.abs(cosLat));
    var lngDelta = radiusKm / (111.32 * safeCosLat);

    return {
        minLat: lat - latDelta,
        minLng: lng - lngDelta,
        maxLat: lat + latDelta,
        maxLng: lng + lngDelta
    };
}

function resolveStationBounds(station) {
    var key = stationKey(station.lineId, station.plannerName);
    if (stationBoundsByKey[key]) {
        return {
            bounds: stationBoundsByKey[key],
            source: 'osm_stop_area'
        };
    }

    return {
        bounds: estimateBoundsFromRadius(station.lat, station.lng, stationAreaRadiusFor(station)),
        source: 'estimated_from_radius'
    };
}

function downloadTextFile(filename, content, mimeType) {
    var blob = new Blob([content], { type: mimeType || 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function downloadStationBoundsData() {
    var stations = window.metroGeoStations || [];
    if (!stations.length) {
        if (travelStatus) {
            travelStatus.innerText = 'Cannot download bounds: station map data is not loaded yet.';
        }
        return;
    }

    var features = stations.map(function(st) {
        var resolved = resolveStationBounds(st);
        var b = resolved.bounds;

        return {
            type: 'Feature',
            properties: {
                stationName: st.plannerName,
                originalName: st.name,
                lineId: st.lineId,
                lineValue: st.lineValue,
                areaRadiusKm: stationAreaRadiusFor(st),
                boundsSource: resolved.source
            },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [b.minLng, b.minLat],
                    [b.maxLng, b.minLat],
                    [b.maxLng, b.maxLat],
                    [b.minLng, b.maxLat],
                    [b.minLng, b.minLat]
                ]]
            }
        };
    });

    var geojson = {
        type: 'FeatureCollection',
        name: 'cairo_metro_station_bounds',
        generatedAt: new Date().toISOString(),
        features: features
    };

    downloadTextFile('cairo_metro_station_bounds.geojson', JSON.stringify(geojson, null, 2), 'application/geo+json;charset=utf-8');

    if (travelStatus) {
        travelStatus.innerText = 'Downloaded station bounds GeoJSON (' + features.length + ' stations).';
    }
}

function downloadStationsData() {
    var stations = window.metroGeoStations || [];
    if (!stations.length) {
        if (travelStatus) {
            travelStatus.innerText = 'Cannot download stations: station map data is not loaded yet.';
        }
        return;
    }

    var features = stations.map(function(st) {
        var key = stationKey(st.lineId, st.plannerName);
        return {
            type: 'Feature',
            properties: {
                stationName: st.plannerName,
                originalName: st.name,
                lineId: st.lineId,
                lineValue: st.lineValue,
                areaRadiusKm: stationAreaRadiusFor(st),
                hasOsmBounds: !!stationBoundsByKey[key]
            },
            geometry: {
                type: 'Point',
                coordinates: [st.lng, st.lat]
            }
        };
    });

    var geojson = {
        type: 'FeatureCollection',
        name: 'cairo_metro_station_points',
        generatedAt: new Date().toISOString(),
        features: features
    };

    downloadTextFile('cairo_metro_station_points.geojson', JSON.stringify(geojson, null, 2), 'application/geo+json;charset=utf-8');

    if (travelStatus) {
        travelStatus.innerText = 'Downloaded station points GeoJSON (' + features.length + ' stations).';
    }
}

function findNearestStation(lat, lng) {
    var stations = window.metroGeoStations || [];
    if (stations.length === 0) return null;

    var nearest = null;
    var minDistance = Number.MAX_VALUE;

    stations.forEach(function(st) {
        var dist = haversineKm(lat, lng, st.lat, st.lng);
        if (dist < minDistance) {
            minDistance = dist;
            nearest = {
                name: st.name,
                lineId: st.lineId,
                lineValue: st.lineValue,
                plannerName: st.plannerName,
                lat: st.lat,
                lng: st.lng,
                distanceKm: dist
            };
        }
    });

    return nearest;
}

function getGeoStationByPlanner(lineValue, stationName) {
    var stations = window.metroGeoStations || [];
    var wanted = normalizeStationName(stationName);

    for (var i = 0; i < stations.length; i++) {
        var st = stations[i];
        if (st.lineValue === lineValue && normalizeStationName(st.plannerName) === wanted) {
            return st;
        }
    }

    for (var j = 0; j < stations.length; j++) {
        var st2 = stations[j];
        if (normalizeStationName(st2.plannerName) === wanted) {
            return st2;
        }
    }

    return null;
}

function clearMapHighlights() {
    if (!window.metroMapState) return;
    if (window.metroMapState.routeLayer) {
        window.metroMapState.routeLayer.clearLayers();
    }
    if (window.metroMapState.contextLayer) {
        window.metroMapState.contextLayer.clearLayers();
    }
}

function clampValue(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function lerpValue(a, b, t) {
    return a + (b - a) * t;
}

function buildRouteMeta(routePoints) {
    if (!routePoints || routePoints.length < 2) return null;

    function catmullRom(p0, p1, p2, p3, t) {
        var t2 = t * t;
        var t3 = t2 * t;
        return 0.5 * (
            (2 * p1) +
            (-p0 + p2) * t +
            (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
            (-p0 + 3 * p1 - 3 * p2 + p3) * t3
        );
    }

    function buildSmoothedGeometry(stations) {
        if (stations.length < 3) {
            return {
                geometryPoints: stations.slice(),
                stationToGeometryIndex: stations.map(function(_, idx) { return idx; })
            };
        }

        var geometry = [];
        var stationToGeometryIndex = new Array(stations.length);
        var samplesPerSegment = Math.max(4, TRAVEL_CONFIG.curveSamplesPerSegment || 8);

        geometry.push({ lat: stations[0].lat, lng: stations[0].lng });
        stationToGeometryIndex[0] = 0;

        for (var i = 0; i < stations.length - 1; i++) {
            var p0 = stations[Math.max(0, i - 1)];
            var p1 = stations[i];
            var p2 = stations[i + 1];
            var p3 = stations[Math.min(stations.length - 1, i + 2)];

            for (var s = 1; s <= samplesPerSegment; s++) {
                var t = s / samplesPerSegment;
                var lat = catmullRom(p0.lat, p1.lat, p2.lat, p3.lat, t);
                var lng = catmullRom(p0.lng, p1.lng, p2.lng, p3.lng, t);
                geometry.push({ lat: lat, lng: lng });

                if (s === samplesPerSegment) {
                    stationToGeometryIndex[i + 1] = geometry.length - 1;
                }
            }
        }

        return {
            geometryPoints: geometry,
            stationToGeometryIndex: stationToGeometryIndex
        };
    }

    var smoothed = buildSmoothedGeometry(routePoints);
    var geometryPoints = smoothed.geometryPoints;
    var stationToGeometryIndex = smoothed.stationToGeometryIndex;

    var cumulativeKm = [0];
    var totalKm = 0;

    for (var i = 1; i < geometryPoints.length; i++) {
        totalKm += haversineKm(geometryPoints[i - 1].lat, geometryPoints[i - 1].lng, geometryPoints[i].lat, geometryPoints[i].lng);
        cumulativeKm.push(totalKm);
    }

    var stationCumulativeKm = stationToGeometryIndex.map(function(geomIndex) {
        return cumulativeKm[geomIndex] || 0;
    });

    return {
        points: routePoints,
        geometryPoints: geometryPoints,
        cumulativeKm: cumulativeKm,
        stationCumulativeKm: stationCumulativeKm,
        stationToGeometryIndex: stationToGeometryIndex,
        totalKm: totalKm
    };
}

function getPointAtProgress(routeMeta, progressKm) {
    if (!routeMeta || !routeMeta.geometryPoints || routeMeta.geometryPoints.length === 0) return null;

    var points = routeMeta.geometryPoints;
    var cumulative = routeMeta.cumulativeKm;
    var clampedProgress = clampValue(progressKm, 0, routeMeta.totalKm);

    if (clampedProgress <= 0) {
        return {
            lat: points[0].lat,
            lng: points[0].lng,
            segmentIndex: 0,
            progressKm: 0
        };
    }

    for (var i = 0; i < cumulative.length - 1; i++) {
        if (clampedProgress <= cumulative[i + 1]) {
            var segmentLength = cumulative[i + 1] - cumulative[i];
            var ratio = segmentLength > 0 ? (clampedProgress - cumulative[i]) / segmentLength : 0;
            ratio = clampValue(ratio, 0, 1);
            return {
                lat: lerpValue(points[i].lat, points[i + 1].lat, ratio),
                lng: lerpValue(points[i].lng, points[i + 1].lng, ratio),
                segmentIndex: i,
                progressKm: clampedProgress
            };
        }
    }

    return {
        lat: points[points.length - 1].lat,
        lng: points[points.length - 1].lng,
        segmentIndex: points.length - 2,
        progressKm: routeMeta.totalKm
    };
}

function projectPointToRoute(routeMeta, lat, lng) {
    if (!routeMeta || !routeMeta.geometryPoints || routeMeta.geometryPoints.length < 2) return null;

    var points = routeMeta.geometryPoints;
    var cumulative = routeMeta.cumulativeKm;
    var best = null;

    for (var i = 0; i < points.length - 1; i++) {
        var a = points[i];
        var b = points[i + 1];
        var ax = a.lng;
        var ay = a.lat;
        var bx = b.lng;
        var by = b.lat;
        var px = lng;
        var py = lat;

        var dx = bx - ax;
        var dy = by - ay;
        var len2 = (dx * dx) + (dy * dy);
        var t = 0;
        if (len2 > 0) {
            t = ((px - ax) * dx + (py - ay) * dy) / len2;
        }
        t = clampValue(t, 0, 1);

        var projLat = ay + (dy * t);
        var projLng = ax + (dx * t);
        var distanceKm = haversineKm(lat, lng, projLat, projLng);
        var progressKm = cumulative[i] + haversineKm(a.lat, a.lng, projLat, projLng);

        if (!best || distanceKm < best.distanceKm) {
            best = {
                lat: projLat,
                lng: projLng,
                segmentIndex: i,
                progressKm: progressKm,
                distanceKm: distanceKm
            };
        }
    }

    return best;
}

function getStationAreaMatch(routeMeta, lat, lng) {
    if (!routeMeta || !routeMeta.points || !routeMeta.stationCumulativeKm) return null;

    var bestIndex = -1;
    var bestDist = Number.MAX_VALUE;

    for (var i = 0; i < routeMeta.points.length; i++) {
        var st = routeMeta.points[i];
        var dist = haversineKm(lat, lng, st.lat, st.lng);
        var radiusKm = stationAreaRadiusFor(st);
        if (dist <= radiusKm && dist < bestDist) {
            bestDist = dist;
            bestIndex = i;
            continue;
        }
        if (dist < bestDist) {
            bestDist = dist;
            bestIndex = i;
        }
    }

    if (bestIndex === -1 || bestDist > stationAreaRadiusFor(routeMeta.points[bestIndex])) {
        return null;
    }

    return {
        index: bestIndex,
        station: routeMeta.points[bestIndex],
        progressKm: routeMeta.stationCumulativeKm[bestIndex],
        distanceKm: bestDist
    };
}

function findNearestStationByProgress(routeMeta, progressKm) {
    if (!routeMeta || !routeMeta.points || routeMeta.points.length === 0 || !routeMeta.stationCumulativeKm) return null;

    var nearestIndex = 0;
    var nearestDiff = Number.MAX_VALUE;

    for (var i = 0; i < routeMeta.stationCumulativeKm.length; i++) {
        var diff = Math.abs(routeMeta.stationCumulativeKm[i] - progressKm);
        if (diff < nearestDiff) {
            nearestDiff = diff;
            nearestIndex = i;
        }
    }

    return {
        station: routeMeta.points[nearestIndex],
        index: nearestIndex
    };
}

function initializeTravelState() {
    var routeMeta = buildRouteMeta(window.currentRouteGeoPoints || []);
    if (!routeMeta) return null;

    travelState = {
        routeMeta: routeMeta,
        maxProgressKm: 0,
        lastProgressKm: null,
        lastProgressAtMs: 0,
        lastGpsProgressKm: null,
        lastGpsAtMs: 0,
        lastTickAtMs: Date.now(),
        smoothedSpeedKmh: TRAVEL_CONFIG.defaultSpeedKmh,
        lastAccuracyMeters: 0,
        filteredPosition: null,
        visuals: null,
        arrivedSamples: 0,
        isFallbackMode: false,
        recoveryVotes: 0,
        recoveryTargetKm: null,
        currentSpeedKmh: 0
    };

    window.travelMapFollowingInitialized = false;
    return travelState;
}

function resetTravelTrackingState() {
    travelState = null;

    if (travelTickId !== null) {
        clearInterval(travelTickId);
        travelTickId = null;
    }
}

function getRemainingRoutePoints(routeMeta, progressKm) {
    var onRoutePoint = getPointAtProgress(routeMeta, progressKm);
    if (!onRoutePoint) return [];

    var remaining = [[onRoutePoint.lat, onRoutePoint.lng]];
    var geometry = routeMeta.geometryPoints || [];
    for (var i = onRoutePoint.segmentIndex + 1; i < geometry.length; i++) {
        remaining.push([geometry[i].lat, geometry[i].lng]);
    }
    return remaining;
}

function renderTravelVisuals(displayPoint, nearestStation, remaining, accuracyMeters, distanceToDestinationKm, isFallback, currentSpeedKmh) {
    if (!window.metroMapState || !window.metroMapState.map || !window.metroMapState.travelLayer) return;

    var map = window.metroMapState.map;
    var travelLayer = window.metroMapState.travelLayer;

    if (!travelState.visuals) {
        travelLayer.clearLayers();
        travelState.visuals = {
            userMarker: L.circleMarker([displayPoint.lat, displayPoint.lng], {
                radius: 8,
                color: '#0d47a1',
                weight: 2,
                fillColor: '#42A5F5',
                fillOpacity: 1
            }).addTo(travelLayer),
            nearestMarker: L.circleMarker([nearestStation.lat, nearestStation.lng], {
                radius: 9,
                color: '#1b5e20',
                weight: 2,
                fillColor: '#66BB6A',
                fillOpacity: 1
            }).addTo(travelLayer),
            connector: L.polyline([[displayPoint.lat, displayPoint.lng], [nearestStation.lat, nearestStation.lng]], {
                color: '#90CAF9',
                weight: 4,
                dashArray: '8,8',
                opacity: 0.95
            }).addTo(travelLayer),
            remainingPath: L.polyline(remaining, {
                color: '#FFC107',
                weight: 5,
                opacity: 0.95
            }).addTo(travelLayer)
        };
    } else {
        travelState.visuals.userMarker.setLatLng([displayPoint.lat, displayPoint.lng]);
        travelState.visuals.nearestMarker.setLatLng([nearestStation.lat, nearestStation.lng]);
        travelState.visuals.connector.setLatLngs([[displayPoint.lat, displayPoint.lng], [nearestStation.lat, nearestStation.lng]]);
        travelState.visuals.remainingPath.setLatLngs(remaining);
    }

    if (!window.travelMapFollowingInitialized) {
        map.fitBounds(L.latLngBounds([[displayPoint.lat, displayPoint.lng], [nearestStation.lat, nearestStation.lng]]), { padding: [36, 36] });
        window.travelMapFollowingInitialized = true;
    } else {
        map.panTo([displayPoint.lat, displayPoint.lng], {
            animate: true,
            duration: 1.15,
            easeLinearity: 0.2
        });
    }

    var accText = Number.isFinite(accuracyMeters) ? (' (±' + accuracyMeters.toFixed(0) + ' m)') : '';
    var modeText = isFallback ? 'GPS weak/underground detected, approximating along route. ' : '';
    if (travelStatus) {
        travelStatus.innerText =
            modeText +
            'Traveling: nearest station is ' + nearestStation.plannerName +
            ' on ' + nearestStation.lineId +
            '. Remaining to destination ~' + (distanceToDestinationKm * 1000).toFixed(0) + ' m' + accText + '.';
    }

    if (travelSpeed) {
        var safeSpeed = Number(currentSpeedKmh || 0);
        var speedText = safeSpeed > 1 ? safeSpeed.toFixed(1) : '0.0';
        travelSpeed.innerText = (isFallback ? 'Speed (est.): ' : 'Speed: ') + speedText + ' km/h';
    }
}

function stopTravelAsArrived() {
    stopTravelMode(true);
    if (travelStatus) {
        travelStatus.innerText = 'You reached near your destination station. Travel mode stopped automatically.';
    }
    if (travelSpeed) {
        travelSpeed.innerText = 'Speed: 0.0 km/h';
    }
}

function processTravelLocation(rawLat, rawLng, accuracyMeters, source) {
    if (!travelState || !travelState.routeMeta) {
        if (!initializeTravelState()) return;
    }

    var now = Date.now();
    var routeMeta = travelState.routeMeta;
    var projected = projectPointToRoute(routeMeta, rawLat, rawLng);
    if (!projected) return;

    var stationAreaMatch = source === 'gps' ? getStationAreaMatch(routeMeta, rawLat, rawLng) : null;

    var projectedProgressKm = projected.progressKm;
    if (stationAreaMatch) {
        projectedProgressKm = stationAreaMatch.progressKm;
    }
    var progressKm = projectedProgressKm;
    var recoveredFromOvershoot = false;

    if (source === 'gps') {
        var gpsAcc = Number(accuracyMeters || 9999);
        var backtrackGapKm = travelState.maxProgressKm - projectedProgressKm;

        if (backtrackGapKm > TRAVEL_CONFIG.maxBacktrackKm) {
            var canRecover = gpsAcc <= TRAVEL_CONFIG.gpsRecoveryAccuracyMeters &&
                backtrackGapKm <= TRAVEL_CONFIG.gpsRecoveryBacktrackKm;

            if (canRecover) {
                if (travelState.recoveryTargetKm !== null && Math.abs(travelState.recoveryTargetKm - projectedProgressKm) <= 0.25) {
                    travelState.recoveryVotes += 1;
                } else {
                    travelState.recoveryVotes = 1;
                    travelState.recoveryTargetKm = projectedProgressKm;
                }

                if (travelState.recoveryVotes >= TRAVEL_CONFIG.recoverySamplesRequired) {
                    progressKm = projectedProgressKm;
                    recoveredFromOvershoot = true;
                    travelState.recoveryVotes = 0;
                    travelState.recoveryTargetKm = null;
                } else {
                    progressKm = Math.max(projectedProgressKm, travelState.maxProgressKm - 0.22);
                }
            } else {
                progressKm = Math.max(projectedProgressKm, travelState.maxProgressKm - TRAVEL_CONFIG.maxBacktrackKm);
                travelState.recoveryVotes = 0;
                travelState.recoveryTargetKm = null;
            }
        } else {
            travelState.recoveryVotes = 0;
            travelState.recoveryTargetKm = null;
        }

        travelState.lastGpsProgressKm = projectedProgressKm;
    } else {
        progressKm = Math.max(projectedProgressKm, travelState.maxProgressKm);
        if (travelState.lastGpsProgressKm !== null) {
            progressKm = Math.min(
                progressKm,
                travelState.lastGpsProgressKm + TRAVEL_CONFIG.maxSyntheticAdvanceWithoutGpsKm
            );
        }
    }

    if (travelState.lastProgressKm !== null) {
        var dtHours = (now - travelState.lastProgressAtMs) / 3600000;
        var deltaKm = progressKm - travelState.lastProgressKm;
        if (source === 'gps' && dtHours > 0 && deltaKm > 0) {
            var speedKmh = deltaKm / dtHours;
            if (speedKmh >= 6 && speedKmh <= 120) {
                travelState.smoothedSpeedKmh = (travelState.smoothedSpeedKmh * 0.7) + (speedKmh * 0.3);
                travelState.currentSpeedKmh = travelState.smoothedSpeedKmh;
            }
        }
    }

    if (source === 'gps' && !Number.isFinite(travelState.currentSpeedKmh)) {
        travelState.currentSpeedKmh = 0;
    }

    if (recoveredFromOvershoot) {
        travelState.maxProgressKm = progressKm;
    } else {
        travelState.maxProgressKm = Math.max(travelState.maxProgressKm, progressKm);
    }
    travelState.lastProgressKm = progressKm;
    travelState.lastProgressAtMs = now;
    travelState.lastAccuracyMeters = accuracyMeters;

    var snappedPoint = getPointAtProgress(routeMeta, progressKm);
    if (!snappedPoint) return;

    var blend = 0.82;
    if (source === 'gps') {
        var acc = Number(accuracyMeters || 0);
        if (acc <= 20) blend = 0.52;
        else if (acc <= 45) blend = 0.68;
        else if (acc <= 90) blend = 0.82;
        else blend = 0.92;
    } else {
        blend = 1;
    }

    var blended = {
        lat: lerpValue(rawLat, snappedPoint.lat, blend),
        lng: lerpValue(rawLng, snappedPoint.lng, blend)
    };

    if (!travelState.filteredPosition) {
        travelState.filteredPosition = blended;
    } else {
        var alpha = source === 'synthetic' ? 0.26 : 0.38;
        travelState.filteredPosition = {
            lat: lerpValue(travelState.filteredPosition.lat, blended.lat, alpha),
            lng: lerpValue(travelState.filteredPosition.lng, blended.lng, alpha)
        };
    }

    var nearestStationRef = stationAreaMatch ? { station: stationAreaMatch.station, index: stationAreaMatch.index } : findNearestStationByProgress(routeMeta, progressKm);
    var nearestStation = nearestStationRef ? nearestStationRef.station : routeMeta.points[0];
    var remaining = getRemainingRoutePoints(routeMeta, progressKm);
    var distanceToDestinationKm = Math.max(0, routeMeta.totalKm - progressKm);
    var destinationStation = routeMeta.points[routeMeta.points.length - 1];
    var destinationCenterDistanceKm = haversineKm(rawLat, rawLng, destinationStation.lat, destinationStation.lng);

    renderTravelVisuals(
        travelState.filteredPosition,
        nearestStation,
        remaining,
        accuracyMeters,
        distanceToDestinationKm,
        source === 'synthetic',
        travelState.currentSpeedKmh
    );

    var isReliableArrivalSample = source === 'gps' && Number(accuracyMeters || 9999) <= 140;
    var arrivedByRouteProgress = distanceToDestinationKm <= TRAVEL_CONFIG.arrivalRadiusKm;
    var arrivedByStationArea = destinationCenterDistanceKm <= stationAreaRadiusFor(destinationStation);
    if ((arrivedByRouteProgress || arrivedByStationArea) && isReliableArrivalSample) {
        travelState.arrivedSamples += 1;
    } else {
        travelState.arrivedSamples = 0;
    }

    if (travelState.arrivedSamples >= 2) {
        stopTravelAsArrived();
    }
}

function travelFallbackTick() {
    if (travelWatchId === null || !travelState || !travelState.routeMeta) return;

    var now = Date.now();
    var sinceLastGps = now - (travelState.lastGpsAtMs || 0);
    var dtSec = (now - (travelState.lastTickAtMs || now)) / 1000;
    travelState.lastTickAtMs = now;

    if (sinceLastGps < TRAVEL_CONFIG.staleGpsMs || dtSec <= 0) {
        return;
    }

    var speed = clampValue(
        travelState.smoothedSpeedKmh || TRAVEL_CONFIG.defaultSpeedKmh,
        TRAVEL_CONFIG.minFallbackSpeedKmh,
        TRAVEL_CONFIG.maxFallbackSpeedKmh
    );
    travelState.currentSpeedKmh = speed;

    var nextProgress = Math.min(
        travelState.routeMeta.totalKm,
        travelState.maxProgressKm + (speed * dtSec / 3600)
    );

    if (nextProgress <= travelState.maxProgressKm + 0.0005) {
        return;
    }

    var simulatedPoint = getPointAtProgress(travelState.routeMeta, nextProgress);
    if (!simulatedPoint) return;

    travelState.isFallbackMode = true;
    processTravelLocation(simulatedPoint.lat, simulatedPoint.lng, Math.max(120, Number(travelState.lastAccuracyMeters || 120)), 'synthetic');
}

function startTravelMode() {
    if (travelWatchId !== null) {
        stopTravelMode(false);
        return;
    }

    if (!navigator.geolocation) {
        travelStatus.innerText = 'Travel mode unavailable: geolocation is not supported by this browser.';
        return;
    }

    // Ensure we have a route to follow.
    if (!window.currentRouteGeoPoints || window.currentRouteGeoPoints.length < 2) {
        calculateTicket();
    }

    if (!window.currentRouteGeoPoints || window.currentRouteGeoPoints.length < 2) {
        travelStatus.innerText = 'Please find a valid route first, then start traveling.';
        return;
    }

    initializeTravelState();

    if (window.metroMapState && window.metroMapState.travelLayer) {
        window.metroMapState.travelLayer.clearLayers();
    }

    if (startTravelBtn) {
        startTravelBtn.innerText = 'Stop Traveling';
        startTravelBtn.classList.remove('btn-primary');
        startTravelBtn.classList.add('btn-secondary');
    }
    if (travelStatus) {
        travelStatus.innerText = 'Travel mode active. Waiting for live location updates...';
    }
    if (travelSpeed) {
        travelSpeed.innerText = 'Speed: -- km/h';
    }

    travelWatchId = navigator.geolocation.watchPosition(function(pos) {
        if (!travelState) {
            initializeTravelState();
        }
        if (travelState) {
            travelState.lastGpsAtMs = Date.now();
            travelState.isFallbackMode = false;
        }
        processTravelLocation(pos.coords.latitude, pos.coords.longitude, Number(pos.coords.accuracy || 0), 'gps');
    }, function(err) {
        if (travelStatus) {
            travelStatus.innerText = 'Travel mode error: ' + err.message;
        }
    }, {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 20000
    });

    if (travelTickId !== null) {
        clearInterval(travelTickId);
    }
    travelTickId = setInterval(travelFallbackTick, TRAVEL_CONFIG.fallbackTickMs);
}

function stopTravelMode(silent) {
    if (travelWatchId !== null) {
        navigator.geolocation.clearWatch(travelWatchId);
        travelWatchId = null;
    }

    if (startTravelBtn) {
        startTravelBtn.innerText = 'Start Traveling';
        startTravelBtn.classList.remove('btn-secondary');
        startTravelBtn.classList.add('btn-primary');
    }

    if (!silent && travelStatus) {
        travelStatus.innerText = 'Travel mode stopped.';
    }
    if (travelSpeed) {
        travelSpeed.innerText = 'Speed: 0.0 km/h';
    }

    if (window.metroMapState && window.metroMapState.travelLayer) {
        window.metroMapState.travelLayer.clearLayers();
    }

    resetTravelTrackingState();
}

function updateTravelMap(lat, lng, accuracyMeters) {
    processTravelLocation(lat, lng, accuracyMeters, 'gps');
}

function showRouteOnMap(routeStations, startLine, endLine, transferStation) {
    if (!window.metroMapState || !window.metroMapState.map) return;

    var routeLayer = window.metroMapState.routeLayer;
    var map = window.metroMapState.map;
    var points = [];
    var switched = false;
    var transferNorm = normalizeStationName(transferStation || '');

    if (routeLayer) {
        routeLayer.clearLayers();
    }

    routeStations.forEach(function(name, idx) {
        var activeLine = startLine;
        if (startLine !== endLine && switched) {
            activeLine = endLine;
        }

        var st = getGeoStationByPlanner(activeLine, name);
        if (!st && startLine !== endLine) {
            st = getGeoStationByPlanner(endLine, name) || getGeoStationByPlanner(startLine, name);
        }
        if (st) points.push(st);

        if (!switched && transferNorm && normalizeStationName(name) === transferNorm && idx !== 0) {
            switched = true;
        }
    });

    if (points.length === 0) return;

    var latLngs = points.map(function(p) { return [p.lat, p.lng]; });
    window.currentRouteGeoPoints = points;
    window.currentRouteMeta = buildRouteMeta(points);
    resetTravelTrackingState();
    L.polyline(latLngs, {
        color: '#9C27B0',
        weight: 6,
        opacity: 0.95
    }).addTo(routeLayer);

    L.circleMarker([points[0].lat, points[0].lng], {
        radius: 8,
        color: '#1b5e20',
        weight: 2,
        fillColor: '#4CAF50',
        fillOpacity: 1
    }).bindPopup('Route start: ' + points[0].plannerName).addTo(routeLayer);

    var endPoint = points[points.length - 1];
    L.circleMarker([endPoint.lat, endPoint.lng], {
        radius: 8,
        color: '#8e0000',
        weight: 2,
        fillColor: '#F44336',
        fillOpacity: 1
    }).bindPopup('Route end: ' + endPoint.plannerName).addTo(routeLayer);

    // Mark transfer station on the map
    if (transferStation && transferNorm) {
        points.forEach(function(point) {
            if (normalizeStationName(point.plannerName) === transferNorm) {
                L.circleMarker([point.lat, point.lng], {
                    radius: 10,
                    color: '#FF9800',
                    weight: 3,
                    fillColor: '#FFC107',
                    fillOpacity: 1
                }).bindPopup('Transfer station: ' + point.plannerName + ' ⇄').addTo(routeLayer);
            }
        });
    }

    map.fitBounds(L.latLngBounds(latLngs), { padding: [36, 36] });
}

function showNearestPointOnMap(userLat, userLng, nearest) {
    if (!window.metroMapState || !window.metroMapState.map || !nearest) return;

    clearMapHighlights();
    var contextLayer = window.metroMapState.contextLayer;
    var map = window.metroMapState.map;

    var userPoint = [userLat, userLng];
    var stationPoint = [nearest.lat, nearest.lng];

    L.circleMarker(userPoint, {
        radius: 7,
        color: '#0d47a1',
        weight: 2,
        fillColor: '#42A5F5',
        fillOpacity: 1
    }).bindPopup('Your position').addTo(contextLayer);

    L.circleMarker(stationPoint, {
        radius: 8,
        color: '#1b5e20',
        weight: 2,
        fillColor: '#66BB6A',
        fillOpacity: 1
    }).bindPopup('Closest station: ' + nearest.name + ' (' + nearest.lineId + ')').addTo(contextLayer);

    L.polyline([userPoint, stationPoint], {
        color: '#81D4FA',
        weight: 4,
        dashArray: '8,8',
        opacity: 0.9
    }).addTo(contextLayer);

    map.fitBounds(L.latLngBounds([userPoint, stationPoint]), { padding: [42, 42] });
}

function showNearestStartEndOnMap(curLat, curLng, dstLat, dstLng, nearestStart, nearestEnd) {
    if (!window.metroMapState || !window.metroMapState.map || !nearestStart || !nearestEnd) return;

    clearMapHighlights();
    var contextLayer = window.metroMapState.contextLayer;
    var map = window.metroMapState.map;

    var currentPoint = [curLat, curLng];
    var destinationPoint = [dstLat, dstLng];
    var startStationPoint = [nearestStart.lat, nearestStart.lng];
    var endStationPoint = [nearestEnd.lat, nearestEnd.lng];

    L.circleMarker(currentPoint, {
        radius: 6,
        color: '#0d47a1',
        weight: 2,
        fillColor: '#42A5F5',
        fillOpacity: 1
    }).bindPopup('Current location').addTo(contextLayer);

    L.circleMarker(destinationPoint, {
        radius: 6,
        color: '#4a148c',
        weight: 2,
        fillColor: '#BA68C8',
        fillOpacity: 1
    }).bindPopup('Destination coordinate').addTo(contextLayer);

    L.circleMarker(startStationPoint, {
        radius: 8,
        color: '#1b5e20',
        weight: 2,
        fillColor: '#4CAF50',
        fillOpacity: 1
    }).bindPopup('Closest start station: ' + nearestStart.name).addTo(contextLayer);

    L.circleMarker(endStationPoint, {
        radius: 8,
        color: '#8e0000',
        weight: 2,
        fillColor: '#F44336',
        fillOpacity: 1
    }).bindPopup('Closest end station: ' + nearestEnd.name).addTo(contextLayer);

    L.polyline([currentPoint, startStationPoint], {
        color: '#80DEEA',
        weight: 4,
        dashArray: '8,8',
        opacity: 0.9
    }).addTo(contextLayer);

    L.polyline([destinationPoint, endStationPoint], {
        color: '#FFAB91',
        weight: 4,
        dashArray: '8,8',
        opacity: 0.9
    }).addTo(contextLayer);

    map.fitBounds(L.latLngBounds([currentPoint, destinationPoint, startStationPoint, endStationPoint]), { padding: [42, 42] });
}

function setPlannerStation(lineValue, stationName, isStart) {
    if (isStart) {
        slinestr = lineValue;
        sline.value = lineValue;
        changeSLine(lineValue);
        var sSel = getActivePickupSelect(lineValue);
        if (sSel) {
            var wanted = normalizeStationName(stationName);
            for (var i = 0; i < sSel.options.length; i++) {
                if (normalizeStationName(sSel.options[i].value) === wanted) {
                    sSel.selectedIndex = i;
                    pickup = sSel.options[i].value;
                    break;
                }
            }
        }
    } else {
        elinestr = lineValue;
        eline.value = lineValue;
        changeELine(lineValue);
        var dSel = getActiveDropoffSelect(lineValue);
        if (dSel) {
            var wanted2 = normalizeStationName(stationName);
            for (var j = 0; j < dSel.options.length; j++) {
                if (normalizeStationName(dSel.options[j].value) === wanted2) {
                    dSel.selectedIndex = j;
                    dropoff = dSel.options[j].value;
                    break;
                }
            }
        }
    }
}

function isValidLatLng(lat, lng) {
    return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function extractCoordinatesFromText(rawText, callback) {
    if (!rawText) {
        if (callback) callback(null);
        return;
    }

    var text = String(rawText).trim();
    if (!text) {
        if (callback) callback(null);
        return;
    }

    // Try extracting directly from text first (synchronous patterns)
    var result = tryExtractDirectCoordinates(text);
    if (result) {
        if (callback) callback(result);
        return result;
    }

    // Check for Plus Code format (e.g., V82R+FV or 8FWC2234+V82R)
    var plusCodeMatch = text.match(/([0-9A-Z]{4,8}\+[0-9A-Z]{2,3})(?:\s|$)/i);
    if (plusCodeMatch && callback) {
        resolvePlusCode(plusCodeMatch[1], callback);
        return;
    }

    // If it's a shortened/redirect link (goo.gl, maps.app.goo.gl, etc), try to resolve it
    if (text.indexOf('goo.gl') > -1 || text.indexOf('maps.app.goo') > -1) {
        if (callback) {
            // Async resolution for shortened links
            resolveShortLink(text, callback);
            return;
        }
    }

    if (callback) callback(null);
    return null;
}

function tryExtractDirectCoordinates(text) {
    if (!text) return null;

    var candidates = [text];
    try {
        var decoded = decodeURIComponent(text);
        if (decoded && decoded !== text) {
            candidates.push(decoded);
        }
    } catch (e) {
        // Ignore malformed URI input and continue with raw text.
    }

    var pairPatterns = [
        /@\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/i,
        /[?&](?:q|query|ll|saddr|daddr|origin|destination|center|cp)=(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/i,
        /geo:\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/i,
        /(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/
    ];

    for (var c = 0; c < candidates.length; c++) {
        var candidate = candidates[c];

        for (var p = 0; p < pairPatterns.length; p++) {
            var m = candidate.match(pairPatterns[p]);
            if (m) {
                var lat = parseFloat(m[1]);
                var lng = parseFloat(m[2]);
                if (isValidLatLng(lat, lng)) {
                    return { lat: lat, lng: lng };
                }
            }
        }

        // Google maps encoded coordinates in some links: !3d<lat>!4d<lng>
        var g = candidate.match(/!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/i);
        if (g) {
            var glat = parseFloat(g[1]);
            var glng = parseFloat(g[2]);
            if (isValidLatLng(glat, glng)) {
                return { lat: glat, lng: glng };
            }
        }
    }

    return null;
}

function resolveShortLink(shortUrl, callback) {
    fetch(shortUrl, { method: 'HEAD', redirect: 'follow' })
        .then(function(response) {
            var expanded = response.url || shortUrl;
            var coords = tryExtractDirectCoordinates(expanded);
            callback(coords);
        })
        .catch(function(err) {
            // Fall back to GET request if HEAD fails
            fetch(shortUrl, { method: 'GET', redirect: 'follow' })
                .then(function(response) {
                    var expanded = response.url || shortUrl;
                    var coords = tryExtractDirectCoordinates(expanded);
                    callback(coords);
                })
                .catch(function(err2) {
                    callback(null);
                });
        });
}

function resolvePlusCode(plusCode, callback) {
    // Construct a Google Maps URL with the Plus Code and follow redirects to get coordinates
    var mapsUrl = "https://maps.google.com/?q=" + encodeURIComponent(plusCode);
    
    fetch(mapsUrl, { method: 'GET', redirect: 'follow', mode: 'no-cors' })
        .then(function(response) {
            var expanded = response.url || mapsUrl;
            var coords = tryExtractDirectCoordinates(expanded);
            if (coords) {
                callback(coords);
                return;
            }
            
            // If Google Maps redirect didn't work, try OpenStreetMap Nominatim
            resolvePlusCodeViaGeocoding(plusCode, callback);
        })
        .catch(function(err) {
            // Fall back to geocoding service
            resolvePlusCodeViaGeocoding(plusCode, callback);
        });
}

function resolvePlusCodeViaGeocoding(plusCode, callback) {
    // Use OSM Nominatim to resolve Plus Code (free, no API key needed)
    var geocodeUrl = "https://nominatim.openstreetmap.org/search?q=" + encodeURIComponent(plusCode) + "&format=json&limit=1";
    
    fetch(geocodeUrl, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data && data.length > 0) {
                var result = data[0];
                var lat = parseFloat(result.lat);
                var lng = parseFloat(result.lon);
                if (isValidLatLng(lat, lng)) {
                    callback({ lat: lat, lng: lng });
                    return;
                }
            }
            callback(null);
        })
        .catch(function(err) {
            callback(null);
        });
}

function importCoordinatesFromLinks(showStatusMessage) {
    if (showStatusMessage === undefined) showStatusMessage = true;

    var currentLinkText = currentLocationLink ? currentLocationLink.value.trim() : "";
    var destLinkText = destLocationLink ? destLocationLink.value.trim() : "";

    if (!currentLinkText && !destLinkText) {
        if (showStatusMessage) {
            coordResult.innerText = 'Paste a current and/or destination map link first. Supports Google Maps (full/short links), Plus Codes (e.g., V82R+FV), Apple Maps, Waze, OSM, geo links, and lat,lng text.';
        }
        return { importedCurrent: false, importedDestination: false };
    }

    if (showStatusMessage) {
        coordResult.innerText = 'Resolving coordinates...';
    }

    var pendingCount = 0;
    var importedCurrent = false;
    var importedDestination = false;

    if (currentLinkText) pendingCount++;
    if (destLinkText) pendingCount++;

    var completed = 0;

    if (currentLinkText) {
        extractCoordinatesFromText(currentLinkText, function(cur) {
            if (cur) {
                currentLat.value = cur.lat.toFixed(6);
                currentLng.value = cur.lng.toFixed(6);
                importedCurrent = true;
            }
            completed++;
            if (completed === pendingCount) {
                updateCoordinateImportStatus(importedCurrent, importedDestination, showStatusMessage);
            }
        });
    }

    if (destLinkText) {
        extractCoordinatesFromText(destLinkText, function(dst) {
            if (dst) {
                destLat.value = dst.lat.toFixed(6);
                destLng.value = dst.lng.toFixed(6);
                importedDestination = true;
            }
            completed++;
            if (completed === pendingCount) {
                updateCoordinateImportStatus(importedCurrent, importedDestination, showStatusMessage);
            }
        });
    }

    return { importedCurrent: false, importedDestination: false };
}

function updateCoordinateImportStatus(importedCurrent, importedDestination, showStatusMessage) {
    if (!showStatusMessage) return;

    if (importedCurrent && importedDestination) {
        coordResult.innerText = 'Imported both current and destination coordinates from links.';
    } else if (importedCurrent) {
        coordResult.innerText = 'Imported current coordinates from link. Add destination link (or manual destination coordinates) to continue.';
    } else if (importedDestination) {
        coordResult.innerText = 'Imported destination coordinates from link. Add current link (or manual current coordinates) to continue.';
    } else {
        coordResult.innerText = 'Could not read coordinates from the provided link(s). If using a Google Maps short link, try right-clicking the location and choosing "Share" for a full link.';
    }
}

function getLiveLocation() {
    if (!navigator.geolocation) {
        coordResult.innerText = 'Live location is not supported in this browser.';
        return;
    }

    coordResult.innerText = 'Fetching live location... waiting for best GPS fix.';

    var best = null;
    var done = false;
    var watchId = null;

    function finishWithBest() {
        if (done) return;
        done = true;

        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
        }

        if (!best) {
            coordResult.innerText = 'Could not get live location. Please enter coordinates manually.';
            return;
        }

        currentLat.value = best.coords.latitude.toFixed(6);
        currentLng.value = best.coords.longitude.toFixed(6);

        var acc = Number(best.coords.accuracy || 0);
        var qualityNote = '';
        if (acc > 500) {
            qualityNote = ' Warning: low accuracy fix. Consider entering coordinates manually.';
        } else if (acc > 100) {
            qualityNote = ' Medium accuracy fix.';
        } else {
            qualityNote = ' High accuracy fix.';
        }

        coordResult.innerText =
            'Live location set to ' + best.coords.latitude.toFixed(6) + ', ' + best.coords.longitude.toFixed(6) +
            ' (accuracy ±' + acc.toFixed(0) + ' m).' + qualityNote;
    }

    watchId = navigator.geolocation.watchPosition(function(pos) {
        if (!best || pos.coords.accuracy < best.coords.accuracy) {
            best = pos;
        }

        // Good enough GPS fix; stop early.
        if (pos.coords.accuracy <= 30) {
            finishWithBest();
        }
    }, function(err) {
        if (!done) {
            coordResult.innerText = 'Could not get live location: ' + err.message;
        }
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
        }
    }, {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
    });

    // Collect readings for a short window, then use the best one.
    setTimeout(finishWithBest, 12000);
}

function findClosestStationNow() {
    if (!Number.isFinite(parseFloat(currentLat.value)) || !Number.isFinite(parseFloat(currentLng.value))) {
        importCoordinatesFromLinks(false);
    }

    var lat = parseFloat(currentLat.value);
    var lng = parseFloat(currentLng.value);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        coordResult.innerText = 'Please enter valid current coordinates.';
        return;
    }

    var nearest = findNearestStation(lat, lng);
    if (!nearest) {
        coordResult.innerText = 'Station coordinate data is not loaded yet.';
        return;
    }

    coordResult.innerText = 'Closest station now: ' + nearest.name + ' (' + nearest.lineId + ') - approx ' + nearest.distanceKm.toFixed(2) + ' km away.';
    showNearestPointOnMap(lat, lng, nearest);
}

function findClosestStartEndStations() {
    if (!Number.isFinite(parseFloat(currentLat.value)) || !Number.isFinite(parseFloat(currentLng.value)) || !Number.isFinite(parseFloat(destLat.value)) || !Number.isFinite(parseFloat(destLng.value))) {
        importCoordinatesFromLinks(false);
    }

    var curLat = parseFloat(currentLat.value);
    var curLng = parseFloat(currentLng.value);
    var dstLat = parseFloat(destLat.value);
    var dstLng = parseFloat(destLng.value);

    if (!Number.isFinite(curLat) || !Number.isFinite(curLng) || !Number.isFinite(dstLat) || !Number.isFinite(dstLng)) {
        coordResult.innerText = 'Please enter valid current and destination coordinates.';
        return;
    }

    var nearestStart = findNearestStation(curLat, curLng);
    var nearestEnd = findNearestStation(dstLat, dstLng);
    if (!nearestStart || !nearestEnd) {
        coordResult.innerText = 'Station coordinate data is not loaded yet.';
        return;
    }

    setPlannerStation(lineIdToPlannerValue(nearestStart.lineId), nearestStart.plannerName, true);
    setPlannerStation(lineIdToPlannerValue(nearestEnd.lineId), nearestEnd.plannerName, false);

    coordResult.innerText =
        'Closest start: ' + nearestStart.name + ' (' + nearestStart.lineId + ') - ' + nearestStart.distanceKm.toFixed(2) + ' km. ' +
        'Closest destination: ' + nearestEnd.name + ' (' + nearestEnd.lineId + ') - ' + nearestEnd.distanceKm.toFixed(2) + ' km. Route fields auto-filled.';

    calculateTicket();
    showNearestStartEndOnMap(curLat, curLng, dstLat, dstLng, nearestStart, nearestEnd);
}

function fareBreakdown(stations){
    // Fare tiers from the provided table image.
    if(stations <= 9){
        return { regular: "8 EGP", elderly: "4 EGP", special: "5 EGP" };
    } else if(stations <= 16){
        return { regular: "10 EGP", elderly: "5 EGP", special: "5 EGP" };
    } else if(stations <= 23){
        return { regular: "15 EGP", elderly: "8 EGP", special: "5 EGP" };
    } else {
        return { regular: "20 EGP", elderly: "10 EGP", special: "5 EGP" };
    }
}

function lineTimingProfile(lineId) {
    // Publicly reported values: Line 1 max speed ~80 km/h, Line 3 up to ~100 km/h.
    // Effective factor models acceleration/deceleration + operational constraints.
    var profiles = {
        "Line 1": { maxSpeedKmh: 80, effectiveFactor: 0.46, headwayMin: 3.8, dwellMin: 0.35 },
        "Line 2": { maxSpeedKmh: 80, effectiveFactor: 0.47, headwayMin: 3.0, dwellMin: 0.35 },
        "Line 3": { maxSpeedKmh: 100, effectiveFactor: 0.50, headwayMin: 3.0, dwellMin: 0.32 }
    };
    return profiles[lineId] || { maxSpeedKmh: 80, effectiveFactor: 0.47, headwayMin: 3.4, dwellMin: 0.35 };
}

function estimateTripTime(stationCount, hasTransfer, routePoints) {
    var distanceKm = 0;
    var movingMin = 0;
    var dwellMin = 0;
    var transferCount = 0;
    var transferWaitMin = 0;
    var initialWaitMin = 2.5;
    var transferWalkMin = 2.5;

    if (Array.isArray(routePoints) && routePoints.length > 1) {
        var startProfile = lineTimingProfile(routePoints[0].lineId);
        initialWaitMin = startProfile.headwayMin / 2;

        for (var i = 1; i < routePoints.length; i++) {
            var prev = routePoints[i - 1];
            var curr = routePoints[i];
            var segLineId = curr.lineId || prev.lineId;
            var segProfile = lineTimingProfile(segLineId);
            var segSpeedKmh = segProfile.maxSpeedKmh * segProfile.effectiveFactor;

            var segDistKm = haversineKm(prev.lat, prev.lng, curr.lat, curr.lng);
            distanceKm += segDistKm;
            movingMin += (segDistKm / segSpeedKmh) * 60;

            if (prev.lineId && curr.lineId && prev.lineId !== curr.lineId) {
                transferCount += 1;
                transferWaitMin += (lineTimingProfile(curr.lineId).headwayMin / 2) + transferWalkMin;
            }
        }

        for (var j = 1; j < routePoints.length - 1; j++) {
            dwellMin += lineTimingProfile(routePoints[j].lineId).dwellMin;
        }
    }

    // Fallback if map coordinates are temporarily unavailable.
    if (distanceKm <= 0) {
        var avgInterStationKm = 1.1;
        var avgEffSpeedKmh = 38;
        var fallbackStops = Math.max(1, stationCount - 1);
        distanceKm = Math.max(0.8, fallbackStops * avgInterStationKm);
        movingMin = (distanceKm / avgEffSpeedKmh) * 60;
        dwellMin = Math.max(0, stationCount - 2) * 0.35;
        transferWaitMin = hasTransfer ? 4.5 : 0;
    }

    if (transferCount === 0 && hasTransfer) {
        transferWaitMin += 4.5;
    }

    var center = movingMin + dwellMin + initialWaitMin + transferWaitMin;

    // Uncertainty band for signal constraints and passenger exchange variance.
    var min = Math.max(3, Math.round(center * 0.92));
    var max = Math.max(min + 1, Math.round(center * 1.12));

    return {
        distanceKm: distanceKm,
        text: min + "-" + max + " min"
    };
}

function destinationLineThree(start, end) {
    if (start === end) return [start];

    var graph = {};

    function addEdge(a, b) {
        if (!graph[a]) graph[a] = [];
        if (!graph[b]) graph[b] = [];
        if (graph[a].indexOf(b) === -1) graph[a].push(b);
        if (graph[b].indexOf(a) === -1) graph[b].push(a);
    }

    lineThreeRouteSegments.forEach(function(segment) {
        for (var i = 1; i < segment.length; i++) {
            addEdge(segment[i - 1], segment[i]);
        }
    });

    if (!graph[start] || !graph[end]) {
        return [start];
    }

    var queue = [start];
    var visited = {};
    var previous = {};
    visited[start] = true;

    while (queue.length > 0) {
        var current = queue.shift();
        if (current === end) break;

        graph[current].forEach(function(next) {
            if (visited[next]) return;
            visited[next] = true;
            previous[next] = current;
            queue.push(next);
        });
    }

    if (!visited[end]) {
        return [start];
    }

    var path = [];
    var cursor = end;
    while (cursor !== undefined) {
        path.push(cursor);
        cursor = previous[cursor];
    }

    return path.reverse();
}

function destination(line, start, end){
    if((start == end)) return [start];

    if (line === "three") {
        return destinationLineThree(start, end);
    }

    var route = [];
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

function lineLabelFromValue(lineValue) {
    if (lineValue === "one") return "Line 1";
    if (lineValue === "two") return "Line 2";
    return "Line 3";
}

function terminalNameForDirection(lineValue, towardEnd) {
    var terminals = {
        one: { start: "Helwan", end: "El Marg" },
        two: { start: "El Monib", end: "Shubra Al Khaimah" },
        three: { start: "Adly Mansour", end: "Rod El Farag Corridor" }
    };
    var lineTerminals = terminals[lineValue] || terminals.one;
    return towardEnd ? lineTerminals.end : lineTerminals.start;
}

function getTransferDirectionGuidance(transferStation, targetLine, targetStation) {
    var stats = network[targetLine] || [];
    var transferIdx = stats.indexOf(transferStation);
    var targetIdx = stats.indexOf(targetStation);

    if (transferIdx === -1 || targetIdx === -1) {
        return "Transfer at " + transferStation + " to " + lineLabelFromValue(targetLine) + ".";
    }

    var towardEnd = targetIdx > transferIdx;
    var terminal = terminalNameForDirection(targetLine, towardEnd);
    return "Transfer at " + transferStation + ". Take " + lineLabelFromValue(targetLine) + " toward " + terminal + ".";
}

function calculateTicket(){
    var transs = "";

    // Read directly from currently active selects to avoid stale state.
    slinestr = sline.value || "one";
    elinestr = eline.value || "one";
    var activePickupSelect = getActivePickupSelect(slinestr);
    var activeDropoffSelect = getActiveDropoffSelect(elinestr);
    pickup = activePickupSelect ? activePickupSelect.value : "";
    dropoff = activeDropoffSelect ? activeDropoffSelect.value : "";
    
    if(!pickup || !dropoff) {
        document.getElementById('stationsList').innerHTML = '<div style="color: #b0c4c1; padding: 1rem; text-align: center;">Please select the stations</div>';
        stations.textContent = '';
        transferGuide.innerText = "";
        z112.classList.remove('show');
        return;
    }

    if (normalizeStationName(pickup) === normalizeStationName(dropoff)) {
        document.getElementById('stationsList').innerHTML = '<div style="color: #ffcf86; padding: 1rem; text-align: center;">Start and destination cannot be the same station. Please choose a different destination.</div>';
        stations.textContent = '';
        transferGuide.innerText = "";
        cstats.innerText = '0';
        cost.innerText = '-';
        elderlyCost.innerText = '-';
        specialNeedsCost.innerText = '-';
        estimatedTime.innerText = '-';
        z112.classList.remove('show');
        return;
    }
    
    if(slinestr == elinestr){
        // Same line
        var totals = destination(slinestr, pickup, dropoff);
        var sameLineCount = totals.length;
        var sameLineFares = fareBreakdown(sameLineCount);
        cstats.innerText = sameLineCount;
        cost.innerText = sameLineFares.regular;
        elderlyCost.innerText = sameLineFares.elderly;
        specialNeedsCost.innerText = sameLineFares.special;
        generateStationBadges(totals, null);
        stations.textContent = totals.join(" → ");
        stations.classList.add('show');
        transferGuide.innerText = "No transfer required on this trip.";
        showRouteOnMap(totals, slinestr, elinestr, null);
        var sameLineTime = estimateTripTime(sameLineCount, false, window.currentRouteGeoPoints);
        estimatedTime.innerText = sameLineTime.text + " (" + sameLineTime.distanceKm.toFixed(1) + " km)";
    } else {
        // Different lines - need transfer
        var routes = [];
        var min1 = 1000;
        interchangeMatrix[slinestr][elinestr].forEach(function(ele){
            let m = destination(slinestr, pickup, ele);
            let n = destination(elinestr, dropoff, ele);
            if((m.length + n.length) < min1){
                transs = ele;
                min1 = (m.length + n.length);
                n.pop();
                routes = m.concat(n.reverse());
            }
        });
        var transferCount = (min1 - 1);
        var transferFares = fareBreakdown(transferCount);
        cstats.innerText = transferCount;
        cost.innerText = transferFares.regular;
        elderlyCost.innerText = transferFares.elderly;
        specialNeedsCost.innerText = transferFares.special;
        generateStationBadges(routes, transs);
        stations.textContent = routes.join(" → ");
        stations.classList.add('show');
        transferGuide.innerText = getTransferDirectionGuidance(transs, elinestr, dropoff);
        showRouteOnMap(routes, slinestr, elinestr, transs);
        var transferTime = estimateTripTime(transferCount, true, window.currentRouteGeoPoints);
        estimatedTime.innerText = transferTime.text + " (" + transferTime.distanceKm.toFixed(1) + " km)";
    }
    
    // Show results with animation
    z112.classList.add('show');
    setTimeout(() => {
        z112.scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

function generateStationBadges(stationArray, transferStation) {
    var stationsList = document.getElementById('stationsList');
    stationsList.innerHTML = '';
    
    stationArray.forEach(function(station, index) {
        var badge = document.createElement('span');
        badge.className = 'station-badge';
        
        // Mark start station
        if (index === 0) {
            badge.classList.add('start');
        }
        // Mark end station
        else if (index === stationArray.length - 1) {
            badge.classList.add('end');
        }
        // Mark transfer station
        else if (transferStation && station === transferStation) {
            badge.classList.add('transfer');
        }
        
        badge.textContent = station;
        stationsList.appendChild(badge);
        
        // Add connector between stations
        if (index < stationArray.length - 1) {
            var connector = document.createElement('span');
            connector.className = 'station-connector';
            connector.textContent = '→';
            stationsList.appendChild(connector);
        }
    });
}

function dmsToDecimal(dmsPart) {
    var match = dmsPart.match(/(\d+)°(\d+)′(\d+)″([NSEW])/);
    if (!match) return null;
    var deg = parseInt(match[1], 10);
    var min = parseInt(match[2], 10);
    var sec = parseInt(match[3], 10);
    var hemi = match[4];
    var dec = deg + (min / 60) + (sec / 3600);
    if (hemi === 'S' || hemi === 'W') dec = -dec;
    return dec;
}

function parseLatLng(dmsCoord) {
    var parts = dmsCoord.split(' ');
    if (parts.length < 2) return null;
    var lat = dmsToDecimal(parts[0]);
    var lng = dmsToDecimal(parts[1]);
    if (lat === null || lng === null) return null;
    return [lat, lng];
}

function buildStationMap() {
    var mapEl = document.getElementById('stationMap');
    if (!mapEl || typeof L === 'undefined') return;

    var line1Stations = [
        { name: 'Helwan', coord: '29°50′56″N 31°20′3″E', opened: '1987' },
        { name: 'Ain Helwan', coord: '29°51′46″N 31°19′30″E', opened: '1987' },
        { name: 'Helwan University', coord: '29°52′8″N 31°19′13″E', opened: '2002' },
        { name: 'Wadi Hof', coord: '29°52′46″N 31°18′48″E', opened: '1995' },
        { name: 'Hadayek Helwan', coord: '29°53′50″N 31°18′15″E', opened: '1997' },
        { name: 'El-Maasara', coord: '29°54′22″N 31°17′59″E', opened: '1987' },
        { name: 'Tora El-Asmant', coord: '29°55′33″N 31°17′16″E', opened: '1987' },
        { name: 'Kozzika', coord: '29°56′10″N 31°16′54″E', opened: '1993' },
        { name: 'Tora El-Balad', coord: '29°56′47″N 31°16′25″E', opened: '1987' },
        { name: 'Sakanat El-Maadi', coord: '29°57′10″N 31°15′48″E', opened: '1992' },
        { name: 'Maadi', coord: '29°57′35″N 31°15′29″E', opened: '1995' },
        { name: 'Hadayek El-Maadi', coord: '29°58′12″N 31°15′2″E', opened: '1992' },
        { name: 'Dar El-Salam', coord: '29°58′55″N 31°14′32″E', opened: '1988' },
        { name: 'El-Zahraa', coord: '29°59′43″N 31°13′54″E', opened: '1997' },
        { name: 'Mar Girgis', coord: '30°0′21″N 31°13′46″E', opened: '1992' },
        { name: 'El-Malek El-Saleh', coord: '30°1′1″N 31°13′51″E', opened: '1995' },
        { name: 'Al-Sayeda Zeinab', coord: '30°1′45″N 31°14′7″E', opened: '1987' },
        { name: 'Saad Zaghloul', coord: '30°2′12″N 31°14′17″E', opened: '1987' },
        { name: 'Sadat', coord: '30°2′40″N 31°14′8″E', opened: '1987' },
        { name: 'Nasser', coord: '30°3′13″N 31°14′20″E', opened: '1987' },
        { name: 'Orabi', coord: '30°3′27″N 31°14′33″E', opened: '1987' },
        { name: 'Al-Shohadaa', coord: '30°3′43″N 31°14′46″E', opened: '1987' },
        { name: 'Ghamra', coord: '30°4′8″N 31°15′53″E', opened: '1989' },
        { name: 'El-Demerdash', coord: '30°4′38″N 31°16′40″E', opened: '2005' },
        { name: 'Manshiet El-Sadr', coord: '30°4′56″N 31°17′16″E', opened: '1989' },
        { name: 'Kobri El-Qobba', coord: '30°5′13″N 31°17′38″E', opened: '1989' },
        { name: 'Hammamat El-Qobba', coord: '30°5′25″N 31°17′53″E', opened: '1989' },
        { name: 'Saray El-Qobba', coord: '30°5′53″N 31°18′17″E', opened: '1989' },
        { name: 'Hadayeq El-Zaitoun', coord: '30°6′19″N 31°18′36″E', opened: '1989' },
        { name: 'Helmeyet El-Zaitoun', coord: '30°6′52″N 31°18′50″E', opened: '1989' },
        { name: 'El-Matareyya', coord: '30°7′17″N 31°18′50″E', opened: '1989' },
        { name: 'Ain Shams', coord: '30°7′52″N 31°19′9″E', opened: '1989' },
        { name: 'Ezbet El-Nakhl', coord: '30°8′21″N 31°19′28″E', opened: '1989' },
        { name: 'El-Marg', coord: '30°9′8″N 31°20′8″E', opened: '1989' },
        { name: 'New El-Marg', coord: '30°9′48″N 31°20′18″E', opened: '1999' }
    ];

    var line2Stations = [
        { name: 'El-Mounib', coord: '29°58′53″N 31°12′43″E', opened: '2005' },
        { name: 'Sakiat Mekky', coord: '29°59′44″N 31°12′31″E', opened: '2005' },
        { name: 'Omm El-Masryeen', coord: '30°0′19″N 31°12′29″E', opened: '2000' },
        { name: 'El Giza', coord: '30°0′38″N 31°12′25″E', opened: '2000' },
        { name: 'Faisal', coord: '30°1′2″N 31°12′14″E', opened: '2000' },
        { name: 'Cairo University', coord: '30°1′34″N 31°12′4″E', opened: '1999' },
        { name: 'El Bohoth', coord: '30°2′9″N 31°12′1″E', opened: '1999' },
        { name: 'Dokki', coord: '30°2′18″N 31°12′43″E', opened: '1999' },
        { name: 'Opera', coord: '30°2′31″N 31°13′31″E', opened: '1999' },
        { name: 'Sadat', coord: '30°2′40″N 31°14′8″E', opened: '1987' },
        { name: 'Mohamed Naguib', coord: '30°2′43″N 31°14′39″E', opened: '1998' },
        { name: 'Attaba', coord: '30°3′9″N 31°14′49″E', opened: '1998' },
        { name: 'Al-Shohadaa', coord: '30°3′43″N 31°14′46″E', opened: '1987' },
        { name: 'Masarra', coord: '30°4′16″N 31°14′42″E', opened: '1996' },
        { name: 'Road El-Farag', coord: '30°4′50″N 31°14′44″E', opened: '1996' },
        { name: 'St. Teresa', coord: '30°5′18″N 31°14′44″E', opened: '1996' },
        { name: 'Khalafawy', coord: '30°5′53″N 31°14′43″E', opened: '1996' },
        { name: 'Mezallat', coord: '30°6′18″N 31°14′48″E', opened: '1996' },
        { name: 'Kolleyyet El-Zeraa', coord: '30°6′50″N 31°14′55″E', opened: '1996' },
        { name: 'Shubra El-Kheima', coord: '30°7′21″N 31°14′41″E', opened: '1996' }
    ];

    var line3Stations = [
        { name: 'Adly Mansour', coord: '30°8′49″N 31°25′17″E', opened: '2020' },
        { name: 'El Haykestep', coord: '30°8′38″N 31°24′17″E', opened: '2020' },
        { name: 'Omar Ibn El-Khattab', coord: '30°8′26″N 31°23′39″E', opened: '2020' },
        { name: 'Qobaa', coord: '30°8′5″N 31°23′2″E', opened: '2020' },
        { name: 'Hesham Barakat', coord: '30°7′52″N 31°22′22″E', opened: '2020' },
        { name: 'El-Nozha', coord: '30°7′42″N 31°21′36″E', opened: '2020' },
        { name: 'Nadi El-Shams', coord: '30°7′20″N 31°20′38″E', opened: '2019' },
        { name: 'Alf Maskan', coord: '30°7′5″N 31°20′23″E', opened: '2019' },
        { name: 'Heliopolis Square', coord: '30°6′29″N 31°20′17″E', opened: '2019' },
        { name: 'Haroun', coord: '30°6′4″N 31°19′58″E', opened: '2019' },
        { name: 'Al-Ahram', coord: '30°5′29″N 31°19′35″E', opened: '2014' },
        { name: 'Koleyet El-Banat', coord: '30°5′1″N 31°19′44″E', opened: '2014' },
        { name: 'Stadium', coord: '30°4′23″N 31°19′3″E', opened: '2014' },
        { name: 'Fair Zone', coord: '30°4′24″N 31°18′4″E', opened: '2014' },
        { name: 'Abbassia', coord: '30°4′11″N 31°16′51″E', opened: '2012' },
        { name: 'Abdou Pasha', coord: '30°3′53″N 31°16′29″E', opened: '2012' },
        { name: 'El Geish', coord: '30°3′43″N 31°16′1″E', opened: '2012' },
        { name: 'Bab El Shaaria', coord: '30°3′14″N 31°15′22″E', opened: '2012' },
        { name: 'Attaba', coord: '30°3′9″N 31°14′49″E', opened: '1998' },
        { name: 'Nasser', coord: '30°3′13″N 31°14′20″E', opened: '1987' },
        { name: 'Maspero', coord: '30°3′20″N 31°13′56″E', opened: '2022' },
        { name: 'Safaa Hegazy', coord: '30°3′45″N 31°13′21″E', opened: '2022' },
        { name: 'Kit Kat', coord: '30°4′0″N 31°12′47″E', opened: '2022' },
        { name: 'Sudan', coord: '30°4′11″N 31°12′19″E', opened: '2024' },
        { name: 'Imbaba', coord: '30°4′33″N 31°12′27″E', opened: '2024' },
        { name: 'El-Bohy', coord: '30°4′56″N 31°12′38″E', opened: '2024' },
        { name: 'El-Qawmia', coord: '30°5′36″N 31°12′32″E', opened: '2024' },
        { name: 'Ring Road', coord: '30°5′47″N 31°11′59″E', opened: '2024' },
        { name: 'Rod al-Farag Corridor', coord: '30°6′7″N 31°11′3″E', opened: '2024' },
        { name: 'Tawfikia', coord: '30°3′55″N 31°12′9″E', opened: '2024' },
        { name: 'Wadi El Nile', coord: '30°3′30″N 31°12′4″E', opened: '2024' },
        { name: 'Gamat El Dowal', coord: '30°3′3″N 31°11′59″E', opened: '2024' },
        { name: 'Boulak El Dakrour', coord: '30°2′10″N 31°11′47″E', opened: '2024' },
        { name: 'Cairo University', coord: '30°1′34″N 31°12′4″E', opened: '1999' }
    ];

    var map = L.map('stationMap', {
        zoomControl: true,
        attributionControl: false
    }).setView([30.045, 31.24], 11);

    function createOfflineGridLayer() {
        var grid = L.gridLayer({ attribution: 'Offline fallback map layer' });
        grid.createTile = function(coords) {
            var tile = document.createElement('div');
            tile.style.background = ((coords.x + coords.y) % 2 === 0) ? '#eef3f2' : '#e7efed';
            tile.style.border = '1px solid rgba(30,72,63,0.06)';
            return tile;
        };
        return grid;
    }

    // Primary online basemap + local offline grid fallback for connectivity drops.
    var onlineBaseLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    });
    var offlineBaseLayer = createOfflineGridLayer();

    function syncBaseLayerWithConnectivity() {
        var isOnline = navigator.onLine !== false;
        if (isOnline) {
            if (map.hasLayer(offlineBaseLayer)) map.removeLayer(offlineBaseLayer);
            if (!map.hasLayer(onlineBaseLayer)) map.addLayer(onlineBaseLayer);
        } else {
            if (map.hasLayer(onlineBaseLayer)) map.removeLayer(onlineBaseLayer);
            if (!map.hasLayer(offlineBaseLayer)) map.addLayer(offlineBaseLayer);
        }
    }

    syncBaseLayerWithConnectivity();
    window.addEventListener('online', syncBaseLayerWithConnectivity);
    window.addEventListener('offline', syncBaseLayerWithConnectivity);

    L.control.attribution({ prefix: false }).addTo(map);

    var linesMeta = [
        { id: 'Line 1', color: '#2E86DE', stations: line1Stations },
        { id: 'Line 2', color: '#E74C3C', stations: line2Stations },
        {
            id: 'Line 3',
            color: '#27AE60',
            stations: line3Stations,
            segments: [
                ['Adly Mansour', 'El Haykestep', 'Omar Ibn El-Khattab', 'Qobaa', 'Hesham Barakat', 'El-Nozha', 'Nadi El-Shams', 'Alf Maskan', 'Heliopolis Square', 'Haroun', 'Al-Ahram', 'Koleyet El-Banat', 'Stadium', 'Fair Zone', 'Abbassia', 'Abdou Pasha', 'El Geish', 'Bab El Shaaria', 'Attaba', 'Nasser', 'Maspero', 'Safaa Hegazy', 'Kit Kat'],
                ['Kit Kat', 'Sudan', 'Imbaba', 'El-Bohy', 'El-Qawmia', 'Ring Road', 'Rod al-Farag Corridor'],
                ['Kit Kat', 'Tawfikia', 'Wadi El Nile', 'Gamat El Dowal', 'Boulak El Dakrour', 'Cairo University']
            ]
        }
    ];

    var bounds = [];
    var labelMarkers = [];
    var geoStations = [];

    linesMeta.forEach(function(line) {
        var latlngs = [];

        line.stations.forEach(function(st) {
            var latlng = parseLatLng(st.coord);
            if (!latlng) return;

            latlngs.push(latlng);
            bounds.push(latlng);
            geoStations.push({
                name: st.name,
                plannerName: plannerStationName(line.id, st.name),
                lineId: line.id,
                lineValue: lineIdToPlannerValue(line.id),
                lat: latlng[0],
                lng: latlng[1]
            });

            var marker = L.circleMarker(latlng, {
                radius: 5,
                color: '#102a27',
                weight: 2,
                fillColor: line.color,
                fillOpacity: 0.95
            }).addTo(map);

            marker.bindPopup(
                '<strong>' + st.name + '</strong><br>' +
                'Line: ' + line.id + '<br>' +
                'Opened: ' + st.opened + '<br>' +
                'Coord: ' + st.coord
            );

            marker.bindTooltip(st.name, {
                permanent: true,
                direction: 'top',
                offset: [0, -8],
                className: 'station-label'
            });

            labelMarkers.push(marker);
        });

        if (line.segments && line.segments.length > 0) {
            line.segments.forEach(function(seg) {
                var segLatLngs = seg.map(function(stationName) {
                    var station = line.stations.find(function(item) { return item.name === stationName; });
                    return station ? parseLatLng(station.coord) : null;
                }).filter(function(v) { return !!v; });

                if (segLatLngs.length > 1) {
                    L.polyline(segLatLngs, {
                        color: line.color,
                        weight: 4,
                        opacity: 0.9
                    }).addTo(map);
                }
            });
        } else if (latlngs.length > 1) {
            L.polyline(latlngs, {
                color: line.color,
                weight: 4,
                opacity: 0.9
            }).addTo(map);
        }
    });

    if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [24, 24] });
        if (map.getZoom() < 11) {
            map.setZoom(11);
        }
    }

    function updateStationLabels() {
        var showLabels = map.getZoom() >= 13;
        labelMarkers.forEach(function(marker) {
            if (showLabels) {
                marker.openTooltip();
            } else {
                marker.closeTooltip();
            }
        });
    }

    map.on('zoomend', updateStationLabels);
    updateStationLabels();

    window.metroGeoStations = geoStations;
    window.metroMapState = {
        map: map,
        routeLayer: L.layerGroup().addTo(map),
        contextLayer: L.layerGroup().addTo(map),
        travelLayer: L.layerGroup().addTo(map),
        stationAreaLayer: L.layerGroup().addTo(map)
    };

    addStationAreaToggleControl(map);
    renderStationAreasOverlay();

    loadStationAreasFromInternet();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildStationMap);
} else {
    buildStationMap();
}

// Ensure inline HTML handlers can always resolve these functions.
window.calculateTicket = calculateTicket;
window.resetForm = resetForm;
window.getLiveLocation = getLiveLocation;
window.importCoordinatesFromLinks = importCoordinatesFromLinks;
window.findClosestStationNow = findClosestStationNow;
window.findClosestStartEndStations = findClosestStartEndStations;
window.startTravelMode = startTravelMode;
window.downloadStationBoundsData = downloadStationBoundsData;
window.downloadStationsData = downloadStationsData;
