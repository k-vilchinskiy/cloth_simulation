import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    AmbientLight,
    BufferGeometry,
    BufferAttribute,
    DirectionalLight,

    Vector3,
    Mesh,
    PlaneGeometry,
    GridHelper,
    MeshPhongMaterial,
    SpotLight,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'

var threeScene;
var renderer;
var camera;
var cameraControl;
var model;

function init(){
    threeScene = new Scene()

    threeScene.add(new AmbientLight(0x505050))
    //threeScene.fog = new THREE.Fog(0x000000, 0, 350)

    // var spotLight = new SpotLight(0xffffff)
    // spotLight.penumbre = 0.2
    // spotLight.position.set(2,3,3)
    // threeScene.add(spotLight) 

    var directLight = new DirectionalLight(0xffffff, 1)
    directLight.position.set(-1,0,0)
    threeScene.add(directLight) 

    var ground = new Mesh(
        new PlaneGeometry(20,20,1,1),
        new MeshPhongMaterial({color:0xa0adaf, shininess: 150})
    )
    ground.rotation.x = -Math.PI/2

    threeScene.add(ground)

    var gridHelper = new GridHelper(20,20)
    gridHelper.material.opasity = 1.0
    gridHelper.material.transparent = true
    gridHelper.position.set(0,0.02,0)
    threeScene.add(gridHelper)

    renderer = new WebGLRenderer()
    renderer.shadowMap.enable = true
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    container.appendChild(renderer.domElement)

    camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 100)
    camera.position.set(-4, 7, -4)
    camera.updateMatrixWorld()

    threeScene.add(camera)

    cameraControl = new OrbitControls(camera, renderer.domElement)
    cameraControl.target = new Vector3(0,4,0)

}

function add(obj){
    threeScene.add(obj)
}

function addGeometry(vertices, indices){
    const geometry = new BufferGeometry();
    geometry.setIndex( indices );
    geometry.setAttribute( 'position', new BufferAttribute( vertices, 3 ) );

    let material = new MeshPhongMaterial({
        color: color,
        side: DoubleSide, 
        flatShading : true,
        //shininess: 150,
        //wireframe: true
    })
    let mesh = new Mesh(geometry, material)
    threeScene.add(mesh)
}

function load( url, onLoad, onProgress, onError ){
    const loader = new OBJLoader();
    loader.load( url, onLoad, onProgress, onError )
}

function render(){
    renderer.render(threeScene, camera)
    cameraControl.update()
}

export default {
    init: init,
    add: add,
    addGeometry: addGeometry,
    load: load,
    render: render
}