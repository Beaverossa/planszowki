import { db } from './firebase-config.js';
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const urlParams = new URLSearchParams(window.location.search);
const gameId = urlParams.get('gameId');
const gameRef = doc(db, "games", gameId);

const gameTitle = document.getElementById("game-title");
const addSessionBtn = document.getElementById("add-session-btn");
const addSessionForm = document.getElementById("add-session-form");
const playersCountInput = document.getElementById("players-count");
const playersFieldsDiv = document.getElementById("players-fields");
const notesInput = document.getElementById("session-notes");
const cancelSessionBtn = document.getElementById("cancel-session");
const rankingTable = document.querySelector("#ranking-table tbody");
const historyList = document.getElementById("history-list");
const scoreChartCanvas = document.getElementById("score-chart");

let currentGameData = null;
let playerColors = {};

const getRandomColor = () => {
  const palette = [
    "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231",
    "#911eb4", "#46f0f0", "#f032e6", "#bcf60c", "#fabebe",
    "#008080", "#e6beff", "#9a6324", "#fffac8", "#800000",
    "#aaffc3", "#808000", "#ffd8b1", "#000075", "#808080"
  ];
  return palette[Math.floor(Math.random() * palette.length)];
};

async function loadGame() {
  const snap = await getDoc(gameRef);
  if (!snap.exists()) {
    gameTitle.textContent = "Gra nie znaleziona";
    return;
  }
  currentGameData = snap.data();
  playerColors = currentGameData.playerColors || {};
  gameTitle.textContent = `Gra: ${currentGameData.name}`;
  renderRankingAndHistory();
}

