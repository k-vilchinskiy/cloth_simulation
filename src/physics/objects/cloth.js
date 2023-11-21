import {
    BackSide,
    BufferGeometry,
    DoubleSide,
    FrontSide,
    InstancedMesh,
    Line,
    LineBasicMaterial,
    Matrix4,
    Mesh,
    MeshPhysicalMaterial,
    MeshPhongMaterial,
    SphereGeometry,
    Vector3
} from 'three'
import threeScene from '../../threeScene.js'
import { SpatialHash } from '../spatialHash.js'

class Cloth{
    constructor(geometry, hash, objIndex=0){
        
        this.objIndex = objIndex
        let len = function(pos, id0, id1){
            let lx = pos[id0]-pos[id1]
            let ly = pos[id0+1]-pos[id1+1]
            let lz = pos[id0+2]-pos[id1+2]
            return Math.sqrt(lx*lx + ly*ly + lz*lz)
        }
        
        this.geometry = geometry
        this.pos = geometry.getAttribute("position").array
        this.radius = len(this.pos,0,3)/2.3
        this.mindsq = this.radius*this.radius*4
        this.maxVel = 10

        this.numParticles = this.pos.length/3

        this.shash = hash


        this.vel = new Float32Array(this.pos.length)
        this.prevPos = new Float32Array(this.pos.length)
        this.imass = new Float32Array(this.pos.length).fill(1.0)
        
        var heightSegments = geometry.parameters.heightSegments
        var widthSegments = geometry.parameters.widthSegments
        this.imass[0] = 0.0
        //this.imass[widthSegments*3] = 0.0
        this.imass[(heightSegments)*(widthSegments+1)*3] = 0.0

        //this.triIndex = []

        //const index = geometry.getIndex().array
        const l = heightSegments*widthSegments*4
        this.edgesStart = new Int32Array(l)
        this.edgesEnd= new Int32Array(l)
        this.edgesLen = new Float32Array(l)
        this.edgeI = 0;

        for(let i = 0; i < this.pos.length; i+=3){
            this.shash.add(this.objIndex+i, this.pos[i], this.pos[i+1], this.pos[i+2])
        }

        for(let i = 0; i <= heightSegments; i++){
            for(let j = 0; j <= widthSegments; j++){
                const p = 3*(i*(widthSegments+1) + j)
                const pr = p+3
                const pb = p+3*(widthSegments+1)
                if(j < widthSegments){
                    this.edgesStart[this.edgeI] = p;
                    this.edgesEnd[this.edgeI] = pr
                    this.edgesLen[this.edgeI++] = len(this.pos, p, pr)
                }
                if(i < heightSegments){
                    this.edgesStart[this.edgeI] = p;
                    this.edgesEnd[this.edgeI] = pb
                    this.edgesLen[this.edgeI++] = len(this.pos, p, pb)
                    // if(j < widthSegments){
                    //     this.edgesStart[this.edgeI] = pr
                    //     this.edgesEnd[this.edgeI] = pb
                    //     this.edgesLen[this.edgeI++] = len(this.pos, pr, pb)
                    // }
                }
            }
        }

        for(var z = 2; z < this.pos.length; z+=3){
            this.pos[z] += Math.random()/100
        }

        var material = new MeshPhongMaterial({
            color: 0x338800,
            side: FrontSide, 
            flatShading : true,
            //shininess: 150,
            //wireframe: true
        })
        var backmaterial = new MeshPhongMaterial({
            color: 0xff8000,
            side: BackSide, 
            flatShading:true ,
            //shininess: 150,
            //wireframe: true
        })
        this.mesh = new Mesh(geometry, material)
        this.backmesh = new Mesh(geometry, backmaterial)
        threeScene.add(this.mesh)
        threeScene.add(this.backmesh)

        // var dotGeometry = new SphereGeometry(this.radius, 16, 16)
        // var dotMaterial = new MeshPhongMaterial({color: 0xff0000})

        // this.dotMesh = new InstancedMesh(dotGeometry, dotMaterial, this.pos.length/3)
        // threeScene.add(this.dotMesh)
        
    }
    
