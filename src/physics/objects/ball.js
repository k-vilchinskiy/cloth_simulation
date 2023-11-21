import {
    Color,
    Vector3,
    SphereGeometry,
    BoxGeometry,
    Mesh,
    MeshPhongMaterial,
} from 'three'
import threeScene from '../../threeScene.js'

class Ball{
    constructor(pos, mas = 0.0, vel = new Vector3()){
        this.pos = pos
        this.prevPos = new Vector3().copy(pos)
        this.invMass = mas ? 1.0/mas : 0.0
        this.radius = mas/10
        this.vel = vel
        this.subv = new Vector3()
        this.objId = -1
        this.addToScene()
    }

    simulate(dt, force){
        if(this.invMass === 0.0) return
        this.vel.addScaledVector(force, dt)
        this.prevPos.copy(this.pos)
        this.pos.addScaledVector(this.vel, dt)
    }

    simulateConstraint(dt){
        if(this.invMass === 0.0){
            return
        }

        this.vel.x = (this.pos.x - this.prevPos.x) / dt
        this.vel.y = (this.pos.y - this.prevPos.y) / dt
        this.vel.z = (this.pos.z - this.prevPos.z) / dt
    }

    addToScene(){
        var geometry;
        if(this.invMass === 0.0){
            geometry = new BoxGeometry(0.1,0.1,0.1)
        }else{
            geometry = new SphereGeometry(this.radius, 16, 16)
        }
        var material = new MeshPhongMaterial({
            color: 0x333333//new Color(this.pos.x/2, this.pos.y/2,this.pos.z/2)
        })
        this.visMesh = new Mesh(geometry, material)
        this.visMesh.position.copy(this.pos)
        threeScene.add(this.visMesh)
    }

    update(color = 0x333333){
        if(this.invMass === 0.0){
            return
        }
        this.visMesh.position.copy(this.pos)
        //this.visMesh.material.color.set(color)
    }
}

export {Ball}