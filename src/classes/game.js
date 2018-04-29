const Stack = require('../lib/stack')
const StateMachine = require('./statemachine')
const Scene = require('./scene')
const renderer = require('../core/renderer')

var instance
var loop
var lastTime

class Game {

  constructor(args){
    if (instance != null) {
      console.warn('Trying to instantiate more than one Game, returning original instance')
      return instance
    }
    this.scenes = args.scenes || {}
    this.sceneStack = new Stack()
    this.currentTime = 0
    this.dt = 0
    this.tick = this.tick.bind(this)
    instance = this
  }

  push(sceneName){
    if (this.currentScene){
      this.currentScene.exit(this, this.currentScene)
    }
    this.sceneStack.push(this.scenes[sceneName])
    this.updateCurrent()
  }

  pop(scene){
    this.currentScene.exit(this, this.currentScene)
    this.sceneStack.pop()
    this.updateCurrent()
  }

  replaceTop(sceneName){
    this.currentScene.exit(this, this.currentScene)
    this.sceneStack.pop()
    this.sceneStack.push(this.scenes[sceneName])
    this.updateCurrent()
  }

  updateCurrent(){
    this.currentScene = this.sceneStack.peek()
    this.currentScene.enter(this, this.currentScene)
  }

  start(){
    loop = requestAnimationFrame(this.tick)
  }

  stop(){
    cancelAnimationFrame(loop)
  }

  tick(timestamp){
    loop = requestAnimationFrame(this.tick);
    this.currentTime = timestamp
    if (!lastTime){
        lastTime = timestamp
    }
    this.dt = timestamp - lastTime
    this.update();
    lastTime = timestamp
  }

  update(){
    renderer.clearRect(0, 0, 320, 240)
    this.currentScene.update(this, this.currentScene)
  }
}

module.exports = Game