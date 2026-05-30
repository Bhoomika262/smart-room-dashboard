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
let lastTime = Date.now();

// INIT CHART
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

  loadHistory();
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
    (now - lastTime > 15000);

  if (disconnected) {
    document.getElementById("temp").innerText = "DISCONNECTED";
    document.getElementById("hum").innerText = "DISCONNECTED";
    document.getElementById("status").innerText = "OFFLINE";
    document.getElementById("alert").innerText = "SENSOR DISCONNECTED";
    return;
  }

  lastTime = now;

  document.getElementById("temp").innerText = temp;
  document.getElementById("hum").innerText = hum;
  document.getElementById("status").innerText = d.status;

  document.getElementById("alert").innerText =
    temp > 35 ? "HOT" : temp < 15 ? "COLD" : "NORMAL";

  const date = new Date().toISOString().split("T")[0];
  const time = new Date().toTimeString().split(" ")[0];

  db.ref("/history").push({ date, time, temp, hum });

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

// LOAD HISTORY
function loadHistory() {
  db.ref("/history").once("value", (snap) => {
    history = [];
    snap.forEach(x => history.push(x.val()));
    history.reverse();
  });
}

// VIEW LIVE
function showLive() {
  document.getElementById("live").style.display = "block";
  document.getElementById("history").style.display = "none";
}

// TEMP HISTORY
function showTemp() {
  render("TEMP HISTORY", "temp");
}

// HUM HISTORY
function showHum() {
  render("HUM HISTORY", "hum");
}

// TABLE
function render(title, type) {
  document.getElementById("live").style.display = "none";
  document.getElementById("history").style.display = "block";

  document.getElementById("list").innerHTML =
    `<h3>${title}</h3>
     <table>
       <tr><th>Date</th><th>Time</th><th>Value</th></tr>`;

  history.forEach(h => {
    document.getElementById("list").innerHTML += `
      <tr>
        <td>${h.date}</td>
        <td>${h.time}</td>
        <td>${type === "temp" ? h.temp : h.hum}</td>
      </tr>`;
  });

  document.getElementById("list").innerHTML += `</table>`;
}