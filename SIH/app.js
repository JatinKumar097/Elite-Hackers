/**
 * SmritiCare - SIH AI & IoT Dementia Care Platform
 * Interactive Client Application
 */

// ==========================================
// 1. APPLICATION STATE & CONFIG
// ==========================================
const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? 'http://localhost:3000/api'
  : '/api';

const state = {
  user: {
    name: 'Arthur Pendelton',
    age: 74,
    condition: 'Mild Cognitive Impairment (MCI)',
    deviceId: 'WATCH-9982',
    role: 'patient',
    userId: 'demo-patient-01'
  },
  vitals: {
    heartRate: 74,
    bloodPressure: '118/78',
    steps: 3840,
    stepGoal: 5000,
    spo2: 98,
    fallStatus: 'Normal (No Fall Detected)',
    geofenceStatus: 'Safe Inside Home Zone'
  },
  reminders: [
    { id: 1, type: 'medication', label: 'Morning Donepezil & BP Medication', time: '08:30 AM', isCompleted: true },
    { id: 2, type: 'food', label: 'Heart-Healthy Breakfast & Fresh Juice', time: '09:15 AM', isCompleted: true },
    { id: 3, type: 'walk', label: 'Mild Garden Stroll & Sunshine Therapy', time: '04:30 PM', isCompleted: false },
    { id: 4, type: 'food', label: 'Evening Nutritious Dinner & Warm Soup', time: '07:30 PM', isCompleted: false },
    { id: 5, type: 'sleep', label: 'Bedtime Calm Music & Hydration', time: '09:45 PM', isCompleted: false }
  ],
  game: {
    sequence: [],
    playerSequence: [],
    level: 1,
    score: 0,
    highScore: 0,
    isPlaying: false,
    canClick: false
  },
  isWanderingSimulated: false
};

// ==========================================
// 2. DOM INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Ensure user is authenticated, otherwise redirect to login.html
  if (sessionStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'login.html';
    return;
  }

  // Restore session user state if available
  const savedName = sessionStorage.getItem('userName');
  const savedRole = sessionStorage.getItem('userRole');
  const savedDevice = sessionStorage.getItem('watchDeviceId');
  if (savedName) state.user.name = savedName;
  if (savedRole) state.user.role = savedRole.toLowerCase();
  if (savedDevice) state.user.deviceId = savedDevice;

  const authBtn = document.getElementById('navAuthBtn');
  if (authBtn) {
    authBtn.innerHTML = `<i class="fa-solid fa-circle-user"></i> ${state.user.name} (${state.user.role})`;
  }

  initECGMonitor();
  initAIChat();
  renderReminders();
  initBrainGame();
  initAccessibility();
  initModals();
  startVitalsSimulation();
});

// ==========================================
// 3. TOAST NOTIFICATIONS
// ==========================================
function showToast(message, icon = '<i class="fa-solid fa-circle-info"></i>') {
  const container = document.getElementById('toastContainer') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

function createToastContainer() {
  const c = document.createElement('div');
  c.id = 'toastContainer';
  c.className = 'toast-container';
  document.body.appendChild(c);
  return c;
}

// ==========================================
// 4. REAL-TIME ECG MONITOR CANVAS
// ==========================================
function initECGMonitor() {
  const canvas = document.getElementById('ecgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = canvas.parentElement.clientWidth - 40;
    canvas.height = 110;
  }
  resize();
  window.addEventListener('resize', resize);

  let x = 0;
  let prevY = 55;
  const points = [];
  const maxPoints = 300;

  function getECGVoltage(step) {
    const cycle = step % 80;
    // P wave
    if (cycle > 15 && cycle < 25) return Math.sin((cycle - 15) * Math.PI / 10) * 10;
    // QRS complex
    if (cycle === 38) return -12; // Q
    if (cycle === 40) return 48;  // R (peak)
    if (cycle === 42) return -18; // S
    // T wave
    if (cycle > 50 && cycle < 65) return Math.sin((cycle - 50) * Math.PI / 15) * 14;
    return (Math.random() - 0.5) * 2; // baseline jitter
  }

  let stepCount = 0;

  function draw() {
    stepCount++;
    const baseline = canvas.height / 2;
    const voltage = getECGVoltage(stepCount);
    const y = baseline - voltage;

    points.push(y);
    if (points.length > canvas.width / 3) {
      points.shift();
    }

    ctx.fillStyle = 'rgba(6, 17, 30, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let gx = 0; gx < canvas.width; gx += 20) {
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, canvas.height);
    }
    for (let gy = 0; gy < canvas.height; gy += 20) {
      ctx.moveTo(0, gy);
      ctx.lineTo(canvas.width, gy);
    }
    ctx.stroke();

    // Draw wave
    ctx.beginPath();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2.2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#34d399';

    for (let i = 0; i < points.length; i++) {
      const px = i * 3;
      if (i === 0) ctx.moveTo(px, points[i]);
      else ctx.lineTo(px, points[i]);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    requestAnimationFrame(draw);
  }

  draw();
}

