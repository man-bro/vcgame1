const gameArea = document.getElementById('gameArea');
const player = document.getElementById('player');
const obstacle = document.getElementById('obstacle');
const coin = document.getElementById('coin');
const startBtn = document.getElementById('startBtn');
const message = document.getElementById('message');
const scoreText = document.getElementById('score');
const coinCountText = document.getElementById('coinCount');
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
    description: '낮은 장애물 위주로 등장합니다.',
    startScore: 0,
    nextScore: 8,
    obstacleDuration: 1.65,
    coinDuration: 2.15,
    obstacleTypes: ['low', 'low', 'wide']
  },
  {
    level: 2,
    name: '2단계: 집중',
    description: '높은 장애물과 빠른 장애물이 추가됩니다.',
    startScore: 8,
    nextScore: 16,
    obstacleDuration: 1.25,
    coinDuration: 1.75,
    obstacleTypes: ['low', 'wide', 'tall', 'fast']
  },
  {
    level: 3,
    name: '3단계: 도전',
    description: '모든 장애물이 더 빠르게 랜덤 등장합니다.',
    startScore: 16,
    nextScore: 25,
    obstacleDuration: 0.95,
    coinDuration: 1.35,
    obstacleTypes: ['low', 'wide', 'tall', 'fast', 'fast']
  }
];

const obstacleSettings = {
  low: {
    label: '낮은 장애물',
    width: 42,
    height: 44,
    bottom: 70,
    color: '#333',
    durationMultiplier: 1
  },
  wide: {
    label: '넓은 장애물',
    width: 72,
    height: 42,
    bottom: 70,
    color: '#4a3f35',
    durationMultiplier: 1.05
  },
  tall: {
    label: '높은 장애물',
    width: 46,
    height: 78,
    bottom: 70,
    color: '#2f4858',
    durationMultiplier: 1.05
  },
  fast: {
    label: '빠른 장애물',
    width: 38,
    height: 52,
    bottom: 70,
    color: '#8d2f2f',
    durationMultiplier: 0.72
  }
};

const targetScore = levels[levels.length - 1].nextScore;
const rankingStorageKey = 'jumpTimingGameRanking';
let score = 0;
let coinCount = 0;
let currentLevelIndex = 0;
let currentObstacleType = 'low';
let isPlaying = false;
let isJumping = false;
let jumpCount = 0;
let playerBottom = 70;
let jumpVelocity = 0;
const groundBottom = 70;
const gravity = 1.15;
const firstJumpPower = 18;
const secondJumpPower = 15;
const maxJumpCount = 2;
let hasScoredThisObstacle = false;
let hasCollectedThisCoin = false;
let collisionTimer = null;
let audioContext = null;
let lastGameResult = null;

scoreText.textContent = score;
coinCountText.textContent = coinCount;
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

function playCoinSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  playTone(880, now, 0.07, 'triangle', 0.12);
  playTone(1174.66, now + 0.06, 0.1, 'triangle', 0.12);
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
  coinCount = 0;
  currentLevelIndex = 0;
  currentObstacleType = 'low';
  isPlaying = true;
  isJumping = false;
  jumpCount = 0;
  playerBottom = groundBottom;
  jumpVelocity = 0;
  player.style.bottom = `${groundBottom}px`;
  player.classList.remove('jump', 'double-jump');
  hasScoredThisObstacle = false;
  hasCollectedThisCoin = false;
  lastGameResult = null;

  scoreText.textContent = score;
  coinCountText.textContent = coinCount;
  startBtn.textContent = '다시 시작';
  message.classList.add('hide');

  applyLevel(currentLevelIndex);
  restartObstacleAnimation();
  restartCoinAnimation();

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

  coin.style.animationDuration = `${currentLevel.coinDuration}s`;
  setRandomObstacleType();
}

function setRandomObstacleType() {
  const currentLevel = levels[currentLevelIndex];
  const candidates = currentLevel.obstacleTypes;
  let randomType = candidates[Math.floor(Math.random() * candidates.length)];

  // 같은 장애물만 반복해서 나오는 느낌을 줄이기 위해
  // 가능한 경우 직전 장애물과 다른 타입을 선택합니다.
  const uniqueCandidates = [...new Set(candidates)];
  if (uniqueCandidates.length > 1) {
    while (randomType === currentObstacleType) {
      randomType = candidates[Math.floor(Math.random() * candidates.length)];
    }
  }

  setObstacleType(randomType);
}

function setObstacleType(type) {
  currentObstacleType = type;
  const currentLevel = levels[currentLevelIndex];
  const setting = obstacleSettings[type];

  obstacle.className = `obstacle obstacle-${type}`;
  obstacle.style.width = `${setting.width}px`;
  obstacle.style.height = `${setting.height}px`;
  obstacle.style.bottom = `${setting.bottom}px`;
  obstacle.style.background = setting.color;
  obstacle.style.animationDuration = `${currentLevel.obstacleDuration * setting.durationMultiplier}s`;
  obstacle.setAttribute('aria-label', setting.label);
  obstacle.title = setting.label;
}

