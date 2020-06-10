/*TODO : Add a bomb item that can be collected every 10 or so coins.  Allows a space bar press to clear all enemies.
        Add a coin-pickup animation.
        Add a death animation?
        Set a win condition?
        Balance difficulty?
        Figure out larger flow control to make a game over/restart screen.
        !!!Refactor ALL THE THINGS to be dynamically generated based on canvas size rather than hardcoded. 
        Allow canvas size to be changed to 600 + 400/500/600 (instead of the current 600(enemy spawn space) + 300 (3x3 play-area)) to allow larger playing grids...add other obstacles?  Change the inner shape of play fields?
*/
const KEYS = { LEFT: 37, RIGHT: 39, UP: 38, DOWN: 40, S: 83 }
const COIN_POSITIONS = { 1: { x : 350, y: 350 }, 
2: { x : 450, y: 350},
3: { x : 550, y: 350},
4: { x : 350, y: 450},
5: { x : 550, y: 450},
6: { x : 350, y: 550},
7: { x : 450, y: 550},
8: { x : 550, y: 550}}
const ANIMATION_FRAMES = 10
let enemyFrequency = 60
let currentSpeed = 5
let enemySpeed = 5


class Game {
    constructor() {

        let canvas = document.querySelector(".game")
        let ctx = canvas.getContext("2d") 
        let gameSize = { x: canvas.width, y: canvas.height }
        this.bodies = []
        this.bodies = this.bodies.concat(new Player(this, gameSize))
        this.tickCount = 58
        this.coin = new Coin(this)
        this.coinCount = 0;
        this.isBegun = false
        this.music = document.getElementById("music")

        this.music.load()

        let tick = () => {
            this.update(gameSize, ctx)
            this.draw(ctx, gameSize)
            requestAnimationFrame(tick)
        }
        
        tick()
    }

    update (gameSize, ctx) {
        let collidingWithAnything = (b1) => {
            return this.bodies.filter(function (b2) { return colliding(b1, b2) }).length > 0
        }

        //checks for a collision.  If so, alerts player, resets game state
        if (this.bodies.length > 1) {
            let enemies = this.bodies.slice(1)
            for (let enemy in enemies) {
                if (collidingWithAnything(this.bodies[0], enemy)) {
                    this.music.pause()
                    this.music.load()
                    alert("You have lost.  Click to play again.")
                    this.bodies = []
                    this.bodies = this.bodies.concat(new Player(this, gameSize))
                    this.tickCount = 0
                    this.coin = new Coin(this)
                    this.coinCount = 0
                    enemyFrequency = 60 
                    this.isBegun = false
                }
            }
        }
        
        //determines whether player picks up a coin, increments coin count, adds a new coin
        if (Math.abs(this.bodies[0].center.x - this.coin.center.x) < 5 && Math.abs(this.bodies[0].center.y - this.coin.center.y) < 5) {
            this.coinCount += 1
            this.coin = new Coin(this)
        }
        
        //increases difficulty as score increases...needs balancing
        if (this.coinCount === 0) {
            this.tickCount = 58 //This is a fun number to set to 59!!!
        } else if (this.coinCount === 1) {
            this.isBegun = true
            this.music.play()
        } else if (this.coinCount === 10) {
            enemyFrequency = 50
        } else if (this.coinCount === 20) {
            enemyFrequency = 40
        } else if (this.coinCount === 30) {
            enemyFrequency = 35
        } else if (this.coinCount === 40) {
            enemyFrequency = 30
        } else if (this.coinCount === 50) {
            enemyFrequency = 25
        } else if (this.coinCount === 60) {
            enemyFrequency = 20
        } else if (this.coinCount === 70) {
            enemyFrequency = 15
        }
        

        //decides whether to spawn an enemy...frequence increases as coin count increases.
        this.tickCount = (this.tickCount + 1) % enemyFrequency;
        if (this.tickCount === 0) {
            this.bodies = this.bodies.concat(new Enemy(this))
        }

        let isOnscreen = (body) => {
            return body.center.x >= -20 && body.center.x <= 920 && body.center.y >= -20 && body.center.y <= 920
        }

        //Throw away bodies that go offscreen...no need for them to ride off into the sunset
        this.bodies = this.bodies.filter(isOnscreen)

        // Call update on every body.  Keep this?  USE INSTANCEOF to check type and render appropriately
        for (let i = 0; i < this.bodies.length; i++) {
          this.bodies[i].update()
        }
    }
    
    draw(ctx, gameSize) {

        ctx.clearRect(0, 0, gameSize.x, gameSize.y)
  
        //draws background
        ctx.fillStyle = "rgb(152, 173, 155)"
        ctx.fillRect(0,0,gameSize.x, gameSize.y)
        ctx.fillStyle = "rgb(80, 146, 100)"
        ctx.fillRect(300, 300, 300, 300)
        ctx.fillStyle = "black"

        drawCoin(ctx, this.coin)

        drawScore(ctx, this.coinCount)

        if (!this.isBegun) {
            drawWelcome(ctx) 
        }

        

        // Draw each body as a rectangle.
        for (let i = 0; i < this.bodies.length; i++) {
          drawRect(ctx, this.bodies[i])
        }
    }
}



class Player {
    constructor (game, gameSize) {
        this.animationFramesLeft = 0
        this.animationDirection = null
        this.game = game
        this.size = { x: 40, y: 40 }
        this.center = { x: gameSize.x / 2, y: gameSize.y / 2 }
        this.color = "purple"
    
        // Create a keyboard object to track button presses.
        this.keyboarder = new Keyboarder()         
    }

