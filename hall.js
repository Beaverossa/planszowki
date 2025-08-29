import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Helper: czy dany gracz wygrał rozgrywkę (najwięcej punktów, bez remisu)
function getWinners(scoresObj) {
  const entries = Object.entries(scoresObj);
  if (entries.length === 0) return [];
  const maxScore = Math.max(...entries.map(([_, v]) => v));
  return entries.filter(([_, v]) => v === maxScore).map(([name]) => name);
}

async function generateStatsAndRender() {
  const gamesSnap = await getDocs(collection(db, "games"));
  const gamesStats = {};
  const playerStats = {};

  gamesSnap.forEach(gameDoc => {
    const gameId = gameDoc.id;
    const gameData = gameDoc.data();
    const sessions = gameData.sessions || {};
    const playerTotals = {}; // suma punktów w tej grze
    const playerWins = {};

    Object.values(sessions).forEach(session => {
      const scores = session.scores || {};
      Object.entries(scores).forEach(([player, pts]) => {
        playerTotals[player] = (playerTotals[player] || 0) + pts;
        playerStats[player] = playerStats[player] || { totalPoints: 0, gamesPlayed: 0, gamesWon: 0 };
        playerStats[player].totalPoints += pts;
        playerStats[player].gamesPlayed += 1;
      });
      const winners = getWinners(scores);
      if (winners.length === 1) {
        const winner = winners[0];
        playerWins[winner] = (playerWins[winner] || 0) + 1;
        playerStats[winner].gamesWon += 1;
      }
    });

    // Top 3 sum punktów w grze
    const topScores = Object.entries(playerTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([player, score]) => ({ player, score }));

    gamesStats[gameId] = {
      name: gameData.name || 'Brak nazwy',
      topScores
    };
  });

  Object.entries(playerStats).forEach(([player, stats]) => {
    stats.winRate = stats.gamesPlayed > 0 ? stats.gamesWon / stats.gamesPlayed : 0;
  });

  renderBestScores(gamesStats);
  renderTopPlayers(playerStats);
}

function renderBestScores(gamesStats) {
  const list = document.getElementById('best-scores-list');
  list.innerHTML = '';
  Object.entries(gamesStats).forEach(([gameId, game]) => {
    const card = document.createElement('div');
    card.className = 'result-card fade-in';
    card.innerHTML = `
      <h3><a class="game-link" data-game-id="${gameId}" href="#">${game.name}</a></h3>
      <ul>
        ${game.topScores.map(score =>
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

function renderTopPlayers(playerStats) {
  // Sort by totalPoints desc, then winRate desc, top 3
  const sorted = Object.entries(playerStats)
    .sort(([, a], [, b]) => b.totalPoints - a.totalPoints || (b.winRate || 0) - (a.winRate || 0))
    .slice(0, 3);
  const list = document.getElementById('top-players-list');
  list.innerHTML = '';
  sorted.forEach(([player, data]) => {
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

// Zakładki (jak wcześniej)
const tabBtns = Array.from(document.querySelectorAll('.tab-btn'));
const tabSections = Array.from(document.querySelectorAll('.tab-section'));
function showTab(tab) {
  tabSections.forEach(section => {
    if (section.id === `tab-${tab}`) {
      section.classList.add('visible');
      section.classList.add('fade-in');
      setTimeout(() => section.classList.remove('fade-in'), 400);
    } else {
      section.classList.remove('visible');
    }
  });
  tabBtns.forEach(btn => {
    if (btn.dataset.tab === tab) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  tabBtns[2].style.display = tab === 'game-details' ? 'inline-block' : 'none';
}
tabBtns.forEach(btn => btn.addEventListener('click', () => showTab(btn.dataset.tab)));
document.getElementById('back-to-games').addEventListener('click', () => showTab('games'));

// Inicjalizacja
showTab('games');
generateStatsAndRender();
