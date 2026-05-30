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

/* ================= VERY IMPORTANT FIX ================= */
window.onload = function () {

  const savedPage = localStorage.getItem("page");

  // DEFAULT = live
  if (savedPage === "history") {
    showHistory(true);
  } else {
    showLive(true);
  }

  loadHistory();
};

/* ================= LIVE DATA ================= */
db.ref("/room").on("value", (snap) => {
  const d = snap.val();
  if (!d) return;

  document.getElementById("temp").innerText = d.temperature;
  document.getElementById("hum").innerText = d.humidity;
  document.getElementById("status").innerText = d.status;

  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().split(" ")[0];

  db.ref("/history").push({
    date,
    time,
    temp: d.temperature,
    hum: d.humidity
  });
});

/* ================= LOAD HISTORY ================= */
function loadHistory() {
  db.ref("/history").on("value", (snap) => {
    history = [];

    snap.forEach(child => {
      history.push(child.val());
    });

    history.reverse();

    // auto refresh table if history page open
    if (localStorage.getItem("page") === "history") {
      render();
    }
  });
}

/* ================= PAGE SYSTEM (FIXED) ================= */
function setPage(page) {
  localStorage.setItem("page", page);

  if (page === "history") showHistory();
  else showLive();
}

function showLive(skipSave) {
  document.getElementById("live").style.display = "block";
  document.getElementById("history").style.display = "none";

  if (!skipSave) localStorage.setItem("page", "live");
}

function showHistory(skipSave) {
  document.getElementById("live").style.display = "none";
  document.getElementById("history").style.display = "block";

  if (!skipSave) localStorage.setItem("page", "history");

  render();
}

/* ================= TABLE ================= */
function render() {
  let html = `
    <table>
      <tr>
        <th>Date</th>
        <th>Time</th>
        <th>Temp</th>
        <th>Hum</th>
      </tr>
  `;

  history.forEach(h => {
    html += `
      <tr>
        <td>${h.date}</td>
        <td>${h.time}</td>
        <td>${h.temp}</td>
        <td>${h.hum}</td>
      </tr>
    `;
  });

  html += "</table>";

  document.getElementById("table").innerHTML = html;
}

/* ================= MENU ================= */
function toggleMenu() {
  const m = document.getElementById("menu");
  m.style.right = (m.style.right === "0px") ? "-250px" : "0px";
}

/* ================= DARK ================= */
function toggleDark() {
  document.body.classList.toggle("dark");
}