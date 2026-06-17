const gameArea = document.getElementById('gameArea');
const player = document.getElementById('player');
const obstacle = document.getElementById('obstacle');
const startBtn = document.getElementById('startBtn');
const message = document.getElementById('message');
const scoreText = document.getElementById('score');
const targetScoreText = document.getElementById('targetScore');

const targetScore = 10;
let score = 0;
let isPlaying = false;
let isJumping = false;
let hasScoredThisObstacle = false;
let collisionTimer = null;
let audioContext = null;

targetScoreText.textContent = targetScore;

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

function startGame() {
  score = 0;
  isPlaying = true;
  isJumping = false;
  hasScoredThisObstacle = false;

  scoreText.textContent = score;
  startBtn.textContent = '다시 시작';
  message.classList.add('hide');

  obstacle.classList.remove('move');
  void obstacle.offsetWidth;
  obstacle.classList.add('move');

  clearInterval(collisionTimer);
  collisionTimer = setInterval(checkGameState, 20);

  getAudioContext();
}

function endGame(result) {
  isPlaying = false;
  clearInterval(collisionTimer);
  obstacle.classList.remove('move');

  if (result === 'win') {
    playWinSound();
    message.innerHTML = '<strong>승리!</strong><span>목표 점수를 달성했습니다.</span>';
  } else {
    playLoseSound();
    message.innerHTML = '<strong>패배!</strong><span>장애물에 부딪혔습니다.</span>';
  }

  message.classList.remove('hide');
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
    }
  }

  if (obstacleRect.left > playerRect.right) {
    hasScoredThisObstacle = false;
  }
}

startBtn.addEventListener('click', startGame);
gameArea.addEventListener('click', jump);

document.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    jump();
  }
});
