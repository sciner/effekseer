// The objects of the host (the game) passed to the WebGPU runtime
addToLibrary({
  // Module.preinitializedWebGPUDevice: the GPUDevice of the host
  effekseer_webgpu_import_device__deps: ['emscripten_webgpu_get_device'],
  effekseer_webgpu_import_device: () => _emscripten_webgpu_get_device(),

  // Module.effekseerImportTextures[slot]: the GPUTexture of the render target (0) and the depth (1) of the draw
  effekseer_webgpu_import_texture__deps: ['$WebGPU', 'emwgpuCreateTexture'],
  effekseer_webgpu_import_texture: (slot) => {
    var texture = Module.effekseerImportTextures[slot];
    var ptr = _emwgpuCreateTexture(0);
    WebGPU.Internals.jsObjects[ptr] = texture;
    return ptr;
  },
});
