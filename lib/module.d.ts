export declare class TModule {
    GL: any;
    preinitializedWebGPUDevice: any;
    effekseerImportTextures: any[] | null;
    _isPowerOfTwo: (img: any) => boolean;
    _loadImage: (path: string) => any;
    _loadBinary: (path: string, isRequired: boolean) => any;
    HEAP8: any;
    HEAPF32: any;
    _malloc(size: int): int;
    resourcesMap: {
        [key: string]: any;
    };
    _free(memptr: int): void;
    cwrap(arg0: string, arg1: string, arg2: string[]): void;
    stackSave(): void;
    stackAlloc(arg0: number): number;
    stackRestore(stack: any): void;
}
