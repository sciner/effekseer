import { effekseer_native } from './effekseer_native.js';
import type { TModule } from './module.js';

var Module: TModule = {} as any
var Core: any
var _imageCrossOrigin = ''
var _onloadAssembly = function _onloadAssembly() { }
var _onerrorAssembly = function _onerrorAssembly() { }
var _is_runtime_initialized = false;
var loadingEffect: any = null;

function _onRuntimeInitialized() {
    // C++ functions
    Core = {
        Init: Module.cwrap("EffekseerInit", "number", ["number", "number", "number"]),
        Terminate: Module.cwrap("EffekseerTerminate", "void", ["number"]),
        Update: Module.cwrap("EffekseerUpdate", "void", ["number", "number"]),
        BeginUpdate: Module.cwrap("EffekseerBeginUpdate", "void", ["number"]),
        EndUpdate: Module.cwrap("EffekseerEndUpdate", "void", ["number"]),
        UpdateHandle: Module.cwrap("EffekseerUpdateHandle", "void", ["number", "number", "number"]),
        Draw: Module.cwrap("EffekseerDraw", "void", ["number"]),
        BeginDraw: Module.cwrap("EffekseerBeginDraw", "void", ["number"]),
        EndDraw: Module.cwrap("EffekseerEndDraw", "void", ["number"]),
        DrawHandle: Module.cwrap("EffekseerDrawHandle", "void", ["number", "number"]),
        SetProjectionMatrix: Module.cwrap("EffekseerSetProjectionMatrix", "void", ["number", "number"]),
        SetProjectionPerspective: Module.cwrap("EffekseerSetProjectionPerspective", "void", ["number", "number", "number", "number", "number"]),
        SetProjectionOrthographic: Module.cwrap("EffekseerSetProjectionOrthographic", "void", ["number", "number", "number", "number", "number"]),
        SetCameraMatrix: Module.cwrap("EffekseerSetCameraMatrix", "void", ["number", "number"]),
        SetCameraLookAt: Module.cwrap("EffekseerSetCameraLookAt", "void", ["number", "number", "number", "number", "number", "number", "number", "number", "number", "number"]),
        LoadEffect: Module.cwrap("EffekseerLoadEffect", "number", ["number", "number", "number", "number", "number"]),
        ReleaseEffect: Module.cwrap("EffekseerReleaseEffect", "void", ["number", "number"]),
        ReloadResources: Module.cwrap("EffekseerReloadResources", "void", ["number", "number"]),
        StopAllEffects: Module.cwrap("EffekseerStopAllEffects", "void", ["number"]),
        PlayEffect: Module.cwrap("EffekseerPlayEffect", "number", ["number", "number", "number", "number", "number"]),
        StopEffect: Module.cwrap("EffekseerStopEffect", "void", ["number", "number"]),
        StopRoot: Module.cwrap("EffekseerStopRoot", "void", ["number", "number"]),
        Exists: Module.cwrap("EffekseerExists", "number", ["number", "number"]),
        SetFrame: Module.cwrap("EffekseerSetFrame", "void", ["number", "number", "number"]),
        SetLocation: Module.cwrap("EffekseerSetLocation", "void", ["number", "number", "number", "number", "number"]),
        SetRotation: Module.cwrap("EffekseerSetRotation", "void", ["number", "number", "number", "number", "number"]),
        SetScale: Module.cwrap("EffekseerSetScale", "void", ["number", "number", "number", "number", "number"]),
        SetMatrix: Module.cwrap("EffekseerSetMatrix", "void", ["number", "number", "number"]),
        SetAllColor: Module.cwrap("EffekseerSetAllColor", "void", ["number", "number", "number", "number", "number", "number"]),
        SetTargetLocation: Module.cwrap("EffekseerSetTargetLocation", "void", ["number", "number", "number", "number", "number"]),
        GetDynamicInput: Module.cwrap("EffekseerGetDynamicInput", "number", ["number", "number", "number"]),
        SetDynamicInput: Module.cwrap("EffekseerSetDynamicInput", "void", ["number", "number", "number", "number"]),
        SendTrigger: Module.cwrap("EffekseerSendTrigger", "void", ["number", "number", "number"]),
        SetPaused: Module.cwrap("EffekseerSetPaused", "void", ["number", "number", "number"]),
        SetShown: Module.cwrap("EffekseerSetShown", "void", ["number", "number", "number"]),
        SetSpeed: Module.cwrap("EffekseerSetSpeed", "void", ["number", "number", "number"]),
        SetRandomSeed: Module.cwrap("EffekseerSetRandomSeed", "void", ["number", "number", "number"]),
        GetRestInstancesCount: Module.cwrap("EffekseerGetRestInstancesCount", "number", ["number"]),
        GetUpdateTime: Module.cwrap("EffekseerGetUpdateTime", "number", ["number"]),
        GetDrawTime: Module.cwrap("EffekseerGetDrawTime", "number", ["number"]),
        IsVertexArrayObjectSupported: Module.cwrap("EffekseerIsVertexArrayObjectSupported", "number", ["number"]),
        SetRestorationOfStatesFlag: Module.cwrap("EffekseerSetRestorationOfStatesFlag", "void", ["number", "number"]),
        CaptureBackground: Module.cwrap("EffekseerCaptureBackground", "void", ["number", "number", "number", "number", "number"]),
        ResetBackground: Module.cwrap("EffekseerResetBackground", "void", ["number"]),
        SetLogEnabled: Module.cwrap("EffekseerSetLogEnabled", "void", ["number"])
    };
    Module.resourcesMap = {};
    Module._isPowerOfTwo = function (img) {
        return _isImagePowerOfTwo(img);
    };
    Module._loadImage = function (path) {
        var effect = loadingEffect;
        effect.context._makeContextCurrent();
        {
            var _res = effect.resources.find(function (res: any) {
                return res.path == path;
            });
            if (_res) {
                return _res.isLoaded ? _res.image : null;
            }
        }
        var res: any = {
            path: path,
            isLoaded: false,
            image: null,
            isRequired: true
        };
        effect.resources.push(res);
        var path = effect.baseDir + path;
        if (effect.redirect) {
            path = effect.redirect(path);
        }
        {
            var arrayBuffer = Module.resourcesMap[path];
            if (arrayBuffer != null) {
                var arrayBufferView = new Uint8Array(arrayBuffer);
                Promise.resolve(new Blob([arrayBufferView], {
                    type: 'image/png'
                })).then(function (blob) {
                    return Promise.resolve(URL.createObjectURL(blob));
                }).then(function (url) {
                    var img = new Image();
                    img.onload = function () {
                        res.image = img;
                        res.isLoaded = true;
                        effect._update();
                    };
                    img.src = url;
                });
            }
            else {
                _loadResource(path, function(image: any) {
                    res.image = image;
                    res.isLoaded = true;
                    effect._update();
                }, effect.onerror);
            }
        }
        return null;
    };
    Module._loadBinary = function (path, isRequired) {
        var effect = loadingEffect;
        effect.context._makeContextCurrent();
        var res = effect.resources.find(function (res: any) {
            return res.path == path;
        });
        if (res) {
            return res.isLoaded ? res.buffer : null;
        }
        var res: any = {
            path: path,
            isLoaded: false,
            buffer: null,
            isRequired: isRequired
        };
        effect.resources.push(res);
        var path = effect.baseDir + path;
        if (effect.redirect) {
            path = effect.redirect(path);
        }
        var arrayBuffer = Module.resourcesMap[path];
        if (arrayBuffer != null) {
            res.buffer = arrayBuffer;
            res.isLoaded = true;
            effect._update();
        }
        else {
            _loadResource(path, function (buffer: ArrayBuffer) {
                res.buffer = buffer;
                res.isLoaded = true;
                effect._update();
            }, effect.onerror);
        }
        return null;
    };
    _is_runtime_initialized = true;
    _onloadAssembly();
};

