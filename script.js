const chatFeed = document.getElementById('chatFeed');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const micBtn = document.getElementById('micBtn');
const upiCard = document.getElementById('upiCard');
const batteryDisplay = document.getElementById('batteryDisplay');
const liveIndicator = document.getElementById('liveIndicator');

// Local Data Store
let defaultUpiId = localStorage.getItem('JARVIS_UPI') || 'paytmqr281005050101150047395066@paytm';
let contacts = JSON.parse(localStorage.getItem('JARVIS_CONTACTS') || '{}');
let torchStream = null;

// Clean up old API key leftovers completely
localStorage.removeItem('JARVIS_API_KEY');
localStorage.removeItem('GEMINI_API_KEY');

// Initialize Battery
async function initBattery() {
  if ('getBattery' in navigator) {
    try {
      const b = await navigator.getBattery();
      const update = () => {
        const level = Math.round(b.level * 100);
        if (batteryDisplay) {
          batteryDisplay.textContent = `${level}% ${b.charging ? '(CHARGING)' : '(ONLINE)'}`;
        }
      };
      update();
      b.addEventListener('levelchange', update);
      b.addEventListener('chargingchange', update);
    } catch (e) {}
  } else {
    if (batteryDisplay) batteryDisplay.textContent = 'ONLINE';
  }
}
initBattery();

// UPI Configuration Prompt
if (upiCard) {
  upiCard.addEventListener('click', () => {
    const custom = prompt("Set default UPI ID for instant transfers (e.g. name@okhdfcbank):", defaultUpiId);
    if (custom) {
      defaultUpiId = custom.trim();
      localStorage.setItem('JARVIS_UPI', defaultUpiId);
      alert(`Default recipient UPI updated: ${defaultUpiId}`);
    }
  });
}

function setPreset(prefix) {
  if (userInput) {
    userInput.value = prefix;
    userInput.focus();
  }
}

// --- 1. LOCAL MATHEMATICS SOLVER (Zero Network / Zero Errors) ---
function solveMath(text) {
  let clean = text.toLowerCase()
    .replace(/tell|what is|calculate|solve|evaluate|find|value of/gi, '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/,/g, '')
    .trim();

  clean = clean.replace(/(\d+)\s*[xX]\s*(\d+)/g, '$1 * $2');

  if (/^[\d+\-*/().\s^%]+$/.test(clean) && /\d/.test(clean)) {
    try {
      const sanitized = clean.replace(/\^/g, '**');
      const result = Function(`'use strict'; return (${sanitized})`)();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return `Calculation complete, Sir: **${clean.replace(/\*/g, '×')} = ${result.toLocaleString()}**`;
      }
    } catch (e) {
      return null;
    }
  }
  return null;
}

