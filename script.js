const player = document.getElementById('player');
const obstacle = document.getElementById('obstacle');
const scoreText = document.getElementById('score');
const bestScoreText = document.getElementById('bestScore');
const messageBox = document.getElementById('messageBox');
const gameContainer = document.getElementById('gameContainer');
const startButton = document.getElementById('startButton');

let score = 0;
let bestScore = Number(localStorage.getItem('jumpGameBestScore')) || 0;
let isPlaying = false;
let isJumping = false;
let scoreTimer = null;
let collisionTimer = null;
let difficultyTimer = null;
let obstacleSpeed = 1.8;

bestScoreText.textContent = bestScore;

function startGame() {
  score = 0;
  obstacleSpeed = 1.8;
  isPlaying = true;
  isJumping = false;

  scoreText.textContent = score;
  messageBox.classList.add('hidden');

  player.classList.remove('jump');
  obstacle.classList.remove('move');
  obstacle.style.animationDuration = `${obstacleSpeed}s`;

  // 애니메이션을 처음부터 다시 시작하기 위한 처리
  void obstacle.offsetWidth;
  obstacle.classList.add('move');

  clearInterval(scoreTimer);
  clearInterval(collisionTimer);
  clearInterval(difficultyTimer);

  scoreTimer = setInterval(() => {
    score += 1;
    scoreText.textContent = score;
  }, 100);

  collisionTimer = setInterval(checkCollision, 10);

  difficultyTimer = setInterval(() => {
    if (obstacleSpeed > 0.9) {
      obstacleSpeed -= 0.08;
      obstacle.style.animationDuration = `${obstacleSpeed}s`;
    }
  }, 5000);
}

function jump() {
  if (!isPlaying) {
    startGame();
    return;
  }

  if (isJumping) return;

  isJumping = true;
  player.classList.add('jump');

  setTimeout(() => {
    player.classList.remove('jump');
    isJumping = false;
  }, 620);
}

function checkCollision() {
  const playerRect = player.getBoundingClientRect();
  const obstacleRect = obstacle.getBoundingClientRect();

  const isHit =
    playerRect.left < obstacleRect.right &&
    playerRect.right > obstacleRect.left &&
    playerRect.top < obstacleRect.bottom &&
    playerRect.bottom > obstacleRect.top;

  if (isHit) {
    gameOver();
  }
}

function gameOver() {
  isPlaying = false;

  clearInterval(scoreTimer);
  clearInterval(collisionTimer);
  clearInterval(difficultyTimer);

  obstacle.classList.remove('move');

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('jumpGameBestScore', bestScore);
    bestScoreText.textContent = bestScore;
  }

  messageBox.classList.remove('hidden');
  messageBox.innerHTML = `
    <h2>게임 오버</h2>
    <p>점수: ${score}</p>
    <p>스페이스바 또는 화면 클릭으로 다시 시작하세요.</p>
  `;
}

startButton.addEventListener('click', startGame);
gameContainer.addEventListener('click', jump);

document.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    jump();
  }
});
