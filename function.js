// Cập nhật thời gian thực
function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    document.getElementById("clock").textContent = timeStr;
}
setInterval(updateClock, 1000);
updateClock();

// Trạng thái thiết bị
let deviceStates = {
    light: false,
    filter: false
};

let timers = {
    light: null,
    filter: null
};

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCoocpmI0JHnGrK7cHrRGuHN28OT3s6_fk",
  authDomain: "hoca-20466.firebaseapp.com",
  databaseURL: "https://hoca-20466-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hoca-20466",
  storageBucket: "hoca-20466.firebasestorage.app",
  messagingSenderId: "302860032635",
  appId: "1:302860032635:web:5a1157b7c293c4c2b620de",
  measurementId: "G-DC5H8RC3T8"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Cập nhật cảm biến từ Firebase
function listenToSensorUpdates() {
    db.ref("sensor_data/temperature").on("value", snapshot => {
        document.getElementById("tempSensor").textContent = snapshot.val() + " °C";
    });
    db.ref("sensor_data/humidity").on("value", snapshot => {
        document.getElementById("humiditySensor").textContent = snapshot.val() + " %";
    });
    db.ref("sensor_data/waterTemperature").on("value", snapshot => {
        document.getElementById("waterTempSensor").textContent = snapshot.val() + " °C";
    });
    // Nếu bạn muốn hiển thị waterDetected như water level:
    db.ref("sensor_data/waterDetected").on("value", snapshot => {
        document.getElementById("waterLevel").textContent = snapshot.val() ? "Có nước" : "Không có nước";
    });
}


listenToSensorUpdates();

function toggleDevice(device, status) {
    if (device === 'light') {
        const lightImg = document.getElementById('lightImg');
        lightImg.src = status ? 'led-light _git.gif' : 'led-light_anh.png';
        document.getElementById('lightTimerStatus').textContent = status ? 'Đèn đang bật' : 'Đèn đang tắt';
        db.ref("relay1").set(status ? 1 : 0);
    } else if (device === 'filter') {
        const filterImg = document.getElementById('filterImg');
        filterImg.src = status ? 'water-filter_anh.png' : 'anh2.png';
        document.getElementById('filterTimerStatus').textContent = status ? 'Máy lọc đang bật' : 'Máy lọc đang tắt';
        db.ref("relay2").set(status ? 1 : 0);
    }
}

// Theo dõi thay đổi relay từ Firebase
function listenToRelayUpdates() {
    db.ref("relay1").on("value", snapshot => {
        const status = snapshot.val() === 1;
        toggleDevice('light', status);
    });
    db.ref("relay2").on("value", snapshot => {
        const status = snapshot.val() === 1;
        toggleDevice('filter', status);
    });
}

listenToRelayUpdates();

function setTimer(device) {
    const input = document.getElementById(`${device}Timer`);
    const statusDisplay = document.getElementById(`${device}TimerStatus`);
    const time = input.value;

    if (!time) {
        alert("Vui lòng chọn thời gian.");
        return;
    }

    const now = new Date();
    const [hours, minutes] = time.split(":").map(Number);
    const target = new Date(now);
    target.setHours(hours, minutes, 0, 0);

    if (target <= now) {
        target.setDate(target.getDate() + 1);
    }

    const delay = target.getTime() - now.getTime();
    if (timers[device]) clearTimeout(timers[device]);

    timers[device] = setTimeout(() => {
        toggleDevice(device, true);
        statusDisplay.textContent = "Thiết bị đã bật tự động!";
    }, delay);

    statusDisplay.textContent = `Sẽ bật lúc: ${target.toLocaleTimeString()}`;
}

// Đồng hồ số
function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    const clockElement = document.getElementById("clock");
    if (clockElement) {
        clockElement.textContent = timeStr;
    }
}
setInterval(updateClock, 1000);

// Vẽ đồng hồ analog
function drawAnalogClock() {
    const canvas = document.getElementById("analogClock");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const radius = canvas.height / 2;
    ctx.translate(radius, radius);

    setInterval(() => {
        drawClock(ctx, radius);
    }, 1000);
}

function drawClock(ctx, radius) {
    ctx.clearRect(-radius, -radius, radius * 2, radius * 2);
    drawFace(ctx, radius);
    drawNumbers(ctx, radius);
    drawTime(ctx, radius);
}

function drawFace(ctx, radius) {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();

    ctx.strokeStyle = '#333';
    ctx.lineWidth = radius * 0.05;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.1, 0, 2 * Math.PI);
    ctx.fillStyle = '#333';
    ctx.fill();
}

function drawNumbers(ctx, radius) {
    ctx.font = radius * 0.15 + "px arial";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    for (let num = 1; num <= 12; num++) {
        const ang = num * Math.PI / 6;
        ctx.rotate(ang);
        ctx.translate(0, -radius * 0.85);
        ctx.rotate(-ang);
        ctx.fillText(num.toString(), 0, 0);
        ctx.rotate(ang);
        ctx.translate(0, radius * 0.85);
        ctx.rotate(-ang);
    }
}

function drawTime(ctx, radius) {
    const now = new Date();
    let hour = now.getHours();
    let minute = now.getMinutes();
    let second = now.getSeconds();

    hour %= 12;
    hour = (hour * Math.PI / 6) +
           (minute * Math.PI / (6 * 60)) +
           (second * Math.PI / (360 * 60));
    drawHand(ctx, hour, radius * 0.5, radius * 0.07);

    minute = (minute * Math.PI / 30) + (second * Math.PI / (30 * 60));
    drawHand(ctx, minute, radius * 0.8, radius * 0.07);

    second = (second * Math.PI / 30);
    drawHand(ctx, second, radius * 0.9, radius * 0.02, "red");
}

function drawHand(ctx, pos, length, width, color = "#333") {
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.moveTo(0, 0);
    ctx.rotate(pos);
    ctx.lineTo(0, -length);
    ctx.stroke();
    ctx.rotate(-pos);
}

window.onload = () => {
    updateClock();
    drawAnalogClock();
};