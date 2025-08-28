import { db } from './firebase-config.js';
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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

  // Ranking graczy
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

  // Historia rozgrywek
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

document.addEventListener('DOMContentLoaded', loadGame);