function _initalize_wasm(url: string) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = function () {
        const params = {wasmBinary: xhr.response};
        // params.onRuntimeInitialized = _onRuntimeInitialized;
        effekseer_native(params).then(function (module: any) {
            Module = module;
            _onRuntimeInitialized();
        });
    };
    xhr.onerror = function () {
        _onerrorAssembly();
    };
    xhr.send(null);
}

function _isImagePowerOfTwo(image: any) {
    return !(image.width & image.width - 1) && !(image.height & image.height - 1);
}

function calcNextPowerOfTwo(v: any) {
    var sizes = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
    // @ts-ignore
    var foundInd = -1;
    for (var i = 0; i < sizes.length; i++) {
        if (sizes[i] >= v) {
            return sizes[i];
        }
    }
    for (var i = sizes.length - 1; i >= 0; i--) {
        if (sizes[i] <= v) {
            return sizes[i];
        }
    }
    return 1;
}

function _convertPowerOfTwoImage(image: any) {
    if (!_isImagePowerOfTwo(image)) {
        var canvas = document.createElement("canvas");
        canvas.width = calcNextPowerOfTwo(image.width);
        canvas.height = calcNextPowerOfTwo(image.height);
        var context2d = canvas.getContext("2d");
        context2d.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height);
        image = canvas;
    }
    return image;
}

