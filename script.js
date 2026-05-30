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

db.ref("/room").on("value", (snapshot) => {
  const data = snapshot.val();

  if (!data) {
    console.log("No data found in /room");
    return;
  }

  document.getElementById("temp").innerText = data.temperature ?? "--";
  document.getElementById("hum").innerText = data.humidity ?? "--";
  document.getElementById("status").innerText = data.status ?? "--";
});