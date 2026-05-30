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

let history = [];

// LIVE DATA
db.ref("/room").on("value", (snap) => {
  const d = snap.val();

  const temp = d?.temperature;
  const hum = d?.humidity;
  const lastSeen = d?.lastSeen;

  const now = Date.now();
  const isDisconnected = !lastSeen || (now - lastSeen > 10000);

  document.getElementById("temp").innerText =
    isDisconnected ? "DISCONNECTED" : temp;

  document.getElementById("hum").innerText =
    isDisconnected ? "DISCONNECTED" : hum;

  if (isDisconnected) {
    document.getElementById("alert").innerText = "⚠ SENSOR DISCONNECTED";
    return;
  }

  // time
  const dateObj = new Date();
  const date = dateObj.toISOString().split("T")[0];
  const time = dateObj.toTimeString().split(" ")[0];

  // save history
  db.ref("/history").push({
    date,
    time,
    temp,
    hum,
    status: "OK"
  });

  // alert
  if (temp > 35) {
    document.getElementById("alert").innerText = "🔥 HOT";
  } else if (temp < 15) {
    document.getElementById("alert").innerText = "❄ COLD";
  } else {
    document.getElementById("alert").innerText = "✅ NORMAL";
  }
});

// LOAD HISTORY
function loadHistory(cb) {
  db.ref("/history").once("value", (snap) => {
    history = [];
    snap.forEach(c => history.push(c.val()));
    history.reverse();
    cb();
  });
}

// MENU
function toggleMenu() {
  const menu = document.getElementById("menu");
  menu.style.right = menu.style.right === "0px" ? "-260px" : "0px";
}

// VIEW
function showLive() {
  document.getElementById("live").style.display = "block";
  document.getElementById("history").style.display = "none";
}

function showTemp() {
  loadHistory(() => render("Temperature History", "temp"));
}

function showHum() {
  loadHistory(() => render("Humidity History", "hum"));
}

// TABLE
function render(title, type) {
  document.getElementById("live").style.display = "none";
  document.getElementById("history").style.display = "block";

  document.getElementById("title").innerText = title;

  let html = `
  <table>
    <tr>
      <th>Date</th>
      <th>Time</th>
      <th>Value</th>
      <th>Status</th>
    </tr>
  `;

  history.forEach(h => {
    html += `
      <tr>
        <td>${h.date}</td>
        <td>${h.time}</td>
        <td>${type === "temp" ? h.temp : h.hum}</td>
        <td>${h.status}</td>
      </tr>
    `;
  });

  html += "</table>";

  document.getElementById("list").innerHTML = html;
}

// SEARCH
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
        <td>${h.temp || h.hum}</td>
        <td>${h.status}</td>
      </tr>
    `;
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

// DARK MODE
function toggleDark() {
  document.body.classList.toggle("dark");
}