function _loadBinFile(url: any, onload: any, onerror: any) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = function () {
        onload(xhr.response);
    };
    xhr.onerror = function () {
        if (!(typeof onerror === "undefined"))
            onerror('not found', url);
    };
    xhr.send(null);
}

function _loadResource(path: any, onload: any, onerror: any) {
    const splitted_path = path.split('?');
    var ext_path = path;
    if (splitted_path.length >= 2) {
        ext_path = splitted_path[0];
    }
    var extindex = ext_path.lastIndexOf(".");
    var ext = extindex >= 0 ? ext_path.slice(extindex) : "";
    if (ext == ".png" || ext == ".jpg") {
        var image = new Image();
        image.onload = function () {
            var converted_image = _convertPowerOfTwoImage(image);
            onload(converted_image);
        };
        image.onerror = function () {
            if (!(typeof onerror === "undefined"))
                onerror('not found', path);
        };
        image.crossOrigin = _imageCrossOrigin;
        image.src = path;
    }
    else if (ext == ".tga") {
        if (!(typeof onerror === "undefined"))
            onerror('not supported', path);
    }
    else {
        _loadBinFile(path, function (buffer: ArrayBuffer) {
            onload(buffer);
        }, onerror);
    }
}

class EffekseerEffect {
    context: any
    nativeptr: number
    baseDir: string
    isLoaded: boolean
    scale: number
    resources: any[]
    main_buffer: ArrayBuffer | null
    onload: any;
    onerror: Function;
    redirect: Function;

    constructor(context: any) {
        this.context = context
        this.nativeptr = 0
        this.baseDir = ""
        this.isLoaded = false
        this.scale = 1.0
        this.resources = []
        this.main_buffer = null
    }

    _load(buffer: ArrayBuffer) {
        loadingEffect = this
        this.main_buffer = buffer
        const memptr = Module._malloc(buffer.byteLength)
        Module.HEAP8.set(new Uint8Array(buffer), memptr)
        this.nativeptr = Core.LoadEffect(this.context.nativeptr, memptr, buffer.byteLength, this.scale)
        Module._free(memptr)
        loadingEffect = null
        this._update()
    }

    async _loadFromPackage(buffer: ArrayBuffer, Unzip: any) {
        const unzip = new Unzip(new Uint8Array(buffer))
        const meta_buffer = unzip.decompress('metafile.json')
        const textDecoder = new TextDecoder()
        const text = textDecoder.decode(meta_buffer)
        const json = JSON.parse(text)
        let efkFile
        const dependencies: string[] = []
        
        for (const key in json.files) {
            const val = json.files[key]
            if (val.type === 'Effect') {
                efkFile = key
                dependencies.push(...val.dependencies)
            }
        }
        
        for (const dep of dependencies) {
            const _buffer = unzip.decompress(dep)
            Module.resourcesMap[dep] = _buffer.buffer
        }

        const efk_buffer = unzip.decompress(efkFile)
        this._load(efk_buffer.buffer)
    }

    _reload() {
        loadingEffect = this
        const buffer = this.main_buffer!
        const memptr = Module._malloc(buffer.byteLength)
        Module.HEAP8.set(new Uint8Array(buffer), memptr)
        Core.ReloadResources(this.context.nativeptr, this.nativeptr, memptr, buffer.byteLength)
        Module._free(memptr)
        loadingEffect = null
    }

    _update() {
        let loaded = this.nativeptr != 0
        if (this.resources.length > 0) {
            for (const resource of this.resources) {
                if (!resource.isLoaded && resource.isRequired) {
                    loaded = false
                    break
                }
            }
            if (loaded) {
                this.context._makeContextCurrent()
                this.context.contextStates.save()
                this._reload()
                this.context.contextStates.restore()
            }
        }
        if (!this.isLoaded && loaded) {
            this.isLoaded = true
            if (this.onload) this.onload()
        }
    }
}

class EffekseerHandle {
    context: any
    native: any

    constructor(context: any, native: any) {
        this.context = context
        this.native = native
    }

    stop() {
        Core.StopEffect(this.context.nativeptr, this.native)
    }

    stopRoot() {
        Core.StopRoot(this.context.nativeptr, this.native)
    }