function restartObstacleAnimation() {
  if (!isPlaying) return;

  hasScoredThisObstacle = false;

  // CSS 애니메이션을 확실하게 처음 위치부터 다시 시작합니다.
  // 일부 브라우저에서는 animation-fill-mode: forwards 상태가 남아서
  // 다음 장애물이 생성되지 않은 것처럼 보일 수 있으므로 animation 속성을 직접 초기화합니다.
  obstacle.classList.remove('move');
  obstacle.style.animation = 'none';

  setRandomObstacleType();

  // 강제 리플로우로 이전 애니메이션 상태를 완전히 비웁니다.
  void obstacle.offsetWidth;

  obstacle.style.animation = '';
  obstacle.classList.add('move');
}


function restartCoinAnimation() {
  if (!isPlaying) return;

  hasCollectedThisCoin = false;
  coin.classList.remove('move', 'collected');
  coin.style.bottom = `${getRandomCoinBottom()}px`;
  void coin.offsetWidth;
  coin.classList.add('move');
}

function getRandomCoinBottom() {
  const coinPositions = [130, 165, 200];
  return coinPositions[Math.floor(Math.random() * coinPositions.length)];
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
    restartCoinAnimation();
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
  coin.classList.remove('move');

  if (result === 'win') {
    playWinSound();
    showEndingMessage('승리!', '3단계까지 모든 장애물을 통과했습니다.');
  } else {
    playLoseSound();
    showEndingMessage('패배!', `${levels[currentLevelIndex].level}단계의 ${obstacleSettings[currentObstacleType].label}에 부딪혔습니다.`);
  }

  message.classList.remove('hide');
}

function showEndingMessage(title, subtitle) {
  message.innerHTML = `
    <strong>${title}</strong>
    <span>${subtitle}</span>
    <span>최종 점수 ${score}점 · 코인 ${coinCount}개</span>
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
    coinCount,
    level: levels[currentLevelIndex].level,
    result: lastGameResult === 'win' ? '승리' : '패배',
    playedAt: new Date().toLocaleString('ko-KR')
  };

  const ranking = getRanking();
  ranking.unshift(playLog);

  const topTenRanking = ranking
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if ((b.coinCount || 0) !== (a.coinCount || 0)) return (b.coinCount || 0) - (a.coinCount || 0);
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
      const savedCoinCount = log.coinCount || 0;

      return `
        <li>
          <span class="log-name">${escapeHTML(log.nickname)}</span>
          <span class="log-result">${log.result}</span>
          <span class="log-info">점수 ${log.score}점 · 코인 ${savedCoinCount}개 · ${level}단계 · ${log.playedAt}</span>
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
  if (!isPlaying || jumpCount >= maxJumpCount) return;

  jumpCount += 1;
  isJumping = true;
  jumpVelocity = jumpCount === 1 ? firstJumpPower : secondJumpPower;

  player.classList.remove('jump', 'double-jump');
  void player.offsetWidth;
  player.classList.add(jumpCount === 1 ? 'jump' : 'double-jump');

  playJumpSound();
}

function updatePlayerPhysics() {
  if (!isPlaying) return;

  if (jumpCount === 0 && playerBottom === groundBottom) return;

  playerBottom += jumpVelocity;
  jumpVelocity -= gravity;

  if (playerBottom <= groundBottom) {
    playerBottom = groundBottom;
    jumpVelocity = 0;
    jumpCount = 0;
    isJumping = false;
    player.classList.remove('jump', 'double-jump');
  }

  player.style.bottom = `${playerBottom}px`;
}

function checkGameState() {
  if (!isPlaying) return;

  updatePlayerPhysics();

  const playerRect = player.getBoundingClientRect();
  const obstacleRect = obstacle.getBoundingClientRect();
  const coinRect = coin.getBoundingClientRect();
  const gameAreaRect = gameArea.getBoundingClientRect();

  const isCollidingWithObstacle =
    playerRect.left < obstacleRect.right &&
    playerRect.right > obstacleRect.left &&
    playerRect.top < obstacleRect.bottom &&
    playerRect.bottom > obstacleRect.top;

  if (isCollidingWithObstacle) {
    endGame('lose');
    return;
  }

  const isCoinVisible = !coin.classList.contains('collected');
  const isCollectingCoin =
    isCoinVisible &&
    playerRect.left < coinRect.right &&
    playerRect.right > coinRect.left &&
    playerRect.top < coinRect.bottom &&
    playerRect.bottom > coinRect.top;

  if (isCollectingCoin && !hasCollectedThisCoin) {
    coinCount += 1;
    score += 2;
    coinCountText.textContent = coinCount;
    scoreText.textContent = score;
    hasCollectedThisCoin = true;
    coin.classList.add('collected');
    playCoinSound();

    if (score >= targetScore) {
      endGame('win');
      return;
    }

    checkLevelUp();
  }

  if (coinRect.right < gameAreaRect.left) {
    restartCoinAnimation();
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

  // 장애물이 화면 밖으로 완전히 나가면 다음 장애물을 새로 생성합니다.
  // 기존에는 CSS animationiteration에 의존해서 일부 환경에서
  // 단계별 첫 번째 장애물만 계속 보이는 문제가 생길 수 있었습니다.
  if (obstacleRect.right <= gameAreaRect.left + 2) {
    restartObstacleAnimation();
  }
}


obstacle.addEventListener('animationend', () => {
  if (!isPlaying) return;
  restartObstacleAnimation();
});

startBtn.addEventListener('click', startGame);
gameArea.addEventListener('click', jump);
clearRankingBtn.addEventListener('click', clearRanking);

document.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    jump();
  }
});
