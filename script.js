// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyB17WZ0At7da-f4aUajp2JRUoMJIIv94k",
  authDomain: "smart-room-100e5.firebaseapp.com",
  databaseURL: "https://smart-room-100e5-default-rtdb.firebaseio.com",
  projectId: "smart-room-100e5",
  storageBucket: "smart-room-100e5.appspot.com",
  messagingSenderId: "947555847929",
  appId: "1:947555847929:web:bbe1a05020e1c5ec579c28"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// State
let chart;
let allHistory     = [];
let filteredHistory= [];
let currentView    = "temp";

// Sensor alive tracking:
// Each time the /room listener fires (any value, even same as before),
// we stamp the browser clock. If no event for 15s => sensor disconnected.
// We do NOT compare values. Same temp/hum still = alive.
let lastSensorEventTime = null;
const SENSOR_TIMEOUT    = 15000; // ms


// ============================================================
//  CHART INIT
// ============================================================
window.onload = function () {
  const ctx = document.getElementById("chart").getContext("2d");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Temperature (C)",
          data: [],
          borderColor: "#ef4444",
          backgroundColor: "rgba(239,68,68,0.08)",
          fill: true,
          tension: 0.4,
          pointRadius: 3
        },
        {
          label: "Humidity (%)",
          data: [],
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59,130,246,0.08)",
          fill: true,
          tension: 0.4,
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { position: "top" } },
      scales: {
        x: { grid: { color: "rgba(128,128,128,0.1)" } },
        y: { grid: { color: "rgba(128,128,128,0.1)" } }
      }
    }
  });

  // 1. Browser <-> Firebase connection (topbar badge)
  db.ref(".info/connected").on("value", function(snap) {
    setBrowserConnection(snap.val() === true);
  });

  // 2. Check sensor status every 5 seconds
  //    Simply: has a /room event arrived recently?
  setInterval(updateSensorStatus, 5000);

  // 3. Load history from Firebase
  loadHistoryFromFirebase();
};


// ============================================================
//  LIVE DATA LISTENER
//  Every time this fires = sensor is alive (regardless of values)
// ============================================================
// Dedicated ping listener — /room/ping increments every 5s from Arduino
// so this ALWAYS fires on every send, even when temp/hum are unchanged.
// This is what keeps lastSensorEventTime fresh.
db.ref("/room/ping").on("value", function(snap) {
  if (snap.val() !== null) {
    lastSensorEventTime = Date.now();
    updateSensorStatus();
  }
});

db.ref("/room").on("value", function(snap) {
  var d = snap.val();
  if (!d) return;

  // Stamp the time this event arrived in the BROWSER
  lastSensorEventTime = Date.now();

  var temp = d.temperature;
  var hum  = d.humidity;

  if (temp == null || hum == null) return;

  document.getElementById("temp").textContent = temp + " C";
  document.getElementById("hum").textContent  = hum + " %";

  // Immediately mark connected since we just got data
  setSensorConnected(true);

  updateAlert(temp, hum);

  // Chart
  var time = new Date().toTimeString().slice(0, 8);
  chart.data.labels.push(time);
  chart.data.datasets[0].data.push(temp);
  chart.data.datasets[1].data.push(hum);
  if (chart.data.labels.length > 15) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
    chart.data.datasets[1].data.shift();
  }
  chart.update("none");

  // Save to Firebase history (persistent)
  saveToHistory(temp, hum);
});


// ============================================================
//  SENSOR STATUS
//  Called every 5 seconds AND immediately on each data event
// ============================================================
function updateSensorStatus() {
  if (lastSensorEventTime === null) {
    // No event ever received yet — still waiting
    setSensorConnected(null);
    return;
  }
  var age = Date.now() - lastSensorEventTime;
  setSensorConnected(age < SENSOR_TIMEOUT);
}

function setSensorConnected(state) {
  var el = document.getElementById("sensorStatus");
  if (state === true) {
    el.textContent   = "CONNECTED";
    el.style.color   = "#22c55e";
    el.style.fontSize= "0.95rem";
  } else if (state === false) {
    el.textContent   = "DISCONNECTED";
    el.style.color   = "#ef4444";
    el.style.fontSize= "0.85rem";
  } else {
    el.textContent   = "Waiting...";
    el.style.color   = "#f97316";
    el.style.fontSize= "0.85rem";
  }
}


// ============================================================
//  BROWSER CONNECTION BADGE
// ============================================================
function setBrowserConnection(isConnected) {
  var badge = document.getElementById("connBadge");
  if (isConnected) {
    badge.textContent = "ONLINE";
    badge.className   = "conn-badge online";
  } else {
    badge.textContent = "OFFLINE";
    badge.className   = "conn-badge";
  }
}


