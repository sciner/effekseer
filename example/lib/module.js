export class TModule {
    constructor() {
        this.GL = null;
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
