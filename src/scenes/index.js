const State = require("./classes/state.js")
const Control = require("./classes/control.js")
const StateMachine = require("./classes/statemachine.js")
const assetLoader = require("./assetloader.js")
const {game, GameObject} = require("./gameobject.js")
const SpriteDrawer = require("./spritedrawer.js")

// DOM links ===================================

const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

// =================================================

// DOM settings ================================

ctx.mozImageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.msImageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

// ==================================================

// Constants ========================================

const ANIM_FRAMERATE = 200
const SPRITE_WIDTH = 48
const SPRITE_HEIGHT = 48
const GROUND = 176

// =================================================

// Globals =========================================

var fgScrollSpeed = 0.12
var obstacleFrequency = 0.15
var sprite = new Image()
var loop
var currentScore = 0
var currentTime
var lastTime = 0
var nextScoreMilestone = 50

// =================================================

function playSound(sound){
    assetLoader.play(sound)
}

// Game object states ===========================

var loading = new State({
    enter: function(){
        cancelAnimationFrame(loop)
        assetLoader.load().then(() => this.changeState(play))
    },
})

var titleScreen = new State({
    enter: function(){
        cancelAnimationFrame(loop)
    },
    message: function(msg){
        switch(msg){
            case ("keydown"):
                this.changeState(loading)
        }
    }
})

var play = new State({
    enter: function(){
        reset()
        playSound(assetLoader.assets.caw)
        loop = requestAnimationFrame(tick)
    },
    message: function(msg){
        switch(msg){
            case ("keydown"):
                player.message("jump")
                break
            case ("keyup"):
                player.message("fall")
                break
            case ("lose"):
                setTimeout(() => {this.changeState(lose)}, 400)
        }
    },
    update: function(dt){
        this.controls.playControl.update(dt)
    }
})

var lose = new State({
    enter: function(){
        cancelAnimationFrame(loop)
    },
    message: function(msg){
        switch(msg){
            case ("keydown"):
                this.changeState(play)
        }
    }

})

// =================================================

var gameEngine = new GameObject({name: "GameEnginesObject"})

// Game engine controls =============================

// TODO: Optimize
gameEngine.controls.obstaclePoolEngine = new Control({
    owner: gameEngine,
    nextObjectPlacementTime: 0,
    activeComponents: [],
    inactiveComponents: [],
    returnToPool: function(obj){
        this.activeComponents.splice(this.activeComponents.indexOf(obj), 1)
        this.inactiveComponents.push(obj)
    },
    update: function(dt){
        if (currentTime >= this.nextObjectPlacementTime){
            var rand = Math.random()
            if (rand < obstacleFrequency) {
                var r = Math.floor(Math.random() * (this.inactiveComponents.length -1))
                var obj = this.inactiveComponents.splice(r, 1)[0]
                if (obj) {
                    this.activeComponents.push(obj)
                    obj.activate()
                    this.nextObjectPlacementTime = currentTime + 300

                }
            }
        }
    }
})

gameEngine.controls.spriteEngine = new Control({
    owner: gameEngine,
    components: [],
    update: function(dt){
        ctx.clearRect(0, 0, 320, 240)
        for (var i = 0; i < this.components.length; i++){
            var position = this.components[i].owner.controls.transform.position
            var frame = this.components[i].currentFrame
            ctx.drawImage(assetLoader.assets.sprite, frame*SPRITE_WIDTH, 0, SPRITE_WIDTH, SPRITE_HEIGHT, position[0], position[1], SPRITE_WIDTH, SPRITE_HEIGHT)
        }
    }
})

