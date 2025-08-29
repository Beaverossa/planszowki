import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Helper: Fade in animation
function fadeIn(element) {
  element.classList.remove('fade-out');
  element.classList.add('fade-in');
  setTimeout(() => element.classList.remove('fade-in'), 400);
}
function fadeOut(element) {
  element.classList.add('fade-out');
  setTimeout(() => element.classList.remove('fade-out'), 400);
}

// Zakładki
const tabBtns = Array.from(document.querySelectorAll('.tab-btn'));
const tabSections = Array.from(document.querySelectorAll('.tab-section'));
function showTab(tab) {
  tabSections.forEach(section => {
    if (section.id === `tab-${tab}`) {
      section.classList.add('visible');
      fadeIn(section);
    } else {
      section.classList.remove('visible');
      fadeOut(section);
    }
  });
  tabBtns.forEach(btn => {
    if (btn.dataset.tab === tab) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  // Ukryj/przywróć przycisk Szczegóły gry
  tabBtns[2].style.display = tab === 'game-details' ? 'inline-block' : 'none';
}
tabBtns.forEach(btn => btn.addEventListener('click', () => showTab(btn.dataset.tab)));
document.getElementById('back-to-games').addEventListener('click', () => showTab('games'));

// Dynamiczne pobieranie z Firebase
const hallRef = doc(db, "hallOfFame", "main");

async function renderBestScores() {
  const snap = await getDoc(hallRef);
  if (!snap.exists()) return;
  const data = snap.data();
  const games = data.games || {};
  const list = document.getElementById('best-scores-list');
  list.innerHTML = '';
  Object.entries(games).forEach(([gameId, game]) => {
    const card = document.createElement('div');
    card.className = 'result-card fade-in';
    card.innerHTML = `
      <h3><a class="game-link" data-game-id="${gameId}" href="#">${game.name}</a></h3>
      <ul>
        ${game.topScores.map((score, idx) => 
          `<li><span class="player">${score.player}</span>: <span class="score">${score.score}</span> pkt</li>`
        ).join('')}
      </ul>
    `;
    card.querySelector('.game-link').addEventListener('click', (e) => {
      e.preventDefault();
      renderGameDetails(gameId, game);
      showTab('game-details');
    });
    list.appendChild(card);
  });
}

async function renderTopPlayers() {
  const snap = await getDoc(hallRef);
  if (!snap.exists()) return;
  const data = snap.data();
  const players = data.players || {};
  // Sort by totalPoints desc, then winRate desc
  const sorted = Object.entries(players)
    .sort(([, a], [, b]) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return (b.winRate || 0) - (a.winRate || 0);
    })
    .slice(0, 3);
  const list = document.getElementById('top-players-list');
  list.innerHTML = '';
  sorted.forEach(([player, data], idx) => {
    const card = document.createElement('div');
    card.className = 'result-card fade-in';
    card.innerHTML = `
      <h3>${player}</h3>
      <ul>
        <li>Suma punktów: <span class="score">${data.totalPoints || 0}</span></li>
        <li>Procent zwycięstw: <span class="score">${((data.winRate || 0) * 100).toFixed(1)}%</span></li>
      </ul>
    `;
    list.appendChild(card);
  });
}

function renderGameDetails(gameId, game) {
  document.getElementById('game-detail-title').textContent = `Szczegóły gry: ${game.name}`;
  const top = document.getElementById('game-detail-top');
  top.innerHTML = `
    <div class="result-card fade-in">
      <h3>Top 3 wyniki</h3>
      <ul>
        ${game.topScores.map(score => 
          `<li><span class="player">${score.player}</span>: <span class="score">${score.score}</span> pkt</li>`
        ).join('')}
      </ul>
      <a href="game.html?gameId=${gameId}" class="game-link-btn">Przejdź do szczegółów gry</a>
    </div>
  `;
}

// Inicjalizacja
showTab('games');
renderBestScores();
renderTopPlayers();
