// --- Game Setup ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 400;

// --- Particle System ---
class Particle {
  constructor(x, y, color, velocityX = 0, velocityY = 0) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.velocityX = velocityX || (Math.random() - 0.5) * 6;
    this.velocityY = velocityY || Math.random() * -4 - 2;
    this.life = 1;
    this.size = Math.random() * 4 + 2;
    this.decay = Math.random() * 0.02 + 0.01;
  }

  update() {
    this.life -= this.decay;
    this.x += this.velocityX;
    this.y += this.velocityY;
    this.velocityY += 0.15; // gravity
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(x, y, color, count = 8, velocityX = 0, velocityY = 0) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color, velocityX, velocityY));
    }
  }

  update() {
    this.particles = this.particles.filter(p => p.life > 0);
    this.particles.forEach(p => p.update());
  }

  draw(ctx) {
    this.particles.forEach(p => p.draw(ctx));
  }
}

// --- Game Classes ---
class Player {
  constructor(game) {
    this.game = game;
    this.width = 30;
    this.height = 30;
    this.x = 50;
    this.y = this.game.groundLevel - this.height;
    this.color = "#FF6B6B";
    this.velocityY = 0;
    this.isJumping = false;
    this.isGrounded = true;
    this.rotation = 0;
  }

  drawCar() {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.rotation);

    // Car body
    ctx.fillStyle = this.color;
    ctx.fillRect(-15, -10, 30, 20);

    // Car windows
    ctx.fillStyle = "rgba(135, 206, 235, 0.6)";
    ctx.fillRect(-10, -6, 8, 6);
    ctx.fillRect(2, -6, 8, 6);