gameEngine.controls.collisionEngine = new Control({
    owner: gameEngine,
    playerCollider: undefined,
    components: [],
    isColliding: function(a, b){
        // If a is above b
        if (a[3] < b[1]) {
            return false
        }

        // If a is below b
        if (a[1] > b[3]) {
            return false
        }

        // If a is left of b
        if (a[2] < b[0]) {
            return false
        }

        // If a is right of b
        if (a[0] > b[2]) {
            return false
        }

        // Else collision
        return true
    },
    update: function(dt){
        var playerBox
        var otherBox
        var playerPos
        var otherPos
        var playerBound = []
        var otherBound = []
        for (var i = 0; i < this.components.length; i++){
            playerBox = this.playerCollider.hitBox
            playerPos = this.playerCollider.owner.controls.transform.position
            playerBound[0] = playerBox[0] + playerPos[0]
            playerBound[2] = playerBox[2] + playerPos[0]
            playerBound[1] = playerBox[1] + playerPos[1]
            playerBound[3] = playerBox[3] + playerPos[1]

            otherBox = this.components[i].hitBox
            otherPos = this.components[i].owner.controls.transform.position
            otherBound[0] = otherBox[0] + otherPos[0]
            otherBound[2] = otherBox[2] + otherPos[0]
            otherBound[1] = otherBox[1] + otherPos[1]
            otherBound[3] = otherBox[3] + otherPos[1]

            if (this.isColliding(playerBound, otherBound)){
                player.controls.playerCollider.onHit(this.components[i])
                this.components[i].onHit()
            }
        }
    }
})

// GameObject Controls ==============================

class Sprite extends Control{
    constructor(args = {}){
        super(args)
        gameEngine.controls.spriteEngine.components.push(this)
        this.currentFrameNum = 0
        this.elapsedTime = 0
        this.looping = true
        this.finished = false
        this.onFinished = function(){}
    }

    update(dt){
        this.advanceFrame(dt)
    }

    advanceFrame(dt){
        this.elapsedTime += dt
        if (this.looping){
            this.elapsedTime = this.elapsedTime % (this.numFrames * ANIM_FRAMERATE)
        } else if (!this.finished){
            if (this.elapsedTime >= this.numFrames * ANIM_FRAMERATE){
                this.onFinished()
                this.finished = true
            }
        }
        this.currentFrameNum = Math.floor (this.elapsedTime / ANIM_FRAMERATE)
        this.currentFrame = this.currentAnimation[this.currentFrameNum]
    }

    setCurrentAnimation(name, looping = true, onFinished = function(){}){
        this.looping = looping
        this.finished = false
        this.onFinished = onFinished
        if (this.currentAnimation != this.animations[name]){
            this.currentAnimation = this.animations[name]
            this.currentFrameNum = 0
            this.currentFrame = this.currentAnimation[this.currentFrameNum]
            this.numFrames = this.currentAnimation.length
            this.elapsedTime = 0
        }
    }
}

class Collider extends Control{
    constructor(args){
        super(args)
        gameEngine.controls.collisionEngine.components.push(this)
    }

    onHit(other){
        // Override
    }
}

class PlayerCollider extends Control{
    constructor(args){
        super(args)
        gameEngine.controls.collisionEngine.playerCollider = this
    }

    onHit(other){
        // Override
    }
}

class Transform extends Control{
    constructor(args){
        super(args)
        this.position = this.position || [0, GROUND - SPRITE_HEIGHT]
        this.pivot = this.pivot || [SPRITE_WIDTH/2, SPRITE_HEIGHT]
        this.center = this.center || [SPRITE_WIDTH/2, SPRITE_HEIGHT/2]
    }
}

class Scroller extends Control{
    constructor(args){
        super(args)
        this.reset()
    }
    reset(){
        this.xScroll = 0
    }
    update(dt){
        this.xScroll = (this.xScroll + fgScrollSpeed * dt)
        this.owner.controls.transform.position[0] = 320 - this.xScroll
    }
}

class ObstaclePooler extends Control{
    constructor(args){
        super(args)
        gameEngine.controls.obstaclePoolEngine.inactiveComponents.push(this)
    }

    activate(){
        this.owner.changeState(activeObstacle)
    }

    deactivate(){
        gameEngine.controls.obstaclePoolEngine.returnToPool(this)
        this.owner.changeState(inactiveObstacle)
    }

    update(dt){
        if (this.owner.controls.transform.position[0] < -SPRITE_WIDTH - 1){
            this.deactivate()
        }
    }
}

// =================================================

// Score controls ===================================

var scoreCounter = new GameObject({name: "Score"})

