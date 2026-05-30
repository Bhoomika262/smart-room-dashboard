// paste your config here
const firebaseConfig = {
  apiKey: "AIzaSyB17WZ0At7da-f4aUajp2nJRUoMJIIv94k",
  authDomain: "smart-room-100e5.firebaseapp.com",
  databaseURL: "https://smart-room-100e5-default-rtdb.firebaseio.com",
  projectId: "smart-room-100e5",
  storageBucket: "smart-room-100e5.firebasestorage.app",
  messagingSenderId: "947555847929",
  appId: "1:947555847929:web:bbe1a05020e1c5ec579c28"
};

// init firebase
firebase.initializeApp(firebaseConfig);

const db = firebase.database();

// realtime read
db.ref("/room").on("value", (snapshot) => {
  const data = snapshot.val();

  document.getElementById("temp").innerText = data.temperature;
  document.getElementById("hum").innerText = data.humidity;
  document.getElementById("status").innerText = data.status;
});