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
        {
          label: "Temperature",
          data: [],
          borderColor: "red",
          fill: false
        },
        {
          label: "Humidity",
          data: [],
          borderColor: "blue",
          fill: false
        }
      ]
    }
  });
};

// LIVE DATA
db.ref("/room").on("value", (snap) => {
  const d = snap.val();
  if (!d) return;

  const temp = d.temperature;
  const hum = d.humidity;
  const status = d.status;

  document.getElementById("temp").innerText = temp;
  document.getElementById("hum").innerText = hum;
  document.getElementById("status").innerText = status;

  // alert
  const alertBox = document.getElementById("alert");

  if (temp > 35) alertBox.innerText = "🔥 HOT";
  else if (temp < 15) alertBox.innerText = "❄ COLD";
  else alertBox.innerText = "✅ NORMAL";

  // history save
  const time = new Date().toLocaleString();
  history.unshift({ time, temp, hum });

  // chart
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

// MENU
function toggleMenu() {
  const m = document.getElementById("menu");
  m.style.right = (m.style.right === "0px") ? "-220px" : "0px";
}

// SHOW LIVE
function showLive() {
  document.getElementById("live").style.display = "block";
  document.getElementById("history").style.display = "none";
}

// TEMP HISTORY
function showTemp() {
  showHistory("Temperature History", "temp");
}

// HUM HISTORY
function showHum() {
  showHistory("Humidity History", "hum");
}

// HISTORY VIEW
function showHistory(title, type) {
  document.getElementById("live").style.display = "none";
  document.getElementById("history").style.display = "block";

  document.getElementById("title").innerText = title;

  let html = "<ul>";

  history.forEach(h => {
    html += `<li>${h.time} → ${type === "temp" ? h.temp + "°C" : h.hum + "%"}</li>`;
  });

  html += "</ul>";

  document.getElementById("list").innerHTML = html;
}

// DARK MODE
function toggleDark() {
  document.body.classList.toggle("dark");
}