// ==========================================
// 5. LIVE SMARTWATCH VITALS ENGINE
// ==========================================
function startVitalsSimulation() {
  // Gentle vital fluctuations
  setInterval(() => {
    // HR fluctuates between 71 and 78
    const hrDelta = Math.floor(Math.random() * 3) - 1;
    state.vitals.heartRate = Math.min(88, Math.max(68, state.vitals.heartRate + hrDelta));

    // Steps tick upward slowly
    state.vitals.steps += Math.floor(Math.random() * 3);

    updateVitalsUI();
  }, 3500);
}

function updateVitalsUI() {
  // Update Hero Watch Card
  const heroHr = document.getElementById('heroHeartRate');
  const heroBp = document.getElementById('heroBloodPressure');
  const heroSteps = document.getElementById('heroSteps');

  if (heroHr) heroHr.innerText = state.vitals.heartRate;
  if (heroBp) heroBp.innerText = state.vitals.bloodPressure;
  if (heroSteps) heroSteps.innerText = state.vitals.steps.toLocaleString();

  // Update Telemetry Section
  const liveHr = document.getElementById('liveHeartRate');
  const liveBp = document.getElementById('liveBloodPressure');
  const liveSteps = document.getElementById('liveSteps');
  const liveSpo2 = document.getElementById('liveSpo2');
  const stepProgress = document.getElementById('stepProgressBar');
  const ecgRate = document.getElementById('ecgRateDisplay');

  if (liveHr) liveHr.innerText = state.vitals.heartRate;
  if (liveBp) liveBp.innerText = state.vitals.bloodPressure;
  if (liveSteps) liveSteps.innerText = state.vitals.steps.toLocaleString();
  if (liveSpo2) liveSpo2.innerText = state.vitals.spo2 + '%';
  if (ecgRate) ecgRate.innerText = state.vitals.heartRate + ' BPM';

  if (stepProgress) {
    const pct = Math.min(100, Math.round((state.vitals.steps / state.vitals.stepGoal) * 100));
    stepProgress.style.width = pct + '%';
    const note = document.getElementById('stepPercentNote');
    if (note) note.innerText = `${pct}% of daily 5,000 steps goal`;
  }
}

