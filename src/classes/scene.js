const AssetManager = require('./assetmanager')

var count = 1

class Scene {
    constructor(args){
        this.name = args.name || "Scene" + count++
        this.game = null
        this.objectIndices = {}
        this.objects = []
        this.assetManager = new AssetManager(args.assets)
    }

    setGame(game){
        this.game = game
    }

    enter(){
        this.game.stop()
        return this.assetManager.load().then(() => this.game.start()) // return for Promise chainability
    }

    exit(){}

    getControlsByName(name){
        var arr = []
        for (let i = 0; i < this.objects.length; i++){
            arr.push(...(this.objects[i].getControlsByName(name)))
        }
        return arr
    }

    getObjectByName(name){
        return objects[objectIndices[name]]
    }

    registerObject(obj){
        this.objects.push(obj)
        this.objectIndices[obj.name] = this.objects.length - 1
    }

    update(){
        for (let i = 0; i < this.objects.length; i++){
          this.objects[i].update()
        }
      }
}

module.exports = Scene