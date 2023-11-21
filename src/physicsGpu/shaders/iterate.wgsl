@group(0) @binding(0) var<storage, read_write>  posIO: array<f32>;
@group(0) @binding(1) var<storage, read_write>  pos: array<vec3<f32>>;
@group(0) @binding(2) var<storage, read_write>  prePos: array<vec3<f32>>;
@group(0) @binding(3) var<storage, read_write>  vel: array<vec3<f32>>;
@group(0) @binding(4) var<storage, read_write>  mass: array<f32>;

@compute @workgroup_size(64) fn iterate(
    @builtin(global_invocation_id) id: vec3<u32>
    ) {

    if (id.x*3 >= u32(arrayLength(&posIO))) {
        return;
    }

    let index = id.x;
    pos[index] = vec3f(posIO[index*3], posIO[index*3+1], posIO[index*3+2]);

    if(mass[id.x] == 0.0){
        return;
    }

    
    let gravity = vec3<f32>(0.0, -10.0, 5.0);
    let dt: f32 = 1.0 / 60.0/50; 
    
    

    if(pos[index].y < 0){
        pos[index].y = -pos[index].y;
        vel[index].y = -vel[index].y;
    }

    prePos[index] = pos[index];
    vel[index] = vel[index] + gravity * dt;
    pos[index] = pos[index] + vel[index] * dt;
    }