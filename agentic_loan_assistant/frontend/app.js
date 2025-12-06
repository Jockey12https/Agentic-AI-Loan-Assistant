
// app.js - Simple demo using Web Speech API (STT) and calling the backend /master/chat
const startBtn = document.getElementById("startRec");
const stopBtn = document.getElementById("stopRec");
const log = document.getElementById("log");
const sendText = document.getElementById("sendText");
const textInput = document.getElementById("textInput");
const customerIdInput = document.getElementById("customerId");

let recognition;
if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
  log.innerHTML += "<div><em>Your browser does not support the Web Speech API.</em></div>";
} else {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    logMessage("user", transcript);
    sendMessageToBackend(transcript);
  };
  recognition.onerror = (e) => {
    log.innerHTML += "<div><strong>Error:</strong> " + e.error + "</div>";
  };
}

startBtn.addEventListener("click", () => {
  if (recognition) {
    recognition.start();
    startBtn.disabled = true;
    stopBtn.disabled = false;
  }
});
stopBtn.addEventListener("click", () => {
  if (recognition) {
    recognition.stop();
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
});

sendText.addEventListener("click", () => {
  const txt = textInput.value;
  if (txt.trim()) {
    logMessage("user", txt);
    sendMessageToBackend(txt);
    textInput.value = "";
  }
});

function logMessage(role, text) {
  const div = document.createElement("div");
  div.innerHTML = "<strong>" + role + ":</strong> " + text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

async function sendMessageToBackend(text) {
  const customerId = customerIdInput.value || "cust001";
  const payload = {
    customer_id: customerId,
    message: text
  };
  // ask for amount detection: naive check for numbers in text
  const m = text.match(/(\d+(\,\d{3})*(\.\d+)?)/);
  if (m) {
    payload.requested_amount = parseInt(m[0].replace(/,/g,''));
    payload.tenure_months = 60;
  }
  logMessage("system", "Sending to backend...");
  try {
    const res = await fetch("http://localhost:8000/master/chat", {
      method: "POST",
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errorText = await res.text();
      logMessage("error", `HTTP ${res.status}: ${res.statusText} - ${errorText}`);
      return;
    }
    const data = await res.json();
    data.messages.forEach(m => {
      logMessage(m.agent, m.text);
    });
  } catch (e) {
    logMessage("error", `Network error: ${e.toString()}`);
  }
}
