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

let chart;
let history = [];

let lastSavedTime = null; // 🔥 prevent duplicate history

// ================= RESTORE PAGE STATE =================
window.onload = function () {
  const savedPage = localStorage.getItem("page") || "live";

  if (savedPage === "history-temp") showTemp();
  else if (savedPage === "history-hum") showHum();
  else showLive();

  initChart();
};

// ================= INIT CHART =================
function initChart() {
  const ctx = document.getElementById("chart").getContext("2d");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        { label: "Temperature", data: [], borderColor: "red", fill: false },
        { label: "Humidity", data: [], borderColor: "blue", fill: false }
      ]
    }
  });
}

// ================= LIVE DATA =================
db.ref("/room").on("value", (snap) => {
  const d = snap.val();

  const temp = d?.temperature;
  const hum = d?.humidity;
  const status = d?.status;

  // ================= DISCONNECTED LOGIC =================
  const isDisconnected =
    temp === undefined || hum === undefined ||
    temp === null || hum === null ||
    isNaN(temp) || isNaN(hum);

  const tempUI = isDisconnected ? "DISCONNECTED" : temp;
  const humUI = isDisconnected ? "DISCONNECTED" : hum;
  const statusUI = isDisconnected ? "DISCONNECTED" : status;

  document.getElementById("temp").innerText = tempUI;
  document.getElementById("hum").innerText = humUI;
  document.getElementById("status").innerText = statusUI;

  const alertBox = document.getElementById("alert");

  if (isDisconnected) {
    alertBox.innerText = "⚠ SENSOR DISCONNECTED";
    alertBox.style.background = "gray";
    alertBox.style.color = "white";
    return;
  }

  // ================= TIME =================
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().split(" ")[0];

  const uniqueKey = date + time;

  // 🔥 SAVE ONLY IF NEW ENTRY
  if (lastSavedTime !== uniqueKey) {
    db.ref("/history").push({ date, time, temp, hum });
    lastSavedTime = uniqueKey;
  }

  // ================= CHART =================
  chart.data.labels.push(time);
  chart.data.datasets[0].data.push(temp);
  chart.data.datasets[1].data.push(hum);

  if (chart.data.labels.length > 10) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
    chart.data.datasets[1].data.shift();
  }

  chart.update();

  // ================= ALERT =================
  if (temp > 35) {
    alertBox.innerText = "🔥 HOT";
    alertBox.style.background = "red";
  } else if (temp < 15) {
    alertBox.innerText = "❄ COLD";
    alertBox.style.background = "blue";
  } else {
    alertBox.innerText = "✅ NORMAL";
    alertBox.style.background = "green";
  }
});

// ================= LOAD HISTORY =================
function loadHistory(callback) {
  db.ref("/history").once("value", (snap) => {
    history = [];
    snap.forEach(child => history.push(child.val()));
    history.reverse();
    callback();
  });
}

// ================= MENU =================
function toggleMenu() {
  const menu = document.getElementById("menu");
  menu.style.right = (menu.style.right === "0px") ? "-260px" : "0px";
}

// ================= PAGE CONTROL =================
function showLive() {
  localStorage.setItem("page", "live");
  document.getElementById("live").style.display = "block";
  document.getElementById("history").style.display = "none";
}

function showTemp() {
  localStorage.setItem("page", "history-temp");
  loadHistory(() => render("Temperature History", "temp"));
}

function showHum() {
  localStorage.setItem("page", "history-hum");
  loadHistory(() => render("Humidity History", "hum"));
}

// ================= TABLE =================
function render(title, type) {
  document.getElementById("live").style.display = "none";
  document.getElementById("history").style.display = "block";

  document.getElementById("title").innerText = title;

  let html = `
    <table>
      <tr>
        <th>Date</th>
        <th>Time</th>
        <th>${type === "temp" ? "Temperature" : "Humidity"}</th>
      </tr>
  `;

  history.forEach(h => {
    html += `
      <tr>
        <td>${h.date}</td>
        <td>${h.time}</td>
        <td>${type === "temp" ? h.temp : h.hum}</td>
      </tr>
    `;
  });

  html += `</table>`;
  document.getElementById("list").innerHTML = html;
}

// ================= SEARCH =================
function filterHistory() {
  const date = document.getElementById("searchDate").value;
  const time = document.getElementById("searchTime").value;

  let filtered = history;

  if (date) filtered = filtered.filter(h => h.date === date);
  if (time) filtered = filtered.filter(h => h.time.startsWith(time));

  renderFiltered(filtered);
}

function renderFiltered(data) {
  let html = `
    <table>
      <tr>
        <th>Date</th>
        <th>Time</th>
        <th>Value</th>
      </tr>
  `;

  data.forEach(h => {
    html += `
      <tr>
        <td>${h.date}</td>
        <td>${h.time}</td>
        <td>${h.temp || h.hum}</td>
      </tr>
    `;
  });

  html += `</table>`;
  document.getElementById("list").innerHTML = html;
}

// ================= RESET =================
function resetHistory() {
  document.getElementById("searchDate").value = "";
  document.getElementById("searchTime").value = "";
  renderFiltered(history);
}

// ================= DARK MODE =================
function toggleDark() {
  document.body.classList.toggle("dark");
}