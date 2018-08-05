const Control = require('../classes/control')
const renderer = require('../core/renderer')
const Camera = require('../controls/camera')

class MapCollisionEngine extends Control{
  constructor(args){
    super(args)
    this.name = 'mapCollisionEngine'
    this.tileMap = args.tileMap
    this.tag = this.tileMap.name
    this.components = []
  }

  init(){
    this.components = this.owner.scene.getControlsByName('collider').filter(c => c.tags.includes(this.tag))
  }

  update(){
    for (var i = 0; i < this.components.length; i++){
      if (!this.components[i].owner.active){
        continue
      }
      var frontTile = this.tileMap.getTileAtMapPosition(...this.components[i].getWorldFrontCheckPoint())
      if (frontTile){
        frontTile.onHit(this.components[i], true)
      }
      var bottomTile = this.tileMap.getTileAtMapPosition(...this.components[i].getWorldBottomCheckPoint())
      if (bottomTile && bottomTile != frontTile){
        bottomTile.onHit(this.components[i], false)
      }
    }
  }
}

module.exports = MapCollisionEngine