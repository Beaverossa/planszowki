import { db } from './firebase-config.js';
import { doc, getDoc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

async function loadPlayer() {
  const params = new URLSearchParams(window.location.search);
  const playerId = params.get('playerId');
  if (!playerId) return;

  const playerRef = doc(db, "players", playerId);
  const playerSnap = await getDoc(playerRef);
  if (!playerSnap.exists()) {
    document.getElementById('player-name').innerText = "Nie znaleziono gracza";
    return;
  }

  const playerData = playerSnap.data();
  document.getElementById('player-name').innerText = playerData.name;
  document.getElementById('total-wins').innerText = playerData.totalWins || 0;
  document.getElementById('best-score').innerText = playerData.bestScore || 0;
  document.getElementById('streak').innerText = playerData.streak || 0;

  // Gry gracza
  const gamesList = document.getElementById('games-list');
  const gamesSnap = await getDocs(collection(db, "games"));
  gamesList.innerHTML = '';

  gamesSnap.forEach(gameDoc => {
    const gameData = gameDoc.data();
    // Tu można dodać sprawdzenie czy gracz brał udział
    const div = document.createElement('div');
    div.innerHTML = `<p>${gameData.name}</p>`;
    gamesList.appendChild(div);
  });
}

document.addEventListener('DOMContentLoaded', loadPlayer);
