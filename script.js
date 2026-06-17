const gameArea = document.getElementById('gameArea');
const player = document.getElementById('player');
const obstacle = document.getElementById('obstacle');
const startBtn = document.getElementById('startBtn');
const message = document.getElementById('message');
const scoreText = document.getElementById('score');
const targetScoreText = document.getElementById('targetScore');
const levelText = document.getElementById('level');
const levelNameText = document.getElementById('levelName');
const levelDescriptionText = document.getElementById('levelDescription');
const rankingList = document.getElementById('rankingList');
const clearRankingBtn = document.getElementById('clearRankingBtn');

const levels = [
  {
    level: 1,
    name: '1단계: 연습',
    description: '기본 속도로 장애물이 등장합니다.',
    startScore: 0,
    nextScore: 5,
    obstacleDuration: 1.65,
    obstacleWidth: 42,
    obstacleHeight: 54
  },
  {
    level: 2,
    name: '2단계: 집중',
    description: '장애물이 더 빠르고 조금 커집니다.',
    startScore: 5,
    nextScore: 10,
    obstacleDuration: 1.25,
    obstacleWidth: 50,
    obstacleHeight: 62
  },
  {
    level: 3,
    name: '3단계: 도전',
    description: '가장 빠른 속도의 장애물을 피해야 합니다.',
    startScore: 10,
    nextScore: 15,
    obstacleDuration: 0.95,
    obstacleWidth: 58,
    obstacleHeight: 70
  }
];

const targetScore = levels[levels.length - 1].nextScore;
const rankingStorageKey = 'jumpTimingGameRanking';
let score = 0;
let currentLevelIndex = 0;
let isPlaying = false;
let isJumping = false;
let hasScoredThisObstacle = false;
let collisionTimer = null;
let audioContext = null;
let lastGameResult = null;

scoreText.textContent = score;
targetScoreText.textContent = targetScore;
applyLevel(0);
renderRanking();

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  return audioContext;
}

function playTone(frequency, startTime, duration, type = 'sine', volume = 0.18) {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

function playJumpSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  playTone(520, now, 0.08, 'square', 0.12);
  playTone(780, now + 0.06, 0.1, 'square', 0.1);
}

function playWinSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  playTone(523.25, now, 0.12, 'sine', 0.16);
  playTone(659.25, now + 0.12, 0.12, 'sine', 0.16);
  playTone(783.99, now + 0.24, 0.15, 'sine', 0.18);
  playTone(1046.5, now + 0.39, 0.28, 'triangle', 0.2);
}

function playLoseSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  playTone(220, now, 0.18, 'sawtooth', 0.16);
  playTone(164.81, now + 0.16, 0.22, 'sawtooth', 0.14);
  playTone(110, now + 0.35, 0.35, 'sawtooth', 0.12);
}

function playLevelUpSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  playTone(440, now, 0.08, 'triangle', 0.12);
  playTone(660, now + 0.08, 0.08, 'triangle', 0.12);
  playTone(880, now + 0.16, 0.12, 'triangle', 0.14);
}

function startGame() {
  score = 0;
  currentLevelIndex = 0;
  isPlaying = true;
  isJumping = false;
  hasScoredThisObstacle = false;
  lastGameResult = null;

  scoreText.textContent = score;
  startBtn.textContent = '다시 시작';
  message.classList.add('hide');

  applyLevel(currentLevelIndex);
  restartObstacleAnimation();

  clearInterval(collisionTimer);
  collisionTimer = setInterval(checkGameState, 20);

  getAudioContext();
}

function applyLevel(levelIndex) {
  currentLevelIndex = levelIndex;
  const currentLevel = levels[currentLevelIndex];

  levelText.textContent = currentLevel.level;
  levelNameText.textContent = currentLevel.name;
  levelDescriptionText.textContent = currentLevel.description;

  obstacle.style.animationDuration = `${currentLevel.obstacleDuration}s`;
  obstacle.style.width = `${currentLevel.obstacleWidth}px`;
  obstacle.style.height = `${currentLevel.obstacleHeight}px`;
}

function restartObstacleAnimation() {
  obstacle.classList.remove('move');
  void obstacle.offsetWidth;
  obstacle.classList.add('move');
}

function checkLevelUp() {
  const nextLevelIndex = currentLevelIndex + 1;

  if (nextLevelIndex >= levels.length) return;

  const nextLevel = levels[nextLevelIndex];

  if (score >= nextLevel.startScore) {
    applyLevel(nextLevelIndex);
    playLevelUpSound();
    showLevelUpNotice(nextLevel);
    restartObstacleAnimation();
  }
}