    // Wheels
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.arc(-10, 10, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(10, 10, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Wheel rims
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(-10, 10, 3, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(10, 10, 3, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.restore();
  }

  drawShield() {
    if (this.game.shieldActive) {
      ctx.save();
      ctx.strokeStyle = "rgba(100, 200, 255, 0.8)";
      ctx.lineWidth = 3;
      ctx.shadowColor = "rgba(100, 200, 255, 0.6)";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width * 1.2,
        0,
        2 * Math.PI
      );
      ctx.stroke();
      ctx.restore();
    }
  }

  draw() {
    this.drawCar();
    this.drawShield();
  }

  update() {
    if (!this.isGrounded) {
      this.velocityY += this.game.physics.gravity;
    }
    this.y += this.velocityY;

    if (this.y >= this.game.groundLevel - this.height) {
      this.y = this.game.groundLevel - this.height;
      this.velocityY = 0;
      this.isGrounded = true;
      this.isJumping = false;
      this.rotation = 0;
    } else {
      this.rotation = Math.atan2(this.velocityY, 2) * 0.3;
    }
  }

  jump() {
    if (this.isGrounded) {
      this.isGrounded = false;
      this.isJumping = true;
      this.velocityY = this.game.physics.jumpForce;
      this.game.particleSystem.emit(
        this.x + this.width / 2,
        this.y + this.height,
        "#FFD700",
        6,
        0,
        1
      );
    }
  }
}

class Obstacle {
  constructor(game) {
    this.game = game;
    this.width = 30;
    this.height = 30;
    this.x = canvas.width;
    this.y = this.game.groundLevel - this.height;
    this.color = "#E74C3C";
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  drawObstacle() {
    ctx.save();

    // Glow effect
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10 + Math.sin(this.pulsePhase) * 5;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Obstacle body with rounded corners
    ctx.fillStyle = this.color;
    this.roundRect(this.x, this.y, this.width, this.height, 5);
    ctx.fill();

    // Highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    this.roundRect(this.x + 2, this.y + 2, this.width - 4, this.height / 2 - 2, 3);
    ctx.fill();

    ctx.restore();
  }

  roundRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  draw() {
    this.drawObstacle();
  }

  update() {
    this.pulsePhase += 0.05;
    if (!this.game.timeSlowed) {
      this.x -= this.game.obstacleSpeed;
    } else {
      this.x -= this.game.obstacleSpeed / 2;
    }
  }
}

class PowerUp {
  constructor(game) {
    this.game = game;
    this.width = 25;
    this.height = 25;
    this.x = canvas.width;
    this.y = this.game.groundLevel - this.height - Math.random() * 100;
    this.duration = 5000;
    this.type = this.getRandomType();
    this.color = this.getColorForType();
    this.bobPhase = Math.random() * Math.PI * 2;
    this.rotation = 0;
  }

  getRandomType() {
    const types = ["scoreMultiplier", "shield", "highJump", "slowTime"];
    return types[Math.floor(Math.random() * types.length)];
  }

  getColorForType() {
    switch (this.type) {
      case "scoreMultiplier":
        return "#FFD700"; // Gold
      case "shield":
        return "#64C8FF"; // Sky Blue
      case "highJump":
        return "#00FF88"; // Lime Green
      case "slowTime":
        return "#B24BFF"; // Purple
      default:
        return "#FFFFFF";
    }
  }

  drawPowerUp() {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.rotation);

    // Glow effect
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Star shape
    ctx.fillStyle = this.color;
    this.drawStar(0, 0, 5, this.width / 2, this.width / 4);
    ctx.fill();

    // Inner glow
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    this.drawStar(0, 0, 5, this.width / 3.5, this.width / 6);
    ctx.fill();

    ctx.restore();
  }

  drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }

  draw() {
    this.drawPowerUp();
  }

  update() {
    this.bobPhase += 0.05;
    this.rotation += 0.1;
    this.y += Math.sin(this.bobPhase) * 0.5; // Bobbing motion

    if (!this.game.timeSlowed) {
      this.x -= this.game.obstacleSpeed;
    } else {
      this.x -= this.game.obstacleSpeed / 2;
    }
  }
}

class Game {
  constructor() {
    this.player = new Player(this);
    this.particleSystem = new ParticleSystem();
    this.physics = {
      gravity: 0.5,
      jumpForce: -12
    };
    this.obstacles = [];
    this.powerUps = [];
    this.obstacleSpeed = 5;
    this.obstacleInterval = 1200;
    this.powerUpInterval = 5000;
    this.lastObstacleTime = Date.now();
    this.lastPowerUpTime = Date.now();
    this.gameOver = false;
    this.score = 0;
    this.highScore = localStorage.getItem("highScore") || 0;
    this.scoreMultiplier = 1;
    this.groundLevel = canvas.height - 30;
    this.lastUpdateTime = 0;
    this.parallaxBackground = { x: 0 };
    this.shieldActive = false;
    this.timeSlowed = false;
    this.clouds = this.generateClouds();
  }

  generateClouds() {
    const clouds = [];
    for (let i = 0; i < 5; i++) {
      clouds.push({
        x: Math.random() * canvas.width,
        y: Math.random() * (this.groundLevel * 0.5),
        width: Math.random() * 80 + 60,
        height: Math.random() * 30 + 20,
        speed: Math.random() * 0.3 + 0.1
      });
    }
    return clouds;
  }

  drawCloud(cloud) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.width * 0.3, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.width * 0.3, cloud.y - cloud.height * 0.2, cloud.width * 0.4, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.width * 0.6, cloud.y, cloud.width * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  drawEnhancedBackground() {
    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, this.groundLevel);
    skyGradient.addColorStop(0, "#87CEEB");
    skyGradient.addColorStop(1, "#E0F6FF");
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, this.groundLevel);

    // Clouds
    this.clouds.forEach(cloud => {
      this.drawCloud(cloud);
      cloud.x -= cloud.speed;
      if (cloud.x + cloud.width < 0) {
        cloud.x = canvas.width;
      }
    });

