import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

async function loadGames() {
  const gameList = document.getElementById('game-list');
  gameList.innerHTML = '<p>Ładowanie gier...</p>';

  const querySnapshot = await getDocs(collection(db, "games"));
  gameList.innerHTML = '';

  querySnapshot.forEach((doc) => {
    const game = doc.data();
    const card = document.createElement('div');
    card.classList.add('game-card');
    card.innerHTML = `
      <img src="${game.icon || 'assets/default.png'}" alt="${game.name}">
      <h3>${game.name}</h3>
      <a href="game.html?gameId=${doc.id}">Zobacz ranking</a>
    `;
    gameList.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', loadGames);