    simulate(dt, force){
        //simulate particles
        for(let p = 0; p < this.pos.length; p+=3){
            //floor collision
            if(this.pos[p+1] < this.radius){
                this.pos[p+1] = this.radius
                this.vel[p+1] = -this.vel[p+1]
            }

            if(this.imass[p] === 0) continue

            let v = Math.sqrt(this.vel[p]*this.vel[p] + 
                this.vel[p+1]*this.vel[p+1] + 
                this.vel[p+2]*this.vel[p+2])
            if(v > this.maxVel){
                this.vel[p] *= this.maxVel / v
            }
            this.vel[p] += this.objIndex?force.x * dt:force.z * dt
            this.vel[p+1] += force.y * dt
            this.vel[p+2] += force.z * dt//(force.z + Math.random()*15) * dt

            this.prevPos[p] = this.pos[p]
            this.prevPos[p+1] = this.pos[p+1]
            this.prevPos[p+2] = this.pos[p+2]
            
            this.pos[p] += this.vel[p] * dt
            this.pos[p+1] += this.vel[p+1] * dt
            this.pos[p+2] += this.vel[p+2] * dt
        }

        //simulate constrains
        const alpha = 0.000001/dt/dt
        let c0, c1, l, dx,dy,dz,dl, w0,w1, corr
        for(let c = 0; c < this.edgeI;c++){
            c0 = this.edgesStart[c]
            c1 = this.edgesEnd[c]

            dx = this.pos[c1] - this.pos[c0]
            dy = this.pos[c1+1] - this.pos[c0+1]
            dz = this.pos[c1+2] - this.pos[c0+2]
            dl = Math.sqrt(dx*dx + dy*dy + dz*dz)

            w0 = this.imass[c0]
            w1 = this.imass[c1]
            if(w0+w1 === 0.0) continue

            corr = (this.edgesLen[c] - dl) / dl / (w0 + w1 + alpha)

            this.pos[c0] += -dx*(corr*w0)
            this.pos[c0+1] += -dy*(corr*w0)
            this.pos[c0+2] += -dz*(corr*w0)

            this.pos[c1] += dx*(corr*w1)
            this.pos[c1+1] += dy*(corr*w1)
            this.pos[c1+2] += dz*(corr*w1)
        }

        //simulate collisions
        let c = 0, ddx,ddy,ddz
        for(let p = 0; p < this.pos.length; p+=3){
            let nearby = this.shash.getNearBy(this.objIndex+p)
            ddx = this.pos[p]
            ddy = this.pos[p+1]
            ddz = this.pos[p+2]
            for(c = 0; c < nearby.length; c++){
                c0 = nearby[c]-this.objIndex
                if(p === c0) continue;
                
                dx = ddx - this.pos[c0]
                dy = ddy - this.pos[c0+1]
                dz = ddz - this.pos[c0+2]
                dl = dx*dx + dy*dy + dz*dz

                if(dl < this.mindsq){
                    l = Math.sqrt(dl)
                    dx /= l; dy /= l; dz /= l;
                    corr = this.radius-l/2
                    if(this.imass[p] !== 0){
                        this.pos[p] += dx*corr
                        this.pos[p+1] += dy*corr
                        this.pos[p+2] += dz*corr
                    }
                    if(this.imass[c0] !== 0){
                        this.pos[c0] -= dx*corr
                        this.pos[c0+1] -= dy*corr
                        this.pos[c0+2] -= dz*corr
                    }
                }
            }
            this.shash.update(this.objIndex+p, ddx, ddy, ddz)
        }

        //update velocities
        for(let p = 0; p < this.pos.length; p+=3){
            if(this.imass[p] > 0.0){
                this.vel[p] = (this.pos[p] - this.prevPos[p]) / dt
                this.vel[p+1] = (this.pos[p+1] - this.prevPos[p+1]) / dt
                this.vel[p+2] = (this.pos[p+2] - this.prevPos[p+2]) / dt
             }
        }
    }

    update(){
        // var matrix = new Matrix4()
        // for (let i = 0; i < this.numParticles; i++) {
        //     const x = this.pos[3*i]
        //     const y = this.pos[3*i+1]
        //     const z = this.pos[3*i+2]
        //     matrix.makeTranslation(x,y,z)
        //     this.dotMesh.setMatrixAt(i, matrix)
        // }

        // this.dotMesh.instanceMatrix.needsUpdate = true;
        this.mesh.geometry.attributes.position.needsUpdate = true;
        this.backmesh.geometry.attributes.position.needsUpdate = true;
    }
}

export {Cloth}