import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const urlParams = new URLSearchParams(window.location.search);
const gameName = urlParams.get('gameName'); // np. ?gameName=Gra1
const scoreTable = document.querySelector('#score-table tbody');

let gameId = null;

// Funkcja pobiera dokument gry na podstawie nazwy
async function fetchGameIdByName(name) {
  const gamesRef = collection(db, 'games/games');
  const q = query(gamesRef, where('name', '==', name));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const docSnap = querySnapshot.docs[0];
    gameId = docSnap.id;
    document.getElementById('game-title').textContent = `Gra: ${docSnap.data().name}`;
  } else {
    document.getElementById('game-title').textContent = `Gra nie znaleziona`;
  }
}

// Funkcja ładuje wyniki dla gry
async function loadScores() {
  if (!gameId) return;
  scoreTable.innerHTML = '';
  const scoresRef = collection(db, `games/${gameId}/scores`);
  const q = query(scoresRef, orderBy("score", "desc"));
  const querySnapshot = await getDocs(q);

  querySnapshot.forEach(docSnap => {
    const data = docSnap.data();
    const row = document.createElement('tr');
    row.innerHTML = `<td>${data.player}</td><td>${data.score}</td>`;
    scoreTable.appendChild(row);
  });
}

// Obsługa dodawania nowego wyniku
const scoreForm = document.getElementById('add-score-form');
scoreForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!gameId) return;

  const player = document.getElementById('player-name').value.trim();
  const score = parseInt(document.getElementById('player-score').value);

  if (!player || isNaN(score)) return;

  const scoresRef = collection(db, `games/${gameId}/scores`);
  await addDoc(scoresRef, { player, score });

  scoreForm.reset();
  loadScores();
});

// Uruchamiamy ładowanie gry i wyników
await fetchGameIdByName(gameName);
loadScores();
