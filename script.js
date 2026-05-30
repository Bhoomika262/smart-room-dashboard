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

// INIT CHART
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

// 🔥 LIVE DATA + SAVE TO FIREBASE HISTORY
db.ref("/room").on("value", (snap) => {
  const d = snap.val();
  if (!d) return;

  const temp = d.temperature;
  const hum = d.humidity;
  const status = d.status;

  document.getElementById("temp").innerText = temp;
  document.getElementById("hum").innerText = hum;
  document.getElementById("status").innerText = status;

  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().split(" ")[0];

  // 🔥 SAVE TO FIREBASE (PERMANENT HISTORY)
  db.ref("/history").push({
    date,
    time,
    temp,
    hum
  });

  // chart update
  chart.data.labels.push(time);
  chart.data.datasets[0].data.push(temp);
  chart.data.datasets[1].data.push(hum);

  if (chart.data.labels.length > 10) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
    chart.data.datasets[1].data.shift();
  }

  chart.update();

  // alert
  const alertBox = document.getElementById("alert");

  if (temp > 35) alertBox.innerText = "🔥 HOT";
  else if (temp < 15) alertBox.innerText = "❄ COLD";
  else alertBox.innerText = "✅ NORMAL";
});

// 🔥 LOAD HISTORY FROM FIREBASE
function loadHistory(callback) {
  db.ref("/history").once("value", (snap) => {
    history = [];
    snap.forEach(child => {
      history.push(child.val());
    });
    history.reverse();
    callback();
  });
}

// MENU
function toggleMenu() {
  const menu = document.getElementById("menu");
  menu.style.right = (menu.style.right === "0px") ? "-260px" : "0px";
}

// LIVE
function showLive() {
  document.getElementById("live").style.display = "block";
  document.getElementById("history").style.display = "none";
}

// TEMP
function showTemp() {
  loadHistory(() => render("Temperature History", "temp"));
}

// HUM
function showHum() {
  loadHistory(() => render("Humidity History", "hum"));
}

// TABLE RENDER
function render(title, type) {
  document.getElementById("live").style.display = "none";
  document.getElementById("history").style.display = "block";

  document.getElementById("title").innerText = title;

  buildTable(history, type);
}

function buildTable(data, type) {
  let html = `
    <table>
      <tr>
        <th>Date</th>
        <th>Time</th>
        <th>${type === "temp" ? "Temp (°C)" : "Humidity (%)"}</th>
      </tr>
  `;

  data.forEach(h => {
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

// FILTER
function filterHistory() {
  const date = document.getElementById("searchDate").value;
  const time = document.getElementById("searchTime").value;

  let filtered = history;

  if (date) filtered = filtered.filter(h => h.date === date);
  if (time) filtered = filtered.filter(h => h.time.startsWith(time));

  buildTable(filtered, "temp");
}

// RESET
function resetHistory() {
  document.getElementById("searchDate").value = "";
  document.getElementById("searchTime").value = "";
  buildTable(history, "temp");
}

// DARK MODE
function toggleDark() {
  document.body.classList.toggle("dark");
}