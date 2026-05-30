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
let lastUpdate = Date.now(); // ⭐ IMPORTANT

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

  // 🔥 check every 3 sec
  setInterval(checkOffline, 3000);
};

// ================= LIVE DATA =================
db.ref("/room").on("value", (snap) => {
  const d = snap.val();
  if (!d) return;

  lastUpdate = Date.now(); // reset timer

  const temp = d.temperature;
  const hum = d.humidity;
  const status = d.status;

  document.getElementById("temp").innerText = temp;
  document.getElementById("hum").innerText = hum;
  document.getElementById("status").innerText = status;

  updateAlert(temp);

  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().split(" ")[0];

  history.unshift({ date, time, temp, hum });

  chart.data.labels.push(time);
  chart.data.datasets[0].data.push(temp);
  chart.data.datasets[1].data.push(hum);

  if (chart.data.labels.length > 10) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
    chart.data.datasets[1].data.shift();
  }

  chart.update();
});

// ================= OFFLINE CHECK =================
function checkOffline() {
  const now = Date.now();

  if (now - lastUpdate > 8000) { // 8 sec no data
    document.getElementById("temp").innerText = "DISCONNECTED";
    document.getElementById("hum").innerText = "DISCONNECTED";
    document.getElementById("status").innerText = "OFFLINE";

    const alertBox = document.getElementById("alert");
    alertBox.innerText = "⚠ SENSOR DISCONNECTED";
    alertBox.style.background = "red";
    alertBox.style.color = "white";
  }
}

// ================= ALERT =================
function updateAlert(temp) {
  const alertBox = document.getElementById("alert");

  if (temp > 35) {
    alertBox.innerText = "🔥 HOT";
    alertBox.style.background = "red";
  } 
  else if (temp < 15) {
    alertBox.innerText = "❄ COLD";
    alertBox.style.background = "blue";
  } 
  else {
    alertBox.innerText = "✅ NORMAL";
    alertBox.style.background = "green";
  }

  alertBox.style.color = "white";
}

// ================= MENU =================
function toggleMenu() {
  const menu = document.getElementById("menu");
  menu.style.right = (menu.style.right === "0px") ? "-260px" : "0px";
}

function showLive() {
  document.getElementById("live").style.display = "block";
  document.getElementById("history").style.display = "none";
}

function showTemp() {
  render("temp");
}

function showHum() {
  render("hum");
}

function render(type) {
  document.getElementById("live").style.display = "none";
  document.getElementById("history").style.display = "block";

  document.getElementById("title").innerText =
    type === "temp" ? "Temperature History" : "Humidity History";

  let html = "<table><tr><th>Date</th><th>Time</th><th>Value</th></tr>";

  history.forEach(h => {
    html += `
      <tr>
        <td>${h.date}</td>
        <td>${h.time}</td>
        <td>${type === "temp" ? h.temp : h.hum}</td>
      </tr>
    `;
  });

  html += "</table>";

  document.getElementById("list").innerHTML = html;
}

function toggleDark() {
  document.body.classList.toggle("dark");
}