// ============================================================
//  ALERT BOX
// ============================================================
function updateAlert(temp, hum) {
  // Temperature alert
  var box  = document.getElementById("alertBox");
  var dot  = document.getElementById("alertDot");
  var text = document.getElementById("alertText");

  if (temp > 35) {
    text.textContent     = "High temperature! Room is HOT.";
    dot.style.background = "#ef4444";
    box.style.borderColor= "#fca5a5";
  } else if (temp < 15) {
    text.textContent     = "Low temperature! Room is COLD.";
    dot.style.background = "#3b82f6";
    box.style.borderColor= "#93c5fd";
  } else {
    text.textContent     = "Temperature is Normal.";
    dot.style.background = "#22c55e";
    box.style.borderColor= "#86efac";
  }

  // Humidity alert
  var hbox  = document.getElementById("humAlertBox");
  var hdot  = document.getElementById("humAlertDot");
  var htext = document.getElementById("humAlertText");

  if (hum > 70) {
    htext.textContent    = "Humidity is HIGH. Room feels damp.";
    hdot.style.background= "#3b82f6";
    hbox.style.borderColor="#93c5fd";
  } else if (hum < 30) {
    htext.textContent    = "Humidity is LOW. Room feels dry.";
    hdot.style.background= "#f97316";
    hbox.style.borderColor="#fdba74";
  } else {
    htext.textContent    = "Humidity is Normal.";
    hdot.style.background= "#22c55e";
    hbox.style.borderColor="#86efac";
  }
}


// ============================================================
//  FIREBASE HISTORY (persistent across refreshes)
// ============================================================
function saveToHistory(temp, hum) {
  var now  = new Date();
  var date = now.toISOString().split("T")[0];
  var time = now.toTimeString().slice(0, 8);
  db.ref("/history").push({ date: date, time: time, temp: temp, hum: hum });
}

function loadHistoryFromFirebase() {
  db.ref("/history").limitToLast(500).once("value", function(snap) {
    var data = snap.val();
    allHistory = data ? Object.values(data).reverse() : [];
    filteredHistory = allHistory;
  });

  // Listen for new entries added after page load
  db.ref("/history").limitToLast(1).on("child_added", function(snap) {
    var record = snap.val();
    if (!record) return;
    allHistory.unshift(record);
    filteredHistory = allHistory;
    if (document.getElementById("history").style.display !== "none") {
      renderTable(currentView);
    }
  });
}


// ============================================================
//  HISTORY TABLE
// ============================================================
function renderTable(type) {
  currentView = type;
  var col  = type === "temp" ? "Temperature (C)" : "Humidity (%)";
  var key  = type === "temp" ? "temp" : "hum";
  var data = filteredHistory;

  if (!data || data.length === 0) {
    document.getElementById("list").innerHTML =
      '<div class="empty-msg">No history records found.</div>';
    return;
  }

  var html = '<table><thead><tr><th>Date</th><th>Time</th><th>' + col + '</th></tr></thead><tbody>';
  data.forEach(function(h) {
    html += '<tr><td>' + h.date + '</td><td>' + h.time + '</td><td>' + h[key] + '</td></tr>';
  });
  html += '</tbody></table>';
  document.getElementById("list").innerHTML = html;
}

function filterHistory() {
  var date = document.getElementById("searchDate").value;
  var time = document.getElementById("searchTime").value;
  filteredHistory = allHistory.filter(function(h) {
    var dm = !date || h.date === date;
    var tm = !time || h.time.startsWith(time.slice(0, 5));
    return dm && tm;
  });
  renderTable(currentView);
}

function resetHistory() {
  filteredHistory = allHistory;
  document.getElementById("searchDate").value = "";
  document.getElementById("searchTime").value = "";
  renderTable(currentView);
}


// ============================================================
//  NAVIGATION
// ============================================================
function showLive() {
  document.getElementById("live").style.display    = "block";
  document.getElementById("history").style.display = "none";
  setActiveBtn("btn-live");
  closeMenu();
}

function showTemp() {
  document.getElementById("live").style.display    = "none";
  document.getElementById("history").style.display = "block";
  document.getElementById("historyTitle").textContent = "Temperature History";
  setActiveBtn("btn-temp");
  renderTable("temp");
  closeMenu();
}

function showHum() {
  document.getElementById("live").style.display    = "none";
  document.getElementById("history").style.display = "block";
  document.getElementById("historyTitle").textContent = "Humidity History";
  setActiveBtn("btn-hum");
  renderTable("hum");
  closeMenu();
}

function setActiveBtn(id) {
  ["btn-live","btn-temp","btn-hum"].forEach(function(b) {
    document.getElementById(b).classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
}

function toggleMenu() {
  document.getElementById("menu").classList.toggle("open");
  document.getElementById("overlay").classList.toggle("open");
}

function closeMenu() {
  document.getElementById("menu").classList.remove("open");
  document.getElementById("overlay").classList.remove("open");
}

function toggleDark() {
  document.body.classList.toggle("dark");
}
