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

// 📊 Chart setup
let chart;

window.onload = function () {
  const ctx = document.getElementById("chart").getContext("2d");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Temperature (°C)",
        data: [],
        borderColor: "blue",
        fill: false,
        tension: 0.3
      }]
    }
  });
};

// 🔁 Real-time Firebase listener
db.ref("/room").on("value", (snapshot) => {
  const data = snapshot.val();

  if (!data) return;

  const temp = data.temperature ?? 0;
  const hum = data.humidity ?? 0;
  const status = data.status ?? "--";

  // UI update
  document.getElementById("temp").innerText = temp;
  document.getElementById("hum").innerText = hum;
  document.getElementById("status").innerText = status;

  // 🔔 ALERT SYSTEM
  const alertBox = document.getElementById("alert");

  if (temp > 35) {
    alertBox.innerText = "🔥 TOO HOT!";
    alertBox.style.background = "red";
    alertBox.style.color = "white";
  } 
  else if (temp < 15) {
    alertBox.innerText = "❄ TOO COLD!";
    alertBox.style.background = "blue";
    alertBox.style.color = "white";
  } 
  else {
    alertBox.innerText = "✅ NORMAL";
    alertBox.style.background = "green";
    alertBox.style.color = "white";
  }

  // 📈 update chart
  const time = new Date().toLocaleTimeString();

  if (chart) {
    chart.data.labels.push(time);
    chart.data.datasets[0].data.push(temp);

    // keep only last 10 points
    if (chart.data.labels.length > 10) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }

    chart.update();
  }
});

// 🌙 Dark mode
function toggleDark() {
  document.body.classList.toggle("dark");
}