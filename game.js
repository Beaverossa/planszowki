import { db } from './firebase-config.js';
import { doc, getDoc, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const urlParams = new URLSearchParams(window.location.search);
const gameId = urlParams.get('gameId');

// Pobierz nazwę gry z Firestore
async function setGameTitle() {
  const gameRef = doc(db, "games", gameId);
  const gameSnap = await getDoc(gameRef);
  if (gameSnap.exists()) {
    const gameData = gameSnap.data();
    document.getElementById('game-title').textContent = `Gra: ${gameData.name}`;
  } else {
    document.getElementById('game-title').textContent = "Gra nie znaleziona";
  }
}

setGameTitle();

const scoreForm = document.getElementById('add-score-form');
const scoreTable = document.querySelector('#score-table tbody');

async function loadScores() {
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

scoreForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const player = document.getElementById('player-name').value.trim();
  const score = parseInt(document.getElementById('player-score').value);

  if (!player || isNaN(score)) return;

  const scoresRef = collection(db, `games/${gameId}/scores`);
  await addDoc(scoresRef, {
    player: player,
    score: score
  });

  scoreForm.reset();
  loadScores();
});

loadScores();