scoreCounter.controls.incrementControl = new Control({
    owner: scoreCounter,
    increment: function(amt){
        currentScore += amt
        if (currentScore > nextScoreMilestone){
            fgScrollSpeed += 0.01
            obstacleFrequency = Math.max(obstacleFrequency - 0.005, 0.06)
            nextScoreMilestone += 50
        }
    },
    update: function(dt){
        this.increment(dt/30)
    }
})

// =================================================

// PLAYER ============================

var player = new GameObject({name: "Player"})

// Player object controls ===========================

player.controls.transform = new Transform({
    owner: player,
    position: [40, 125]
})

player.controls.sprite = new Sprite({
    owner: player,
    animations: {
        stand: [7],
        walk: [11, 12],
        jump: [5],
        fall: [6],
        glide: [7, 8],
        hurt: [9],
        pounce: [10]
    }
})

player.controls.playerCollider = new PlayerCollider({
    owner: player,
    hitBox: [20, 26, 40, 40],
    onHit: function(other){
        this.owner.message("pounce", other)
    }
})

player.controls.altitude = new Control({
    owner: player,
    yAccel: 0,
    startJump: function(){
        this.yAccel -= 9
        this.gliding = true
    },
    bounce: function(){
        this.yAccel = -7
    },
    flap: function(){
        this.yAccel -= Math.max(0, this.yAccel * 0.9)
        this.owner.controls.sprite.setCurrentAnimation("jump")
        playSound(assetLoader.assets.flap)
    },
    fall: function(){
        this.owner.controls.sprite.setCurrentAnimation("fall")
    },
    sink: function(){
        this.yAccel = 1.5
    },
    move: function(dt){
        this.yAccel = Math.max(this.yAccel, -9)
        this.owner.controls.transform.position[1] += this.yAccel * (dt / 30)
        this.yAccel += 0.45 * (dt / 30)
        if (this.owner.controls.transform.position[1] >= GROUND - SPRITE_HEIGHT / 2){
            this.owner.changeState(sink)
        }
    }
})

// =================================================

// Player object states =========================

var walk = new State({
    enter: function(){
        this.controls.sprite.setCurrentAnimation("walk")
    },
    message: function(msg){
        switch (msg){
            case "jump":
                this.changeState(jump)
                break
            case "hurt":
                this.changeState(hurt)
                break
        }
    },
    update: function(dt){
        this.controls.sprite.update(dt)
    }
})

var sink = new State({
    enter: function(){
        this.controls.sprite.setCurrentAnimation("hurt")
        this.controls.altitude.sink()
        playSound(assetLoader.assets.slime)
        game.message("lose")
    }
})

var jump = new State({
    enter: function(){
        this.controls.sprite.setCurrentAnimation("jump")
        this.controls.altitude.startJump()
    },
    message: function(msg, e){
        switch (msg){
            case "jump":
                this.controls.altitude.flap()
                break
            case "fall":
                this.controls.altitude.fall()
                break
            case "hurt":
                this.changeState(hurt)
                break
            case "pounce":
                this.controls.sprite.setCurrentAnimation("pounce")
                this.controls.altitude.bounce()
        }
    },
    update: function(dt){
        this.controls.altitude.move(dt)
        this.controls.sprite.update(dt)
    }
})

var hurt = new State({
    enter: function(){
        playSound(assetLoader.assets.screech)
        this.controls.altitude.bounce()
        this.controls.sprite.setCurrentAnimation("hurt")
        game.message("lose")
    },
    message: function(msg){
    },
    update: function(dt){
        this.controls.altitude.move(dt)
        this.controls.sprite.update(dt)
    }
})

// =================================================

// FOOTHOLD OBJECTS ====================================

class Foothold extends GameObject{
    constructor(args){
        super(args)
        this.controls = {
            sprite: new Sprite({owner: this}),
            collider: new Collider({owner: this}),
            transform: new Transform({owner: this}),
            scroller: new Scroller({owner: this}),
            obstaclePooler: new ObstaclePooler({owner: this})
        }
    }
}

class Fern extends Foothold{
    constructor(args){
        super(args)
        this.controls.sprite.animations = {
            default: [1],
            dead: [0]
        }
        this.controls.collider.hitBox = [20, 30, 33, 48]
        this.controls.collider.onHit = function(){
            if (player.currentState == jump && player.controls.transform.position[1] < this.owner.controls.transform.position[1]){
                this.owner.changeState(deadEnemy)
                playSound(assetLoader.assets.crunch2)
            }
        }
    }
}

