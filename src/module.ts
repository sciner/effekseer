export class TModule {

    GL: any = null
    _isPowerOfTwo: (img: any) => boolean
    _loadImage: (path: string) => any
    _loadBinary: (path: string, isRequired: boolean) => any
    HEAP8: any
    HEAPF32: any

    _malloc(size: int): int {
        return size
    }

    resourcesMap: {[key: string]: any} = {}

    _free(_memptr: int): void {
    }

    cwrap(_arg0: string, _arg1: string, _arg2: string[]) {
        throw new Error("Method not implemented.")
    }

    stackSave() {
        throw new Error("Method not implemented.")
    }

    stackAlloc(_arg0: number): number {
        throw new Error("Method not implemented.")
    }

    stackRestore(_stack: any) {
        throw new Error("Method not implemented.")
    }

}
