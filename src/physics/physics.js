import {
    BoxGeometry,
    InstancedMesh,
    Float32BufferAttribute,
    LineBasicMaterial,
    LineSegments,
    Matrix4,
    Mesh,
    MeshPhongMaterial,
    SphereGeometry,
    Vector3,
} from 'three'
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js'
import threeScene from '../threeScene.js';

var dots = []
var modelPos;
const restitution = 0.9
const complience = 0.0

function addWorldBounds(){
    var geometry = new BoxGeometry(
        2*physicsScene.worldSize.x,
        100,
        2*physicsScene.worldSize.z)
    var material = new LineBasicMaterial({color: 0x00ff00})
    var worldBox = new LineSegments(geometry, material)
    threeScene.add(worldBox)
}

function addMesh(obj){

    obj.geometry = mergeVertices (obj.geometry);

    var geometry = obj.geometry
    var pos = modelPos = geometry.getAttribute('position')

    var dotGeometry = new SphereGeometry(0.01, 8, 8)
    var dotMaterial = new MeshPhongMaterial({color: 0xff0000})

    var dotMesh = new InstancedMesh(dotGeometry, dotMaterial, pos.count)
    console.log(dotGeometry)
    threeScene.add(dotMesh)

    //geometry.computeBoundingBox()

    
    var color = []

    var matrix = new Matrix4()
    for (let i = 0; i < pos.count; i++) {
         const x = pos.getX(i)
         const y = pos.getY(i)
         const z = pos.getZ(i)
        // color.push(
        //     (Math.abs(x))/(geometry.boundingBox.max.x/3), 
        //     y/geometry.boundingBox.max.y, 
        //     0//z/geometry.boundingBox.max.z
        //     )
        //color.push(i/pos.count,i/pos.count,i/pos.count)
        matrix.makeTranslation(x,y,z)
        dotMesh.setMatrixAt(i, matrix)
    }

    //obj.material.vertexColors = true
    //obj.geometry.setAttribute('color', new Float32BufferAttribute(color, 3))
    
    addWorldBounds()
    //addBall()

    console.log(obj)
}

//======collisions=======
function handleGroundCollision(o){
    if(o.pos.y < o.radius){
        o.pos.y = o.radius; o.vel.y = -o.vel.y*restitution
    }
}

function handleWallCollision(o, worldSize){
    
    if(o.pos.y > worldSize.y){o.pos.y = worldSize.y; o.vel.y = -o.vel.y*restitution}

    if(o.pos.x < o.radius){o.pos.x = o.radius; o.vel.x = -o.vel.x*restitution}
    if(o.pos.x > worldSize.x){o.pos.x = worldSize.x; o.vel.x = -o.vel.x*restitution}

    if(o.pos.z < o.radius){o.pos.z = o.radius; o.vel.z = -o.vel.z*restitution}
    if(o.pos.z > worldSize.z){o.pos.z = worldSize.z; o.vel.z = -o.vel.z*restitution}
}

function handleModelCollisions(ball, m){
    var o = ball.pos
    var v = ball.vel

    //m - o
    var subv = {x: m.x - o.x, y: m.y - o.y, z: m.z - o.z}
    var lengthSq = subv.x*subv.x + subv.y*subv.y + subv.z*subv.z

    if(lengthSq < 0.01) {
        //debugger
        var d = Math.sqrt(lengthSq)
        subv.x /= d; subv.y /= d; subv.z /= d;
        var corr = (0.1 - d)

        o.x -= corr*subv.x; o.y -= corr*subv.y; o.z -= corr*subv.z

        //v dot subv
        var vcorr = v.x*subv.x + v.y*subv.y + v.z*subv.z

        v.x = -subv.x*vcorr
        v.y = -subv.y*vcorr
        v.z = -subv.z*vcorr
        //o1.vel.addScaledVector(subv, v2-v1)
    }

}

function handleObjectCollisions(o1, o2){
    if(o1 === o2) return

    // var subv = new Vector3()
    o1.subv.subVectors(o2.pos, o1.pos)
    const lengthSq = o1.subv.lengthSq()
    const mind = (o1.radius+o2.radius)
    // var subv = {x: o2.pos.x - o1.pos.x, y: o2.pos.y - o1.pos.y, z: o2.pos.z - o1.pos.z}
    // var lengthSq = subv.x*subv.x + subv.y*subv.y + subv.z*subv.z


    if(lengthSq < mind*mind) {
        //debugger
        var d = Math.sqrt(lengthSq)
        o1.subv.divideScalar(d)
        //subv.x /= d; subv.y /= d; subv.z /= d;
        var corr = (mind - d)/2

        o1.pos.addScaledVector(o1.subv, -corr)
        o2.pos.addScaledVector(o1.subv, corr)
        // o1.pos.x -= corr*subv.x; o1.pos.y -= corr*subv.y; o1.pos.z -= corr*subv.z
        // o2.pos.x += corr*subv.x; o2.pos.y += corr*subv.y; o2.pos.z += corr*subv.z

        var v1 = o1.vel.dot(o1.subv); const m1 = o1.radius;
        var v2 = o2.vel.dot(o1.subv); const m2 = o2.radius;
        var newV1 = (m1*v1 + m2*v2 - m2*(v1 - v2)*restitution)/(m1 + m2)
		var newV2 = (m1*v1 + m2*v2 - m1*(v2 - v1)*restitution)/(m1 + m2)
        // var v1 = (o1.vel.x*subv.x + o1.vel.y*subv.y + o1.vel.z*subv.z)*restitution
        // var v2 = (o2.vel.x*subv.x + o2.vel.y*subv.y + o2.vel.z*subv.z)*restitution

        o1.vel.addScaledVector(o1.subv, newV1-v1)
        o2.vel.addScaledVector(o1.subv, newV2-v2)
    }

}

function handleConstraints(){

}



export default {
    addMesh: addMesh,
    handleGroundCollision: handleGroundCollision,
    handleWallCollision: handleWallCollision,
    handleObjectCollisions: handleObjectCollisions,
}