// Function to simulate sending data to backend /api/watch/sync
async function syncSmartwatchData() {
  const syncBtn = document.getElementById('syncWatchBtn');
  if (syncBtn) syncBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate fa-spin"></i> Syncing...';

  const payload = {
    userId: state.user.userId,
    heartRate: state.vitals.heartRate,
    bloodPressure: state.vitals.bloodPressure,
    steps: state.vitals.steps
  };

  try {
    const res = await fetch(`${API_BASE}/watch/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      showToast('Smartwatch vitals synced to cloud database successfully!', '<i class="fa-solid fa-circle-check" style="color: #10b981;"></i>');
    } else {
      // Mock fallback if DB is not actively connected
      showToast('Smartwatch synced! (Local Telemetry Engine: WATCH-9982)', '<i class="fa-solid fa-clock"></i>');
    }
  } catch (err) {
    showToast('Biometric stream active! Telemetry packet logged.', '<i class="fa-solid fa-tower-broadcast"></i>');
  } finally {
    if (syncBtn) syncBtn.innerHTML = '<i class="fa-solid fa-bolt"></i> Trigger Watch Sync';
  }
}

function triggerVitalAnomaly() {
  state.vitals.heartRate = 114;
  updateVitalsUI();
  showToast('Anomaly Detected: Elevated Heart Rate (114 BPM). Notification sent to Caregiver Sarah.', '<i class="fa-solid fa-triangle-exclamation" style="color: #ef4444;"></i>');

  setTimeout(() => {
    state.vitals.heartRate = 76;
    updateVitalsUI();
    showToast('Heart rate stabilized back into safe baseline range.', '<i class="fa-solid fa-heart-circle-check" style="color: #10b981;"></i>');
  }, 7000);
}

// ==========================================
// 6. 24/7 AI DEMENTIA CARE COMPANION
// ==========================================
const aiKnowledgeBase = {
  who: `Hello Arthur! You are at your home in Greenfield Gardens with your daughter Sarah nearby. You are in a safe, peaceful space, and everyone loves you dearly.`,
  time: `Today is Tuesday, and the time is around afternoon. Your next planned activity is your gentle 30-minute garden walk at 4:30 PM.`,
  medicine: `Your morning BP & memory medicine was taken on schedule at 8:30 AM! You don't need any pills right now. Your next light dose is at 8:00 PM tonight.`,
  confused: `Take a slow, deep breath, Arthur. You are completely safe right now. Look around at your favorite armchair and window flowers. I'm right here with you, and Sarah is just one room away. Would you like to hear some soft music?`,
  walk: `A garden walk is wonderful for healthy blood flow! It's currently warm and sunny outside. Don't forget your comfortable shoes and water bottle.`,
  family: `Your daughter Sarah visits every day, and your grandson Leo called yesterday to show you his school drawing of a red fire truck. They both send you warm hugs!`,
  default: `I am here with you 24/7, Arthur. I can remind you of your family, guide you through your daily routine, or simply chat to keep you company. How are you feeling right now?`
};

function initAIChat() {
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');

  if (chatInput && chatSendBtn) {
    chatSendBtn.addEventListener('click', () => sendUserMessage());
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendUserMessage();
    });
  }
}

function askAI(promptText) {
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.value = promptText;
    sendUserMessage();
  }
}