    setFrame(frame: number) {
        Core.SetFrame(this.context.nativeptr, this.native, frame)
    }

    setLocation(x: number, y: number, z: number) {
        Core.SetLocation(this.context.nativeptr, this.native, x, y, z)
    }

    setRotation(x: number, y: number, z: number) {
        Core.SetRotation(this.context.nativeptr, this.native, x, y, z)
    }

    setScale(x: number, y: number, z: number) {
        Core.SetScale(this.context.nativeptr, this.native, x, y, z)
    }

    setMatrix(matrixArray: number[]) {
        const stack = Module.stackSave()
        const arrmem = Module.stackAlloc(4 * 16)
        Module.HEAPF32.set(matrixArray, arrmem >> 2)
        Core.SetMatrix(this.context.nativeptr, this.native, arrmem)
        Module.stackRestore(stack)
    }

    setAllColor(r: number, g: number, b: number, a: number) {
        Core.SetAllColor(this.context.nativeptr, this.native, r, g, b, a)
    }

    setTargetLocation(x: number, y: number, z: number) {
        Core.SetTargetLocation(this.context.nativeptr, this.native, x, y, z)
    }

    getDynamicInput(index: number): number {
        return Core.GetDynamicInput(this.context.nativeptr, this.native, index)
    }

    setDynamicInput(index: number, value: number) {
        Core.SetDynamicInput(this.context.nativeptr, this.native, index, value)
    }

    sendTrigger(index: number) {
        Core.SendTrigger(this.context.nativeptr, this.native, index)
    }

    setPaused(paused: boolean) {
        Core.SetPaused(this.context.nativeptr, this.native, paused)
    }

    setShown(shown: boolean) {
        Core.SetShown(this.context.nativeptr, this.native, shown)
    }

    setSpeed(speed: number) {
        Core.SetSpeed(this.context.nativeptr, this.native, speed)
    }

    setRandomSeed(seed: number) {
        Core.SetRandomSeed(this.context.nativeptr, this.native, seed)
    }

    get exists(): boolean {
        return !!Core.Exists(this.context.nativeptr, this.native)
    }
}

class ContextStates {
    restore_texture_slot_max: number
    _gl: any
    ext_vao: any
    isWebGL2VAOEnabled: boolean
    effekseer_vao: any
    current_vao: any
    current_vbo: any
    current_ibo: any
    current_textures: any[]
    current_active_texture_id: any

    constructor(gl: any) {
        this.restore_texture_slot_max = 8
        this._gl = gl
        this.ext_vao = null
        this.isWebGL2VAOEnabled = false
        this.effekseer_vao = null
        this.current_vao = null
        this.current_vbo = null
        this.current_ibo = null
        this.current_textures = []
        this.current_textures.length = this.restore_texture_slot_max
        this.current_active_texture_id = null
        this.ext_vao = this._gl.getExtension('OES_vertex_array_object')
        if (this.ext_vao != null) {
            this.effekseer_vao = this.ext_vao.createVertexArrayOES()
        } else if ('createVertexArray' in this._gl) {
            this.isWebGL2VAOEnabled = true
            this.effekseer_vao = this._gl.createVertexArray()
        }
    }

    release() {
        if (this.effekseer_vao) {
            if (this.ext_vao) {
                this.ext_vao.deleteVertexArrayOES(this.effekseer_vao)
            } else if (this.isWebGL2VAOEnabled) {
                this._gl.deleteVertexArray(this.effekseer_vao)
            }
            this.effekseer_vao = null
        }
        this._gl = null
    }

    save() {
        this.current_vbo = this._gl.getParameter(this._gl.ARRAY_BUFFER_BINDING)
        this.current_ibo = this._gl.getParameter(this._gl.ELEMENT_ARRAY_BUFFER_BINDING)
        if (this.ext_vao != null) {
            this.current_vao = this._gl.getParameter(this.ext_vao.VERTEX_ARRAY_BINDING_OES)
            this.ext_vao.bindVertexArrayOES(this.effekseer_vao)
        } else if (this.isWebGL2VAOEnabled) {
            this.current_vao = this._gl.getParameter(this._gl.VERTEX_ARRAY_BINDING)
            this._gl.bindVertexArray(this.effekseer_vao)
        }
        this.current_active_texture_id = this._gl.getParameter(this._gl.ACTIVE_TEXTURE)
        for (let i = 0; i < this.restore_texture_slot_max; i++) {
            this._gl.activeTexture(this._gl.TEXTURE0 + i)
            this.current_textures[i] = this._gl.getParameter(this._gl.TEXTURE_BINDING_2D)
        }
    }