function showLevelUpNotice(level) {
  const notice = document.createElement('div');
  notice.className = 'level-up-text';
  notice.textContent = `${level.name} 진입!`;

  gameArea.appendChild(notice);

  Object.assign(notice.style, {
    position: 'absolute',
    top: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 18px',
    borderRadius: '999px',
    background: 'rgba(255, 255, 255, 0.88)',
    border: '2px solid #222',
    zIndex: '5'
  });

  setTimeout(() => {
    notice.remove();
  }, 1100);
}

function endGame(result) {
  isPlaying = false;
  lastGameResult = result;
  clearInterval(collisionTimer);
  obstacle.classList.remove('move');

  if (result === 'win') {
    playWinSound();
    showEndingMessage('승리!', '3단계까지 모두 통과했습니다.');
  } else {
    playLoseSound();
    showEndingMessage('패배!', `${levels[currentLevelIndex].level}단계에서 장애물에 부딪혔습니다.`);
  }

  message.classList.remove('hide');
}

function showEndingMessage(title, subtitle) {
  message.innerHTML = `
    <strong>${title}</strong>
    <span>${subtitle}</span>
    <span>닉네임을 남기면 플레이 로그에 저장됩니다.</span>
    <form id="nicknameForm" class="nickname-form">
      <input id="nicknameInput" type="text" maxlength="10" placeholder="닉네임 입력" autocomplete="off" />
      <button type="submit">기록 저장</button>
    </form>
  `;

  const nicknameForm = document.getElementById('nicknameForm');
  const nicknameInput = document.getElementById('nicknameInput');

  nicknameInput.focus();
  nicknameForm.addEventListener('submit', saveCurrentPlayLog);
}

function saveCurrentPlayLog(event) {
  event.preventDefault();

  const nicknameInput = document.getElementById('nicknameInput');
  const nickname = nicknameInput.value.trim() || '이름없음';

  const playLog = {
    nickname,
    score,
    level: levels[currentLevelIndex].level,
    result: lastGameResult === 'win' ? '승리' : '패배',
    playedAt: new Date().toLocaleString('ko-KR')
  };

  const ranking = getRanking();
  ranking.unshift(playLog);

  const topTenRanking = ranking
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.playedAt) - new Date(a.playedAt);
    })
    .slice(0, 10);

  localStorage.setItem(rankingStorageKey, JSON.stringify(topTenRanking));
  renderRanking();

  message.innerHTML = `
    <strong>기록 저장 완료!</strong>
    <span>${escapeHTML(nickname)}님의 기록이 플레이 로그에 저장되었습니다.</span>
  `;
}

function getRanking() {
  const savedRanking = localStorage.getItem(rankingStorageKey);

  if (!savedRanking) return [];

  try {
    return JSON.parse(savedRanking);
  } catch (error) {
    return [];
  }
}

function renderRanking() {
  const ranking = getRanking();

  if (ranking.length === 0) {
    rankingList.innerHTML = '<li class="ranking-empty">아직 저장된 플레이 로그가 없습니다.</li>';
    return;
  }

  rankingList.innerHTML = ranking
    .map((log) => {
      const level = log.level || (log.result === '승리' ? 3 : 1);

      return `
        <li>
          <span class="log-name">${escapeHTML(log.nickname)}</span>
          <span class="log-result">${log.result}</span>
          <span class="log-info">점수 ${log.score}점 · ${level}단계 · ${log.playedAt}</span>
        </li>
      `;
    })
    .join('');
}

function escapeHTML(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function clearRanking() {
  const isConfirmed = confirm('저장된 플레이 로그를 모두 삭제할까요?');

  if (!isConfirmed) return;

  localStorage.removeItem(rankingStorageKey);
  renderRanking();
}

function jump() {
  if (!isPlaying || isJumping) return;

  isJumping = true;
  player.classList.add('jump');
  playJumpSound();

  setTimeout(() => {
    player.classList.remove('jump');
    isJumping = false;
  }, 620);
}

function checkGameState() {
  if (!isPlaying) return;

  const playerRect = player.getBoundingClientRect();
  const obstacleRect = obstacle.getBoundingClientRect();

  const isColliding =
    playerRect.left < obstacleRect.right &&
    playerRect.right > obstacleRect.left &&
    playerRect.top < obstacleRect.bottom &&
    playerRect.bottom > obstacleRect.top;

  if (isColliding) {
    endGame('lose');
    return;
  }

  const obstaclePassedPlayer = obstacleRect.right < playerRect.left;

  if (obstaclePassedPlayer && !hasScoredThisObstacle) {
    score += 1;
    scoreText.textContent = score;
    hasScoredThisObstacle = true;

    if (score >= targetScore) {
      endGame('win');
      return;
    }

    checkLevelUp();
  }

  if (obstacleRect.left > playerRect.right) {
    hasScoredThisObstacle = false;
  }
}

startBtn.addEventListener('click', startGame);
gameArea.addEventListener('click', jump);
clearRankingBtn.addEventListener('click', clearRanking);

document.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    jump();
  }
});
