import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

async function loadHallOfFame() {
  const bestScores = document.getElementById('best-scores');
  const topPlayers = document.getElementById('top-players');
  bestScores.innerHTML = '';
  topPlayers.innerHTML = '';

  const gamesSnap = await getDocs(collection(db, "games"));
  gamesSnap.forEach(doc => {
    const g = doc.data();
    const li = document.createElement('li');
    li.textContent = `${g.name}: Rekord ${g.record || '-'} pkt`;
    bestScores.appendChild(li);
  });

  const playersSnap = await getDocs(collection(db, "players"));
  playersSnap.forEach(doc => {
    const p = doc.data();
    const li = document.createElement('li');
    li.textContent = `${p.name} – ${p.totalWins || 0} zwycięstw`;
    topPlayers.appendChild(li);
  });
}

document.addEventListener('DOMContentLoaded', loadHallOfFame);
