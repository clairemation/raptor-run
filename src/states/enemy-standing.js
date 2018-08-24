const State = require('../classes/state')

var standing = new State({
  enter: function(){
    // this.controls.sprite.setAnimation('Rwalk')
  },
  update: function(){
    this.controls.advance.update()
    this.controls.gravity.update()
    this.controls.velocity.update()
    this.controls.sprite.update()
  },
  message: function(msg, e){
    switch(msg){
      case('keyDown'):
        this.controls.flap.startJump()
        break
      case('walkRight'):
        this.controls.advance.change(1)
        break
      case('walkLeft'):
        this.controls.advance.change(-1)
        break
      case('stop'):
        this.controls.advance.change(0)
    }
  }
})

module.exports = standing