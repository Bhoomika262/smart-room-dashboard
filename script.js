const firebaseConfig = {
  apiKey: "AIzaSyB17WZ0At7da-f4Uajp2JRUoMJIIv94k",
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
let lastSeen = Date.now();

// INIT
window.onload = () => {
  const ctx = document.getElementById("chart").getContext("2d");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        { label: "Temp", data: [], borderColor: "red" },
        { label: "Hum", data: [], borderColor: "blue" }
      ]
    }
  });
};

// LIVE DATA
db.ref("/room").on("value", (snap) => {
  const d = snap.val();

  const now = Date.now();

  const temp = d?.temperature;
  const hum = d?.humidity;

  const disconnected =
    !d ||
    temp == null ||
    hum == null ||
    (now - lastSeen > 15000);

  if (disconnected) {
    document.getElementById("temp").innerText = "DISCONNECTED";
    document.getElementById("hum").innerText = "DISCONNECTED";
    document.getElementById("status").innerText = "DISCONNECTED";
    document.getElementById("alert").innerText = "⚠ SENSOR OFF";
    return;
  }

  lastSeen = now;

  document.getElementById("temp").innerText = temp;
  document.getElementById("hum").innerText = hum;
  document.getElementById("status").innerText = d.status;

  const date = new Date().toISOString().split("T")[0];
  const time = new Date().toTimeString().split(" ")[0];

  db.ref("/history").push({ date, time, temp, hum, status: "OK" });

  chart.data.labels.push(time);
  chart.data.datasets[0].data.push(temp);
  chart.data.datasets[1].data.push(hum);

  if (chart.data.labels.length > 10) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
    chart.data.datasets[1].data.shift();
  }

  chart.update();

  document.getElementById("alert").innerText =
    temp > 35 ? "🔥 HOT" : temp < 15 ? "❄ COLD" : "✅ NORMAL";
});

// LOAD HISTORY
function loadHistory(cb) {
  db.ref("/history").once("value", (snap) => {
    history = [];
    snap.forEach(x => history.push(x.val()));
    history.reverse();
    cb();
  });
}

// MENU
function toggleMenu() {
  const m = document.getElementById("menu");
  m.style.right = m.style.right === "0px" ? "-260px" : "0px";
}

// VIEW
function showLive() {
  document.getElementById("live").style.display = "block";
  document.getElementById("history").style.display = "none";
}

function showTemp() {
  loadHistory(() => render("TEMP HISTORY", "temp"));
}

function showHum() {
  loadHistory(() => render("HUM HISTORY", "hum"));
}

// TABLE
function render(title, type) {
  document.getElementById("live").style.display = "none";
  document.getElementById("history").style.display = "block";

  document.getElementById("title").innerText = title;

  let html = `<table>
    <tr><th>Date</th><th>Time</th><th>Value</th><th>Status</th></tr>`;

  history.forEach(h => {
    html += `<tr>
      <td>${h.date}</td>
      <td>${h.time}</td>
      <td>${type === "temp" ? h.temp : h.hum}</td>
      <td>${h.status}</td>
    </tr>`;
  });

  html += "</table>";
  document.getElementById("list").innerHTML = html;
}

// FILTER
function filterHistory() {
  const d = document.getElementById("searchDate").value;
  const t = document.getElementById("searchTime").value;

  let f = history;
  if (d) f = f.filter(x => x.date === d);
  if (t) f = f.filter(x => x.time.startsWith(t));

  renderFiltered(f);
}

function renderFiltered(data) {
  let html = `<table>
    <tr><th>Date</th><th>Time</th><th>Value</th><th>Status</th></tr>`;

  data.forEach(h => {
    html += `<tr>
      <td>${h.date}</td>
      <td>${h.time}</td>
      <td>${h.temp || h.hum || "DISCONNECTED"}</td>
      <td>${h.status}</td>
    </tr>`;
  });

  html += "</table>";
  document.getElementById("list").innerHTML = html;
}

// RESET
function resetHistory() {
  document.getElementById("searchDate").value = "";
  document.getElementById("searchTime").value = "";
  renderFiltered(history);
}

// DARK
function toggleDark() {
  document.body.classList.toggle("dark");
}