    restore() {
        for (let i = 0; i < this.restore_texture_slot_max; i++) {
            this._gl.activeTexture(this._gl.TEXTURE0 + i)
            this._gl.bindTexture(this._gl.TEXTURE_2D, this.current_textures[i])
        }
        this._gl.activeTexture(this.current_active_texture_id)
        if (this.ext_vao != null) {
            this.ext_vao.bindVertexArrayOES(this.current_vao)
        } else if (this.isWebGL2VAOEnabled) {
            this._gl.bindVertexArray(this.current_vao)
        }
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this.current_vbo)
        this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this.current_ibo)
    }

    disableVAO() {
        if (this.ext_vao != null) {
            this.ext_vao.bindVertexArrayOES(null)
        } else if (this.isWebGL2VAOEnabled) {
            this._gl.bindVertexArray(null)
        }
    }
}

class EffekseerContext {
    _gl: WebGLRenderingContext | null = null
    contextStates: ContextStates | null = null
    ctx: any = null
    nativeptr: any = null
    _restorationOfStatesFlag: boolean = true

    _makeContextCurrent() {
        Module.GL.makeContextCurrent(this.ctx)
    }

    init(webglContext: WebGLRenderingContext, settings?: { instanceMaxCount?: number, squareMaxCount?: number, enableExtensionsByDefault?: boolean }) {
        this._gl = webglContext
        this.contextStates = new ContextStates(this._gl)

        let instanceMaxCount = 4000
        let squareMaxCount = 10000
        let enableExtensionsByDefault = true

        if (settings) {
            if ("instanceMaxCount" in settings) instanceMaxCount = settings.instanceMaxCount!
            if ("squareMaxCount" in settings) squareMaxCount = settings.squareMaxCount!
            if ("enableExtensionsByDefault" in settings) enableExtensionsByDefault = settings.enableExtensionsByDefault!
        }

        // @ts-ignore
        window.gl = this._gl

        this.ctx = Module.GL.registerContext(webglContext, {
            majorVersion: 1,
            minorVersion: 0,
            enableExtensionsByDefault: enableExtensionsByDefault
        })

        this._makeContextCurrent()
        this._restorationOfStatesFlag = true

        this.contextStates.save()
        this.nativeptr = Core.Init(instanceMaxCount, squareMaxCount, enableExtensionsByDefault)
        this.contextStates.restore()
    }

    update(deltaFrames: number = 1.0) {
        Core.Update(this.nativeptr, deltaFrames)
    }

    beginUpdate() {
        Core.BeginUpdate(this.nativeptr)
    }

    endUpdate() {
        Core.EndUpdate(this.nativeptr)
    }

    updateHandle(handle: EffekseerHandle, deltaFrames: number) {
        Core.UpdateHandle(this.nativeptr, handle.native, deltaFrames)
    }

    draw() {
        this._makeContextCurrent()
        let program = null
        if (this._restorationOfStatesFlag) {
            program = this._gl!.getParameter(this._gl!.CURRENT_PROGRAM)
            this.contextStates!.save()
        } else {
            this.contextStates!.disableVAO()
        }
        Core.Draw(this.nativeptr)
        if (this._restorationOfStatesFlag) {
            this.contextStates!.restore()
            this._gl!.useProgram(program)
        }
    }

    beginDraw() {
        if (this._restorationOfStatesFlag) {
            this.contextStates!.save()
        } else {
            this.contextStates!.disableVAO()
        }
        Core.BeginDraw(this.nativeptr)
    }

    endDraw() {
        Core.EndDraw(this.nativeptr)
        if (this._restorationOfStatesFlag) {
            this.contextStates!.restore()
        }
    }

    drawHandle(handle: EffekseerHandle) {
        Core.DrawHandle(this.nativeptr, handle.native)
    }

    setProjectionMatrix(matrixArray: number[]) {
        const stack = Module.stackSave()
        const arrmem = Module.stackAlloc(4 * 16)
        Module.HEAPF32.set(matrixArray, arrmem >> 2)
        Core.SetProjectionMatrix(this.nativeptr, arrmem)
        Module.stackRestore(stack)
    }

    setProjectionPerspective(fov: number, aspect: number, near: number, far: number) {
        Core.SetProjectionPerspective(this.nativeptr, fov, aspect, near, far)
    }

    setProjectionOrthographic(width: number, height: number, near: number, far: number) {
        Core.SetProjectionOrthographic(this.nativeptr, width, height, near, far)
    }

