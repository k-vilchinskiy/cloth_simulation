import { SpatialHash } from "../physics/spatialHash.js";

class Engine{
    constructor(){
        this.objects = []
        this.constraints = [] 
            //[{start: {objectId, particleId}, end: {objectId, particleId}, len},
            // {start: {objectId, particleId}, end: [x,y,z], len}]
            //
        this.shash = new SpatialHash({x:20, y:10, z:20}, 0.2)
        // this.pos = new Float32Array() //[x1,y1,z1, x2,y2,z2 ...]
        // this.mass = new Float32Array() //[m1, m2, ...]
        // this.vel = new Float32Array() //[x1,y1,z1, x2,y2,z2 ...]
        // this.edges = new Int16Array() //[e1_start, e1_end, e2_start, e2_end ...]
        // this.edge_len = new Float32Array() //[e1_len, e2_len ...]
        // this.faces = new Int16Array() //[f1_1, f1_2, f1_3, ...]
        // this.edge_faces = new Int16Array() //[e1_f1, e1_f2, ...]
        // this.edge_faces_constraint = new Float32Array() //[e1_angle, e2_angle] 
    }

    init(){}

    add(object){
        this.objects.push(object)
        for(let i = 0; i < object.pos.length; i+=3){
            this.shash.add(this.objects.length-1, i, object.pos[i], object.pos[i+1], object.pos[i+2])
        }
    }

    simulate(dt, force){
        let pi, o, o1, o2 ;
        for(let oi = 0; oi < this.objects.length; oi++){
            if(oi==1)continue
            o = this.objects[oi]
            //particles
            for(let p = 0; p < o.pos.length; p+=3){
                if(o.mass[p/3] == 0) continue;

                //floor collision
                if(o.pos[p+1] < o.radius){
                    o.pos[p+1] = o.radius
                    o.vel[p+1] = -o.vel[p+1]
                }

                //iterate
                o.vel[p] += -force.z * dt
                o.vel[p+1] += -10 * dt
                //o.vel[p+2] += -force.z * dt//(force.z + Math.random()*15) * dt

                let v = Math.sqrt(o.vel[p]*o.vel[p] + 
                    o.vel[p+1]*o.vel[p+1] + 
                    o.vel[p+2]*o.vel[p+2])
                if(v > o.maxVel){
                    o.vel[p] *= o.maxVel / v
                }

                o.prevPos[p] = o.pos[p]
                o.prevPos[p+1] = o.pos[p+1]
                o.prevPos[p+2] = o.pos[p+2]
                
                o.pos[p] += o.vel[p] * dt
                o.pos[p+1] += o.vel[p+1] * dt
                o.pos[p+2] += o.vel[p+2] * dt
            }
            //simulate constrains
            const alpha = 0.0000001/dt/dt
            let c0, c1, l, dx,dy,dz,dl, w0,w1, corr
            for(let c = 0; c < o.edgeI;c++){
                c0 = o.edgesStart[c]
                c1 = o.edgesEnd[c]

                dx = o.pos[c1] - o.pos[c0]
                dy = o.pos[c1+1] - o.pos[c0+1]
                dz = o.pos[c1+2] - o.pos[c0+2]
                dl = Math.sqrt(dx*dx + dy*dy + dz*dz)

                w0 = o.mass[c0/3]
                w1 = o.mass[c1/3]
                if(w0+w1 === 0.0) continue

                corr = (o.edgesLen[c] - dl) / dl / (w0 + w1 + alpha)

                o.pos[c0] += -dx*(corr*w0)
                o.pos[c0+1] += -dy*(corr*w0)
                o.pos[c0+2] += -dz*(corr*w0)

                o.pos[c1] += dx*(corr*w1)
                o.pos[c1+1] += dy*(corr*w1)
                o.pos[c1+2] += dz*(corr*w1)
            }

            //simulate external constraints
            let start, end, len
            for(let c = 0; c < this.constraints.length; c++){
                start = this.constraints[c].start
                end = this.constraints[c].end

                o1 = typeof start.objectId != 'undefined' ? this.objects[start.objectId]: {pos: start, mass: [0]}
                o2 = typeof end.objectId != 'undefined' ? this.objects[end.objectId]: {pos: end, mass: [0]}
                
                c0 = typeof start.objectId != 'undefined' ? start.particleId : 0
                c1 = typeof end.objectId != 'undefined' ? end.particleId : 0

                dx = o2.pos[c1] - o1.pos[c0]
                dy = o2.pos[c1+1] - o1.pos[c0+1]
                dz = o2.pos[c1+2] - o1.pos[c0+2]
                dl = Math.sqrt(dx*dx + dy*dy + dz*dz)

                w0 = o1.mass[c0/3]
                w1 = o2.mass[c1/3]
                if(w0+w1 === 0.0) continue

                corr = (this.constraints[c].len - dl) / dl / (w0 + w1 + 0)
                if(this.constraints[c].len > 0){
                    this.constraints[c].len -= dt/10
                } else if(this.constraints[c].end[2] != 0) {
                    this.constraints[c].end[2]=0
                    this.constraints[c].len = 0.8
                }

                o1.pos[c0] += -dx*(corr*w0)
                o1.pos[c0+1] += -dy*(corr*w0)
                o1.pos[c0+2] += -dz*(corr*w0)

                o2.pos[c1] += dx*(corr*w1)
                o2.pos[c1+1] += dy*(corr*w1)
                o2.pos[c1+2] += dz*(corr*w1)
            }

            //simulate collisions
            let no, c, ddx,ddy,ddz
            for(let p = 0; p < o.pos.length; p+=3){
                let nearby = this.shash.getNearBy(oi, p)
                ddx = o.pos[p]
                ddy = o.pos[p+1]
                ddz = o.pos[p+2]
                for(no = 0; no < nearby.length; no++){
                    if(!nearby[no]) 
                        continue
                    o1 = no == oi ? o : this.objects[no]
                    for(c = 0; c < nearby[no].length; c++){
                        c0 = nearby[no][c]
                        if(no == oi && p === c0) continue;
                        
                        dx = ddx - o1.pos[c0]
                        dy = ddy - o1.pos[c0+1]
                        dz = ddz - o1.pos[c0+2]
                        dl = dx*dx + dy*dy + dz*dz

                        if((no == oi && dl < o.mindsq) || (no != oi)){
                            l = Math.sqrt(dl)
                            if(o.radius + o1.radius < l) continue;
                            dx /= l; dy /= l; dz /= l;
                            
                            corr = no == oi ? o.radius-l/2 : (o.radius + o1.radius - l)/2
                            if(corr < -1){
                                debugger
                               }
                            if(o.mass[p/3] !== 0){
                                o.pos[p] += dx*corr
                                o.pos[p+1] += dy*corr
                                o.pos[p+2] += dz*corr
                            }
                            if(o1.mass[c0/3] !== 0){
                                o1.pos[c0] -= dx*corr
                                o1.pos[c0+1] -= dy*corr
                                o1.pos[c0+2] -= dz*corr
                            }
                        }
                    }
                }
                this.shash.update(oi, p, ddx, ddy, ddz)
            }

            //update velocities
            for(let p = 0; p < o.pos.length; p+=3){
                if(o.mass[p/3] > 0.0){
                    o.vel[p] = (o.pos[p] - o.prevPos[p]) / dt
                    o.vel[p+1] = (o.pos[p+1] - o.prevPos[p+1]) / dt
                    o.vel[p+2] = (o.pos[p+2] - o.prevPos[p+2]) / dt
                }
            }

            o.update()
        }

        
    }  
}

export {Engine}