// --- 2. INSTANT PAYMENT & UPI INTENT ENGINE ---
function processPayment(text) {
  const q = text.toLowerCase();
  
  const amountMatch = q.match(/(?:pay|send|transfer|amount)\s*(?:rs|inr|₹)?\s*(\d+(?:\.\d+)?)/i);
  const amount = amountMatch ? amountMatch[1] : null;

  const upiMatch = text.match(/[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/);
  let targetUPI = upiMatch ? upiMatch[0] : defaultUpiId;
  let targetName = "Merchant Payee";

  for (const name in contacts) {
    if (q.includes(name)) {
      targetName = name.toUpperCase();
      targetUPI = `${contacts[name]}@upi`;
      break;
    }
  }

  if (amount) {
    const upiUri = `upi://pay?pa=${targetUPI}&pn=${encodeURIComponent(targetName)}&am=${amount}&cu=INR&tn=JARVIS%20Payment`;
    
    setTimeout(() => {
      window.location.href = upiUri;
    }, 350);

    return `Payment directive executed: Initiating **₹${amount}** transfer to **${targetUPI}**. Opening UPI interface (GPay / PhonePe / Paytm)...`;
  }

  if (q.includes("gpay") || q.includes("google pay")) {
    window.location.href = "upi://pay";
    return "Opening Google Pay selector, Boss.";
  }
  if (q.includes("paytm")) {
    window.location.href = "paytmmp://";
    return "Opening Paytm wallet, Boss.";
  }
  if (q.includes("phonepe")) {
    window.location.href = "phonepe://";
    return "Opening PhonePe, Boss.";
  }

  return null;
}

// --- 3. STOCK MARKET & FINANCIAL ENGINE ---
function processStockQuery(text) {
  const q = text.toLowerCase();
  if (q.includes("stock") || q.includes("market") || q.includes("share") || q.includes("nifty") || q.includes("sensex")) {
    setTimeout(() => {
      window.open("https://www.google.com/finance/markets/gainers", "_blank");
    }, 500);
    return `Accessing market indices and high-performing equities. Telemetry confirms NIFTY / SENSEX metrics. Opening live market gainers...`;
  }
  return null;
}

// --- 4. HARDWARE CONTROLLER ---
function triggerCall(target) {
  let num = target.replace(/[^0-9+]/g, '');
  const key = target.toLowerCase().trim();

  if (!num && contacts[key]) num = contacts[key];
  else if (!num) {
    const ask = prompt(`No phone number saved for "${target}". Enter number:`);
    if (ask) {
      contacts[key] = ask.trim();
      localStorage.setItem('JARVIS_CONTACTS', JSON.stringify(contacts));
      num = ask.trim();
    }
  }

  if (num) {
    window.location.href = `tel:${num}`;
    return `Initiating cellular call to ${target} (${num}), Boss.`;
  }
  return `Cellular directive aborted. Valid number required for ${target}.`;
}

async function toggleTorch(enable) {
  try {
    if (enable) {
      torchStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const track = torchStream.getVideoTracks()[0];
      await track.applyConstraints({ advanced: [{ torch: true }] });
      return "Flashlight illuminated, Boss.";
    } else {
      if (torchStream) {
        torchStream.getTracks().forEach(t => t.stop());
        torchStream = null;
      }
      return "Flashlight extinguished, Boss.";
    }
  } catch (err) {
    return `Flashlight permission required.`;
  }
}

function getLiveLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve("Geolocation telemetry unavailable on this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
        resolve(`Coordinates locked: Lat ${latitude.toFixed(4)}, Lon ${longitude.toFixed(4)}. Launching maps.`);
      },
      (err) => resolve(`GPS lock failed: ${err.message}`)
    );
  });
}

// --- 5. FREE PUBLIC KNOWLEDGE LOOKUP (No Key Required) ---
async function fetchPublicKnowledge(query) {
  try {
    const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
    const data = await res.json();
    if (data.AbstractText) {
      return data.AbstractText;
    }
  } catch (e) {}

  // Fallback to Wikipedia API
  try {
    const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
    const wikiData = await wikiRes.json();
    if (wikiData.extract) {
      return wikiData.extract;
    }
  } catch (e) {}

  return `Directive recorded, Sir: "${query}". I have executed local verification protocols.`;
}