    setCameraMatrix(matrixArray: number[]) {
        const stack = Module.stackSave()
        const arrmem = Module.stackAlloc(4 * 16)
        Module.HEAPF32.set(matrixArray, arrmem >> 2)
        Core.SetCameraMatrix(this.nativeptr, arrmem)
        Module.stackRestore(stack)
    }

    setCameraLookAt(positionX: number, positionY: number, positionZ: number, targetX: number, targetY: number, targetZ: number, upvecX: number, upvecY: number, upvecZ: number) {
        Core.SetCameraLookAt(this.nativeptr, positionX, positionY, positionZ, targetX, targetY, targetZ, upvecX, upvecY, upvecZ)
    }

    setCameraLookAtFromVector(position: { x: number, y: number, z: number }, target: { x: number, y: number, z: number }, upvec?: { x: number, y: number, z: number }) {
        const upvecVector = upvec ?? { x: 0, y: 1, z: 0 }
        Core.SetCameraLookAt(this.nativeptr, position.x, position.y, position.z, target.x, target.y, target.z, upvecVector.x, upvecVector.y, upvecVector.z)
    }

    loadEffect(data: string | ArrayBuffer, scale: number = 1.0, onload?: Function, onerror?: Function, redirect?: Function): EffekseerEffect {
        this._makeContextCurrent()
        const effect = new EffekseerEffect(this)

        if (typeof scale === "function") {
            console.log("Error : second arguments is number from version 1.5")
            effect.scale = 1.0
            effect.onload = scale as any
            effect.onerror = onload
            effect.redirect = redirect
        } else {
            effect.scale = scale
            effect.onload = onload
            effect.onerror = onerror
            effect.redirect = redirect
        }

        if (typeof data === "string") {
            const dirIndex = data.lastIndexOf("/")
            effect.baseDir = dirIndex >= 0 ? data.slice(0, dirIndex + 1) : ""
            _loadBinFile(data, (buffer: ArrayBuffer) => {
                effect._load(buffer)
            }, effect.onerror)
        } else if (data instanceof ArrayBuffer) {
            effect._load(data)
        }
        return effect
    }

    loadEffectPackage(path: string | ArrayBuffer, Unzip: any, scale: number = 1.0, onload?: Function, onerror?: Function): EffekseerEffect {
        this._makeContextCurrent()
        const effect = new EffekseerEffect(this)
        effect.scale = scale
        effect.onload = onload
        effect.onerror = onerror

        if (typeof path === "string") {
            const dirIndex = path.lastIndexOf("/")
            effect.baseDir = dirIndex >= 0 ? path.slice(0, dirIndex + 1) : ""
            _loadBinFile(path, (buffer: ArrayBuffer) => {
                effect._loadFromPackage(buffer, Unzip)
            }, effect.onerror)
        } else if (path instanceof ArrayBuffer) {
            effect._loadFromPackage(path, Unzip)
        }
        return effect
    }

    releaseEffect(effect: EffekseerEffect) {
        this._makeContextCurrent()
        if (effect == null) {
            console.warn("the effect is null.")
            return
        }
        if (!effect.isLoaded) {
            console.warn("the effect has not be loaded yet.")
            return
        }
        if (effect.nativeptr == null) {
            console.warn("the effect has been released.")
            return
        }
        Core.ReleaseEffect(this.nativeptr, effect.nativeptr)
        effect.nativeptr = null
    }

    play(effect: EffekseerEffect, x: number = 0, y: number = 0, z: number = 0): EffekseerHandle | null {
        if (!effect || !effect.isLoaded) {
            return null
        }
        const handle = Core.PlayEffect(this.nativeptr, effect.nativeptr, x, y, z)
        return handle >= 0 ? new EffekseerHandle(this, handle) : null
    }

    stopAll() {
        Core.StopAllEffects(this.nativeptr)
    }

    setResourceLoader(loader: any) {
        _loadResource = loader
    }

    getRestInstancesCount(): number {
        return Core.GetRestInstancesCount(this.nativeptr)
    }

    getUpdateTime(): number {
        return Core.GetUpdateTime(this.nativeptr)
    }

    getDrawTime(): number {
        return Core.GetDrawTime(this.nativeptr)
    }

    isVertexArrayObjectSupported(): boolean {
        return Core.IsVertexArrayObjectSupported(this.nativeptr)
    }