    update() {

        if (this.animationFramesLeft !== 0) {
            if (this.animationDirection === KEYS.LEFT) {
                this.center.x -= 100 / ANIMATION_FRAMES
                this.animationFramesLeft -= 1
            } else if (this.animationDirection === KEYS.RIGHT) {
                this.center.x += 100 / ANIMATION_FRAMES
                this.animationFramesLeft -= 1
            } else if (this.animationDirection === KEYS.UP) {
                this.center.y -= 100 / ANIMATION_FRAMES
                this.animationFramesLeft -= 1
            } else if (this.animationDirection === KEYS.DOWN) {
                this.center.y += 100 / ANIMATION_FRAMES
                this.animationFramesLeft -= 1
            } 
        } else {
            if (this.keyboarder.isDown(KEYS.LEFT) && this.center.x > 350) {
                this.animationFramesLeft = ANIMATION_FRAMES
                this.animationDirection = KEYS.LEFT
            } else if (this.keyboarder.isDown(KEYS.RIGHT) && this.center.x < 550) {
                this.animationFramesLeft = ANIMATION_FRAMES
                this.animationDirection = KEYS.RIGHT
            } else if (this.keyboarder.isDown(KEYS.UP) && this.center.y > 350) {
                this.animationFramesLeft = ANIMATION_FRAMES
                this.animationDirection = KEYS.UP
            } else if (this.keyboarder.isDown(KEYS.DOWN) && this.center.y < 550) {
                this.animationFramesLeft = ANIMATION_FRAMES
                this.animationDirection = KEYS.DOWN
            }
        }
    }
}

class Enemy {
    constructor(game) {
        this.game = game
        this.POSITIONS = { 1: { x: -20, y: 350 }, 
                           2: { x : -20, y: 450},
                           3: { x : -20, y: 550},
                           4: { x : 350, y: 920},
                           5: { x : 450, y: 920},
                           6: { x : 550, y: 920},
                           7: { x : 920, y: 550},
                           8: { x : 920, y: 450},
                           9: { x : 920, y: 350},
                           10: { x : 350, y: -20},
                           11: { x : 450, y: -20},
                           12: { x : 550, y: -20}}
        this.size = { x: 20, y: 20 }
        this.random = Math.floor(Math.random() * 12) + 1
        this.center = this.POSITIONS[this.random]
        this.color = "black"
    }

    update() {
        if (this.random >= 1 && this.random <= 3) {
            this.center.x += enemySpeed
        } else if (this.random >= 4 && this.random <= 6) {
            this.center.y -= enemySpeed
        } else if (this.random >= 7 && this.random <= 9) {
            this.center.x -= enemySpeed
        } else {
            this.center.y += enemySpeed
        }
    }
}

class Coin {
    constructor (game) {
        this.game = game;
        this.center = getCoinCenter(this.game)
    }
}

class Keyboarder {
  constructor() { 
    let keyState = {}
    
    window.addEventListener('keydown', function (event) {
        keyState[event.keyCode] = true
       // console.log(event.keyCode + "is pressed")
      })

      window.addEventListener('keyup', function (event) {
        keyState[event.keyCode] = false
       // console.log(event.keyCode + "is released")
      })
      
      this.isDown = function (keyCode) {
        return keyState[keyCode] === true
      }
    }
}

function drawRect (ctx, body) {
    ctx.fillStyle = body.color
    ctx.fillRect(body.center.x - body.size.x / 2, body.center.y - body.size.y / 2,
      body.size.x, body.size.y)
    ctx.fillStyle = "black"
  }

function drawCoin (ctx, body) {
    ctx.arc(body.center.x, body.center.y, 30, 0, Math.PI * 2)
    ctx.fillStyle = "gold"
    ctx.fill()
    ctx.beginPath()
    ctx.arc(body.center.x, body.center.y, 22, 0, Math.PI * 2)
    ctx.fillStyle = "orange"
    ctx.fill()
    ctx.beginPath()
    ctx.fillStyle = "gold"
    ctx.arc(body.center.x, body.center.y, 20, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = "black"
    ctx.font = "35px sans-serif"
    ctx.strokeText("$", body.center.x - 10, body.center.y + 12)
}
  
function getCoinCenter(body) {
    let r = Math.floor(Math.random() * 8) + 1
    while (COIN_POSITIONS[r].x === body.x && COIN_POSITIONS[r].y === body.y) {
        r = Math.floor(Math.random() * 8) + 1
    }
    return COIN_POSITIONS[r]
}

function colliding(b1, b2) {
    return !(
      b1 === b2 ||
            //player right < enemy left
          b1.center.x + b1.size.x / 2 < b2.center.x - b2.size.x / 2 ||
            //player bottom < enemy top
          b1.center.y + b1.size.y / 2 < b2.center.y - b2.size.y / 2 ||
            //player left  > enemy right
          b1.center.x - b1.size.x / 2 > b2.center.x + b2.size.x / 2 ||
            //player top > enemy bottom
          b1.center.y - b1.size.y / 2 > b2.center.y + b2.size.y / 2
    )
  }
  
  function drawScore(ctx, score) {
    ctx.fillStyle = "black"
    ctx.font = "75px sans-serif"
    ctx.strokeText("Score: " + score, 50, 850)
  }

  function drawWelcome(ctx) {
        ctx.fillStyle = "black"
        ctx.font = "75px sans-serif"
        ctx.strokeText("Grab the coin to begin!", 50, 750)
  }



window.addEventListener('load', function () {
    new Game()
})