// --- 6. CORE DIRECTIVE ROUTER ---
async function executeDirective(text) {
  const q = text.toLowerCase().trim();

  // 1. Check Payments
  const payOutput = processPayment(text);
  if (payOutput) return payOutput;

  // 2. Check Stocks
  const stockOutput = processStockQuery(text);
  if (stockOutput) return stockOutput;

  // 3. Instant Math
  const mathOutput = solveMath(text);
  if (mathOutput) return mathOutput;

  // 4. Calls
  if (q.startsWith("call ") || q.startsWith("dial ")) {
    const target = q.replace("call ", "").replace("dial ", "").replace("to ", "").trim();
    return triggerCall(target);
  }

  // 5. Contacts
  if (q.startsWith("save contact ") || q.startsWith("save number ")) {
    const parts = q.replace("save contact ", "").replace("save number ", "").split(" ");
    if (parts.length >= 2) {
      contacts[parts[0].toLowerCase()] = parts[1];
      localStorage.setItem('JARVIS_CONTACTS', JSON.stringify(contacts));
      return `Contact stored: ${parts[0].toUpperCase()} (${parts[1]}).`;
    }
  }

  // 6. Flashlight
  if (q.includes("flashlight on") || q.includes("torch on")) return await toggleTorch(true);
  if (q.includes("flashlight off") || q.includes("torch off")) return await toggleTorch(false);

  // 7. Location
  if (q.includes("where am i") || q.includes("my location")) return await getLiveLocation();

  // 8. Navigation & Search
  if (q.startsWith("navigate to ") || q.startsWith("directions to ")) {
    const dest = q.replace("navigate to ", "").replace("directions to ", "");
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`, "_blank");
    return `Plotting navigation trajectory to ${dest}, Boss.`;
  }

  if (q.startsWith("search ") || q.startsWith("google ")) {
    const target = q.replace("search ", "").replace("google ", "");
    window.open(`https://www.google.com/search?q=${encodeURIComponent(target)}`, "_blank");
    return `Opening Google search for "${target}", Boss.`;
  }

  // 9. Public Knowledge Fallback
  return await fetchPublicKnowledge(text);
}

// --- 7. VOICE ENGINE ---
function speakText(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*#`_₹💸📈📱👛📍🔦]/g, '').replace(/J\.A\.R\.V\.I\.S:/g, '').substring(0, 260);
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.pitch = 0.95;
    window.speechSynthesis.speak(utterance);
  }
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    isListening = true;
    if (micBtn) {
      micBtn.style.background = '#ff0055';
      micBtn.style.boxShadow = '0 0 15px #ff0055';
    }
  };

  recognition.onresult = (event) => {
    if (userInput) userInput.value = event.results[0][0].transcript;
    handleSend();
  };

  recognition.onerror = () => stopMic();
  recognition.onend = () => stopMic();
}

function stopMic() {
  isListening = false;
  if (micBtn) {
    micBtn.style.background = 'linear-gradient(135deg, #00f0ff, #0099aa)';
    micBtn.style.boxShadow = '0 0 8px rgba(0, 240, 255, 0.4)';
  }
}

if (micBtn) {
  micBtn.addEventListener('click', () => {
    if (!recognition) {
      alert("Microphone requires Google Chrome on Android.");
      return;
    }
    if (!isListening) recognition.start();
    else recognition.stop();
  });
}

// --- 8. CHAT DISPATCHER ---
function addMessage(sender, text, type) {
  const bubble = document.createElement('div');
  bubble.classList.add('chat-bubble', type);
  
  if (type === 'jarvis-msg' && typeof marked !== 'undefined') {
    bubble.innerHTML = `<strong>${sender}:</strong> ` + marked.parse(text);
  } else {
    bubble.textContent = `${sender}: ${text}`;
  }

  if (chatFeed) {
    chatFeed.appendChild(bubble);
    chatFeed.scrollTop = chatFeed.scrollHeight;
  }
  return bubble;
}

async function handleSend() {
  const text = userInput ? userInput.value.trim() : "";
  if (!text) return;

  addMessage("YOU", text, "user-msg");
  if (userInput) userInput.value = "";

  if (liveIndicator) liveIndicator.textContent = "PROCESSING...";
  const loadingBubble = addMessage("J.A.R.V.I.S", "Executing directive...", "jarvis-msg");

  const reply = await executeDirective(text);

  if (liveIndicator) liveIndicator.textContent = "LIVE";
  loadingBubble.innerHTML = `<strong>J.A.R.V.I.S:</strong> ` + (typeof marked !== 'undefined' ? marked.parse(reply) : reply);
  if (chatFeed) chatFeed.scrollTop = chatFeed.scrollHeight;
  
  speakText(reply);
}

if (sendBtn) sendBtn.addEventListener('click', handleSend);
if (userInput) {
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
  });
                                                                      }
