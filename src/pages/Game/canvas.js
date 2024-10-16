import gsap from 'gsap';
export const getGame = () => {
  const canvas = document.querySelector('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const c = canvas.getContext('2d');

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.random() * (max - min + 1) + min; // The maximum is inclusive and the minimum is inclusive
  }

  const getDistance = (x1, y1, x2, y2) => {
    let xDistance = x2 - x1;
    let yDistance = y2 - y1;

    return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
  };

  const getRandomStartEnemy = (radius) => {
    let x;
    let y;
    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? -radius : canvas.width + radius;
      y = getRandomInt(0, canvas.height);
    } else {
      x = getRandomInt(0, canvas.width);
      y = Math.random() < 0.5 ? -radius : canvas.height + radius;
    }
    return { x, y };
  };

  const getVelocities = (start, end, speed) => {
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const velocities = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    };
    return velocities;
  };

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  function Player(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.draw = () => {
      c.beginPath();
      c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
      c.fillStyle = this.color;
      c.fill();
      c.closePath();
    };

    this.update = () => {
      this.draw();
    };
  }

  function Projectile(x, y, velocity, radius, color) {
    this.x = x;
    this.y = y;
    this.velocity = velocity;
    this.radius = radius;
    this.color = color;

    this.draw = () => {
      c.beginPath();
      c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
      c.fillStyle = this.color;
      c.fill();
      c.closePath();
    };

    this.update = () => {
      this.draw();
      this.x += this.velocity.x;
      this.y += this.velocity.y;
    };
  }

  function Enemy(x, y, velocity, radius, color) {
    this.x = x;
    this.y = y;
    this.velocity = velocity;
    this.radius = radius;
    this.color = color;

    this.draw = () => {
      c.beginPath();
      c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
      c.fillStyle = this.color;
      c.fill();
      c.closePath();
    };

    this.update = () => {
      this.draw();
      this.x += this.velocity.x;
      this.y += this.velocity.y;
    };
  }

  const friction = 0.985;
  function Particle(x, y, velocity, radius, color) {
    this.x = x;
    this.y = y;
    this.velocity = velocity;
    this.radius = radius;
    this.color = color;
    this.alpha = 1;

    this.draw = () => {
      c.save();
      c.globalAlpha = this.alpha;
      c.beginPath();
      c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
      c.fillStyle = this.color;
      c.fill();
      c.closePath();
      c.restore();
    };

    this.update = () => {
      this.draw();
      this.velocity.x *= friction;
      this.velocity.y *= friction;
      this.x += this.velocity.x;
      this.y += this.velocity.y;
      this.alpha -= 0.01;
    };
  }

  let player;
  const projectiles = [];
  const particles = [];
  const enemies = [];

  const spawnEnemies = () => {
    setInterval(() => {
      const radius = getRandomInt(10, 30);
      const start = getRandomStartEnemy(radius);
      const velocities = getVelocities(
        start,
        {
          x: canvas.width / 2,
          y: canvas.height / 2,
        },
        1,
      );
      const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
      enemies.push(new Enemy(start.x, start.y, velocities, radius, color));
    }, 2000);
  };
  const init = () => {
    const start = () => {
      const r = 10;
      const x = window.innerWidth / 2;
      const y = window.innerHeight / 2;
      const color = 'white';
      player = new Player(x, y, r, color);
      spawnEnemies();
    };
    ysdk.adv.showRewardedVideo({
      callbacks: {
        onClose: () => {
          start();
        },
        onError: (e) => {
          start();
        },
      },
    });
  };

  let animationId = null;

  const animate = () => {
    animationId = requestAnimationFrame(animate);
    c.fillStyle = 'rgba(0, 0, 0, 0.1)';
    c.fillRect(0, 0, canvas.width, canvas.height);
    player.update();
    particles.forEach((particle, idx) => {
      if (particle.alpha <= 0) {
        particles.slice(idx, 1);
      } else {
        particle.update();
      }
    });
    projectiles.map((projectile, idx) => {
      projectile.update();

      if (
        projectile.x + projectile.radius < 0 ||
        projectile.x - projectile.radius > canvas.width ||
        projectile.y + projectile.radius < 0 ||
        projectile.y - projectile.radius > canvas.height
      ) {
        setTimeout(() => {
          projectiles.splice(idx, 1);
        }, 0);
      }
    });
    enemies.forEach((enemy, eIdx) => {
      enemy.update();
      //Проигрыш
      if (getDistance(enemy.x, enemy.y, player.x, player.y) < enemy.radius + player.radius) {
        cancelAnimationFrame(animationId);
      }
      //Соприкосновение врага со снарядом
      projectiles.forEach((projectile, pIdx) => {
        if (
          getDistance(enemy.x, enemy.y, projectile.x, projectile.y) <
          enemy.radius + projectile.radius
        ) {
          // создаем взрыв
          for (let i = 0; i < enemy.radius * 2; i++) {
            particles.push(
              new Particle(
                enemy.x,
                enemy.y,
                {
                  x: (Math.random() - 0.5) * (Math.random() * 8),
                  y: (Math.random() - 0.5) * (Math.random() * 8),
                },
                Math.random() * 2,
                enemy.color,
              ),
            );
          }
          if (enemy.radius - 10 > 5) {
            gsap.to(enemy, {
              radius: enemy.radius - 10,
            });
            setTimeout(() => {
              projectiles.splice(pIdx, 1);
            }, 0);
          } else {
            setTimeout(() => {
              enemies.splice(eIdx, 1);
              projectiles.splice(pIdx, 1);
            }, 0);
          }
        }
      });
    });
  };

  window.addEventListener('click', (ev) => {
    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;
    const velocities = getVelocities(
      {
        x: x,
        y: y,
      },
      {
        x: ev.clientX,
        y: ev.clientY,
      },
      5,
    );
    projectiles.push(new Projectile(x, y, velocities, 5, 'white'));
  });

  init();
  animate();
};
