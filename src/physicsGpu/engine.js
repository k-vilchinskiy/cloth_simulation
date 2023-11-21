class Engine{
    constructor(){
        this.objects = []
    }

    async init(){
        this.adapter = await navigator.gpu.requestAdapter()
        this.device = await this.adapter.requestDevice()

        this.pipelineIterate = this.device.createComputePipeline({
            label: 'iterate pipeline',
            layout: 'auto',
            compute: {
                module: this.device.createShaderModule({
                    label: 'iterate module',
                    code: await loadShader('iterate')
                }),
                entryPoint: 'iterate',
            },
        });

        this.pipelineConstraints = this.device.createComputePipeline({
            label: 'constraint pipeline',
            layout: 'auto',
            compute: {
                module: this.device.createShaderModule({
                    label: 'constraint module',
                    code: await loadShader('constraints')
                }),
                entryPoint: 'constraints',
            },
        });

        this.pipelineAddCorrection = this.device.createComputePipeline({
            label: 'add correction pipeline',
            layout: 'auto',
            compute: {
                module: this.device.createShaderModule({
                    label: 'add correction module',
                    code: await loadShader('addCorrections')
                }),
                entryPoint: 'AddCorrection',
            },
        });

        this.pipelineVelocityUpdate = this.device.createComputePipeline({
            label: 'velocity update pipeline',
            layout: 'auto',
            compute: {
                module: this.device.createShaderModule({
                    label: 'velocity update module',
                    code: await loadShader('velocitiesUpdate')
                }),
                entryPoint: 'velocityUpdate',
            },
        });
        
    }

    add(object){
        this.objects.push(object)

        //Pos InOut
        this.posIOBuffer = this.device.createBuffer({
            label: 'pos InOut buffer',
            size: object.pos.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        });

        //Pos
        this.posBuffer = this.device.createBuffer({
            label: 'pos buffer',
            size: object.pos.byteLength/12*16,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        });

        //PrePos
        this.prePosBuffer = this.device.createBuffer({
            label: 'prePos buffer',
            size: object.pos.byteLength/12*16,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        });

        //Vel
        this.velBuffer = this.device.createBuffer({
            label: 'vel buffer',
            size: object.pos.byteLength/12*16,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        });

        //Mass
        this.massBuffer = this.device.createBuffer({
            label: 'mass buffer',
            size: object.pos.byteLength/3,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        });

        //Constraints
        //Start
        this.constStartBuffer = this.device.createBuffer({
            label: 'const start buffer',
            size: object.edgeI * 4,//edgesStart.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        });

        //End
        this.constEndBuffer = this.device.createBuffer({
            label: 'const end buffer',
            size: object.edgeI * 4,//edgesEnd.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        });

        //Length
        this.constLenBuffer = this.device.createBuffer({
            label: 'const length buffer',
            size: object.edgeI * 4,//edgesLen.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        });

        //Correction
        this.corrBuffer = this.device.createBuffer({
            label: 'correction buffer',
            size: object.pos.byteLength/12*16,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        });

        this.bufferGraphColoring = this.device.createBuffer({
            label: 'buffer graph coloring',
            size: object.edgeI * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        this.bufferGraphColoringLimits = this.device.createBuffer({
            label: 'buffer graph coloring limits',
            size: 2 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.device.queue.writeBuffer(this.posIOBuffer, 0, object.pos);
        this.device.queue.writeBuffer(this.massBuffer, 0, object.mass);
        this.device.queue.writeBuffer(this.constStartBuffer, 0, object.edgesStart, 0, object.edgeI);
        this.device.queue.writeBuffer(this.constEndBuffer, 0, object.edgesEnd, 0, object.edgeI);
        this.device.queue.writeBuffer(this.constLenBuffer, 0, object.edgesLen, 0, object.edgeI);
        this.device.queue.writeBuffer(this.bufferGraphColoring, 0, object.graphColoring);

        this.resultBuffer = this.device.createBuffer({
            label: 'result buffer',
            size: object.pos.byteLength,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST ,
        });

        this.bindGroupIterate = this.device.createBindGroup({
            label: 'bindGroup for iterate',
            layout: this.pipelineIterate.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.posIOBuffer } },  
                { binding: 1, resource: { buffer: this.posBuffer } }, 
                { binding: 2, resource: { buffer: this.prePosBuffer } }, 
                { binding: 3, resource: { buffer: this.velBuffer } },        
                { binding: 4, resource: { buffer: this.massBuffer } },      
            ],
        });

        this.bindGroupConstraints = this.device.createBindGroup({
            label: 'bindGroup for constraints',
            layout: this.pipelineConstraints.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.constStartBuffer } },  
                { binding: 1, resource: { buffer: this.constEndBuffer } }, 
                { binding: 2, resource: { buffer: this.constLenBuffer } }, 
                { binding: 3, resource: { buffer: this.posBuffer } },        
                //{ binding: 4, resource: { buffer: this.corrBuffer } },    
                { binding: 4, resource: { buffer: this.massBuffer } }, 
                { binding: 5, resource: { buffer: this.bufferGraphColoring } },
                { binding: 6, resource: { buffer: this.bufferGraphColoringLimits } },
            ],
        });

        this.bindGroupCorrections = this.device.createBindGroup({
            label: 'bindGroup for corrections',
            layout: this.pipelineAddCorrection.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.posBuffer } },        
                { binding: 1, resource: { buffer: this.corrBuffer } },  
            ],
        });
    }

    gpuCompute(pipeline, bindGroup, len){
        const encoder = this.device.createCommandEncoder({
            label: 'encoder',
        });
    
        const computePass = encoder.beginComputePass({
            label: 'compute pass',
        });
    
        computePass.setPipeline(pipeline);
        computePass.setBindGroup(0, bindGroup);
        computePass.dispatchWorkgroups(len);
        computePass.end();

        return encoder
    }

    async simulate(dt, force){
        let pi, o1, o2 ;
        let o = this.objects[0]
        let encoder;
        let cl = o.graphColoringLimits;
        for(var t = 70; t < 100; t++){
            
            encoder = this.gpuCompute(this.pipelineIterate, this.bindGroupIterate, Math.ceil(o.pos.length/3 / 64))
            this.device.queue.submit([encoder.finish()]);

            this.device.queue.writeBuffer(this.bufferGraphColoringLimits, 0, cl[0]);
            encoder = this.gpuCompute(this.pipelineConstraints, this.bindGroupConstraints, Math.ceil(cl[0][1]- cl[0][0] / 64))
            this.device.queue.submit([encoder.finish()]);

            this.device.queue.writeBuffer(this.bufferGraphColoringLimits, 0, cl[1]);
            encoder = this.gpuCompute(this.pipelineConstraints, this.bindGroupConstraints, Math.ceil(cl[1][1]- cl[1][0] / 64))
            this.device.queue.submit([encoder.finish()]);

            this.device.queue.writeBuffer(this.bufferGraphColoringLimits, 0, cl[2]);
            encoder = this.gpuCompute(this.pipelineConstraints, this.bindGroupConstraints, Math.ceil(cl[2][1]- cl[2][0] / 64))
            this.device.queue.submit([encoder.finish()]);

            this.device.queue.writeBuffer(this.bufferGraphColoringLimits, 0, cl[3]);
            encoder = this.gpuCompute(this.pipelineConstraints, this.bindGroupConstraints, Math.ceil(cl[3][1]- cl[3][0] / 64))
            this.device.queue.submit([encoder.finish()]);

            // encoder = this.gpuCompute(this.pipelineAddCorrection, this.bindGroupCorrections, Math.ceil(o.pos.length/3 / 64))
            // this.device.queue.submit([encoder.finish()]);

            encoder = this.gpuCompute(this.pipelineVelocityUpdate, this.bindGroupIterate, Math.ceil(o.pos.length/3 / 64))

            if(t==99)encoder.copyBufferToBuffer(this.posIOBuffer, 0, this.resultBuffer, 0, this.resultBuffer.size);
        
            this.device.queue.submit([encoder.finish()]);
        }
        await this.resultBuffer.mapAsync(GPUMapMode.READ);
        o.pos.set(new Float32Array(this.resultBuffer.getMappedRange()));
        this.resultBuffer.unmap();
        o.update()
    }
}

async function loadShader(shaderName){
    return await fetch('src/physicsGpu/shaders/'+shaderName+'.wgsl')
    .then((response) => {
        if (response.ok){
            return response.text()
        }
    }).then((r) => {
        return r;
    })
}

export {Engine}