import { db } from './firebase-config.js';
import { doc, getDoc, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

async function loadGame() {
  const params = new URLSearchParams(window.location.search);
  const gameId = params.get('gameId');
  if (!gameId) return;

  const gameRef = doc(db, "games", gameId);
  const gameSnap = await getDoc(gameRef);
  if (!gameSnap.exists()) {
    document.getElementById('game-title').innerText = "Nie znaleziono gry";
    return;
  }

  const gameData = gameSnap.data();
  document.getElementById('game-title').innerText = gameData.name;

  await loadRanking(gameId);
  await loadMatches(gameId);

  // obsługa formularza
  const form = document.getElementById('add-match-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await addMatch(gameId);
  });
}

async function loadRanking(gameId) {
  const rankingBody = document.querySelector('#ranking tbody');
  rankingBody.innerHTML = '';
  const playersCol = collection(db, `games/${gameId}/players`);
  const playersSnap = await getDocs(playersCol);

  playersSnap.forEach(doc => {
    const p = doc.data();
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><a href="player.html?playerId=${doc.id}">${p.name}</a></td>
      <td>${p.wins || 0}</td>
      <td>${p.points || 0}</td>
      <td>${p.streak || 0}</td>
    `;
    rankingBody.appendChild(tr);
  });
}

async function loadMatches(gameId) {
  const matchesBody = document.querySelector('#matches tbody');
  matchesBody.innerHTML = '';
  const matchesCol = collection(db, `games/${gameId}/matches`);
  const matchesSnap = await getDocs(matchesCol);

  matchesSnap.forEach(doc => {
    const m = doc.data();
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${m.date || '-'}</td>
      <td>${(m.results || []).map(r => `${r.name}: ${r.score}`).join(', ')}</td>
      <td>${m.notes || ''}</td>
    `;
    matchesBody.appendChild(tr);
  });
}

async function addMatch(gameId) {
  const dateInput = document.getElementById('match-date').value;
  const resultsInput = document.getElementById('match-results').value;
  const notesInput = document.getElementById('match-notes').value;

  // Parsowanie wpisanych graczy
  const results = resultsInput.split(',').map(pair => {
    const [name, score] = pair.split('=').map(s => s.trim());
    return { name, score: parseInt(score, 10) };
  });

  // Zapis w bazie
  await addDoc(collection(db, `games/${gameId}/matches`), {
    date: dateInput,
    results: results,
    notes: notesInput || ''
  });

  alert('Wynik został zapisany!');
  await loadMatches(gameId); // odśwież tabelę
}

document.addEventListener('DOMContentLoaded', loadGame);
