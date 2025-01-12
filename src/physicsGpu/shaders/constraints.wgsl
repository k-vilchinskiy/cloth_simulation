@group(0) @binding(0) var<storage, read_write>  constStart: array<u32>;
@group(0) @binding(1) var<storage, read_write>  constEnd: array<u32>;
@group(0) @binding(2) var<storage, read_write>  constLen: array<f32>;
@group(0) @binding(3) var<storage, read_write>  pos: array<vec3<f32>>;
//@group(0) @binding(4) var<storage, read_write>  corr: array<vec3<f32>>;
@group(0) @binding(4) var<storage, read_write>  mass: array<f32>;
@group(0) @binding(5) var<storage, read_write> graphColor : array<u32>;
@group(0) @binding(6) var<uniform> limits : vec2u;


@compute @workgroup_size(64) fn constraints(
    @builtin(global_invocation_id) id: vec3<u32>
    ) {

    if (id.x >= limits.y - limits.x)
     {
        return;
    }

    let index = graphColor[limits.x + id.x];

    let dt: f32 = 1.0 / 60.0/50; 
    let alpha = 0.000000001;//dt/dt;
    
    let c0 = constStart[index]/3;
    let c1 = constEnd[index]/3;
    
    let w0 = mass[c0];
    let w1 = mass[c1];
    let w = w0 + w1;
    if(w == 0.0){
        return;
    }
    
    let p0 = pos[c0];
    let p1 = pos[c1];

    let d = p1 - p0;
    let l = length(d);
    let l0 = constLen[index];

    let dp = d * (l - l0) / l / (w + alpha);
    pos[c0] = pos[c0] + w0 * dp;
    pos[c1] = pos[c1] - w1 * dp;
}