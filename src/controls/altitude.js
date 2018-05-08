const Control = require('../classes/control')

class Altitude extends Control{
  constructor(args){
    super(args)
    this.yAccel = 0
  }

  resetFall(){
    this.yAccel = 4
  }

  startJump(){
    this.yAccel -= 12
    this.owner.changeState('flying')
  }

  startBounce(){
    this.yAccel = -5
  }

  flap(){
    this.yAccel -= Math.max(0, this.yAccel * 0.9)
    // this.owner.controls.sprite.setCurrentAnimation("jump")
  }

  fall(){
    // this.owner.controls.sprite.setCurrentAnimation("fall")
  }

  update(){
      // this.yAccel = Math.max(this.yAccel, -9)
      this.owner.controls.transform.moveDown(this.yAccel * (this.getGame().dt / 30))
      this.yAccel += 0.6 * (this.getGame().dt / 30)
  }
}

module.exports = Altitude