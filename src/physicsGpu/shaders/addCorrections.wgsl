@group(0) @binding(0) var<storage, read_write>  pos: array<vec3<f32>>;
@group(0) @binding(1) var<storage, read_write>  corr: array<vec3<f32>>;

@compute @workgroup_size(64) fn AddCorrection(
    @builtin(global_invocation_id) id: vec3<u32>
    ) {

    if (id.x >= u32(arrayLength(&pos))) {
        return;
    }

    let index = id.x;
    pos[index] = pos[index] + corr[index];
    corr[index] = vec3f(0.0, 0.0, 0.0);
}