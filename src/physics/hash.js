class SpatialHash{
    constructor(worldSize, cellSize){

        this.worldSize = worldSize
        this.cellSize = cellSize
        this.w = Math.ceil(worldSize.x / cellSize)
        this.h = Math.ceil(worldSize.y / cellSize)
        this.d = Math.ceil(worldSize.z / cellSize)
        this.hashTable = new Array(this.w*this.h*this.d)
        for(var i = -1; i < this.w+1; i++)
            for(var j =-1; j < this.h+1; j++)
                for(var k = -1; k < this.d+1; k++){
                    var cell = this.hashTable[this.getCell(i,j,k)] = []
                    //cell.objects = []
                    cell.neighbors = this.getNeighbors(i,j,k)
                    cell.neighborObjects = []
                }
        
    }

    getNeighbors(w,h,d){
        var neighbors = []
        for(var i = w-1; i <= w+1; i++){
            for(var j = h-1; j <= h+1; j++){
                for(var k = d-1; k <= d+1; k++){
                    if(i>=-1 && i < this.w+1 && j >= -1 && j < this.h+1 && k >= -1 && k < this.d+1) {
                        neighbors.push(this.getCell(i,j,k))
                    }
                }
            }
        }
        return neighbors
    }

    getCell(posOrW, h, d){
        var _w,_h,_d
        if(typeof posOrW === 'object'){
            _w = Math.floor(posOrW.x / this.cellSize )
            _h = Math.floor(posOrW.y / this.cellSize )
            _d = Math.floor(posOrW.z / this.cellSize )
        } else {
            _w = posOrW
            _h = h
            _d = d
        }
        // if(_w >= this.w) _w = this.w-1; if(_w < 0) _w = 0
        // if(_h >= this.h) _h = this.h-1; if(_h < 0) _h = 0
        // if(_d >= this.d) _d = this.d-1; if(_d < 0) _d = 0
        return _w*this.h*this.d + _h*this.d + _d
    }

    add(o, c){
        var _c = c || this.getCell(o.pos)
        //this.hashTable[_c].objects.push(o.objId)
        try {
            
        this.hashTable[_c].neighbors.map(n => this.hashTable[n].neighborObjects.push(o.objId))
        } catch (error) {
            debugger
        }
        
        o.hashIndex = _c
    }

    delete(o){
        //var objects = this.hashTable[o.hashIndex].objects
        this.hashTable[o.hashIndex].neighbors.map(n => {
            var j = this.hashTable[n].neighborObjects.indexOf(o.objId)
            if(j >= 0){
                var t = this.hashTable[n].neighborObjects.pop()
                if(j < this.hashTable[n].neighborObjects.length)
                this.hashTable[n].neighborObjects[j] = t
            }
        })
        
        // var j = objects.indexOf(o.objId)
        // if(j >= 0 ){
        //     var t = objects.pop()
        //     if(j < objects.length)
        //         objects[j] = t
        // }
    }

    update(o){
        var c = this.getCell(o.pos)
        if( c != o.hashIndex ) {
            this.delete(o)
            this.add(o, c)
        }
    }

    getNearby(o){
        //var list = []
        //var shift = 0
        //const c = this.hashTable[o.hashIndex]
        // for(var i = 0; i < c.neighbors.length; i++){
        //     list.push(this.hashTable[c.neighbors[i]].objects)
        //     // const l = hn.objects.length
        //     // for(var n =0; n < l; n++)
        //     //     list[shift + n] = hn.objects[n]
        //     // shift += l
        // }
        
        //list.length = shift
        return this.hashTable[o.hashIndex].neighborObjects
    }

}

export {SpatialHash}