class Protoceratops extends Foothold{
    constructor(args){
        super(args)
        this.controls.sprite.animations = {
            default: [4]
        }
        this.controls.collider.hitBox = [3, 31, 31, 48]
        this.controls.collider.onHit = function(){
            if (player.currentState == jump && player.controls.transform.position[1] < this.owner.controls.transform.position[1]){
                playSound(assetLoader.assets.boing)
            }
        }
    }
}

class ProtoSkeleton extends Foothold{
    constructor(args){
        super(args)
        this.controls.sprite.animations = {
            default: [2],
            dead: [3]
        }
        this.controls.collider.hitBox = [3, 31, 31, 48]
        this.controls.collider.onHit = function(){
            if (player.currentState == jump && player.controls.transform.position[1] < this.owner.controls.transform.position[1]){
                this.owner.changeState(deadEnemy)
                playSound(assetLoader.assets.crunch)
            }
        }
    }
}

// ==================================================

// Foothold states ==================================

var activeObstacle = new State({
    enter: function(){
        this.controls.sprite.setCurrentAnimation("default")
        this.controls.scroller.reset()
    },
    update: function(dt){
        this.controls.scroller.update(dt)
        this.controls.obstaclePooler.update(dt)
    }
})

var inactiveObstacle = new State({
    enter: function(){
        this.controls.transform.position = [-SPRITE_WIDTH, GROUND - SPRITE_HEIGHT]
        gameEngine.controls.obstaclePoolEngine.returnToPool()
    }
})

var deadEnemy = new State({
    enter: function(){
        this.controls.sprite.setCurrentAnimation("dead", false)
    },
    update: function(dt){
        this.controls.scroller.update(dt)
        this.controls.obstaclePooler.update(dt)
        this.controls.sprite.update(dt)
    }
})
// =================================================

// Object instantiation ============================

var fern1 = new Fern({name: "Fern1"})
var fern2 = new Fern({name: "Fern2"})
var fern3 = new Fern({name: "Fern3"})
var fern4 = new Fern({name: "Fern4"})
var fern5 = new Fern({name: "Fern5"})
var proto1 = new Protoceratops({name: "Proto1"})
var protoSkel1 = new ProtoSkeleton({name: "ProtoSkel1"})
var protoSkel2 = new ProtoSkeleton({name: "ProtoSkel2"})

// =================================================

// State assignments ============================

game.changeState(titleScreen)
player.changeState(jump)
fern1.changeState(inactiveObstacle)
fern2.changeState(inactiveObstacle)
fern3.changeState(inactiveObstacle)
fern4.changeState(inactiveObstacle)
fern5.changeState(inactiveObstacle)
proto1.changeState(inactiveObstacle)
protoSkel1.changeState(inactiveObstacle)
protoSkel2.changeState(inactiveObstacle)

// =================================================


// Key listeners ===================================

var keyDown = false

document.addEventListener("keydown", e => {
    if (keyDown == false && e.keyCode == 32){
        e.preventDefault()
        keyDown = true
        game.message("keydown")
    }
})

document.addEventListener("keyup", e => {
    if (e.keyCode == 32){
        e.preventDefault()
        keyDown = false
        game.message("keyup")
    }
})

document.addEventListener("touchstart", e => {
    game.message("keydown")
    e.preventDefault()
})

document.addEventListener("touchend", e => {
    game.message("keyup")
    e.preventDefault()
})

// =================================================

// Game loop =======================================

var bgX = 0
var fgX = 0

function tick(timestamp){
    loop = requestAnimationFrame(tick);
    if (!lastTime){
        lastTime = timestamp
    }
    var dt = timestamp - lastTime
    currentTime = timestamp
    game.update(dt);
    lastTime = timestamp

}

function reset(){
    lastTime = null
    currentScore = 0
    obstacleFrequency = 0.15
    fgScrollSpeed = 0.12
    nextScoreMilestone = 50
    player.controls.transform.position = [40, 125]
    player.changeState(jump)

}

// =================================================

// Export module ===================================

module.exports = {StateMachine}