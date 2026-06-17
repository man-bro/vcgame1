const player = document.getElementById('player');
const obstacle = document.getElementById('obstacle');
const scoreText = document.getElementById('score');
const message = document.getElementById('message');
const startBtn = document.getElementById('startBtn');
const soundBtn = document.getElementById('soundBtn');
const gameArea = document.getElementById('gameArea');

let isPlaying = false;
let isJumping = false;
let score = 0;
let scoreTimer = null;
let collisionTimer = null;
let soundEnabled = true;
let audioContext = null;

function prepareAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

function playJumpSound() {
  if (!soundEnabled) return;

  prepareAudio();

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(430, now);
  oscillator.frequency.exponentialRampToValueAtTime(760, now + 0.08);
  oscillator.frequency.exponentialRampToValueAtTime(520, now + 0.16);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.2);
}

function startGame() {
  prepareAudio();

  isPlaying = true;
  isJumping = false;
  score = 0;
  scoreText.textContent = score;

  message.classList.add('hide');
  obstacle.classList.remove('move');
  void obstacle.offsetWidth;
  obstacle.classList.add('move');

  clearInterval(scoreTimer);
  clearInterval(collisionTimer);

  scoreTimer = setInterval(() => {
    score += 1;
    scoreText.textContent = score;
  }, 200);

  collisionTimer = setInterval(checkCollision, 10);
}

function endGame() {
  isPlaying = false;
  obstacle.classList.remove('move');

  clearInterval(scoreTimer);
  clearInterval(collisionTimer);

  message.innerHTML = `
    <strong>게임 오버</strong>
    <span>최종 점수: ${score}</span>
    <span>다시 시작하려면 버튼 또는 스페이스바를 누르세요</span>
  `;
  message.classList.remove('hide');
}

function jump() {
  if (!isPlaying) {
    startGame();
    return;
  }

  if (isJumping) return;

  isJumping = true;
  player.classList.add('jump');
  playJumpSound();

  setTimeout(() => {
    player.classList.remove('jump');
    isJumping = false;
  }, 620);
}

function checkCollision() {
  const playerRect = player.getBoundingClientRect();
  const obstacleRect = obstacle.getBoundingClientRect();

  const isColliding =
    playerRect.left < obstacleRect.right &&
    playerRect.right > obstacleRect.left &&
    playerRect.top < obstacleRect.bottom &&
    playerRect.bottom > obstacleRect.top;

  if (isColliding) {
    endGame();
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;

  if (soundEnabled) {
    soundBtn.textContent = '효과음 ON';
    soundBtn.classList.remove('sound-off');
    soundBtn.classList.add('sound-on');
    prepareAudio();
  } else {
    soundBtn.textContent = '효과음 OFF';
    soundBtn.classList.remove('sound-on');
    soundBtn.classList.add('sound-off');
  }
}

startBtn.addEventListener('click', startGame);
soundBtn.addEventListener('click', toggleSound);
gameArea.addEventListener('click', jump);

document.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    jump();
  }
});