    setRestorationOfStatesFlag(flag: boolean) {
        this._restorationOfStatesFlag = flag
        Core.SetRestorationOfStatesFlag(this.nativeptr, flag)
    }

    captureBackground(x: number, y: number, width: number, height: number): any {
        return Core.CaptureBackground(this.nativeptr, x, y, width, height)
    }

    resetBackground() {
        return Core.ResetBackground(this.nativeptr)
    }
}

class Effekseer {
    defaultContext: EffekseerContext | null = null

    /**
     * Initialize Effekseer.js.
     * This function must be called at first if use WebAssembly
     * @param {string} path A file of webassembly
     * @param {function=} onload A function that is called at loading complete
     * @param {function=} onerror A function that is called at loading error.
     */
    initRuntime(path: string, onload: any, onerror?: any) {
        if (typeof effekseer_native === "undefined") {
            onload()
            return
        }
        _onloadAssembly = onload
        _onerrorAssembly = onerror
        _initalize_wasm(path)
    }

    /**
     * Create a context to render in multiple scenes
     * @returns {EffekseerContext} context
     */
    createContext(): EffekseerContext | null {
        if (!_is_runtime_initialized) {
            return null
        }
        return new EffekseerContext()
    }

    /**
     * Release specified context. After that, don't touch a context
     * @param {EffekseerContext} context context
     */
    releaseContext(context: EffekseerContext) {
        if (context.contextStates) {
            context.contextStates.release()
        }
        if (context._gl) {
            context._gl = null
        }
        if (context.nativeptr == null) {
            return
        }
        Core.Terminate(context.nativeptr)
        context.nativeptr = null
    }

    /**
     * Set the flag whether Effekseer shows logs
     * @param {boolean} flag
     */
    setLogEnabled(flag: boolean) {
        Core.SetLogEnabled(flag)
    }

    /**
     * Set the string of cross origin for images
     * @param {string} crossOrigin
     */
    setImageCrossOrigin(crossOrigin: string) {
        _imageCrossOrigin = crossOrigin
    }

    /**
     * Initialize graphics system.
     * @param {WebGLRenderingContext} webglContext WebGL Context
     * @param {object} settings Some settings with Effekseer initialization
     */
    init(webglContext: WebGLRenderingContext, settings?: object) {
        console.warn('deprecated: please use through createContext.')
        this.defaultContext = new EffekseerContext()
        this.defaultContext.init(webglContext, settings)
    }

    /**
     * Advance frames.
     * @param {number=} deltaFrames number of advance frames
     */
    update(deltaFrames?: number) {
        console.warn('deprecated: please use through createContext.')
        this.defaultContext?.update(deltaFrames)
    }

    beginUpdate() {
        console.warn('deprecated: please use through createContext.')
        this.defaultContext?.beginUpdate()
    }

    endUpdate() {
        console.warn('deprecated: please use through createContext.')
        this.defaultContext?.endUpdate()
    }

    updateHandle(handle: EffekseerHandle, deltaFrames?: number) {
        console.warn('deprecated: please use through createContext.')
        this.defaultContext?.updateHandle(handle, deltaFrames)
    }

    /**
     * Main rendering.
     */
    draw() {
        console.warn('deprecated: please use through createContext.')
        this.defaultContext?.draw()
    }

    beginDraw() {
        console.warn('deprecated: please use through createContext.')
        this.defaultContext?.beginDraw()
    }

    endDraw() {
        console.warn('deprecated: please use through createContext.')
        this.defaultContext?.endDraw()
    }

    drawHandle(handle: EffekseerHandle) {
        console.warn('deprecated: please use through createContext.')
        this.defaultContext?.drawHandle(handle)
    }

    /**
     * Set camera projection from matrix.
     * @param {array} matrixArray An array that is required 16 elements
     */
    setProjectionMatrix(matrixArray: number[]) {
        console.warn('deprecated: please use through createContext.')
        this.defaultContext?.setProjectionMatrix(matrixArray)
    }

    /**
     * Set camera projection from perspective parameters.
     * @param {number} fov Field of view in degree
     * @param {number} aspect Aspect ratio
     * @param {number} near Distance of near plane
     * @param {number} far Distance of far plane
     */
    setProjectionPerspective(fov: number, aspect: number, near: number, far: number) {
        console.warn('deprecated: please use through createContext.')
        this.defaultContext?.setProjectionPerspective(fov, aspect, near, far)
    }

