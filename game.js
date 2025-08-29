import { db } from './firebase-config.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Pobierz gameId z URL
function getGameId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('gameId');
}

const gameId = getGameId();
if (!gameId) {
  document.body.innerHTML = '<main><h2>Błąd: Nie podano ID gry!</h2></main>';
  throw new Error('Brak gameId w URL!');
}

const gameRef = doc(db, "games", gameId);

async function renderGame() {
  const snap = await getDoc(gameRef);
  if (!snap.exists()) {
    document.body.innerHTML = '<main><h2>Brak danych o tej grze!</h2></main>';
    return;
  }
  const data = snap.data();
  document.getElementById('game-title').textContent = data.name || "Szczegóły gry";

  // 1. Ranking graczy
  const sessions = data.sessions || {};
  const totals = {};
  const notesList = [];
  Object.values(sessions).forEach(s => {
    Object.entries(s.scores || {}).forEach(([player, score]) => {
      totals[player] = (totals[player] || 0) + score;
    });
    if (s.notes) notesList.push({date: s.date, note: s.notes});
  });

  const ranking = Object.entries(totals)
    .sort(([,a],[,b]) => b-a)
    .map(([player, score]) => ({player, score}));
  const rankingDiv = document.getElementById('game-ranking');
  rankingDiv.innerHTML = '';
  ranking.forEach(r =>
    rankingDiv.innerHTML += `<div class="result-card"><h3>${r.player}</h3><p>Punkty: <span class="score">${r.score}</span></p></div>`
  );

  // 2. Wykres wyników
  const chartCanvas = document.getElementById('score-chart');
  const sessionDates = [];
  const players = Object.keys(data.playerColors || totals);
  const scoresByPlayer = {};
  players.forEach(p => scoresByPlayer[p] = []);
  Object.values(sessions).forEach(s => {
    sessionDates.push(s.date || '');
    players.forEach(p => {
      scoresByPlayer[p].push(s.scores?.[p] || 0);
    });
  });
  // Chart.js
  if (chartCanvas) {
    chartCanvas.height = 320;
    new window.Chart(chartCanvas, {
      type: 'line',
      data: {
        labels: sessionDates,
        datasets: players.map(p => ({
          label: p,
          data: scoresByPlayer[p],
          backgroundColor: data.playerColors?.[p] || "#339dff",
          borderColor: data.playerColors?.[p] || "#339dff",
          fill: false,
          tension: 0.25
        }))
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: "#e4e6eb" } } },
        scales: {
          x: { ticks: { color: "#b0b3b8" } },
          y: { ticks: { color: "#b0b3b8" }, beginAtZero: true }
        }
      }
    });
  }

  // 3. Uwagi do rozgrywek
  const notesDiv = document.getElementById('game-notes');
  notesDiv.innerHTML = notesList.length ? notesList.map(n =>
    `<div class="notes-box"><b>${n.date || ''}</b>: ${n.note}</div>`
  ).join('') : '<p>Brak uwag.</p>';

  // 4. Formularz dodawania sesji
  const playersListDiv = document.getElementById('players-list');
  const playersForm = Object.keys(data.playerColors || totals);
  playersListDiv.innerHTML = playersForm.map(p =>
    `<label>${p}: <input type="number" name="score-${p}" min="0" value="0"></label>`
  ).join(" ");
}
renderGame();

document.getElementById('add-session-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const snap = await getDoc(gameRef);
  if (!snap.exists()) return;
  const data = snap.data();
  const sessions = data.sessions || {};
  const newId = Date.now().toString();
  const scores = {};
  Object.keys(data.playerColors || {}).forEach(p => {
    const val = parseInt(document.querySelector(`[name="score-${p}"]`)?.value || "0", 10);
    scores[p] = isNaN(val) ? 0 : val;
  });
  const date = document.getElementById('session-date').value || new Date().toISOString().split('T')[0];
  const notes = document.getElementById('session-notes').value || '';
  sessions[newId] = {date, notes, scores};
  await updateDoc(gameRef, {sessions});
  renderGame();
  this.reset();
});