    // Ground
    const groundGradient = ctx.createLinearGradient(0, this.groundLevel, 0, canvas.height);
    groundGradient.addColorStop(0, "#8B7355");
    groundGradient.addColorStop(1, "#6B5344");
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, this.groundLevel, canvas.width, canvas.height - this.groundLevel);

    // Road lane lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    ctx.moveTo(0, this.groundLevel + 10);
    ctx.lineTo(canvas.width, this.groundLevel + 10);
    ctx.stroke();
    ctx.setLineDash([]);

    // Parallax shift
    this.parallaxBackground.x -= 0.5;
    if (this.parallaxBackground.x < -canvas.width) {
      this.parallaxBackground.x = 0;
    }
  }

  drawUI() {
    ctx.save();
    ctx.font = "bold 18px 'Orbitron', sans-serif";
    ctx.textAlign = "left";

    // Score with glow
    ctx.fillStyle = "white";
    ctx.shadowColor = "rgba(102, 126, 234, 0.8)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText(`Score: ${Math.floor(this.score)}`, 15, 35);

    ctx.textAlign = "right";
    ctx.fillText(`High: ${Math.floor(this.highScore)}`, canvas.width - 15, 35);

    ctx.textAlign = "center";
    if (this.scoreMultiplier > 1) {
      ctx.fillStyle = "#FFD700";
      ctx.shadowColor = "rgba(255, 215, 0, 0.8)";
      ctx.fillText(`x${this.scoreMultiplier}`, canvas.width / 2, 35);
    }

    if (this.shieldActive) {
      ctx.fillStyle = "#64C8FF";
      ctx.shadowColor = "rgba(100, 200, 255, 0.8)";
      ctx.font = "bold 16px 'Orbitron', sans-serif";
      ctx.fillText("🛡 SHIELD", canvas.width / 2, 60);
    }

    if (this.timeSlowed) {
      ctx.fillStyle = "#B24BFF";
      ctx.shadowColor = "rgba(178, 75, 255, 0.8)";
      ctx.font = "bold 16px 'Orbitron', sans-serif";
      ctx.fillText("⏱ SLOW", canvas.width / 2, 75);
    }

    ctx.restore();
  }

  generateObstacle() {
    const currentTime = Date.now();
    const interval = this.timeSlowed
      ? this.obstacleInterval * 2
      : this.obstacleInterval;
    if (currentTime - this.lastObstacleTime > interval) {
      this.obstacles.push(new Obstacle(this));
      this.lastObstacleTime = currentTime;
    }
  }

  generatePowerUp() {
    const currentTime = Date.now();
    const interval = this.timeSlowed
      ? this.powerUpInterval * 2
      : this.powerUpInterval;
    if (currentTime - this.lastPowerUpTime > interval) {
      this.powerUps.push(new PowerUp(this));
      this.lastPowerUpTime = currentTime;
    }
  }

  checkCollision() {
    this.obstacles.forEach((obstacle, index) => {
      if (
        this.player.x < obstacle.x + obstacle.width &&
        this.player.x + this.player.width > obstacle.x &&
        this.player.y < obstacle.y + obstacle.height &&
        this.player.y + this.player.height > obstacle.y
      ) {
        if (this.shieldActive) {
          this.shieldActive = false;
          this.game.particleSystem.emit(
            obstacle.x + obstacle.width / 2,
            obstacle.y + obstacle.height / 2,
            "#64C8FF",
            12
          );
          this.obstacles.splice(index, 1);
        } else {
          this.game.particleSystem.emit(
            this.player.x + this.player.width / 2,
            this.player.y + this.player.height / 2,
            "#FF6B6B",
            15
          );
          this.endGame();
        }
      }
    });

    this.powerUps.forEach((powerUp, index) => {
      if (
        this.player.x < powerUp.x + powerUp.width &&
        this.player.x + this.player.width > powerUp.x &&
        this.player.y < powerUp.y + powerUp.height &&
        this.player.y + this.player.height > powerUp.y
      ) {
        this.game.particleSystem.emit(
          powerUp.x + powerUp.width / 2,
          powerUp.y + powerUp.height / 2,
          powerUp.color,
          10
        );
        this.powerUps.splice(index, 1);
        this.activatePowerUp(powerUp);
      }
    });
  }

  activatePowerUp(powerUp) {
    switch (powerUp.type) {
      case "scoreMultiplier":
        this.scoreMultiplier = 2;
        setTimeout(() => {
          this.scoreMultiplier = 1;
        }, powerUp.duration);
        break;
      case "shield":
        this.shieldActive = true;
        setTimeout(() => {
          this.shieldActive = false;
        }, powerUp.duration);
        break;
      case "highJump":
        const originalJumpForce = this.physics.jumpForce;
        this.physics.jumpForce = -18;
        setTimeout(() => {
          this.physics.jumpForce = originalJumpForce;
        }, powerUp.duration);
        break;
      case "slowTime":
        this.timeSlowed = true;
        setTimeout(() => {
          this.timeSlowed = false;
        }, powerUp.duration);
        break;
    }
  }

  updateDifficulty() {
    const speedMultiplier = this.timeSlowed ? 0.5 : 1;
    this.obstacleSpeed += 0.001 * speedMultiplier;
    if (this.obstacleInterval > 500) {
      this.obstacleInterval -= 0.1 * speedMultiplier;
    }
  }

  endGame() {
    this.gameOver = true;
    this.updateHighScore();
  }

  drawGameOver() {
    // Semi-transparent overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.font = "bold 48px 'Press Start 2P', sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#FF6B6B";
    ctx.shadowColor = "rgba(255, 107, 107, 0.8)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 60);

    ctx.font = "24px 'Orbitron', sans-serif";
    ctx.fillStyle = "white";
    ctx.shadowBlur = 10;
    ctx.fillText(`Score: ${Math.floor(this.score)}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText(`Best: ${Math.floor(this.highScore)}`, canvas.width / 2, canvas.height / 2 + 40);

    ctx.font = "18px 'Orbitron', sans-serif";
    ctx.fillStyle = "#FFD700";
    ctx.fillText("Press SPACE to Restart", canvas.width / 2, canvas.height / 2 + 90);
    ctx.restore();
  }

  updateHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem("highScore", this.highScore);
    }
  }

  restart() {
    this.player = new Player(this);
    this.obstacles = [];
    this.powerUps = [];
    this.particleSystem = new ParticleSystem();
    this.obstacleSpeed = 5;
    this.obstacleInterval = 1200;
    this.score = 0;
    this.scoreMultiplier = 1;
    this.gameOver = false;
    this.lastObstacleTime = Date.now();
    this.lastPowerUpTime = Date.now();
    this.shieldActive = false;
    this.timeSlowed = false;
    this.gameLoop(0);
  }

  gameLoop(timestamp) {
    const deltaTime = timestamp - this.lastUpdateTime;
    this.lastUpdateTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drawEnhancedBackground();

    if (!this.gameOver) {
      this.player.update();
      this.obstacles.forEach((obstacle) => obstacle.update());
      this.powerUps.forEach((powerUp) => powerUp.update());
      this.particleSystem.update();

      this.generateObstacle();
      this.generatePowerUp();
      this.checkCollision();
      this.updateDifficulty();
      this.score += this.scoreMultiplier;

      this.obstacles = this.obstacles.filter(
        (obstacle) => obstacle.x + obstacle.width > 0
      );
      this.powerUps = this.powerUps.filter(
        (powerUp) => powerUp.x + powerUp.width > 0
      );

      this.player.draw();
      this.obstacles.forEach((obstacle) => obstacle.draw());
      this.powerUps.forEach((powerUp) => powerUp.draw());
      this.particleSystem.draw(ctx);
    } else {
      this.drawGameOver();
    }

    this.drawUI();
    requestAnimationFrame(this.gameLoop.bind(this));
  }
}

// --- Event Listeners ---
document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    if (myGame.gameOver) {
      myGame.restart();
    } else {
      myGame.player.jump();
    }
  }
});

// --- Start the game ---
const myGame = new Game();
myGame.gameLoop(0);