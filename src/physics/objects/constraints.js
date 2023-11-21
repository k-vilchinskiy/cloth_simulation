import {
    Color,
    Vector3,
    BufferGeometry,
    SphereGeometry,
    Mesh,
    MeshPhongMaterial,
    LineBasicMaterial,
    Line,
} from 'three'
import threeScene from '../../threeScene.js'

class Constraint{
    constructor(o1, o2, l){
        this.o1 = o1
        this.o2 = o2
        this.subV = new Vector3().subVectors(o2.pos, o1.pos)
        this.l = l || this.subV.length()

        this.addToScene()
    }

    simulate(dt){
        var alpha = 0.0/dt/dt
        this.subV.subVectors(this.o2.pos, this.o1.pos)
        const d = this.subV.length()

        var corr = (this.l - d) / d / (this.o1.invMass + this.o2.invMass + alpha)

        this.o1.pos.addScaledVector(this.subV, -this.o1.invMass * corr)
        this.o2.pos.addScaledVector(this.subV, this.o2.invMass * corr)

        this.o1.simulateConstraint(dt)
        this.o2.simulateConstraint(dt)
    }

    addToScene(){
        const material = new LineBasicMaterial( { color: 0x0000ff } );
        const geometry = new BufferGeometry().setFromPoints( [this.o1.pos, this.o2.pos] );
        this.line = new Line( geometry, material );
        threeScene.add(this.line)
    }

    update(){
        this.line.geometry.attributes.position.setXYZ(0, this.o1.pos.x, this.o1.pos.y, this.o1.pos.z)
        this.line.geometry.attributes.position.setXYZ(1, this.o2.pos.x, this.o2.pos.y, this.o2.pos.z)
        this.line.geometry.attributes.position.needsUpdate = true;

    }
}

export {Constraint}