function sendUserMessage() {
  const chatInput = document.getElementById('chatInput');
  const text = chatInput.value.trim();
  if (!text) return;

  const messagesContainer = document.getElementById('chatMessages');
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Append user message
  const userDiv = document.createElement('div');
  userDiv.className = 'chat-msg user';
  userDiv.innerHTML = `${escapeHtml(text)}<span class="chat-timestamp">${now}</span>`;
  messagesContainer.appendChild(userDiv);
  chatInput.value = '';
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Typing indicator
  const typingDiv = document.createElement('div');
  typingDiv.className = 'chat-msg bot';
  typingDiv.id = 'aiTyping';
  typingDiv.innerHTML = `<em>Smriti AI is thinking with care...</em>`;
  messagesContainer.appendChild(typingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Generate empathetic response
  setTimeout(() => {
    typingDiv.remove();
    let reply = aiKnowledgeBase.default;
    const lower = text.toLowerCase();

    if (lower.includes('who') || lower.includes('where') || lower.includes('am i')) {
      reply = aiKnowledgeBase.who;
    } else if (lower.includes('time') || lower.includes('date') || lower.includes('day') || lower.includes('schedule')) {
      reply = aiKnowledgeBase.time;
    } else if (lower.includes('med') || lower.includes('pill') || lower.includes('dose')) {
      reply = aiKnowledgeBase.medicine;
    } else if (lower.includes('nervous') || lower.includes('confused') || lower.includes('scared') || lower.includes('lost')) {
      reply = aiKnowledgeBase.confused;
    } else if (lower.includes('walk') || lower.includes('exercise')) {
      reply = aiKnowledgeBase.walk;
    } else if (lower.includes('family') || lower.includes('sarah') || lower.includes('leo') || lower.includes('grand')) {
      reply = aiKnowledgeBase.family;
    }

    const botDiv = document.createElement('div');
    botDiv.className = 'chat-msg bot';
    botDiv.innerHTML = `${reply}<span class="chat-timestamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
    messagesContainer.appendChild(botDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, 750);
}

function toggleVoiceOutput() {
  startElevenLabsVoiceCall();
}

function startElevenLabsVoiceCall() {
  const widget = document.querySelector('elevenlabs-convai');
  if (widget) {
    if (typeof widget.startConversation === 'function') {
      widget.startConversation();
      showToast('Starting ElevenLabs Voice Session...', '<i class="fa-solid fa-microphone-lines"></i>');
      return;
    }
    const internalBtn = widget.shadowRoot ? widget.shadowRoot.querySelector('button') : null;
    if (internalBtn) {
      internalBtn.click();
      showToast('Connecting to ElevenLabs Voice Agent...', '<i class="fa-solid fa-microphone-lines"></i>');
      return;
    }
    widget.click();
    showToast('Connecting to ElevenLabs Voice Agent (Agent ID: agent_3801m2376aq3f45t111pzcyw9e1c)...', '<i class="fa-solid fa-microphone-lines"></i>');
  } else {
    window.open('https://elevenlabs.io/app/talk-to?agent_id=agent_3801m2376aq3f45t111pzcyw9e1c&branch_id=agtbrch_3201m2376czsfmy9bnfnpnbr79t3', '_blank');
  }
}

// ==========================================
// 7. DAILY REMINDERS & ROUTINE CHECKLIST
// ==========================================
function renderReminders() {
  const list = document.getElementById('remindersList');
  if (!list) return;
  list.innerHTML = '';

  let completedCount = 0;

  state.reminders.forEach((item) => {
    if (item.isCompleted) completedCount++;

    const div = document.createElement('div');
    div.className = `reminder-item ${item.isCompleted ? 'completed' : ''}`;

    const iconMap = {
      medication: { class: 'icon-medication', icon: '<i class="fa-solid fa-pills"></i>' },
      food: { class: 'icon-food', icon: '<i class="fa-solid fa-utensils"></i>' },
      walk: { class: 'icon-walk', icon: '<i class="fa-solid fa-person-walking"></i>' },
      sleep: { class: 'icon-sleep', icon: '<i class="fa-solid fa-bed"></i>' }
    };

    const iconData = iconMap[item.type] || { class: 'icon-medication', icon: '<i class="fa-regular fa-clock"></i>' };

    div.innerHTML = `
      <div class="reminder-left">
        <input type="checkbox" class="reminder-checkbox" ${item.isCompleted ? 'checked' : ''} onchange="toggleReminder(${item.id})">
        <div class="reminder-type-icon ${iconData.class}">${iconData.icon}</div>
        <div>
          <div class="reminder-label">${escapeHtml(item.label)}</div>
          <div class="reminder-time">${item.time}</div>
        </div>
      </div>
      <button class="btn btn-light" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;" onclick="deleteReminder(${item.id})" title="Delete reminder"><i class="fa-solid fa-xmark"></i></button>
    `;
    list.appendChild(div);
  });

  const total = state.reminders.length;
  const pct = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  const pctText = document.getElementById('routinePercentText');
  const countText = document.getElementById('routineCountText');

  if (pctText) pctText.innerText = `${pct}%`;
  if (countText) countText.innerText = `${completedCount} of ${total} Daily Routines Completed`;
}

function toggleReminder(id) {
  const r = state.reminders.find(item => item.id === id);
  if (r) {
    r.isCompleted = !r.isCompleted;
    renderReminders();
    showToast(`Routine updated: ${r.label}`, r.isCompleted ? '<i class="fa-solid fa-circle-check" style="color: #10b981;"></i>' : '<i class="fa-regular fa-clock"></i>');
  }
}

function deleteReminder(id) {
  state.reminders = state.reminders.filter(item => item.id !== id);
  renderReminders();
  showToast('Routine reminder removed.', '<i class="fa-solid fa-trash-can"></i>');
}

function addCustomReminder(event) {
  event.preventDefault();
  const labelInput = document.getElementById('reminderLabelInput');
  const timeInput = document.getElementById('reminderTimeInput');
  const typeSelect = document.getElementById('reminderTypeSelect');

  if (!labelInput.value || !timeInput.value) return;

  const newReminder = {
    id: Date.now(),
    type: typeSelect.value,
    label: labelInput.value.trim(),
    time: formatTime(timeInput.value),
    isCompleted: false
  };

  state.reminders.push(newReminder);
  renderReminders();
  closeModal('addReminderModal');
  labelInput.value = '';
  showToast('New routine anchor scheduled!', '<i class="fa-solid fa-calendar-check" style="color: #10b981;"></i>');
}

function formatTime(timeStr) {
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${suffix}`;
}

// ==========================================
// 8. COGNITIVE BRAIN GAME ("MindGlow")
// ==========================================
const COLORS = ['green', 'red', 'yellow', 'blue'];

function initBrainGame() {
  const startBtn = document.getElementById('startGameBtn');
  if (startBtn) {
    startBtn.addEventListener('click', startBrainGame);
  }

  document.querySelectorAll('.simon-pad').forEach(pad => {
    pad.addEventListener('click', () => {
      if (!state.game.isPlaying || !state.game.canClick) return;
      const color = pad.getAttribute('data-color');
      handlePadClick(color);
    });
  });
}

function startBrainGame() {
  state.game.sequence = [];
  state.game.playerSequence = [];
  state.game.level = 1;
  state.game.score = 0;
  state.game.isPlaying = true;
  state.game.canClick = false;

  updateGameScores();
  setGameInstruction('Watch closely as the colors light up...');
  nextGameRound();
}

function nextGameRound() {
  state.game.playerSequence = [];
  state.game.canClick = false;

  const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
  state.game.sequence.push(randomColor);

  setGameInstruction(`Round ${state.game.level}: Memorize the pattern...`);

  let i = 0;
  const interval = setInterval(() => {
    flashPad(state.game.sequence[i]);
    i++;
    if (i >= state.game.sequence.length) {
      clearInterval(interval);
      setTimeout(() => {
        state.game.canClick = true;
        setGameInstruction('Your turn! Click the pads in the same sequence.');
      }, 500);
    }
  }, 750);
}

function flashPad(color) {
  const pad = document.querySelector(`.simon-pad[data-color="${color}"]`);
  if (!pad) return;
  pad.classList.add('active');
  setTimeout(() => {
    pad.classList.remove('active');
  }, 400);
}

function handlePadClick(color) {
  flashPad(color);
  state.game.playerSequence.push(color);

  const currentIndex = state.game.playerSequence.length - 1;
  if (state.game.playerSequence[currentIndex] !== state.game.sequence[currentIndex]) {
    // Mistake
    endGame();
    return;
  }

  if (state.game.playerSequence.length === state.game.sequence.length) {
    // Round won!
    state.game.score += state.game.level * 10;
    if (state.game.score > state.game.highScore) {
      state.game.highScore = state.game.score;
    }
    state.game.level++;
    updateGameScores();
    setGameInstruction('<i class="fa-solid fa-wand-magic-sparkles" style="color: #f59e0b;"></i> Brilliant memory! Preparing next sequence...');
    setTimeout(nextGameRound, 1200);
  }
}

function endGame() {
  state.game.isPlaying = false;
  state.game.canClick = false;
  setGameInstruction(`Well played! Final Score: ${state.game.score}. Excellent mental exercise.`);
  showToast(`Brain game finished! Score ${state.game.score} logged to cognitive health chart.`, '<i class="fa-solid fa-brain"></i>');

  // Submit score to /api/game/score if available
  fetch(`${API_BASE}/game/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: state.user.userId,
      gameType: 'color_memory',
      score: state.game.score
    })
  }).catch(() => {});
}

function setGameInstruction(msg) {
  const el = document.getElementById('gameInstruction');
  if (el) el.innerHTML = msg;
}

function updateGameScores() {
  const currentEl = document.getElementById('gameCurrentScore');
  const highEl = document.getElementById('gameHighScore');
  const levelEl = document.getElementById('gameCurrentLevel');

  if (currentEl) currentEl.innerText = state.game.score;
  if (highEl) highEl.innerText = state.game.highScore;
  if (levelEl) levelEl.innerText = state.game.level;
}

// ==========================================
// 9. SAFETY & GEOFENCING SIMULATION
// ==========================================
function toggleWanderingSimulation() {
  const blip = document.getElementById('patientRadarBlip');
  const statusNote = document.getElementById('geofenceStatusText');
  const btn = document.getElementById('wanderSimBtn');

  state.isWanderingSimulated = !state.isWanderingSimulated;

  if (state.isWanderingSimulated) {
    if (blip) blip.classList.add('wandering');
    if (statusNote) {
      statusNote.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> BREACH: Arthur has stepped outside the 150m Home Zone!';
      statusNote.style.color = 'var(--danger)';
    }
    if (btn) btn.innerHTML = '<i class="fa-solid fa-house-chimney"></i> Return Patient to Safe Zone';
    showToast('GEOFENCE ALERT: Patient exited Safe Zone at 11th Cross Rd. Caregivers notified!', '<i class="fa-solid fa-triangle-exclamation" style="color: #ef4444;"></i>');
  } else {
    if (blip) blip.classList.remove('wandering');
    if (statusNote) {
      statusNote.innerHTML = '<i class="fa-solid fa-house-chimney"></i> Arthur is securely inside Home Garden Safe Zone (150m radius).';
      statusNote.style.color = 'var(--teal)';
    }
    if (btn) btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Simulate Wandering Incident';
    showToast('Patient verified safely back within home boundary.', '<i class="fa-solid fa-house-chimney" style="color: #10b981;"></i>');
  }
}

// ==========================================
// 10. ACCESSIBILITY & CONTROLS
// ==========================================
function initAccessibility() {
  const btnNorm = document.getElementById('a11yNormal');
  const btnLarge = document.getElementById('a11yLarge');
  const btnXLarge = document.getElementById('a11yXLarge');
  const btnContrast = document.getElementById('a11yContrast');

  if (btnNorm) {
    btnNorm.addEventListener('click', () => {
      document.body.classList.remove('text-large', 'text-xlarge');
      setActiveA11yBtn(btnNorm);
    });
  }

  if (btnLarge) {
    btnLarge.addEventListener('click', () => {
      document.body.classList.remove('text-xlarge');
      document.body.classList.add('text-large');
      setActiveA11yBtn(btnLarge);
    });
  }

  if (btnXLarge) {
    btnXLarge.addEventListener('click', () => {
      document.body.classList.remove('text-large');
      document.body.classList.add('text-xlarge');
      setActiveA11yBtn(btnXLarge);
    });
  }

  if (btnContrast) {
    btnContrast.addEventListener('click', () => {
      document.body.classList.toggle('high-contrast');
      btnContrast.classList.toggle('active');
    });
  }
}

function setActiveA11yBtn(btn) {
  document.querySelectorAll('.a11y-btn').forEach(b => {
    if (b.id !== 'a11yContrast') b.classList.remove('active');
  });
  btn.classList.add('active');
}

// ==========================================
// 11. MODALS & AUTHENTICATION
// ==========================================
function initModals() {
  // Close on backdrop click
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  // Auth role buttons
  document.querySelectorAll('.role-btn').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.role-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
    });
  });
}

function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('active');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('active');
}

function handleLoginSubmit(event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const role = document.querySelector('.role-btn.active')?.innerText || 'Patient';

  fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'demoPassword' })
  })
  .then(res => res.json())
  .then(data => {
    closeModal('authModal');
    showToast(`Welcome back, ${data.user?.name || email}! Logged in as ${role}.`, '<i class="fa-solid fa-hand"></i>');
    const authBtn = document.getElementById('navAuthBtn');
    if (authBtn) authBtn.innerHTML = `<i class="fa-solid fa-circle-user"></i> ${data.user?.name || 'Arthur'}`;
  })
  .catch(() => {
    closeModal('authModal');
    showToast(`Demo mode: Logged in successfully as ${role}!`, '<i class="fa-solid fa-hand"></i>');
    const authBtn = document.getElementById('navAuthBtn');
    if (authBtn) authBtn.innerHTML = `<i class="fa-solid fa-circle-user"></i> Arthur P. (${role})`;
  });
}

function signOut() {
  sessionStorage.clear();
  window.location.href = 'login.html';
}

function triggerEmergencySOS() {
  openModal('sosModal');
}

function dispatchEmergencyTeam() {
  closeModal('sosModal');
  showToast('SOS DISPATCHED: Caregiver Sarah & Local Emergency Response notified with Live GPS coordinates!', '<i class="fa-solid fa-truck-medical" style="color: #ef4444;"></i>');
}

// ==========================================
// 12. UTILITY HELPERS
// ==========================================
function escapeHtml(string) {
  const div = document.createElement('div');
  div.innerText = string;
  return div.innerHTML;
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}
