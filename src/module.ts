export class TModule {

    GL: any = null
    // the WebGPU runtime: the GPUDevice of the host and the GPUTextures of the current draw (main_webgpu.cpp)
    preinitializedWebGPUDevice: any = null
    effekseerImportTextures: any[] | null = null
    _isPowerOfTwo: (img: any) => boolean
    _loadImage: (path: string) => any
    _loadBinary: (path: string, isRequired: boolean) => any
    HEAP8: any
    HEAPF32: any

    _malloc(size: int): int {
        return size
    }

    resourcesMap: {[key: string]: any} = {}

    // @ts-ignore
    _free(memptr: int): void {
    }

    // @ts-ignore
    cwrap(arg0: string, arg1: string, arg2: string[]) {
        throw new Error("Method not implemented.")
    }

    stackSave() {
        throw new Error("Method not implemented.")
    }

    // @ts-ignore
    stackAlloc(arg0: number): number {
        throw new Error("Method not implemented.")
    }

    // @ts-ignore
    stackRestore(stack: any) {
        throw new Error("Method not implemented.")
    }

}
