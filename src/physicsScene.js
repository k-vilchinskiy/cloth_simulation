import {
    DoubleSide,
    Vector3,
    Mesh,
    Line,
    LineBasicMaterial,
    LineSegments,
    MeshBasicMaterial,
    MeshPhongMaterial,
    WireframeGeometry,
    PlaneGeometry,
    SphereGeometry,
    TriangleStripDrawMode
} from 'three'
import threeScene from './threeScene.js'
import { Engine } from './physicsGpu/engine.js'
import {ConstraintBody} from './physics2/objects/constraintBody.js'
import { PhysicsObject } from './physics2/objects/physicsObject.js'

var physicsScene = {
    engine:null,
    paused: false,
    gravity : new Vector3(0.0, -10, 0.0),
    objects : [],
    cloth: null,
    constraints : [],
    dt : 1.0 / 60.0,
    subSteps: 50,
    worldSize: {x:20, y:10, z:20}
}

function addPlane(x,y,z, color){
    let geometry = new PlaneGeometry(4,4,150,150)
    geometry.rotateX(Math.PI/2)
    geometry.translate(x,y,z)
    geometry.rotateY(Math.PI/2)
    
    let material = new MeshPhongMaterial({
        color: color,
        side: DoubleSide, 
        flatShading : true,
        //shininess: 150,
        //wireframe: true
    })
    let mesh = new Mesh(geometry, material)
    threeScene.add(mesh)
    let obj = new ConstraintBody(geometry)
    // for(var z = 2; z < obj.pos.length; z+=3){
    //     obj.pos[z] += Math.random()/100
    // }
    obj.mass[0] = 0.0
    // obj.pos[0] = -0.1
    // obj.pos[1] = 1
    // obj.pos[2] = -0.2
    //obj.mass[(geometry.parameters.heightSegments)*(geometry.parameters.widthSegments+1)] = 0.0

    // let left = geometry.parameters.heightSegments*3
    // obj.pos[left] = -0.1
    // obj.pos[left+1] = 1
    // obj.pos[left+2] = 0.2
    obj.mass[(geometry.parameters.heightSegments)] = 0.0

    // physicsScene.engine.constraints.push({start: {objectId:0,particleId:0}, end:[-0.5,4,-0.8], len:1.0})

    // physicsScene.engine.constraints.push({start: {objectId:0,particleId:(geometry.parameters.heightSegments)*3}, end:[-0.5,4,0.8], len:1.0})


    physicsScene.engine.add(obj)
}

async function init(){

    physicsScene.engine = new Engine()
    await physicsScene.engine.init()

    addPlane(0, 5, -1, 0xff8800)

    // threeScene.load(
    //     './data/models/Realistic_White_Female_Low_Poly.obj',
    //     //'./data/models/female.obj',
    //     function(obj){
    //         obj.children[0].geometry.rotateY(-Math.PI/2)
    //         obj.children[0].geometry.scale(0.1,0.1,0.1)
    //         physicsScene.engine.add(new PhysicsObject(obj.children[0].geometry, {mass:0.0}))
    //         threeScene.add(obj)
    //         //physics.addMesh(obj.children[0])
    //     }
    // )

    // let geometry = new SphereGeometry(0.1, 4, 4).translate(-0.5,4,0)
    // var material = new MeshBasicMaterial({
    //     color: 0xFF0000//new Color(this.pos.x/2, this.pos.y/2,this.pos.z/2)
    // })
    // let visMesh = new Mesh(geometry, material)
    // threeScene.add(visMesh)

    }

async function simulate(){
    const dt = physicsScene.dt / physicsScene.subSteps
    let i = physicsScene.subSteps
    physicsScene.gravity.z = Math.random()*2-0.9
    if(Math.abs(physicsScene.gravity.z)>10){
        physicsScene.gravity.z*0.5
    }
    //while(i--){
        await physicsScene.engine.simulate(dt, physicsScene.gravity)

        // for (var o of physicsScene.objects) {
        //     physics.handleGroundCollision(o)
        //     physics.handleWallCollision(o, physicsScene.worldSize)

        //     o.simulate(dt, physicsScene.gravity)

            

        //     const nearBy = physicsScene.spatialHash.getNearby(o)
        //     let k = nearBy.length
        //     while(k--) {
        //             physics.handleObjectCollisions(o, physicsScene.objects[nearBy[k]], dt)
        //     }
        //     physicsScene.spatialHash.update(o)
        // }

        //this.cloth.map(c=>c.simulate(dt, physicsScene.gravity))

        // for (var c of physicsScene.constraints) {
        //     c.simulate(dt)
        // }
    //}
    // physicsScene.objects.map(o => o.update())
    // physicsScene.constraints.map(c => c.update())
    //this.cloth.map(c=>c.update())
}

export default {
    init: init,
    simulate: simulate
}

