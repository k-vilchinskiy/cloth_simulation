import { PhysicsObject } from "./physicsObject.js"

class ConstraintBody extends PhysicsObject{
    constructor(geometry){
        super(geometry)

        let heightSegments = geometry.parameters.heightSegments
        let widthSegments = geometry.parameters.widthSegments
        const l = heightSegments*widthSegments*4
        this.edgesStart = new Int32Array(l)
        this.edgesEnd= new Int32Array(l)
        this.edgesLen = new Float32Array(l)
        this.edgeI = 0;
        const tempGraphColoring = [[],[],[],[]]

        let len = function(pos, id0, id1){
            let lx = pos[id0]-pos[id1]
            let ly = pos[id0+1]-pos[id1+1]
            let lz = pos[id0+2]-pos[id1+2]
            return Math.sqrt(lx*lx + ly*ly + lz*lz)
        }

        this.radius = len(this.pos,0,3)/2.5
        this.mindsq = this.radius*this.radius*4
        this.maxVel = 1

        for(let i = 0; i <= heightSegments; i++){
            for(let j = 0; j <= widthSegments; j++){
                const p = 3*(i*(widthSegments+1) + j)
                const pr = p+3
                const pb = p+3*(widthSegments+1)
                if(j < widthSegments){
                    if(j%2==0){
                        tempGraphColoring[0].push(this.edgeI)
                    } else {
                        tempGraphColoring[1].push(this.edgeI)
                    }
                    this.edgesStart[this.edgeI] = p;
                    this.edgesEnd[this.edgeI] = pr
                    this.edgesLen[this.edgeI++] = len(this.pos, p, pr)
                }
                if(i < heightSegments){
                    if(i%2==0){
                        tempGraphColoring[2].push(this.edgeI)
                    } else {
                        tempGraphColoring[3].push(this.edgeI)
                    }
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

        let ll = 0
        this.graphColoringLimits = [
            new Int32Array([ll, ll+=tempGraphColoring[0].length]),
            new Int32Array([ll, ll+=tempGraphColoring[1].length]),
            new Int32Array([ll, ll+=tempGraphColoring[2].length]),
            new Int32Array([ll, ll+=tempGraphColoring[3].length]),
        ]
        this.graphColoring = new Int32Array(tempGraphColoring.flat())
        
    }
}

export {ConstraintBody}