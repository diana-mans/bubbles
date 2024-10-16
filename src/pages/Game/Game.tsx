import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.random() * (max - min + 1) + min; // The maximum is inclusive and the minimum is inclusive
}

const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
  let xDistance = x2 - x1;
  let yDistance = y2 - y1;

  return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
};

const getRandomStartEnemy = (radius: number) => {
  let x;
  let y;
  if (Math.random() < 0.5) {
    x = Math.random() < 0.5 ? -radius : window.innerWidth + radius;
    y = getRandomInt(0, window.innerHeight);
  } else {
    x = getRandomInt(0, window.innerWidth);
    y = Math.random() < 0.5 ? -radius : window.innerWidth + radius;
  }
  return { x, y };
};

type Coordinates = {
  x: number;
  y: number;
};

type Velocity = {
  x: number;
  y: number;
};

const getVelocities = (start: Coordinates, end: Coordinates, speed: number) => {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const velocities = {
    x: Math.cos(angle) * speed,
    y: Math.sin(angle) * speed,
  };
  return velocities;
};

const Game = () => {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(true);
  const startGameBtnRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const enemyIntervalId = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    //@ts-ignore
    const canvas: HTMLCanvasElement = document.querySelector('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const c = canvas.getContext('2d');

    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });

    class Player {
      x: number;
      y: number;
      radius: number;
      color: string;

      constructor(x: number, y: number, radius: number, color: string) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
      }

      draw(c: CanvasRenderingContext2D): void {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
        c.closePath();
      }

      update = () => {
        if (c) {
          this.draw(c);
        }
      };
    }

    class Projectile {
      x: number;
      y: number;
      velocity: Velocity;
      radius: number;
      color: string;

      constructor(x: number, y: number, velocity: Velocity, radius: number, color: string) {
        this.x = x;
        this.y = y;
        this.velocity = velocity;
        this.radius = radius;
        this.color = color;
      }

      draw(c: CanvasRenderingContext2D): void {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
        c.closePath();
      }

      update = () => {
        if (c) {
          this.draw(c);
        }
        this.x += this.velocity.x;
        this.y += this.velocity.y;
      };
    }

    class Enemy {
      x: number;
      y: number;
      velocity: Velocity;
      radius: number;
      color: string;

      constructor(x: number, y: number, velocity: Velocity, radius: number, color: string) {
        this.x = x;
        this.y = y;
        this.velocity = velocity;
        this.radius = radius;
        this.color = color;
      }

      draw(c: CanvasRenderingContext2D): void {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
        c.closePath();
      }

      update = () => {
        if (c) {
          this.draw(c);
        }
        this.x += this.velocity.x;
        this.y += this.velocity.y;
      };
    }

    const friction = 0.985;

    class Particle {
      x: number;
      y: number;
      velocity: Velocity;
      radius: number;
      color: string;
      alpha: number;

      constructor(x: number, y: number, velocity: Velocity, radius: number, color: string) {
        this.x = x;
        this.y = y;
        this.velocity = velocity;
        this.radius = radius;
        this.color = color;
        this.alpha = 1;
      }

      draw(c: CanvasRenderingContext2D): void {
        c.save();
        c.globalAlpha = this.alpha;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
        c.closePath();
        c.restore();
      }

      update = () => {
        if (c) {
          this.draw(c);
        }
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.01;
      };
    }

    let player: any;
    let projectiles: any[] = [];
    let particles: any[] = [];
    let enemies: any[] = [];

    const spawnEnemies = () => {
      enemyIntervalId.current = setInterval(() => {
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
      }, 1000);
    };
    const init = () => {
      projectiles = [];
      particles = [];
      enemies = [];
      setScore(0);
      const r = 10;
      const x = window.innerWidth / 2;
      const y = window.innerHeight / 2;
      const color = 'white';
      player = new Player(x, y, r, color);
      spawnEnemies();
    };

    let animationId: number | null = null;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (c) {
        c.fillStyle = 'rgba(0, 0, 0, 0.1)';
        c.fillRect(0, 0, canvas.width, canvas.height);
      }
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
        if (
          getDistance(enemy.x, enemy.y, player.x, player.y) < enemy.radius + player.radius &&
          animationId
        ) {
          cancelAnimationFrame(animationId);
          if (enemyIntervalId.current) {
            clearInterval(enemyIntervalId.current);
          }
          enemyIntervalId.current = null;
          setGameOver(true);
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
                setScore((act) => act + 100);
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

    if (startGameBtnRef.current) {
      startGameBtnRef.current.addEventListener('click', () => {
        console.log('click');
        init();
        animate();
        setGameOver(false);
      });
    }
  }, []);

  useEffect(() => {
    if (popupRef.current) {
      if (gameOver) {
        //@ts-ignore
        popupRef.current.style.display = 'flex';
      } else {
        //@ts-ignore
        popupRef.current.style.display = 'none';
      }
    }
  }, [gameOver]);

  return (
    <div className="bg-black">
      <div className="fixed text-white text-sm ml-2 mt-1 select-none">
        <span>Счет: </span>
        <span>{score}</span>
      </div>

      <div className="fixed inset-0 flex items-center justify-center" ref={popupRef}>
        <div className="bg-white max-w-md w-full p-6 text-center">
          <h1 className="text-4xl font-bold leading-none">{score}</h1>
          <p className="text-sm text-gray-700 mb-4">Очки</p>
          <div>
            <button
              className="bg-blue-500 text-white w-full py-3 rounded-full"
              ref={startGameBtnRef}>
              Начать Игру
            </button>
          </div>
        </div>
      </div>
      <canvas></canvas>
    </div>
  );
};

export default Game;
