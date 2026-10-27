# The WebGPU runtime of Effekseer for the browser (emscripten + emdawnwebgpu): the libraries of Effekseer master
# (EffekseerRendererWebGPU over LLGI) and the C API of src/cpp/main_webgpu.cpp, the same functions as the WebGL runtime
cmake_minimum_required(VERSION 3.15)
project(effekseer_webgpu C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(EFFEKSEER_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../Effekseer" CACHE PATH "Effekseer source directory")

# the WebGL runtime (effekseer_webgl): EffekseerRendererGL in the OpenGL ES 3 mode (WebGL 2: the materials need it)
set(BUILD_GL ON CACHE BOOL "" FORCE)
set(USE_OPENGLES2 OFF CACHE BOOL "" FORCE)
set(USE_OPENGLES3 ON CACHE BOOL "" FORCE)
set(BUILD_WEBGPU ON CACHE BOOL "" FORCE)
# the browser build: LLGI takes the WGSL shaders as they are (no glslang)
set(BUILD_WEBGPU_BROWSER_TEST ON CACHE BOOL "" FORCE)
set(BUILD_VULKAN OFF CACHE BOOL "" FORCE)
set(BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
set(BUILD_TOOLS OFF CACHE BOOL "" FORCE)
set(BUILD_TEST OFF CACHE BOOL "" FORCE)
set(BUILD_VIEWER OFF CACHE BOOL "" FORCE)
set(BUILD_EDITOR OFF CACHE BOOL "" FORCE)
set(NETWORK_ENABLED OFF CACHE BOOL "" FORCE)
# OpenAL of emscripten has no CMake package: EffekseerSoundAL is compiled here
set(USE_OPENAL OFF CACHE BOOL "" FORCE)

add_subdirectory(${EFFEKSEER_DIR} effekseer)

file(GLOB effekseer_sound_src ${EFFEKSEER_DIR}/Dev/Cpp/EffekseerSoundAL/EffekseerSoundAL/*.cpp)

add_executable(effekseer_webgpu ${CMAKE_CURRENT_SOURCE_DIR}/../src/cpp/main_webgpu.cpp ${effekseer_sound_src})
target_link_libraries(effekseer_webgpu PRIVATE EffekseerRendererWebGPU EffekseerRendererLLGI LLGI Effekseer)
target_include_directories(effekseer_webgpu PRIVATE
  ${EFFEKSEER_DIR}/Dev/Cpp/3rdParty/LLGI/src
  ${EFFEKSEER_DIR}/Dev/Cpp/EffekseerRendererLLGI
  ${EFFEKSEER_DIR}/Dev/Cpp/EffekseerRendererWebGPU
  ${EFFEKSEER_DIR}/Dev/Cpp/EffekseerSoundAL)
target_compile_options(effekseer_webgpu PRIVATE -Wno-inconsistent-missing-override)
set_target_properties(effekseer_webgpu PROPERTIES SUFFIX ".mjs")
target_link_options(effekseer_webgpu PRIVATE
  "-lopenal"
  "--js-library=${CMAKE_CURRENT_SOURCE_DIR}/../src/cpp/effekseer_webgpu_lib.js"
  "-sWASM=1"
  "-sMODULARIZE=1"
  "-sEXPORT_ES6=1"
  "-sEXPORT_NAME=effekseer_webgpu"
  "-sENVIRONMENT=web,worker"
  "-sALLOW_MEMORY_GROWTH=1"
  "-sINITIAL_MEMORY=33554432"
  "-sNO_EXIT_RUNTIME=1"
  "-sFILESYSTEM=0"
  "-sDISABLE_EXCEPTION_CATCHING=1"
  "-sASYNCIFY=1"
  "-sEXPORTED_FUNCTIONS=['_malloc','_free','_main']"
  "-sEXPORTED_RUNTIME_METHODS=['cwrap','UTF8ToString','UTF16ToString','stackSave','stackRestore','stackAlloc','HEAP8','HEAPU8','HEAPF32','setValue','getValue']"
  "-O2")

# node tool: precompiled WebGPU materials (path.efkmat -> path.efkmatd), native/tools/compile_materials.cpp
add_executable(compile_materials ${CMAKE_CURRENT_SOURCE_DIR}/tools/compile_materials.cpp)
target_link_libraries(compile_materials PRIVATE EffekseerRendererWebGPU EffekseerRendererLLGI LLGI Effekseer)
target_include_directories(compile_materials PRIVATE
  ${EFFEKSEER_DIR}/Dev/Cpp/Effekseer
  ${EFFEKSEER_DIR}/Dev/Cpp/EffekseerRendererWebGPU)
target_compile_options(compile_materials PRIVATE -Wno-inconsistent-missing-override)
set_target_properties(compile_materials PROPERTIES SUFFIX ".js")
target_link_options(compile_materials PRIVATE "-sENVIRONMENT=node" "-sNODERAWFS=1" "-sALLOW_MEMORY_GROWTH=1" "-sEXIT_RUNTIME=1" "-O2")

# the WebGL runtime: the C API of EffekseerForWebGL (src/cpp/main_webgl.cpp) over EffekseerRendererGL of the same Effekseer
add_executable(effekseer_webgl ${CMAKE_CURRENT_SOURCE_DIR}/../src/cpp/main_webgl.cpp ${effekseer_sound_src})
target_link_libraries(effekseer_webgl PRIVATE EffekseerRendererGL Effekseer)
target_include_directories(effekseer_webgl PRIVATE
  ${EFFEKSEER_DIR}/Dev/Cpp/EffekseerRendererGL
  ${EFFEKSEER_DIR}/Dev/Cpp/EffekseerSoundAL)
target_compile_options(effekseer_webgl PRIVATE -Wno-inconsistent-missing-override)
set_target_properties(effekseer_webgl PROPERTIES SUFFIX ".mjs")
target_link_options(effekseer_webgl PRIVATE
  "-lopenal"
  "-sWASM=1"
  "-sMODULARIZE=1"
  "-sEXPORT_ES6=1"
  "-sEXPORT_NAME=effekseer_webgl"
  "-sENVIRONMENT=web,worker"
  "-sALLOW_MEMORY_GROWTH=1"
  "-sINITIAL_MEMORY=33554432"
  "-sNO_EXIT_RUNTIME=1"
  "-sFILESYSTEM=0"
  "-sDISABLE_EXCEPTION_CATCHING=1"
  "-sMAX_WEBGL_VERSION=2"
  "-sMIN_WEBGL_VERSION=2"
  "-sEXPORTED_FUNCTIONS=['_malloc','_free','_main']"
  "-sEXPORTED_RUNTIME_METHODS=['cwrap','UTF8ToString','UTF16ToString','stackSave','stackRestore','stackAlloc','HEAP8','HEAPU8','HEAPF32','setValue','getValue','GL']"
  "-O2")
