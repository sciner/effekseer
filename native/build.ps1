# Builds the WebGPU runtime (effekseer_webgpu.mjs + effekseer_webgpu.wasm in the root of the package)
# Needs emsdk (emcmake), cmake and ninja on PATH and the submodule Effekseer with its LLGI:
#   git submodule update --init Effekseer
#   git -C Effekseer submodule update --init Dev/Cpp/3rdParty/LLGI
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$build = Join-Path $root "build-webgpu"
New-Item -ItemType Directory -Force $build | Out-Null
Push-Location $build
try {
    emcmake cmake (Join-Path $root "native") -G Ninja -DCMAKE_BUILD_TYPE=Release
    if ($LASTEXITCODE -ne 0) { throw "cmake failed" }
    ninja effekseer_webgpu
    if ($LASTEXITCODE -ne 0) { throw "ninja failed" }
    Copy-Item effekseer_webgpu.mjs, effekseer_webgpu.wasm $root -Force
} finally {
    Pop-Location
}
