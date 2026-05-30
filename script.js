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

// ================= INIT CHART =================
window.onload = function () {
  const ctx = document.getElementById("chart").getContext("2d");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Temperature (°C)",
          data: [],
          borderColor: "red",
          fill: false,
          tension: 0.3
        },
        {
          label: "Humidity (%)",
          data: [],
          borderColor: "blue",
          fill: false,
          tension: 0.3
        }
      ]
    }
  });
};

// ================= LIVE DATA =================
db.ref("/room").on("value", (snap) => {
  const d = snap.val();
  if (!d) return;

  const temp = d.temperature;
  const hum = d.humidity;
  const status = d.status;

  // UI update
  document.getElementById("temp").innerText = temp;
  document.getElementById("hum").innerText = hum;
  document.getElementById("status").innerText = status;

  // ALERT SYSTEM
  const alertBox = document.getElementById("alert");

  if (temp > 35) {
    alertBox.innerText = "🔥 TOO HOT";
    alertBox.style.background = "red";
    alertBox.style.color = "white";
  } 
  else if (temp < 15) {
    alertBox.innerText = "❄ TOO COLD";
    alertBox.style.background = "blue";
    alertBox.style.color = "white";
  } 
  else {
    alertBox.innerText = "✅ NORMAL";
    alertBox.style.background = "green";
    alertBox.style.color = "white";
  }

  // TIME
  const time = new Date().toLocaleString();

  // STORE HISTORY (temporary)
  history.unshift({ time, temp, hum });

  // UPDATE CHART
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

// ================= MENU (FIXED) =================
function toggleMenu() {
  const menu = document.getElementById("menu");
  const isOpen = menu.style.right === "0px";

  menu.style.right = isOpen ? "-260px" : "0px";
}

// ================= VIEW SWITCH =================
function showLive() {
  document.getElementById("live").style.display = "block";
  document.getElementById("history").style.display = "none";
}

// ================= HISTORY =================
function showTemp() {
  renderHistory("Temperature History", "temp");
}

function showHum() {
  renderHistory("Humidity History", "hum");
}

function renderHistory(title, type) {
  document.getElementById("live").style.display = "none";
  document.getElementById("history").style.display = "block";

  document.getElementById("title").innerText = title;

  let html = "<ul>";

  if (history.length === 0) {
    html += "<li>No history yet</li>";
  }

  history.forEach(item => {
    if (type === "temp") {
      html += `<li>🕒 ${item.time} → 🌡 ${item.temp}°C</li>`;
    } else {
      html += `<li>🕒 ${item.time} → 💧 ${item.hum}%</li>`;
    }
  });

  html += "</ul>";

  document.getElementById("list").innerHTML = html;
}

// ================= DARK MODE =================
function toggleDark() {
  document.body.classList.toggle("dark");
}