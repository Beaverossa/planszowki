import { db } from './firebase-config.js';
import { collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

async function loadGames() {
  const gameList = document.getElementById('game-list');
  gameList.innerHTML = '<p>Ładowanie gier...</p>';

  try {
    const querySnapshot = await getDocs(collection(db, "games"));
    gameList.innerHTML = '';

    if (querySnapshot.empty) {
      gameList.innerHTML = '<p>Brak gier w bazie danych.</p>';
      return;
    }

    querySnapshot.forEach((doc) => {
      const game = doc.data();
      const card = document.createElement('div');
      card.classList.add('game-card');
      card.innerHTML = `
        <img src="${game.icon || 'assets/default.png'}" alt="${game.name}" width="100">
        <h3>${game.name}</h3>
        <a href="game.html?gameId=${doc.id}">Zobacz ranking</a>
      `;
      gameList.appendChild(card);
    });
  } catch (error) {
    console.error("Błąd ładowania gier:", error);
    gameList.innerHTML = '<p>Błąd połączenia z bazą danych.</p>';
  }
}

async function addGame(event) {
  event.preventDefault();
  const nameInput = document.getElementById('game-name');
  const iconInput = document.getElementById('game-icon');

  const newGame = {
    name: nameInput.value.trim(),
    icon: iconInput.value.trim() || null
  };

  try {
    await addDoc(collection(db, "games"), newGame);
    alert('Gra została dodana!');
    nameInput.value = '';
    iconInput.value = '';
    loadGames(); // odświeżenie listy
  } catch (error) {
    console.error("Błąd dodawania gry:", error);
    alert('Nie udało się dodać gry.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadGames();
  document.getElementById('add-game-form').addEventListener('submit', addGame);
});
