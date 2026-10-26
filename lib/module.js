export class TModule {
    constructor() {
        this.GL = null;
        // the WebGPU runtime: the GPUDevice of the host and the GPUTextures of the current draw (main_webgpu.cpp)
        this.preinitializedWebGPUDevice = null;
        this.effekseerImportTextures = null;
        this.resourcesMap = {};
    }
    _malloc(size) {
        return size;
    }
    // @ts-ignore
    _free(memptr) {
    }
    // @ts-ignore
    cwrap(arg0, arg1, arg2) {
        throw new Error("Method not implemented.");
    }
    stackSave() {
        throw new Error("Method not implemented.");
    }
    // @ts-ignore
    stackAlloc(arg0) {
        throw new Error("Method not implemented.");
    }
    // @ts-ignore
    stackRestore(stack) {
        throw new Error("Method not implemented.");
    }
}
