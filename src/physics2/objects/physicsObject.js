class PhysicsObject{
    constructor(geometry, options){
        options = options||{}
        this.geometry = geometry
        this.pos = geometry.attributes.position.array
        this.vel = new Float32Array(this.pos.length)
        this.prevPos = new Float32Array(this.pos.length)
        this.mass = new Float32Array(this.pos.length/3).fill(options.mass||1.0)

        this.radius = 0.05
    }

    update(){
        this.geometry.attributes.position.needsUpdate = true;
    }
}

export {PhysicsObject}