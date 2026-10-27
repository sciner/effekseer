# Builds the WebGPU runtime (effekseer_webgpu.mjs + effekseer_webgpu.wasm in the root of the package)
# Needs emsdk (emcmake), cmake and ninja on PATH and the submodule Effekseer with its LLGI:
#   git submodule update --init Effekseer
#   git -C Effekseer submodule update --init Dev/Cpp/3rdParty/LLGI
# The patches of native/patches are applied to the submodule before the build
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$build = Join-Path $root "build-webgpu"
# the fixes of the submodules (native/patches/effekseer for Effekseer, native/patches/llgi for its LLGI), applied once
$targets = @{ "effekseer" = (Join-Path $root "Effekseer"); "llgi" = (Join-Path $root "Effekseer/Dev/Cpp/3rdParty/LLGI") }
foreach ($name in $targets.Keys) {
    $dir = $targets[$name]
    foreach ($patch in Get-ChildItem (Join-Path $PSScriptRoot "patches/$name") -Filter *.patch | Sort-Object Name) {
        git -C $dir apply --reverse --check $patch.FullName 2>$null
        if ($LASTEXITCODE -ne 0) {
            git -C $dir apply $patch.FullName
            if ($LASTEXITCODE -ne 0) { throw "failed to apply $($patch.Name)" }
        }
    }
}
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
