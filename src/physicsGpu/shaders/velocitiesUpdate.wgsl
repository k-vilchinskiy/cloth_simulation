@group(0) @binding(0) var<storage, read_write>  posIO: array<f32>;
@group(0) @binding(1) var<storage, read_write>  pos: array<vec3<f32>>;
@group(0) @binding(2) var<storage, read_write>  prePos: array<vec3<f32>>;
@group(0) @binding(3) var<storage, read_write>  vel: array<vec3<f32>>;
@group(0) @binding(4) var<storage, read_write>  mass: array<f32>;


@compute @workgroup_size(64) fn velocityUpdate(
    @builtin(global_invocation_id) id: vec3<u32>
    ) {

    if (id.x*3 >= u32(arrayLength(&posIO))) {
        return;
    }

    if(mass[id.x] == 0.0){
        return;
    }

    let index = id.x;
    let dt: f32 = 1.0 / 60.0/50; 

    vel[index] = (pos[index] - prePos[index]) / dt;
    if(length(vel[index]) > 10){
        //vel[index] = vel[index]*10/length(vel[index]);
    }
    posIO[index*3] = pos[index].x; 
    posIO[index*3+1] = pos[index].y; 
    posIO[index*3+2] = pos[index].z;
}