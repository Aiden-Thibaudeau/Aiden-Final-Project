export class UIManager {
  constructor() {
    this.restartBtn = document.getElementById('restartBtn');
  }

  updateStockDisplay(player, playerId) {
    const containerId = playerId === 'player1' ? 'player1Stock' : 'player2Stock';
    const stockContainer = document.getElementById(containerId);

    if (!stockContainer) return;

    stockContainer.innerHTML = '';
    for (let i = 0; i < player.stocks; i++) {
      const heart = document.createElement('img');
      heart.src = 'hearts.png';
      heart.alt = 'Heart';
      stockContainer.appendChild(heart);
    }
  }

  updatePercentDisplay(player, playerId) {
    const percentId = playerId === 'player1' ? 'player1Percent' : 'player2Percent';
    const percentContainer = document.getElementById(percentId);

    if (!percentContainer) return;

    percentContainer.textContent = `${Math.round((player.knockbackMultiplier - 1) * 10)}%`;
  }

  showRestartButton() {
    if (this.restartBtn) {
      this.restartBtn.style.display = 'block';
    }
  }

  hideRestartButton() {
    if (this.restartBtn) {
      this.restartBtn.style.display = 'none';
    }
  }

  onRestartClick(callback) {
    if (this.restartBtn) {
      this.restartBtn.addEventListener('click', callback);
    }
  }
}