import { db } from './firebase-config.js';
import { collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const gameList = document.getElementById('game-list');
const addGameForm = document.getElementById('add-game-form');
const defaultIcon = 'https://cdn-icons-png.flaticon.com/512/3669/3669727.png';

// Wczytaj gry z Firestore
async function loadGames() {
  gameList.innerHTML = '';
  const gamesSnapshot = await getDocs(collection(db, "games"));
  gamesSnapshot.forEach(docSnap => {
    const game = docSnap.data();
    const icon = game.icon || defaultIcon;
    const card = document.createElement('div');
    card.classList.add('game-card');
    card.innerHTML = `
      <img src="${icon}" alt="${game.name || 'Brak nazwy'}">
      <h3>${game.name || 'Brak nazwy'}</h3>
      <a class="game-link" href="game.html?gameId=${docSnap.id}">Zobacz ranking</a>
      <button class="delete-btn" data-id="${docSnap.id}">Usuń grę</button>
    `;
    gameList.appendChild(card);
  });

  // Obsługa usuwania gry
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      if (confirm('Czy na pewno chcesz usunąć tę grę?')) {
        await deleteDoc(doc(db, "games", id));
        loadGames();
      }
    });
  });
}

addGameForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('game-name').value.trim();
  const icon = document.getElementById('game-icon').value.trim();
  if (!name) return;
  await addDoc(collection(db, "games"), {
    name: name,
    icon: icon || defaultIcon
  });
  addGameForm.reset();
  loadGames();
});

loadGames();
