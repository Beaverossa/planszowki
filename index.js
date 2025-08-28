import { db } from './firebase-config.js';
import { collection, getDocs, setDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const gameList = document.getElementById('game-list');
const addGameForm = document.getElementById('add-game-form');

async function loadGames() {
  gameList.innerHTML = '';
  const querySnapshot = await getDocs(collection(db, "games"));
  
  querySnapshot.forEach((docSnap) => {
    const game = docSnap.data();
    const name = game.name || docSnap.id;
    const icon = game.icon || 'assets/default.png';

    const card = document.createElement('div');
    card.classList.add('game-card');
    card.innerHTML = `
      <img src="${icon}" alt="${name}">
      <h3>${name}</h3>
      <a class="view-link" href="game.html?gameId=${docSnap.id}">Zobacz ranking</a>
      <button class="delete-btn" data-id="${docSnap.id}">Usuń</button>
    `;
    gameList.appendChild(card);
  });

  // obsługa przycisków usuwania
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      if (confirm(`Czy na pewno chcesz usunąć grę: ${id}?`)) {
        await deleteDoc(doc(db, "games", id));
        loadGames(); // odśwież listę
      }
    });
  });
}

addGameForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('game-name').value.trim();
  const icon = document.getElementById('game-icon').value.trim();

  if (!name) return;

  await setDoc(doc(db, "games", name), {
    name: name,
    icon: icon || ''
  });

  addGameForm.reset();
  loadGames();
});

loadGames();