async function renderRankingAndHistory() {
  const snap = await getDoc(gameRef);
  if (!snap.exists()) return;
  const data = snap.data();
  const sessions = data.sessions || {};
  playerColors = data.playerColors || {};

  // Ranking: suma punktów gracza po imieniu
  const scoresSum = {};
  const history = [];
  Object.entries(sessions).forEach(([sessionId, session]) => {
    history.push({ id: sessionId, date: session.date, scores: session.scores, notes: session.notes || "" });
    Object.entries(session.scores).forEach(([player, points]) => {
      scoresSum[player] = (scoresSum[player] || 0) + points;
    });
  });

  // Render ranking
  rankingTable.innerHTML = '';
  Object.entries(scoresSum)
    .sort(([,a],[,b])=>b-a)
    .forEach(([player, sum]) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${player}</td><td>${sum}</td>`;
      rankingTable.appendChild(tr);
    });

  // Render historia
  historyList.innerHTML = '';
  history.forEach((entry, idx) => {
    const div = document.createElement('div');
    div.className = 'history-card';
    div.innerHTML = `<strong>Rozgrywka ${idx+1} (${entry.date}):</strong><ul>`
      + Object.entries(entry.scores).map(([p, pts]) => `<li>${p}: ${pts} pkt</li>`).join('')
      + `</ul>`;

    // Uwagi (notes)
    if (typeof entry.notes === "string" && entry.notes.length > 0) {
      const notesDiv = document.createElement('div');
      notesDiv.className = 'notes-box';
      let expanded = false;

      function renderNotes() {
        notesDiv.innerHTML = '';
        const notesText = expanded || entry.notes.length <= 200
          ? entry.notes
          : entry.notes.slice(0, 200) + '...';
        const notesContent = document.createElement('span');
        notesContent.textContent = notesText;
        notesDiv.appendChild(notesContent);

        // Show more/less
        if (entry.notes.length > 200) {
          const showMoreBtn = document.createElement('button');
          showMoreBtn.className = 'show-more-btn';
          showMoreBtn.textContent = expanded ? "Pokaż mniej" : "Pokaż więcej";
          showMoreBtn.addEventListener('click', () => {
            expanded = !expanded;
            renderNotes();
          });
          notesDiv.appendChild(showMoreBtn);
        }
        // Edycja i usuwanie
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'notes-actions';

        // Edycja
        const editBtn = document.createElement('button');
        editBtn.className = 'notes-btn';
        editBtn.textContent = "Edytuj uwagi";
        editBtn.addEventListener('click', () => {
          renderEditArea();
        });
        actionsDiv.appendChild(editBtn);

        // Usuwanie
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'notes-btn';
        deleteBtn.style.background = 'var(--danger)';
        deleteBtn.style.color = '#fff';
        deleteBtn.textContent = "Usuń uwagi";
        deleteBtn.addEventListener('click', async () => {
          if (confirm("Czy na pewno usunąć uwagi?")) {
            await removeNotes(entry.id);
          }
        });
        actionsDiv.appendChild(deleteBtn);

        notesDiv.appendChild(actionsDiv);
      }

      function renderEditArea() {
        notesDiv.innerHTML = '';
        const textarea = document.createElement('textarea');
        textarea.className = 'notes-edit-area';
        textarea.value = entry.notes;
        notesDiv.appendChild(textarea);

        const saveBtn = document.createElement('button');
        saveBtn.className = 'notes-btn';
        saveBtn.textContent = "Zapisz";
        saveBtn.addEventListener('click', async () => {
          await updateNotes(entry.id, textarea.value);
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'notes-btn';
        cancelBtn.style.background = 'var(--accent)';
        cancelBtn.style.color = '#222';
        cancelBtn.textContent = "Anuluj";
        cancelBtn.addEventListener('click', () => {
          renderNotes();
        });

        notesDiv.appendChild(saveBtn);
        notesDiv.appendChild(cancelBtn);
      }

      renderNotes();
      div.appendChild(notesDiv);
    } else {
      // Dodaj przycisk dodania uwag jeśli nie istnieją
      const addNotesBtn = document.createElement('button');
      addNotesBtn.className = 'notes-btn';
      addNotesBtn.textContent = "Dodaj uwagi";
      addNotesBtn.addEventListener('click', () => {
        renderAddNotesArea(entry.id, div);
      });
      div.appendChild(addNotesBtn);
    }
    historyList.appendChild(div);
  });

  // Render wykres
  renderChart(history);
}

// Dodawanie rozgrywki
addSessionBtn.addEventListener('click', () => {
  addSessionForm.style.display = 'flex';
  addSessionBtn.style.display = 'none';
  playersFieldsDiv.innerHTML = '';
  playersCountInput.value = '';
  notesInput.value = '';
});

playersCountInput.addEventListener('input', () => {
  const n = parseInt(playersCountInput.value) || 0;
  playersFieldsDiv.innerHTML = '';
  for(let i=0;i<n;i++) {
    playersFieldsDiv.innerHTML += `
      <label>Gracz ${i+1} <input type="text" class="player-name" placeholder="Imię gracza" required></label>
      <label>Punkty <input type="number" class="player-score" min="0" required></label>
    `;
  }
});

cancelSessionBtn.addEventListener('click', () => {
  addSessionForm.style.display = 'none';
  addSessionBtn.style.display = '';
  playersFieldsDiv.innerHTML = '';
  notesInput.value = '';
  playersCountInput.value = '';
});

addSessionForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const names = Array.from(addSessionForm.querySelectorAll('.player-name')).map(i=>i.value.trim()).filter(Boolean);
  const scores = Array.from(addSessionForm.querySelectorAll('.player-score')).map(i=>parseInt(i.value));
  const notesText = notesInput.value.trim();
  if (names.length !== scores.length || names.length<2) return;
  const sessionId = `${Date.now()}`;
  const date = new Date().toISOString().slice(0,10);
  const sessionData = { date, scores: {}, notes: notesText };
  names.forEach((name, idx) => {
    sessionData.scores[name]=scores[idx];
    if (!playerColors[name]) {
      playerColors[name] = getRandomColor();
    }
  });

  // Zapisz do Firebase, z uwagami
  const gameSnap = await getDoc(gameRef);
  let gameData = gameSnap.data();
  if(!gameData.sessions) gameData.sessions = {};
  if(!gameData.playerColors) gameData.playerColors = {};
  Object.assign(gameData.playerColors, playerColors);
  gameData.sessions[sessionId] = sessionData;
  await updateDoc(gameRef, { sessions: gameData.sessions, playerColors: gameData.playerColors });

  addSessionForm.style.display = 'none';
  addSessionBtn.style.display = '';
  playersFieldsDiv.innerHTML = '';
  notesInput.value = '';
  playersCountInput.value = '';
  renderRankingAndHistory();
});

// Dodanie uwag do istniejącej rozgrywki
function renderAddNotesArea(sessionId, parentDiv) {
  const notesDiv = document.createElement('div');
  notesDiv.className = 'notes-box';
  const textarea = document.createElement('textarea');
  textarea.className = 'notes-edit-area';
  textarea.placeholder = "Dodaj uwagi do rozgrywki";
  notesDiv.appendChild(textarea);

  const saveBtn = document.createElement('button');
  saveBtn.className = 'notes-btn';
  saveBtn.textContent = "Zapisz";
  saveBtn.addEventListener('click', async () => {
    await updateNotes(sessionId, textarea.value);
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'notes-btn';
  cancelBtn.style.background = 'var(--accent)';
  cancelBtn.style.color = '#222';
  cancelBtn.textContent = "Anuluj";
  cancelBtn.addEventListener('click', () => {
    renderRankingAndHistory();
  });

  notesDiv.appendChild(saveBtn);
  notesDiv.appendChild(cancelBtn);

  parentDiv.appendChild(notesDiv);
}

// Edycja/aktualizacja uwag w Firebase
async function updateNotes(sessionId, newNotes) {
  const gameSnap = await getDoc(gameRef);
  let gameData = gameSnap.data();
  if (!gameData.sessions) return;
  gameData.sessions[sessionId].notes = newNotes;
  await updateDoc(gameRef, { sessions: gameData.sessions });
  renderRankingAndHistory();
}

// Usunięcie uwag z Firebase
async function removeNotes(sessionId) {
  const gameSnap = await getDoc(gameRef);
  let gameData = gameSnap.data();
  if (!gameData.sessions) return;
  delete gameData.sessions[sessionId].notes;
  await updateDoc(gameRef, { sessions: gameData.sessions });
  renderRankingAndHistory();
}

// Wykres punktowy (Chart.js)
function renderChart(history) {
  const labels = history.map((_,i)=>`#${i+1}`);
  const players = Array.from(new Set(history.flatMap(h=>Object.keys(h.scores))));
  const datasets = players.map(player=>{
    let sum = 0;
    return {
      label: player,
      borderColor: playerColors[player] || "#888",
      backgroundColor: "transparent",
      data: history.map(h=>{
        sum += h.scores[player]||0;
        return sum;
      }),
      tension: 0.2,
    }
  });
  scoreChartCanvas.height = Math.max(220, history.length*30);

  if(window.scoreChart) window.scoreChart.destroy();
  window.scoreChart = new Chart(scoreChartCanvas, {
    type:'line',
    data:{labels, datasets},
    options:{
      responsive:true,
      plugins:{legend:{labels:{color:'#e4e6eb'}}},
      scales:{
        x:{ ticks:{color:'#e4e6eb'}, grid:{color:'#333'} },
        y:{ ticks:{color:'#e4e6eb'}, grid:{color:'#333'} }
      }
    }
  });
}

loadGame();
