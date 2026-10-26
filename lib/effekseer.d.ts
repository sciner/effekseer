export declare class EffekseerEffect {
    context: any;
    nativeptr: number;
    baseDir: string;
    isLoaded: boolean;
    scale: number;
    resources: any[];
    main_buffer: ArrayBuffer | null;
    onload: any;
    onerror: Function;
    redirect: Function;
    constructor(context: any);
    _load(buffer: ArrayBuffer): void;
    _loadFromPackage(buffer: ArrayBuffer, Unzip: any): Promise<void>;
    _reload(): void;
    _update(): void;
}
export declare class EffekseerHandle {
    context: any;
    native: any;
    constructor(context: any, native: any);
    stop(): void;
    stopRoot(): void;
    setFrame(frame: number): void;
    setLocation(x: number, y: number, z: number): void;
    setRotation(x: number, y: number, z: number): void;
    setScale(x: number, y: number, z: number): void;
    setMatrix(matrixArray: number[]): void;
    setAllColor(r: number, g: number, b: number, a: number): void;
    setTargetLocation(x: number, y: number, z: number): void;
    getDynamicInput(index: number): number;
    setDynamicInput(index: number, value: number): void;
    sendTrigger(index: number): void;
    setPaused(paused: boolean): void;
    setShown(shown: boolean): void;
    setSpeed(speed: number): void;
    setRandomSeed(seed: number): void;
    get exists(): boolean;
}
declare class ContextStates {
    restore_texture_slot_max: number;
    _gl: any;
    ext_vao: any;
    isWebGL2VAOEnabled: boolean;
    effekseer_vao: any;
    current_vao: any;
    current_vbo: any;
    current_ibo: any;
    current_textures: any[];
    current_active_texture_id: any;
    constructor(gl: any);
    release(): void;
    save(): void;
    restore(): void;
    disableVAO(): void;
}
declare class NoContextStates {
    save(): void;
    restore(): void;
    disableVAO(): void;
    release(): void;
}
export declare class EffekseerContext {
    _gl: WebGLRenderingContext | null;
    contextStates: ContextStates | NoContextStates | null;
    ctx: any;
    nativeptr: any;
    _restorationOfStatesFlag: boolean;
    _webgpu: boolean;
    _colorTexture: any;
    _depthTexture: any;
    _colorFormat: number;
    _depthFormat: number;
    _samples: number;
    _makeContextCurrent(): void;
    /**
     * Initialize the context on WebGPU (the runtime of initRuntimeWebGPU)
     * @param device the GPUDevice of the host
     * @param colorFormat the format of the render target the effects are drawn to (GPUTextureFormat)
     * @param depthFormat the format of its depth buffer (GPUTextureFormat), null without the depth
     */
    initWebGPU(device: any, colorFormat: string, depthFormat: string | null, settings?: {
        instanceMaxCount?: number;
        squareMaxCount?: number;
        premultipliedAlpha?: boolean;
        reversedDepth?: boolean;
    }): void;
    /**
     * WebGPU: the render targets of the host for the next draw (the effects are drawn over them, nothing is cleared).
     * The commands of the host recorded before the draw must be submitted first: the runtime submits its own
     * command buffer in draw()
     * @param colorTexture GPUTexture with RENDER_ATTACHMENT (and COPY_SRC for the distortion)
     * @param depthTexture GPUTexture of the depth with RENDER_ATTACHMENT, null without the depth test
     */
    setRenderTargets(colorTexture: any, depthTexture?: any): void;
    _beginFrameWebGPU(): boolean;
    init(webglContext: WebGLRenderingContext, settings?: {
        instanceMaxCount?: number;
        squareMaxCount?: number;
        enableExtensionsByDefault?: boolean;
    }): void;
    update(deltaFrames?: number): void;
    beginUpdate(): void;
    endUpdate(): void;
    updateHandle(handle: EffekseerHandle, deltaFrames: number): void;
    draw(): void;
    beginDraw(): void;
    endDraw(): void;
    drawHandle(handle: EffekseerHandle): void;
    setProjectionMatrix(matrixArray: number[]): void;
    setProjectionPerspective(fov: number, aspect: number, near: number, far: number): void;
    setProjectionOrthographic(width: number, height: number, near: number, far: number): void;
    setCameraMatrix(matrixArray: number[]): void;
    setCameraLookAt(positionX: number, positionY: number, positionZ: number, targetX: number, targetY: number, targetZ: number, upvecX: number, upvecY: number, upvecZ: number): void;
    setCameraLookAtFromVector(position: {
        x: number;
        y: number;
        z: number;
    }, target: {
        x: number;
        y: number;
        z: number;
    }, upvec?: {
        x: number;
        y: number;
        z: number;
    }): void;
    loadEffect(data: string | ArrayBuffer, scale?: number, onload?: Function, onerror?: Function, redirect?: Function): EffekseerEffect;
    loadEffectPackage(path: string | ArrayBuffer, Unzip: any, scale?: number, onload?: Function, onerror?: Function): EffekseerEffect;
    releaseEffect(effect: EffekseerEffect): void;
    play(effect: EffekseerEffect, x?: number, y?: number, z?: number): EffekseerHandle | null;
    stopAll(): void;
    getRestInstancesCount(): number;
    getUpdateTime(): number;
    getDrawTime(): number;
    isVertexArrayObjectSupported(): boolean;
    setRestorationOfStatesFlag(flag: boolean): void;
    captureBackground(x: number, y: number, width: number, height: number): any;
    resetBackground(): any;
}
/**
 * Initialize Effekseer.js.
 * This function must be called at first if use WebAssembly
 * @param {string} path A file of webassembly
 * @param {function=} onload A function that is called at loading complete
 * @param {function=} onerror A function that is called at loading error.
 */
export declare function initRuntime(path: string, onload: any, onerror?: any): void;
/**
 * Initialize the WebGPU runtime of Effekseer.js (the contexts are initialized by initWebGPU)
 * @param {string} path the ES module effekseer_webgpu.mjs, the wasm is loaded next to it
 * @param {function=} onload A function that is called at loading complete
 * @param {function=} onerror A function that is called at loading error.
 */
export declare function initRuntimeWebGPU(path: string, onload: any, onerror?: any): void;
export declare function initRuntimeWebGPUPromise(path: string): Promise<any>;
export declare function isWebGPURuntime(): boolean;
export declare function initRuntimePromise(path: string): Promise<any>;
/**
 * Create a context to render in multiple scenes
 * @returns {EffekseerContext} context
 */
export declare function createContext(): EffekseerContext | null;
/**
 * Release specified context. After that, don't touch a context
 * @param {EffekseerContext} context context
 */
export declare function releaseContext(context: EffekseerContext): void;
export declare function setLogEnabled(flag: boolean): void;
/**
 * Set the string of cross origin for images
 * @param {string} crossOrigin
 */
export declare function setImageCrossOrigin(crossOrigin: string): void;
export {};
