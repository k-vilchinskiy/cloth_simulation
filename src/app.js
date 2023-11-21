import physicsScene from './physicsScene.js'
import threeScene from './threeScene.js'

threeScene.init()
await physicsScene.init()

var timesum = 0;
var frames = 0;
var paused = false;
async function update(){
    var start = performance.now()
    if(!paused)
        await physicsScene.simulate()
    threeScene.render()

    var frameTime = performance.now() - start
    timesum += frameTime
    frames++
    if(timesum > 1000){
        document.getElementById('fps').innerHTML = frames + "fps " + (timesum/frames).toFixed(3)
        timesum = frames = 0
    }
    
    requestAnimationFrame(update)
}
//physicsScene.simulate()
document.getElementById("Pause").onclick =function(){
    paused = !paused
}
update()