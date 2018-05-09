const Control = require('../classes/control')
const Math2 = require('../lib/math2')

class ObjectPoolEngine extends Control{
    constructor(args){
        super(args)
        this.tag = args.tag
        this.nextObjectPlacementTime = 0
        this.activeComponents = []
        this.inactiveComponents = []
        this.scrollingEngine = null
        this.deltaPixels = 0
        this.waitTime = 0
        this.layer = args.layer || 'foreground'
        this.objectFrequency = args.objectFrequency || 0.75
        this.minInterval = args.minInterval || 75
        this.maxInterval = args.maxInterval || 90
        this.minOffset = args.minOffset || 0
        this.maxOffset = args.maxOffset || 0
        this.lastOffset = 0
        this.intervalWidth = 0
    }

    init(){
        var components = this.owner.scene.getControlsByName('objectpooler').filter(objPooler => objPooler.tag == this.tag)
        this.inactiveComponents = components.filter(c => c.owner.currentStateName == 'inactive')
        this.activeComponents = components.filter(c => c.owner.currentStateName != 'inactive')
        for (let i = 0; i < this.inactiveComponents.length; i++){
            this.inactiveComponents[i].setObjectPool(this)
        }
        for (let i = 0; i < this.activeComponents.length; i++){
            this.activeComponents[i].setObjectPool(this)
        }
        this.scrollingEngine = this.owner.scene.getControlsByName('scrollingEngine').find(e => e.layer == this.layer)
    }

    returnToPool(obj){
        this.activeComponents.splice(this.activeComponents.indexOf(obj), 1)
        this.inactiveComponents.push(obj)
    }

    update(){

        this.deltaPixels += this.scrollingEngine.scrollAmt
        if (this.deltaPixels < this.waitTime - 2){ //Fudge factor
            return
        }

        var rand = this.intervalWidth >= this.maxInterval ? 0 : Math.random()
        if (rand < this.objectFrequency) {
            var r = Math.floor(Math.random() * (this.inactiveComponents.length -1))
            var obj = this.inactiveComponents.splice(r, 1)[0]
            if (obj) {
                this.activeComponents.push(obj)
                var offset = this.intervalWidth == 0 ? this.lastOffset : Math2.clamp(this.lastOffset + Math.ceil(Math.random() * 50 - 25), this.minOffset, this.maxOffset)
                this.lastOffset = offset
                obj.activate(offset)
                this.waitTime = obj.owner.controls.transform.width
                this.deltaPixels = 0
                this.intervalWidth = 0

            }
        } else {
            this.waitTime = this.minInterval
            this.deltaPixels = 0
            this.intervalWidth += this.minInterval
        }
    }
}

module.exports = ObjectPoolEngine