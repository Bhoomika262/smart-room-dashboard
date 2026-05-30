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

/* ================= PAGE RESTORE ================= */
window.onload = function () {

  const page = localStorage.getItem("page") || "live";
  if (page === "history") showHistory();

  chart = new Chart(document.getElementById("chart"), {
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

/* ================= LIVE DATA ================= */
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

  // ONLY SAVE IF NEW DATA (PREVENT SPAM)
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

  document.getElementById("alert").innerText =
    temp > 35 ? "HOT" : temp < 15 ? "COLD" : "NORMAL";
});

/* ================= LOAD HISTORY FROM FIREBASE ================= */
function loadHistory() {
  db.ref("/history").on("value", (snap) => {
    history = [];

    snap.forEach(child => {
      history.push(child.val());
    });

    history.reverse();
  });
}

/* ================= MENU ================= */
function toggleMenu() {
  const m = document.getElementById("menu");
  m.style.right = (m.style.right === "0px") ? "-250px" : "0px";
}

/* ================= PAGE CONTROL ================= */
function showLive() {
  localStorage.setItem("page", "live");
  document.getElementById("live").style.display = "block";
  document.getElementById("history").style.display = "none";
}

function showHistory() {
  localStorage.setItem("page", "history");
  document.getElementById("live").style.display = "none";
  document.getElementById("history").style.display = "block";
  render(history);
}

/* ================= TABLE ================= */
function render(data) {
  let html = `
    <table>
      <tr>
        <th>Date</th>
        <th>Time</th>
        <th>Temp</th>
        <th>Hum</th>
      </tr>
  `;

  data.forEach(d => {
    html += `
      <tr>
        <td>${d.date}</td>
        <td>${d.time}</td>
        <td>${d.temp}</td>
        <td>${d.hum}</td>
      </tr>
    `;
  });

  html += "</table>";
  document.getElementById("table").innerHTML = html;
}

/* ================= FILTER ================= */
function filter() {
  const date = document.getElementById("dateFilter").value;
  const time = document.getElementById("timeFilter").value;

  let filtered = history;

  if (date) filtered = filtered.filter(x => x.date === date);
  if (time) filtered = filtered.filter(x => x.time.startsWith(time));

  render(filtered);
}

/* ================= RESET ================= */
function reset() {
  document.getElementById("dateFilter").value = "";
  document.getElementById("timeFilter").value = "";
  render(history);
}

/* ================= DARK MODE ================= */
function toggleDark() {
  document.body.classList.toggle("dark");
}