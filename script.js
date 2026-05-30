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

let lastTimestamp = 0;

// ================= INIT =================
window.onload = function () {
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
};

// ================= LIVE DATA =================
db.ref("/room").on("value", (snap) => {
  const d = snap.val();

  const temp = d?.temperature;
  const hum = d?.humidity;

  const now = Date.now();

  // 🔥 HEARTBEAT: if no data recently → disconnected
  const isDisconnected =
    temp === undefined ||
    hum === undefined ||
    temp === null ||
    hum === null ||
    isNaN(temp) ||
    isNaN(hum) ||
    (now - lastTimestamp > 15000); // 15 sec rule

  const tempUI = isDisconnected ? "DISCONNECTED" : temp;
  const humUI = isDisconnected ? "DISCONNECTED" : hum;

  document.getElementById("temp").innerText = tempUI;
  document.getElementById("hum").innerText = humUI;

  const alertBox = document.getElementById("alert");

  if (isDisconnected) {
    alertBox.innerText = "⚠ SENSOR DISCONNECTED";
    alertBox.style.background = "gray";
    alertBox.style.color = "white";
    return;
  }

  // ================= UPDATE TIMESTAMP =================
  lastTimestamp = now;

  const dateObj = new Date();
  const date = dateObj.toISOString().split("T")[0];
  const time = dateObj.toTimeString().split(" ")[0];

  // ================= SAVE HISTORY (WITH STATUS) =================
  db.ref("/history").push({
    date,
    time,
    temp,
    hum,
    status: "OK"
  });

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
function loadHistory(cb) {
  db.ref("/history").once("value", (snap) => {
    history = [];
    snap.forEach(c => history.push(c.val()));
    history.reverse();
    cb();
  });
}

// ================= MENU =================
function toggleMenu() {
  const menu = document.getElementById("menu");
  menu.style.right = menu.style.right === "0px" ? "-260px" : "0px";
}

function showLive() {
  document.getElementById("live").style.display = "block";
  document.getElementById("history").style.display = "none";
}

// ================= HISTORY =================
function showTemp() {
  loadHistory(() => renderTable("Temperature History", "temp"));
}

function showHum() {
  loadHistory(() => renderTable("Humidity History", "hum"));
}

function renderTable(title, type) {
  document.getElementById("live").style.display = "none";
  document.getElementById("history").style.display = "block";

  document.getElementById("title").innerText = title;

  let html = `
    <table>
      <tr>
        <th>Date</th>
        <th>Time</th>
        <th>${type === "temp" ? "Temperature" : "Humidity"}</th>
        <th>Status</th>
      </tr>
  `;

  history.forEach(h => {
    html += `
      <tr>
        <td>${h.date}</td>
        <td>${h.time}</td>
        <td>${h.temp ?? "DISCONNECTED"}</td>
        <td>${h.status ?? "DISCONNECTED"}</td>
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
        <th>Status</th>
      </tr>
  `;

  data.forEach(h => {
    html += `
      <tr>
        <td>${h.date}</td>
        <td>${h.time}</td>
        <td>${h.temp ?? h.hum ?? "DISCONNECTED"}</td>
        <td>${h.status ?? "DISCONNECTED"}</td>
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