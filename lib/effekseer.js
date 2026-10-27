import { effekseer_native } from './effekseer_native.js';
var Module = {};
var Core;
var _imageCrossOrigin = '';
var _onloadAssembly = function _onloadAssembly() { };
var _onerrorAssembly = function _onerrorAssembly() { };
var _is_runtime_initialized = false;
var __initPromise = null;
var loadingEffect = null;
// the runtime is the WebGPU one (initRuntimeWebGPU): the contexts draw over the GPUTextures of the host
var _is_webgpu_runtime = false;
// the WebGL runtime of Effekseer master (effekseer_webgl.mjs) is OpenGL ES 3: its context is registered as WebGL 2
var _is_webgl2_runtime = false;
// the codes of the formats for EffekseerInit and EffekseerBeginFrame of the WebGPU runtime (main_webgpu.cpp)
const WEBGPU_COLOR_FORMATS = {
    'rgba8unorm': 0,
    'bgra8unorm': 1,
    'rgba16float': 2,
    'rgba8unorm-srgb': 3,
    'bgra8unorm-srgb': 4,
};
const WEBGPU_DEPTH_FORMATS = {
    'depth32float': 1,
    'depth24plus-stencil8': 2,
    'depth32float-stencil8': 3,
};
function webgpuColorFormatCode(format) {
    const code = WEBGPU_COLOR_FORMATS[format];
    if (code === undefined) {
        throw new Error(`Effekseer: the color format ${format} is not supported on WebGPU`);
    }
    return code;
}
// 0: the depth is not used (no depth buffer or a format LLGI does not support)
function webgpuDepthFormatCode(format) {
    return format ? (WEBGPU_DEPTH_FORMATS[format] ?? 0) : 0;
}
// the ids of the GPUTextures passed to the WebGPU runtime: the render pass is rebuilt when the id changes
const _webgpuTextureIds = new WeakMap();
let _webgpuNextTextureId = 0;
function webgpuTextureId(texture) {
    if (!texture) {
        return -1;
    }
    let id = _webgpuTextureIds.get(texture);
    if (id === undefined) {
        id = _webgpuNextTextureId++;
        _webgpuTextureIds.set(texture, id);
    }
    return id;
}
function _onRuntimeInitialized() {
    // C++ functions
    Core = {
        Init: _is_webgpu_runtime
            ? Module.cwrap("EffekseerInit", "number", ["number", "number", "number", "number", "number", "number"])
            : Module.cwrap("EffekseerInit", "number", ["number", "number", "number"]),
        BeginFrame: _is_webgpu_runtime ? Module.cwrap("EffekseerBeginFrame", "number", ["number", "number", "number", "number", "number", "number", "number", "number"]) : null,
        EndFrame: _is_webgpu_runtime ? Module.cwrap("EffekseerEndFrame", "void", ["number"]) : null,
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
            var _res = effect.resources.find(function (res) {
                return res.path == path;
            });
            if (_res) {
                return _res.isLoaded ? _res.image : null;
            }
        }
        var res = {
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
                _loadResource(path, function (image) {
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
        var res = effect.resources.find(function (res) {
            return res.path == path;
        });
        if (res) {
            return res.isLoaded ? res.buffer : null;
        }
        var res = {
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
            _loadResource(path, function (buffer) {
                res.buffer = buffer;
                res.isLoaded = true;
                effect._update();
            }, effect.onerror);
        }
        return null;
    };
    _is_runtime_initialized = true;
    _onloadAssembly();
}
;
function _initalize_wasm(url) {
    // fetch(url)
    //     .then(response => response.arrayBuffer()) // Получаем бинарный буфер WASM
    //     .then(buffer => {
    //         // Инициализация WebAssembly модуля
    //         WebAssembly.instantiate(buffer, imports)
    //             .then(result => {
    //                 Module = result.instance.exports;  // Экспортируемый объект модуля
    //                 _onRuntimeInitialized(); // Вызов пользовательской функции после инициализации
    //             })
    //             .catch(err => {
    //                 console.error('Failed to initialize WebAssembly module:', err);
    //             });
    //     })
    //     .catch(err => {
    //         console.error('Failed to fetch WebAssembly module:', err);
    //     });
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = function () {
        const params = { wasmBinary: xhr.response };
        // params.onRuntimeInitialized = _onRuntimeInitialized;
        effekseer_native(params).then(function (module) {
            Module = module;
            _onRuntimeInitialized();
        });
    };
    xhr.onerror = function () {
        _onerrorAssembly();
    };
    xhr.send(null);
}
// the WebGPU runtime: effekseer_webgpu.mjs (emscripten ES module), its wasm is next to it
// the WebGL runtime built from the same Effekseer as the WebGPU one: effekseer_webgl.mjs (emscripten ES module)
function _initalize_webgl_module(url) {
    const module_url = new URL(url, document.baseURI).href;
    import(/* @vite-ignore */ /* webpackIgnore: true */ module_url).then(function (factory) {
        return factory.default({});
    }).then(function (module) {
        Module = module;
        _is_webgpu_runtime = false;
        _is_webgl2_runtime = true;
        _onRuntimeInitialized();
    }).catch(function (e) {
        console.error(e);
        _onerrorAssembly();
    });
}
function _initalize_webgpu(url) {
    // the path is relative to the page like the wasm of the WebGL runtime, not to this module
    const module_url = new URL(url, document.baseURI).href;
    import(/* @vite-ignore */ /* webpackIgnore: true */ module_url).then(function (factory) {
        return factory.default({});
    }).then(function (module) {
        Module = module;
        _is_webgpu_runtime = true;
        _onRuntimeInitialized();
    }).catch(function (e) {
        console.error(e);
        _onerrorAssembly();
    });
}
function _isImagePowerOfTwo(image) {
    return !(image.width & image.width - 1) && !(image.height & image.height - 1);
}
function calcNextPowerOfTwo(v) {
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
function _convertPowerOfTwoImage(image) {
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
function _loadBinFile(url, onload, onerror) {
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
function _loadResource(path, onload, onerror) {
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
        _loadBinFile(path, function (buffer) {
            onload(buffer);
        }, onerror);
    }
}
export class EffekseerEffect {
    constructor(context) {
        this.context = context;
        this.nativeptr = 0;
        this.baseDir = "";
        this.isLoaded = false;
        this.scale = 1.0;
        this.resources = [];
        this.main_buffer = null;
    }
    _load(buffer) {
        loadingEffect = this;
        this.main_buffer = buffer;
        const memptr = Module._malloc(buffer.byteLength);
        Module.HEAP8.set(new Uint8Array(buffer), memptr);
        this.nativeptr = Core.LoadEffect(this.context.nativeptr, memptr, buffer.byteLength, this.scale);
        Module._free(memptr);
        loadingEffect = null;
        this._update();
    }
    async _loadFromPackage(buffer, Unzip) {
        const unzip = new Unzip(new Uint8Array(buffer));
        const meta_buffer = unzip.decompress('metafile.json');
        const textDecoder = new TextDecoder();
        const text = textDecoder.decode(meta_buffer);
        const json = JSON.parse(text);
        let efkFile;
        const dependencies = [];
        for (const key in json.files) {
            const val = json.files[key];
            if (val.type === 'Effect') {
                efkFile = key;
                dependencies.push(...val.dependencies);
            }
        }
        for (const dep of dependencies) {
            const _buffer = unzip.decompress(dep);
            Module.resourcesMap[dep] = _buffer.buffer;
        }
        const efk_buffer = unzip.decompress(efkFile);
        this._load(efk_buffer.buffer);
    }
    _reload() {
        loadingEffect = this;
        const buffer = this.main_buffer;
        const memptr = Module._malloc(buffer.byteLength);
        Module.HEAP8.set(new Uint8Array(buffer), memptr);
        Core.ReloadResources(this.context.nativeptr, this.nativeptr, memptr, buffer.byteLength);
        Module._free(memptr);
        loadingEffect = null;
    }
    _update() {
        let loaded = this.nativeptr != 0;
        if (this.resources.length > 0) {
            for (const resource of this.resources) {
                if (!resource.isLoaded && resource.isRequired) {
                    loaded = false;
                    break;
                }
            }
            if (loaded) {
                this.context._makeContextCurrent();
                this.context.contextStates.save();
                this._reload();
                this.context.contextStates.restore();
            }
        }
        if (!this.isLoaded && loaded) {
            this.isLoaded = true;
            if (this.onload)
                this.onload();
        }
    }
}
export class EffekseerHandle {
    constructor(context, native) {
        this.context = context;
        this.native = native;
    }
    stop() {
        Core.StopEffect(this.context.nativeptr, this.native);
    }
    stopRoot() {
        Core.StopRoot(this.context.nativeptr, this.native);
    }
    setFrame(frame) {
        Core.SetFrame(this.context.nativeptr, this.native, frame);
    }
    setLocation(x, y, z) {
        Core.SetLocation(this.context.nativeptr, this.native, x, y, z);
    }
    setRotation(x, y, z) {
        Core.SetRotation(this.context.nativeptr, this.native, x, y, z);
    }
    setScale(x, y, z) {
        Core.SetScale(this.context.nativeptr, this.native, x, y, z);
    }
    setMatrix(matrixArray) {
        const stack = Module.stackSave();
        const arrmem = Module.stackAlloc(4 * 16);
        Module.HEAPF32.set(matrixArray, arrmem >> 2);
        Core.SetMatrix(this.context.nativeptr, this.native, arrmem);
        Module.stackRestore(stack);
    }
    setAllColor(r, g, b, a) {
        Core.SetAllColor(this.context.nativeptr, this.native, r, g, b, a);
    }
    setTargetLocation(x, y, z) {
        Core.SetTargetLocation(this.context.nativeptr, this.native, x, y, z);
    }
    getDynamicInput(index) {
        return Core.GetDynamicInput(this.context.nativeptr, this.native, index);
    }
    setDynamicInput(index, value) {
        Core.SetDynamicInput(this.context.nativeptr, this.native, index, value);
    }
    sendTrigger(index) {
        Core.SendTrigger(this.context.nativeptr, this.native, index);
    }
    setPaused(paused) {
        Core.SetPaused(this.context.nativeptr, this.native, paused);
    }
    setShown(shown) {
        Core.SetShown(this.context.nativeptr, this.native, shown);
    }
    setSpeed(speed) {
        Core.SetSpeed(this.context.nativeptr, this.native, speed);
    }
    setRandomSeed(seed) {
        Core.SetRandomSeed(this.context.nativeptr, this.native, seed);
    }
    get exists() {
        return !!Core.Exists(this.context.nativeptr, this.native);
    }
}
class ContextStates {
    constructor(gl) {
        this.restore_texture_slot_max = 8;
        this._gl = gl;
        this.ext_vao = null;
        this.isWebGL2VAOEnabled = false;
        this.effekseer_vao = null;
        this.current_vao = null;
        this.current_vbo = null;
        this.current_ibo = null;
        this.current_textures = [];
        this.current_textures.length = this.restore_texture_slot_max;
        this.current_active_texture_id = null;
        this.ext_vao = this._gl.getExtension('OES_vertex_array_object');
        if (this.ext_vao != null) {
            this.effekseer_vao = this.ext_vao.createVertexArrayOES();
        }
        else if ('createVertexArray' in this._gl) {
            this.isWebGL2VAOEnabled = true;
            this.effekseer_vao = this._gl.createVertexArray();
        }
    }
    release() {
        if (this.effekseer_vao) {
            if (this.ext_vao) {
                this.ext_vao.deleteVertexArrayOES(this.effekseer_vao);
            }
            else if (this.isWebGL2VAOEnabled) {
                this._gl.deleteVertexArray(this.effekseer_vao);
            }
            this.effekseer_vao = null;
        }
        this._gl = null;
    }
    save() {
        this.current_vbo = this._gl.getParameter(this._gl.ARRAY_BUFFER_BINDING);
        this.current_ibo = this._gl.getParameter(this._gl.ELEMENT_ARRAY_BUFFER_BINDING);
        if (this.ext_vao != null) {
            this.current_vao = this._gl.getParameter(this.ext_vao.VERTEX_ARRAY_BINDING_OES);
            this.ext_vao.bindVertexArrayOES(this.effekseer_vao);
        }
        else if (this.isWebGL2VAOEnabled) {
            this.current_vao = this._gl.getParameter(this._gl.VERTEX_ARRAY_BINDING);
            this._gl.bindVertexArray(this.effekseer_vao);
        }
        this.current_active_texture_id = this._gl.getParameter(this._gl.ACTIVE_TEXTURE);
        for (let i = 0; i < this.restore_texture_slot_max; i++) {
            this._gl.activeTexture(this._gl.TEXTURE0 + i);
            this.current_textures[i] = this._gl.getParameter(this._gl.TEXTURE_BINDING_2D);
        }
    }
    restore() {
        for (let i = 0; i < this.restore_texture_slot_max; i++) {
            this._gl.activeTexture(this._gl.TEXTURE0 + i);
            this._gl.bindTexture(this._gl.TEXTURE_2D, this.current_textures[i]);
        }
        this._gl.activeTexture(this.current_active_texture_id);
        if (this.ext_vao != null) {
            this.ext_vao.bindVertexArrayOES(this.current_vao);
        }
        else if (this.isWebGL2VAOEnabled) {
            this._gl.bindVertexArray(this.current_vao);
        }
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this.current_vbo);
        this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this.current_ibo);
    }
    disableVAO() {
        if (this.ext_vao != null) {
            this.ext_vao.bindVertexArrayOES(null);
        }
        else if (this.isWebGL2VAOEnabled) {
            this._gl.bindVertexArray(null);
        }
    }
}
// WebGPU has no states of the host to save and restore
class NoContextStates {
    save() { }
    restore() { }
    disableVAO() { }
    release() { }
}
export class EffekseerContext {
    constructor() {
        this._gl = null;
        this.contextStates = null;
        this.ctx = null;
        this.nativeptr = null;
        this._restorationOfStatesFlag = true;
        // WebGPU: the render targets of the host the effects are drawn over (setRenderTargets)
        this._webgpu = false;
        this._colorTexture = null;
        this._depthTexture = null;
        this._colorFormat = 0;
        this._depthFormat = 0;
        this._samples = 1;
    }
    _makeContextCurrent() {
        if (this._webgpu) {
            return;
        }
        Module.GL.makeContextCurrent(this.ctx);
    }
    /**
     * Initialize the context on WebGPU (the runtime of initRuntimeWebGPU)
     * @param device the GPUDevice of the host
     * @param colorFormat the format of the render target the effects are drawn to (GPUTextureFormat)
     * @param depthFormat the format of its depth buffer (GPUTextureFormat), null without the depth
     */
    initWebGPU(device, colorFormat, depthFormat, settings) {
        if (!_is_webgpu_runtime) {
            throw new Error('Effekseer: initWebGPU needs the WebGPU runtime (initRuntimeWebGPU)');
        }
        this._webgpu = true;
        this.contextStates = new NoContextStates();
        let instanceMaxCount = 4000;
        let squareMaxCount = 10000;
        let premultipliedAlpha = false;
        // the depth buffer of the host is reversed (near 1, far 0)
        let reversedDepth = false;
        if (settings) {
            if ("instanceMaxCount" in settings)
                instanceMaxCount = settings.instanceMaxCount;
            if ("squareMaxCount" in settings)
                squareMaxCount = settings.squareMaxCount;
            if ("premultipliedAlpha" in settings)
                premultipliedAlpha = settings.premultipliedAlpha;
            if ("reversedDepth" in settings)
                reversedDepth = settings.reversedDepth;
        }
        // main_webgpu.cpp takes the device by emscripten_webgpu_get_device
        Module.preinitializedWebGPUDevice = device;
        this.nativeptr = Core.Init(instanceMaxCount, squareMaxCount, webgpuColorFormatCode(colorFormat), webgpuDepthFormatCode(depthFormat), premultipliedAlpha ? 1 : 0, reversedDepth ? 1 : 0);
        if (!this.nativeptr) {
            throw new Error('Effekseer: failed to initialize on WebGPU');
        }
    }
    /**
     * WebGPU: the render targets of the host for the next draw (the effects are drawn over them, nothing is cleared).
     * The commands of the host recorded before the draw must be submitted first: the runtime submits its own
     * command buffer in draw()
     * @param colorTexture GPUTexture with RENDER_ATTACHMENT (and COPY_SRC for the distortion)
     * @param depthTexture GPUTexture of the depth with RENDER_ATTACHMENT, null without the depth test
     */
    setRenderTargets(colorTexture, depthTexture = null) {
        this._colorTexture = colorTexture;
        this._depthTexture = depthTexture;
        this._colorFormat = webgpuColorFormatCode(colorTexture.format);
        this._depthFormat = depthTexture ? webgpuDepthFormatCode(depthTexture.format) : 0;
        this._samples = colorTexture.sampleCount ?? 1;
    }
    _beginFrameWebGPU() {
        const color = this._colorTexture;
        if (!color) {
            return false;
        }
        const depth = this._depthFormat > 0 ? this._depthTexture : null;
        Module.effekseerImportTextures = [color, depth];
        const res = Core.BeginFrame(this.nativeptr, webgpuTextureId(color), this._colorFormat, webgpuTextureId(depth), this._depthFormat, color.width, color.height, this._samples);
        Module.effekseerImportTextures = null;
        return !!res;
    }
    init(webglContext, settings) {
        this._gl = webglContext;
        this.contextStates = new ContextStates(this._gl);
        let instanceMaxCount = 4000;
        let squareMaxCount = 10000;
        let enableExtensionsByDefault = true;
        if (settings) {
            if ("instanceMaxCount" in settings)
                instanceMaxCount = settings.instanceMaxCount;
            if ("squareMaxCount" in settings)
                squareMaxCount = settings.squareMaxCount;
            if ("enableExtensionsByDefault" in settings)
                enableExtensionsByDefault = settings.enableExtensionsByDefault;
        }
        // @ts-ignore
        window.gl = this._gl;
        this.ctx = Module.GL.registerContext(webglContext, {
            majorVersion: _is_webgl2_runtime ? 2 : 1,
            minorVersion: 0,
            enableExtensionsByDefault: enableExtensionsByDefault
        });
        this._makeContextCurrent();
        this._restorationOfStatesFlag = true;
        this.contextStates.save();
        this.nativeptr = Core.Init(instanceMaxCount, squareMaxCount, enableExtensionsByDefault);
        this.contextStates.restore();
    }
    update(deltaFrames = 1.0) {
        Core.Update(this.nativeptr, deltaFrames);
    }
    beginUpdate() {
        Core.BeginUpdate(this.nativeptr);
    }
    endUpdate() {
        Core.EndUpdate(this.nativeptr);
    }
    updateHandle(handle, deltaFrames) {
        Core.UpdateHandle(this.nativeptr, handle.native, deltaFrames);
    }
    draw() {
        if (this._webgpu) {
            if (this._beginFrameWebGPU()) {
                Core.Draw(this.nativeptr);
                Core.EndFrame(this.nativeptr);
            }
            return;
        }
        this._makeContextCurrent();
        let program = null;
        if (this._restorationOfStatesFlag) {
            program = this._gl.getParameter(this._gl.CURRENT_PROGRAM);
            this.contextStates.save();
        }
        else {
            this.contextStates.disableVAO();
        }
        Core.Draw(this.nativeptr);
        if (this._restorationOfStatesFlag) {
            this.contextStates.restore();
            this._gl.useProgram(program);
        }
    }
    beginDraw() {
        if (this._webgpu) {
            if (this._beginFrameWebGPU()) {
                Core.BeginDraw(this.nativeptr);
            }
            return;
        }
        if (this._restorationOfStatesFlag) {
            this.contextStates.save();
        }
        else {
            this.contextStates.disableVAO();
        }
        Core.BeginDraw(this.nativeptr);
    }
    endDraw() {
        if (this._webgpu) {
            Core.EndDraw(this.nativeptr);
            Core.EndFrame(this.nativeptr);
            return;
        }
        Core.EndDraw(this.nativeptr);
        if (this._restorationOfStatesFlag) {
            this.contextStates.restore();
        }
    }
    drawHandle(handle) {
        Core.DrawHandle(this.nativeptr, handle.native);
    }
    setProjectionMatrix(matrixArray) {
        const stack = Module.stackSave();
        const arrmem = Module.stackAlloc(4 * 16);
        Module.HEAPF32.set(matrixArray, arrmem >> 2);
        Core.SetProjectionMatrix(this.nativeptr, arrmem);
        Module.stackRestore(stack);
    }
    setProjectionPerspective(fov, aspect, near, far) {
        Core.SetProjectionPerspective(this.nativeptr, fov, aspect, near, far);
    }
    setProjectionOrthographic(width, height, near, far) {
        Core.SetProjectionOrthographic(this.nativeptr, width, height, near, far);
    }
    setCameraMatrix(matrixArray) {
        const stack = Module.stackSave();
        const arrmem = Module.stackAlloc(4 * 16);
        Module.HEAPF32.set(matrixArray, arrmem >> 2);
        Core.SetCameraMatrix(this.nativeptr, arrmem);
        Module.stackRestore(stack);
    }
    setCameraLookAt(positionX, positionY, positionZ, targetX, targetY, targetZ, upvecX, upvecY, upvecZ) {
        Core.SetCameraLookAt(this.nativeptr, positionX, positionY, positionZ, targetX, targetY, targetZ, upvecX, upvecY, upvecZ);
    }
    setCameraLookAtFromVector(position, target, upvec) {
        const upvecVector = upvec ?? { x: 0, y: 1, z: 0 };
        Core.SetCameraLookAt(this.nativeptr, position.x, position.y, position.z, target.x, target.y, target.z, upvecVector.x, upvecVector.y, upvecVector.z);
    }
    loadEffect(data, scale = 1.0, onload, onerror, redirect) {
        this._makeContextCurrent();
        const effect = new EffekseerEffect(this);
        if (typeof scale === "function") {
            console.log("Error : second arguments is number from version 1.5");
            effect.scale = 1.0;
            effect.onload = scale;
            effect.onerror = onload;
            effect.redirect = redirect;
        }
        else {
            effect.scale = scale;
            effect.onload = onload;
            effect.onerror = onerror;
            effect.redirect = redirect;
        }
        if (typeof data === "string") {
            const dirIndex = data.lastIndexOf("/");
            effect.baseDir = dirIndex >= 0 ? data.slice(0, dirIndex + 1) : "";
            _loadBinFile(data, (buffer) => {
                effect._load(buffer);
            }, effect.onerror);
        }
        else if (data instanceof ArrayBuffer) {
            effect._load(data);
        }
        return effect;
    }
    loadEffectPackage(path, Unzip, scale = 1.0, onload, onerror) {
        this._makeContextCurrent();
        const effect = new EffekseerEffect(this);
        effect.scale = scale;
        effect.onload = onload;
        effect.onerror = onerror;
        if (typeof path === "string") {
            const dirIndex = path.lastIndexOf("/");
            effect.baseDir = dirIndex >= 0 ? path.slice(0, dirIndex + 1) : "";
            _loadBinFile(path, (buffer) => {
                effect._loadFromPackage(buffer, Unzip);
            }, effect.onerror);
        }
        else if (path instanceof ArrayBuffer) {
            effect._loadFromPackage(path, Unzip);
        }
        return effect;
    }
    releaseEffect(effect) {
        this._makeContextCurrent();
        if (effect == null) {
            console.warn("the effect is null.");
            return;
        }
        if (!effect.isLoaded) {
            console.warn("the effect has not be loaded yet.");
            return;
        }
        if (effect.nativeptr == null) {
            console.warn("the effect has been released.");
            return;
        }
        Core.ReleaseEffect(this.nativeptr, effect.nativeptr);
        effect.nativeptr = null;
    }
    play(effect, x = 0, y = 0, z = 0) {
        if (!effect || !effect.isLoaded) {
            return null;
        }
        const handle = Core.PlayEffect(this.nativeptr, effect.nativeptr, x, y, z);
        return handle >= 0 ? new EffekseerHandle(this, handle) : null;
    }
    stopAll() {
        Core.StopAllEffects(this.nativeptr);
    }
    // setResourceLoader(loader: any) {
    //     _loadResource = loader
    // }
    getRestInstancesCount() {
        return Core.GetRestInstancesCount(this.nativeptr);
    }
    getUpdateTime() {
        return Core.GetUpdateTime(this.nativeptr);
    }
    getDrawTime() {
        return Core.GetDrawTime(this.nativeptr);
    }
    isVertexArrayObjectSupported() {
        return Core.IsVertexArrayObjectSupported(this.nativeptr);
    }
    setRestorationOfStatesFlag(flag) {
        this._restorationOfStatesFlag = flag;
        Core.SetRestorationOfStatesFlag(this.nativeptr, flag);
    }
    captureBackground(x, y, width, height) {
        return Core.CaptureBackground(this.nativeptr, x, y, width, height);
    }
    resetBackground() {
        return Core.ResetBackground(this.nativeptr);
    }
}
/**
 * Initialize Effekseer.js.
 * This function must be called at first if use WebAssembly
 * @param {string} path A file of webassembly
 * @param {function=} onload A function that is called at loading complete
 * @param {function=} onerror A function that is called at loading error.
 */
export function initRuntime(path, onload, onerror) {
    if (typeof effekseer_native === "undefined") {
        onload();
        return;
    }
    _onloadAssembly = onload;
    _onerrorAssembly = onerror;
    // effekseer_webgl.mjs: the WebGL runtime of Effekseer master, effekseer.wasm: the old EffekseerForWebGL build
    if (path.split('?')[0].endsWith('.mjs')) {
        _initalize_webgl_module(path);
        return;
    }
    _initalize_wasm(path);
}
/**
 * Initialize the WebGPU runtime of Effekseer.js (the contexts are initialized by initWebGPU)
 * @param {string} path the ES module effekseer_webgpu.mjs, the wasm is loaded next to it
 * @param {function=} onload A function that is called at loading complete
 * @param {function=} onerror A function that is called at loading error.
 */
export function initRuntimeWebGPU(path, onload, onerror) {
    _onloadAssembly = onload;
    _onerrorAssembly = onerror;
    _initalize_webgpu(path);
}
export function initRuntimeWebGPUPromise(path) {
    if (__initPromise) {
        return __initPromise;
    }
    return __initPromise = new Promise((resolve, reject) => {
        initRuntimeWebGPU(path, resolve, reject);
    });
}
export function isWebGPURuntime() {
    return _is_webgpu_runtime;
}
export function initRuntimePromise(path) {
    if (__initPromise) {
        return __initPromise;
    }
    return __initPromise = new Promise((resolve, reject) => {
        initRuntime(path, resolve, reject);
    });
}
/**
 * Create a context to render in multiple scenes
 * @returns {EffekseerContext} context
 */
export function createContext() {
    if (!_is_runtime_initialized) {
        return null;
    }
    return new EffekseerContext();
}
/**
 * Release specified context. After that, don't touch a context
 * @param {EffekseerContext} context context
 */
export function releaseContext(context) {
    if (context.contextStates) {
        context.contextStates.release();
    }
    if (context._gl) {
        context._gl = null;
    }
    if (context.nativeptr == null) {
        return;
    }
    Core.Terminate(context.nativeptr);
    context.nativeptr = null;
}
export function setLogEnabled(flag) {
    Core.SetLogEnabled(flag);
}
/**
 * Set the string of cross origin for images
 * @param {string} crossOrigin
 */
export function setImageCrossOrigin(crossOrigin) {
    _imageCrossOrigin = crossOrigin;
}
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