    /**
     * Set camera projection from orthographic parameters.
     * @param {number} width Width coordinate of the view plane
     * @param {number} height Height coordinate of the view plane
     * @param {number} near Distance of near plane
     * @param {number} far Distance of far plane
     */
    setProjectionOrthographic(width: number, height: number, near: number, far: number) {
        console.warn('deprecated: please use through createContext.')
        this.defaultContext?.setProjectionOrthographic(width, height, near, far)
    }

    /**
     * Set camera view from matrix.
     * @param {array} matrixArray An array that is required 16 elements
     */
    setCameraMatrix(matrixArray: number[]) {
        console.warn('deprecated: please use through createContext.')
        this.defaultContext?.setCameraMatrix(matrixArray)
    }

    /**
     * Set camera view from lookat parameters.
     * @param {number} positionX X value of camera position
     * @param {number} positionY Y value of camera position
     * @param {number} positionZ Z value of camera position
     * @param {number} targetX X value of target position
     * @param {number} targetY Y value of target position
     * @param {number} targetZ Z value of target position
     * @param {number} upvecX X value of upper vector
     * @param {number} upvecY Y value of upper vector
     * @param {number} upvecZ Z value of upper vector
     */
    setCameraLookAt(positionX: number, positionY: number, positionZ: number, targetX: number, targetY: number, targetZ: number, upvecX: number, upvecY: number, upvecZ: number) {
        console.warn('deprecated: please use through createContext.')
        this.defaultContext?.setCameraLookAt(positionX, positionY, positionZ, targetX, targetY, targetZ, upvecX, upvecY, upvecZ)
    }

    /**
     * Set camera view from lookat vector parameters.
     * @param {object} position camera position
     * @param {object} target target position
     * @param {object=} upvec upper vector
     */
    setCameraLookAtFromVector(position: { x: number, y: number, z: number }, target: { x: number, y: number, z: number }, upvec?: { x: number, y: number, z: number }) {
        console.warn('deprecated: please use through createContext.')
        this.defaultContext?.setCameraLookAtFromVector(position, target, upvec)
    }

    /**
     * Load the effect data file (and resources).
     * @param {string} path A URL of effect file (*.efk)
     * @param {number} scale A magnification rate for the effect. The effect is loaded magnifying with this specified number.
     * @param {function=} onload A function that is called at loading complete
     * @param {function=} onerror A function that is called at loading error. First argument is a message. Second argument is an url.
     * @returns {EffekseerEffect} The effect data
     */
    loadEffect(path: string, scale: number = 1.0, onload?: Function, onerror?: Function): EffekseerEffect {
        console.warn('deprecated: please use through createContext.')
        return this.defaultContext?.loadEffect(path, scale, onload, onerror) as EffekseerEffect
    }

    /**
     * Release the specified effect. Don't touch the instance of effect after released.
     * @param {EffekseerEffect} effect The loaded effect
     */
    releaseEffect(effect: EffekseerEffect) {
        console.warn('deprecated: please use through createContext.')
        this.defaultContext?.releaseEffect(effect)
    }

    /**
     * Play the specified effect.
     * @param {EffekseerEffect} effect The loaded effect
     * @param {number} x X value of location that is emitted
     * @param {number} y Y value of location that is emitted
     * @param {number} z Z value of location that is emitted
     * @returns {EffekseerHandle} The effect handle
     */
    play(effect: EffekseerEffect, x?: number, y?: number, z?: number): EffekseerHandle | null {
        console.warn('deprecated: please use through createContext.')
        return this.defaultContext?.play(effect, x, y, z) || null
    }

    /**
     * Stop all effects.
     */
    stopAll() {
        console.warn('deprecated: please use through createContext.')
        this.defaultContext?.stopAll()
    }

    /**
     * Set the resource loader function.
     * @param {function} loader
     */
    setResourceLoader(loader: Function) {
        console.warn('deprecated: please use through createContext.')
        this.defaultContext?.setResourceLoader(loader)
    }

    /**
     * Get whether VAO is supported
     */
    isVertexArrayObjectSupported(): boolean {
        console.warn('deprecated: please use through createContext.')
        return this.defaultContext?.isVertexArrayObjectSupported() || false
    }
}

export const effekseer = new Effekseer()
// _onRuntimeInitialized();

// if (typeof effekseer_native === "undefined") {
//     let moduleOrPromise = effekseer();
//     if (moduleOrPromise instanceof Promise) {
//         moduleOrPromise.then(function (module) {
//             Module = module;
//             _onRuntimeInitialized();
//         });
//     }
//     else {
//         Module = moduleOrPromise;
//         _onRuntimeInitialized();
//     }
// }
