class SpatialHash{
    constructor(worldSize, cellSize){
        this.worldSize = worldSize
        this.cellSize = cellSize
        this.u = Math.ceil(worldSize.x / cellSize)
        this.v = Math.ceil(worldSize.y / cellSize)
        this.w = Math.ceil(worldSize.z / cellSize)
        this.hash = new Array()
        this.grid = new Array(this.u*this.v*this.w)
        for(let i = 0; i <= this.u; i++){
            for(let j = 0; j <= this.v; j++){
                for(let k = 0; k<= this.w; k++){
                    this.grid[i*this.v*this.w + j*this.w +k] = {
                        neighbors:this.getNeighbors(i,j,k),
                        nearbyObjects:[] //[obj_index:[particle_indexes...], ...]
                    }
                }
            }
        }
    }

    getNeighbors(u,v,w){
        var neighbors = []
        for(var i = u-1; i <= u+1; i++){
            for(var j = v-1; j <= v+1; j++){
                for(var k = w-1; k <= w+1; k++){
                    if(i>=0 && i <= this.u && j >= 0 && j < this.v && k >= 0 && k < this.w) {
                        neighbors.push(i*this.v*this.w + j*this.w +k)
                    }
                }
            }
        }
        return neighbors
    }

    add(o, i, x,y,z){
        let cellIndex = this.getCellIndex(x,y,z)
        this.addToCell(cellIndex, o, i)
    }

    addToCell(cellIndex, o, i){
        for(let n of this.grid[cellIndex].neighbors){
            if(!this.grid[n].nearbyObjects[o])
                this.grid[n].nearbyObjects[o] = []
            this.grid[n].nearbyObjects[o].push(i)
        }
        if(!this.hash[o]) 
            this.hash[o] = []
        this.hash[o][i] = cellIndex    
    }

    delete(o, i){
        this.grid[this.hash[o][i]].neighbors.map(n => {
            if(!this.grid[n].nearbyObjects[o]) 
                return;
            const j = this.grid[n].nearbyObjects[o].indexOf(i)
            if(j > -1){
                const t = this.grid[n].nearbyObjects[o].pop()
                if(j < this.grid[n].nearbyObjects[o].length)
                    this.grid[n].nearbyObjects[o][j] = t
            }
        })
    }

    update(o, i, x,y,z){
        let cellIndex = this.getCellIndex(x,y,z)
        if(this.hash[o][i] != cellIndex){
            this.delete(o, i)
            this.addToCell(cellIndex, o, i)
        }
    }

    getCellIndex(x,y,z){
        return  Math.floor((x + this.worldSize.x/2) / this.cellSize)*this.v*this.w +
                Math.floor((y + this.worldSize.y/2) / this.cellSize)*this.w +
                Math.floor((z + this.worldSize.z/2) / this.cellSize)
    }

    getNearBy(o, i){
        return this.grid[this.hash[o][i]].nearbyObjects
    }
}

export {SpatialHash}