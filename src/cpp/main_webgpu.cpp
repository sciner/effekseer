// Effekseer runtime for WebGPU (the C API of EffekseerForWebGL, rendered by EffekseerRendererWebGPU over LLGI)
// The host (the game) owns the GPUDevice and the render targets: the device comes through
// Module.preinitializedWebGPUDevice, the color and depth GPUTextures of a frame through Module.effekseerImportTextures

#include "Effekseer.h"
#include "EffekseerRendererWebGPU.h"
#include "EffekseerSoundAL.h"
#include <AL/alc.h>
#include <EffekseerRendererLLGI/EffekseerRendererLLGI.Renderer.h>
#include <EffekseerRendererLLGI/EffekseerRendererLLGI.RendererImplemented.h>
#include <EffekseerRendererLLGI/GraphicsDevice.h>
#include <LLGI.CommandList.h>
#include <LLGI.Graphics.h>
#include <WebGPU/LLGI.GraphicsWebGPU.h>
#include <WebGPU/LLGI.TextureWebGPU.h>

#include <EffekseerRendererWebGPU/EffekseerMaterialCompilerWebGPU.h>
#include <EffekseerRendererWebGPU/ShaderHeader/ad_model_distortion_ps.h>
#include <EffekseerRendererWebGPU/ShaderHeader/ad_model_distortion_vs.h>
#include <EffekseerRendererWebGPU/ShaderHeader/ad_model_lit_ps.h>
#include <EffekseerRendererWebGPU/ShaderHeader/ad_model_lit_vs.h>
#include <EffekseerRendererWebGPU/ShaderHeader/ad_model_unlit_ps.h>
#include <EffekseerRendererWebGPU/ShaderHeader/ad_model_unlit_vs.h>
#include <EffekseerRendererWebGPU/ShaderHeader/ad_sprite_distortion_vs.h>
#include <EffekseerRendererWebGPU/ShaderHeader/ad_sprite_lit_vs.h>
#include <EffekseerRendererWebGPU/ShaderHeader/ad_sprite_unlit_vs.h>
#include <EffekseerRendererWebGPU/ShaderHeader/gpu_particles_clear_cs.h>
#include <EffekseerRendererWebGPU/ShaderHeader/gpu_particles_render_ps.h>
#include <EffekseerRendererWebGPU/ShaderHeader/gpu_particles_render_vs.h>
#include <EffekseerRendererWebGPU/ShaderHeader/gpu_particles_spawn_cs.h>
#include <EffekseerRendererWebGPU/ShaderHeader/gpu_particles_update_cs.h>
#include <EffekseerRendererWebGPU/ShaderHeader/model_distortion_ps.h>
#include <EffekseerRendererWebGPU/ShaderHeader/model_distortion_vs.h>
#include <EffekseerRendererWebGPU/ShaderHeader/model_lit_ps.h>
#include <EffekseerRendererWebGPU/ShaderHeader/model_lit_vs.h>
#include <EffekseerRendererWebGPU/ShaderHeader/model_unlit_ps.h>
#include <EffekseerRendererWebGPU/ShaderHeader/model_unlit_vs.h>
#include <EffekseerRendererWebGPU/ShaderHeader/sprite_distortion_vs.h>
#include <EffekseerRendererWebGPU/ShaderHeader/sprite_lit_vs.h>
#include <EffekseerRendererWebGPU/ShaderHeader/sprite_unlit_vs.h>

#include <algorithm>
#include <array>
#include <emscripten.h>
#include <math.h>
#include <stdlib.h>

#include "CustomFile.h"

// effekseer_webgpu_lib.js: the GPUTexture of the slot (0 color, 1 depth) of the current draw as a WGPUTexture
extern "C" WGPUTexture effekseer_webgpu_import_texture(int slot);
// effekseer_webgpu_lib.js: Module.preinitializedWebGPUDevice as a WGPUDevice
extern "C" WGPUDevice effekseer_webgpu_import_device();

static void ArrayToMatrix44(const float* array, Effekseer::Matrix44& matrix)
{
	for (int i = 0; i < 4; i++)
	{
		for (int j = 0; j < 4; j++)
		{
			matrix.Values[i][j] = array[i * 4 + j];
		}
	}
}

static void ArrayToMatrix43(const float* array, Effekseer::Matrix43& matrix)
{
	for (int i = 0; i < 4; i++)
	{
		for (int j = 0; j < 3; j++)
		{
			matrix.Value[i][j] = array[i * 4 + j];
		}
	}
}

static bool isEffekseerLogEnabled = false;

static void PrintEffekseerLog(const std::string& message)
{
	if (isEffekseerLogEnabled)
	{
		printf("%s\n", message.c_str());
	}
}

// the codes of the formats passed by the glue (effekseer.ts: WEBGPU_COLOR_FORMATS, WEBGPU_DEPTH_FORMATS)
static LLGI::TextureFormatType ColorFormatFromCode(int code)
{
	switch (code)
	{
	case 1:
		return LLGI::TextureFormatType::B8G8R8A8_UNORM;
	case 2:
		return LLGI::TextureFormatType::R16G16B16A16_FLOAT;
	case 3:
		return LLGI::TextureFormatType::R8G8B8A8_UNORM_SRGB;
	case 4:
		return LLGI::TextureFormatType::B8G8R8A8_UNORM_SRGB;
	default:
		return LLGI::TextureFormatType::R8G8B8A8_UNORM;
	}
}

static LLGI::TextureFormatType DepthFormatFromCode(int code)
{
	switch (code)
	{
	case 1:
		return LLGI::TextureFormatType::D32;
	case 2:
		return LLGI::TextureFormatType::D24S8;
	case 3:
		return LLGI::TextureFormatType::D32S8;
	default:
		return LLGI::TextureFormatType::Unknown;
	}
}

#define GENERATE_VIEW(x) {{x, static_cast<int32_t>(sizeof(x))}};

// EffekseerRendererWebGPU::Create with the reversed depth of the host (the original passes false to Initialize)
static ::EffekseerRenderer::RendererRef CreateRendererWebGPU(::Effekseer::Backend::GraphicsDeviceRef graphicsDevice,
															 ::EffekseerRendererWebGPU::RenderPassInformation renderPassInformation,
															 int32_t squareMaxCount,
															 bool isPremultipliedAlphaEnabled,
															 bool isReversedDepth)
{
	auto gd = graphicsDevice.DownCast<EffekseerRendererLLGI::Backend::GraphicsDevice>();
	auto renderer = Effekseer::MakeRefPtr<::EffekseerRendererLLGI::RendererImplemented>(squareMaxCount);

	auto shader = &renderer->fixedShader_;
	shader->AdvancedSpriteUnlit_VS = GENERATE_VIEW(webgpu_ad_sprite_unlit_vs);
	shader->AdvancedSpriteLit_VS = GENERATE_VIEW(webgpu_ad_sprite_lit_vs);
	shader->AdvancedSpriteDistortion_VS = GENERATE_VIEW(webgpu_ad_sprite_distortion_vs);

	shader->AdvancedModelUnlit_VS = GENERATE_VIEW(webgpu_ad_model_unlit_vs);
	shader->AdvancedModelUnlit_PS = GENERATE_VIEW(webgpu_ad_model_unlit_ps);
	shader->AdvancedModelLit_VS = GENERATE_VIEW(webgpu_ad_model_lit_vs);
	shader->AdvancedModelLit_PS = GENERATE_VIEW(webgpu_ad_model_lit_ps);
	shader->AdvancedModelDistortion_VS = GENERATE_VIEW(webgpu_ad_model_distortion_vs);
	shader->AdvancedModelDistortion_PS = GENERATE_VIEW(webgpu_ad_model_distortion_ps);

	shader->SpriteUnlit_VS = GENERATE_VIEW(webgpu_sprite_unlit_vs);
	shader->SpriteLit_VS = GENERATE_VIEW(webgpu_sprite_lit_vs);
	shader->SpriteDistortion_VS = GENERATE_VIEW(webgpu_sprite_distortion_vs);

	shader->ModelUnlit_VS = GENERATE_VIEW(webgpu_model_unlit_vs);
	shader->ModelUnlit_PS = GENERATE_VIEW(webgpu_model_unlit_ps);
	shader->ModelLit_VS = GENERATE_VIEW(webgpu_model_lit_vs);
	shader->ModelLit_PS = GENERATE_VIEW(webgpu_model_lit_ps);
	shader->ModelDistortion_VS = GENERATE_VIEW(webgpu_model_distortion_vs);
	shader->ModelDistortion_PS = GENERATE_VIEW(webgpu_model_distortion_ps);

	shader->GpuParticles_Clear_CS = GENERATE_VIEW(webgpu_gpu_particles_clear_cs);
	shader->GpuParticles_Spawn_CS = GENERATE_VIEW(webgpu_gpu_particles_spawn_cs);
	shader->GpuParticles_Update_CS = GENERATE_VIEW(webgpu_gpu_particles_update_cs);
	shader->GpuParticles_Render_VS = GENERATE_VIEW(webgpu_gpu_particles_render_vs);
	shader->GpuParticles_Render_PS = GENERATE_VIEW(webgpu_gpu_particles_render_ps);

	renderer->GetImpl()->IsPremultipliedAlphaEnabled = isPremultipliedAlphaEnabled;

	LLGI::RenderPassPipelineStateKey key;
	key.RenderTargetFormats.resize(renderPassInformation.RenderTextureCount);
	key.IsPresent = renderPassInformation.DoesPresentToScreen;
	for (size_t i = 0; i < key.RenderTargetFormats.size(); i++)
	{
		key.RenderTargetFormats.at(i) = LLGI::ConvertFormat(renderPassInformation.RenderTextureFormats.at(i));
	}
	key.DepthFormat = LLGI::ConvertFormat(renderPassInformation.DepthFormat);

	renderer->platformType_ = Effekseer::CompiledMaterialPlatformType::WebGPU;
	renderer->materialCompiler_ = new Effekseer::MaterialCompilerWebGPU();

	if (!renderer->Initialize(gd, key, isReversedDepth))
	{
		return nullptr;
	}

	return renderer;
}

namespace EfkWebViewer
{
using namespace Effekseer;

// a GPUTexture of the host wrapped for LLGI (a render target or a depth buffer of the host's frame)
class HostTextureWebGPU : public LLGI::TextureWebGPU
{
public:
	bool Initialize(wgpu::Device& device, wgpu::Texture texture, LLGI::TextureFormatType format, int32_t width, int32_t height, int32_t samples, bool isDepth)
	{
		LLGI::TextureParameter param;
		param.Format = format;
		param.Size = LLGI::Vec3I(width, height, 1);
		param.SampleCount = samples;
		param.Usage = LLGI::TextureUsageType::RenderTarget | LLGI::TextureUsageType::External;
		if (!InitializeFromSurfaceTexture(device, texture, param))
		{
			return false;
		}
		type_ = isDepth ? LLGI::TextureType::Depth : LLGI::TextureType::Render;
		return true;
	}
};

class CustomTextureLoader : public TextureLoader
{
private:
	::Effekseer::Backend::GraphicsDeviceRef graphicsDevice_;

public:
	CustomTextureLoader(::Effekseer::Backend::GraphicsDeviceRef graphicsDevice) : graphicsDevice_(graphicsDevice) {}

	~CustomTextureLoader() = default;

public:
	Effekseer::TextureRef Load(const EFK_CHAR* path, TextureType textureType) override
	{
		// Request to load image
		int loaded = EM_ASM_INT({ return Module._loadImage(Module.UTF16ToString($0)) != null; }, path);
		if (!loaded)
		{
			// Loading incompleted
			return nullptr;
		}

		// the pixels of the image (the glue converts it to the power of two like for WebGL)
		uint8_t* pixels = nullptr;
		int32_t width = 0;
		int32_t height = 0;
		int hasMipmap = EM_ASM_INT(
			{
				var img = Module._loadImage(Module.UTF16ToString($0));
				var canvas = document.createElement("canvas");
				canvas.width = img.width;
				canvas.height = img.height;
				var context2d = canvas.getContext("2d", {willReadFrequently : true});
				context2d.drawImage(img, 0, 0);
				var data = context2d.getImageData(0, 0, img.width, img.height).data;
				var memptr = _malloc(data.length);
				HEAPU8.set(data, memptr);
				setValue($1, memptr, "i32");
				setValue($2, img.width, "i32");
				setValue($3, img.height, "i32");
				return Module._isPowerOfTwo(img) ? 1 : 0;
			},
			path,
			&pixels,
			&width,
			&height);

		if (pixels == nullptr || width <= 0 || height <= 0)
		{
			free(pixels);
			return nullptr;
		}

		// getImageData returns the straight alpha: the same as texImage2D without UNPACK_PREMULTIPLY_ALPHA_WEBGL
		Effekseer::CustomVector<uint8_t> initialData;
		initialData.resize(static_cast<size_t>(width) * height * 4);
		memcpy(initialData.data(), pixels, initialData.size());
		free(pixels);

		Effekseer::Backend::TextureParameter param;
		param.Format = Effekseer::Backend::TextureFormatType::R8G8B8A8_UNORM;
		param.Size = {width, height, 1};
		// 0: the mipmaps are generated on the load (generateMipmap of the WebGL runtime for the power of two)
		param.MipLevelCount = hasMipmap != 0 ? 0 : 1;

		std::array<char, 260> path8;
		Effekseer::ConvertUtf16ToUtf8(path8.data(), static_cast<int32_t>(path8.size()), path);

		auto backend = graphicsDevice_->CreateTexture(param, initialData);
		if (backend == nullptr)
		{
			PrintEffekseerLog(std::string("Effekseer : Failed to load : ") + path8.data());
			return nullptr;
		}
		auto textureData = Effekseer::MakeRefPtr<Effekseer::Texture>();
		textureData->SetBackend(backend);

		PrintEffekseerLog(std::string("Effekseer : Load : ") + path8.data());

		return textureData;
	}

	void Unload(Effekseer::TextureRef data) override {}
};

class Context;

// the distortion: the color of the host is copied to the background texture when the first distortion is drawn
class DistortingCallbackWebGPU : public EffekseerRenderer::DistortingCallback
{
	Context* context_ = nullptr;

public:
	DistortingCallbackWebGPU(Context* context) : context_(context) {}

	bool OnDistorting(EffekseerRenderer::Renderer* renderer) override;
};

class Context
{
public:
	Effekseer::ManagerRef manager = nullptr;
	EffekseerRenderer::RendererRef renderer = nullptr;
	EffekseerSound::SoundRef sound = nullptr;
	float time_ = 0.0f;
	bool isFirstUpdate_ = false;
	float restDeltaTime_ = 0.0f;

	Matrix44 projectionMatrix;
	Matrix44 cameraMatrix;

	Effekseer::RefPtr<CustomFileInterface> fileInterface;

	ALCdevice* alcDevice = nullptr;
	ALCcontext* alcContext = nullptr;

	wgpu::Device device_;
	LLGI::Graphics* graphics_ = nullptr;
	Effekseer::RefPtr<EffekseerRendererLLGI::Backend::GraphicsDevice> graphicsDevice_;
	Effekseer::RefPtr<EffekseerRenderer::SingleFrameMemoryPool> memoryPool_;
	Effekseer::RefPtr<EffekseerRenderer::CommandList> commandList_;

	// the render targets of the host of the last draw (rebuilt when the host passes other textures)
	int32_t colorTextureId_ = -1;
	int32_t depthTextureId_ = -1;
	HostTextureWebGPU* colorTexture_ = nullptr;
	HostTextureWebGPU* depthTexture_ = nullptr;
	LLGI::RenderPass* renderPass_ = nullptr;
	LLGI::RenderPassPipelineState* rppip_ = nullptr;

	// the background of the distortion
	bool isBackgroundCaptureEnabled_ = false;
	bool isBackgroundCaptured_ = false;
	LLGI::Texture* backgroundTexture_ = nullptr;
	Effekseer::Backend::TextureRef backgroundTextureEfk_;

	bool isDrawing_ = false;

	void CalculateCameraDirectionAndPosition(const Effekseer::Matrix44& matrix, Effekseer::Vector3D& direction, Effekseer::Vector3D& position)
	{
		const auto& mat = matrix;

		direction = -::Effekseer::Vector3D(matrix.Values[0][2], matrix.Values[1][2], matrix.Values[2][2]);

		{
			auto localPos = ::Effekseer::Vector3D(-mat.Values[3][0], -mat.Values[3][1], -mat.Values[3][2]);
			auto f = ::Effekseer::Vector3D(mat.Values[0][2], mat.Values[1][2], mat.Values[2][2]);
			auto r = ::Effekseer::Vector3D(mat.Values[0][0], mat.Values[1][0], mat.Values[2][0]);
			auto u = ::Effekseer::Vector3D(mat.Values[0][1], mat.Values[1][1], mat.Values[2][1]);

			position = r * localPos.X + u * localPos.Y + f * localPos.Z;
		}
	}

	void ReleaseRenderTargets()
	{
		ES_SAFE_RELEASE(rppip_);
		ES_SAFE_RELEASE(renderPass_);
		ES_SAFE_RELEASE(colorTexture_);
		ES_SAFE_RELEASE(depthTexture_);
		colorTextureId_ = -1;
		depthTextureId_ = -1;
	}

	void ReleaseBackground()
	{
		if (renderer != nullptr)
		{
			renderer->SetBackground(nullptr);
		}
		backgroundTextureEfk_.Reset();
		ES_SAFE_RELEASE(backgroundTexture_);
	}

	bool PrepareRenderTargets(int32_t colorId, int32_t colorFormat, int32_t depthId, int32_t depthFormat, int32_t width, int32_t height, int32_t samples)
	{
		if (renderPass_ != nullptr && colorId == colorTextureId_ && depthId == depthTextureId_ &&
			colorTexture_->GetSizeAs2D().X == width && colorTexture_->GetSizeAs2D().Y == height)
		{
			return true;
		}

		ReleaseRenderTargets();

		auto colorTex = wgpu::Texture::Acquire(effekseer_webgpu_import_texture(0));
		colorTexture_ = new HostTextureWebGPU();
		if (!colorTexture_->Initialize(device_, colorTex, ColorFormatFromCode(colorFormat), width, height, samples, false))
		{
			ReleaseRenderTargets();
			return false;
		}

		const auto depth = DepthFormatFromCode(depthFormat);
		if (depthId >= 0 && depth != LLGI::TextureFormatType::Unknown)
		{
			auto depthTex = wgpu::Texture::Acquire(effekseer_webgpu_import_texture(1));
			depthTexture_ = new HostTextureWebGPU();
			if (!depthTexture_->Initialize(device_, depthTex, depth, width, height, samples, true))
			{
				ReleaseRenderTargets();
				return false;
			}
		}

		renderPass_ = graphics_->CreateRenderPass((LLGI::Texture**)&colorTexture_, 1, depthTexture_);
		if (renderPass_ == nullptr)
		{
			ReleaseRenderTargets();
			return false;
		}
		// the effects are drawn over the frame of the host
		renderPass_->SetIsColorCleared(false);
		renderPass_->SetIsDepthCleared(false);
		rppip_ = graphics_->CreateRenderPassPipelineState(renderPass_);

		colorTextureId_ = colorId;
		depthTextureId_ = depthId;
		return true;
	}

	LLGI::CommandList* GetInternalCommandList()
	{
		return static_cast<EffekseerRendererLLGI::CommandList*>(commandList_.Get())->GetInternal();
	}

	void CaptureBackgroundForDistortion()
	{
		if (!isBackgroundCaptureEnabled_ || isBackgroundCaptured_ || colorTexture_ == nullptr || colorTexture_->GetSamplingCount() > 1)
		{
			return;
		}

		const auto size = colorTexture_->GetSizeAs2D();
		if (backgroundTexture_ == nullptr || backgroundTexture_->GetSizeAs2D() != size || backgroundTexture_->GetFormat() != colorTexture_->GetFormat())
		{
			ReleaseBackground();
			LLGI::TextureParameter param;
			param.Format = colorTexture_->GetFormat();
			param.Size = LLGI::Vec3I(size.X, size.Y, 1);
			backgroundTexture_ = graphics_->CreateTexture(param);
			if (backgroundTexture_ == nullptr)
			{
				return;
			}
			backgroundTextureEfk_ = graphicsDevice_->CreateTexture(backgroundTexture_);
		}

		// the pass is restarted over the copy: the copy is not allowed inside a render pass
		auto cl = GetInternalCommandList();
		cl->EndRenderPass();
		cl->CopyTexture(colorTexture_, backgroundTexture_);
		cl->BeginRenderPass(renderPass_);
		renderer.DownCast<EffekseerRendererLLGI::RendererImplemented>()->ChangeRenderPassPipelineState(renderPass_->GetKey());
		renderer->SetBackground(backgroundTextureEfk_);
		isBackgroundCaptured_ = true;
	}

public:
	Context() = default;
	~Context() = default;

	bool Init(int instanceMaxCount, int squareMaxCount, int colorFormat, int depthFormat, bool isPremultipliedAlphaEnabled, bool isReversedDepth)
	{
		Effekseer::SetLogger([](Effekseer::LogType type, const std::string& s) -> void { PrintEffekseerLog("EffekseerLog : " + s); });

		device_ = wgpu::Device::Acquire(effekseer_webgpu_import_device());
		if (device_ == nullptr)
		{
			PrintEffekseerLog("Effekseer : The WebGPU device is not passed.");
			return false;
		}

		graphics_ = new LLGI::GraphicsWebGPU(device_);
		graphicsDevice_ = Effekseer::MakeRefPtr<EffekseerRendererLLGI::Backend::GraphicsDevice>(graphics_, false, LLGI::DeviceType::WebGPU);

		::EffekseerRendererWebGPU::RenderPassInformation renderPassInfo;
		renderPassInfo.DoesPresentToScreen = false;
		renderPassInfo.RenderTextureCount = 1;
		renderPassInfo.RenderTextureFormats[0] = LLGI::ConvertFormat(ColorFormatFromCode(colorFormat));
		renderPassInfo.DepthFormat = LLGI::ConvertFormat(DepthFormatFromCode(depthFormat));

		renderer = CreateRendererWebGPU(graphicsDevice_, renderPassInfo, squareMaxCount, isPremultipliedAlphaEnabled, isReversedDepth);
		if (renderer == nullptr)
		{
			return false;
		}

		memoryPool_ = EffekseerRenderer::CreateSingleFrameMemoryPool(renderer->GetGraphicsDevice());
		commandList_ = EffekseerRenderer::CreateCommandList(renderer->GetGraphicsDevice(), memoryPool_);
		if (memoryPool_ == nullptr || commandList_ == nullptr)
		{
			return false;
		}

		renderer->SetDistortingCallback(new DistortingCallbackWebGPU(this));

		fileInterface = Effekseer::MakeRefPtr<CustomFileInterface>();
		manager = Manager::Create(instanceMaxCount);
		sound = EffekseerSound::Sound::Create(16);

		manager->SetSpriteRenderer(renderer->CreateSpriteRenderer());
		manager->SetRibbonRenderer(renderer->CreateRibbonRenderer());
		manager->SetRingRenderer(renderer->CreateRingRenderer());
		manager->SetModelRenderer(renderer->CreateModelRenderer());
		manager->SetTrackRenderer(renderer->CreateTrackRenderer());
		manager->SetGpuParticleSystem(renderer->CreateGpuParticleSystem());
		manager->SetGpuParticleFactory(renderer->CreateGpuParticleFactory());
		manager->SetTextureLoader(Effekseer::MakeRefPtr<CustomTextureLoader>(renderer->GetGraphicsDevice()));
		manager->SetModelLoader(renderer->CreateModelLoader(fileInterface));
		manager->SetCurveLoader(Effekseer::MakeRefPtr<Effekseer::CurveLoader>(fileInterface));
		manager->SetMaterialLoader(renderer->CreateMaterialLoader(fileInterface));
		if (sound != nullptr)
		{
			manager->SetSoundPlayer(sound->CreateSoundPlayer());
			manager->SetSoundLoader(sound->CreateSoundLoader(fileInterface));
		}

		manager->SetCoordinateSystem(CoordinateSystem::RH);

		return true;
	}

	void Terminate()
	{
		if (graphics_ != nullptr)
		{
			graphics_->WaitFinish();
		}

		ReleaseBackground();
		ReleaseRenderTargets();

		manager.Reset();
		if (renderer != nullptr)
		{
			renderer->SetCommandList(nullptr);
		}
		commandList_.Reset();
		memoryPool_.Reset();
		renderer.Reset();
		sound.Reset();
		graphicsDevice_.Reset();
		ES_SAFE_RELEASE(graphics_);
	}

	void Update(float deltaFrames) { manager->Update(deltaFrames); }

	// starts the command list and the pass over the render targets of the host (EffectPlatformLLGI::BeginRendering)
	bool BeginFrame(int32_t colorId, int32_t colorFormat, int32_t depthId, int32_t depthFormat, int32_t width, int32_t height, int32_t samples)
	{
		if (isDrawing_ || !PrepareRenderTargets(colorId, colorFormat, depthId, depthFormat, width, height, samples))
		{
			return false;
		}

		memoryPool_->NewFrame();
		auto c = static_cast<EffekseerRendererLLGI::CommandList*>(commandList_.Get());
		c->Begin();
		renderer->SetCommandList(commandList_);

		// GPU particles
		renderer->GetGraphicsDevice()->BeginComputePass();
		manager->Compute();
		renderer->GetGraphicsDevice()->EndComputePass();

		auto cl = c->GetInternal();
		cl->BeginRenderPass(renderPass_);
		graphicsDevice_->SetCommandList(cl);
		graphicsDevice_->SetRenderPassPipelineState(rppip_);
		renderer.DownCast<EffekseerRendererLLGI::RendererImplemented>()->ChangeRenderPassPipelineState(renderPass_->GetKey());

		isBackgroundCaptured_ = false;
		isDrawing_ = true;
		return true;
	}

	// ends the pass and submits the commands (EffectPlatformLLGI::EndRendering, Present)
	void EndFrame()
	{
		if (!isDrawing_)
		{
			return;
		}
		auto c = static_cast<EffekseerRendererLLGI::CommandList*>(commandList_.Get());
		auto cl = c->GetInternal();
		renderer->SetCommandList(nullptr);
		graphicsDevice_->SetCommandList(nullptr);
		cl->EndRenderPass();
		cl->End();
		c->SetState(EffekseerRendererLLGI::CommandListState::Wait);
		graphics_->Execute(cl);
		isDrawing_ = false;
	}

	void Draw()
	{
		::Effekseer::Vector3D cameraPosition;
		::Effekseer::Vector3D cameraFrontDirection;
		CalculateCameraDirectionAndPosition(cameraMatrix, cameraFrontDirection, cameraPosition);

		Effekseer::Manager::LayerParameter layerParam;
		layerParam.ViewerPosition = cameraPosition;
		manager->SetLayerParameter(0, layerParam);

		renderer->SetProjectionMatrix(projectionMatrix);
		renderer->SetCameraMatrix(cameraMatrix);

		renderer->BeginRendering();
		manager->Draw();
		renderer->EndRendering();
	}

	void SetBackgroundCaptureEnabled(bool enabled)
	{
		isBackgroundCaptureEnabled_ = enabled;
		if (!enabled)
		{
			ReleaseBackground();
		}
	}

	friend class DistortingCallbackWebGPU;
};

bool DistortingCallbackWebGPU::OnDistorting(EffekseerRenderer::Renderer* renderer)
{
	context_->CaptureBackgroundForDistortion();
	return context_->isBackgroundCaptured_;
}

//! pass strings
std::string tempStr;

} // namespace EfkWebViewer

#define EXPORT EMSCRIPTEN_KEEPALIVE

int main(int argc, char* argv[]) { return 0; }

extern "C"
{
	using namespace Effekseer;

	// isReversedDepth: the depth buffer of the host is reversed (near 1, far 0), the depth test is GreaterEqual
	EfkWebViewer::Context* EXPORT EffekseerInit(
		int instanceMaxCount, int squareMaxCount, int colorFormat, int depthFormat, bool isPremultipliedAlphaEnabled, bool isReversedDepth)
	{
		auto context = new EfkWebViewer::Context();
		// Initialize OpenAL
		context->alcDevice = alcOpenDevice(NULL);
		context->alcContext = alcCreateContext(context->alcDevice, NULL);
		alcMakeContextCurrent(context->alcContext);

		// Initialize viewer
		if (!context->Init(instanceMaxCount, squareMaxCount, colorFormat, depthFormat, isPremultipliedAlphaEnabled, isReversedDepth))
		{
			context->Terminate();
			delete context;
			return nullptr;
		}

		return context;
	}

	void EXPORT EffekseerTerminate(EfkWebViewer::Context* context)
	{
		context->Terminate();
		if (context->alcContext != nullptr)
		{
			alcMakeContextCurrent(nullptr);
			alcDestroyContext(context->alcContext);
		}
		if (context->alcDevice != nullptr)
		{
			alcCloseDevice(context->alcDevice);
		}
		delete context;
	}

	void EXPORT EffekseerUpdate(EfkWebViewer::Context* context, float deltaFrames)
	{
		deltaFrames += context->restDeltaTime_;
		context->restDeltaTime_ = deltaFrames - int(deltaFrames);
		for (int loop = 0; loop < int(deltaFrames); loop++)
		{
			context->Update(1);
		}

		context->time_ += deltaFrames * 1.0f / 60.0f;
		context->renderer->SetTime(context->time_);
	}

	void EXPORT EffekseerBeginUpdate(EfkWebViewer::Context* context)
	{
		context->manager->BeginUpdate();
		context->isFirstUpdate_ = true;
	}

	void EXPORT EffekseerEndUpdate(EfkWebViewer::Context* context)
	{
		context->manager->EndUpdate();
		context->renderer->SetTime(context->time_);
	}

	void EXPORT EffekseerUpdateHandle(EfkWebViewer::Context* context, int handle, float deltaFrame)
	{
		context->manager->UpdateHandle(handle, deltaFrame);
		if (context->isFirstUpdate_)
		{
			context->time_ += deltaFrame * 1.0f / 60.0f;
			context->isFirstUpdate_ = false;
		}
	}

	// the frame over the render targets of the host: the GPUTextures are in Module.effekseerImportTextures,
	// their ids change when the host passes other textures
	int EXPORT EffekseerBeginFrame(EfkWebViewer::Context* context,
								   int colorId,
								   int colorFormat,
								   int depthId,
								   int depthFormat,
								   int width,
								   int height,
								   int samples)
	{
		return context->BeginFrame(colorId, colorFormat, depthId, depthFormat, width, height, samples) ? 1 : 0;
	}

	void EXPORT EffekseerEndFrame(EfkWebViewer::Context* context) { context->EndFrame(); }

	void EXPORT EffekseerDraw(EfkWebViewer::Context* context) { context->Draw(); }

	void EXPORT EffekseerBeginDraw(EfkWebViewer::Context* context)
	{
		context->renderer->SetProjectionMatrix(context->projectionMatrix);
		context->renderer->SetCameraMatrix(context->cameraMatrix);
		context->renderer->BeginRendering();
	}

	void EXPORT EffekseerEndDraw(EfkWebViewer::Context* context) { context->renderer->EndRendering(); }

	void EXPORT EffekseerDrawHandle(EfkWebViewer::Context* context, int handle) { context->manager->DrawHandle(handle); }

	void EXPORT EffekseerSetProjectionMatrix(EfkWebViewer::Context* context, const float* matrixElements)
	{
		ArrayToMatrix44(matrixElements, context->projectionMatrix);
	}

	void EXPORT EffekseerSetProjectionPerspective(EfkWebViewer::Context* context, float fov, float aspect, float near, float far)
	{
		context->projectionMatrix.PerspectiveFovRH_OpenGL(fov * 3.1415926f / 180.0f, aspect, near, far);
	}

	void EXPORT EffekseerSetProjectionOrthographic(EfkWebViewer::Context* context, float width, float height, float near, float far)
	{
		context->projectionMatrix.OrthographicRH(width, height, near, far);
	}

	void EXPORT EffekseerSetCameraMatrix(EfkWebViewer::Context* context, const float* matrixElements)
	{
		ArrayToMatrix44(matrixElements, context->cameraMatrix);
	}

	void EXPORT EffekseerSetCameraLookAt(EfkWebViewer::Context* context,
										 float eyeX,
										 float eyeY,
										 float eyeZ,
										 float atX,
										 float atY,
										 float atZ,
										 float upX,
										 float upY,
										 float upZ)
	{
		context->cameraMatrix.LookAtRH(Vector3D(eyeX, eyeY, eyeZ), Vector3D(atX, atY, atZ), Vector3D(upX, upY, upZ));
	}

	void* EXPORT EffekseerLoadEffect(EfkWebViewer::Context* context, void* data, int32_t size, float magnification)
	{
		auto effect = Effect::Create(context->manager, data, size, magnification);
		return effect.Pin();
	}

	void EXPORT EffekseerReleaseEffect(EfkWebViewer::Context* context, void* effect) { Effekseer::RefPtr<Effect>::Unpin(effect); }

	void EXPORT EffekseerReloadResources(EfkWebViewer::Context* context, Effect* effect, void* data, int32_t size)
	{
		auto effectRef = Effekseer::RefPtr<Effect>::FromPinned(effect);
		if (effectRef == nullptr)
		{
			return;
		}

		effectRef->ReloadResources(data, size);
	}

	void EXPORT EffekseerStopAllEffects(EfkWebViewer::Context* context) { context->manager->StopAllEffects(); }

	int EXPORT EffekseerPlayEffect(EfkWebViewer::Context* context, void* effect, float x, float y, float z)
	{
		auto effectRef = Effekseer::RefPtr<Effect>::FromPinned(effect);
		return context->manager->Play(effectRef, x, y, z);
	}

	void EXPORT EffekseerStopEffect(EfkWebViewer::Context* context, int handle) { context->manager->StopEffect(handle); }

	void EXPORT EffekseerStopRoot(EfkWebViewer::Context* context, int handle) { context->manager->StopRoot(handle); }

	int EXPORT EffekseerExists(EfkWebViewer::Context* context, int handle) { return context->manager->Exists(handle) ? 1 : 0; }

	void EXPORT EffekseerSetFrame(EfkWebViewer::Context* context, int handle, float frame)
	{
		context->manager->UpdateHandleToMoveToFrame(handle, frame);
	}

	void EXPORT EffekseerSetLocation(EfkWebViewer::Context* context, int handle, float x, float y, float z)
	{
		context->manager->SetLocation(handle, x, y, z);
	}

	void EXPORT EffekseerSetRotation(EfkWebViewer::Context* context, int handle, float x, float y, float z)
	{
		context->manager->SetRotation(handle, x, y, z);
	}

	void EXPORT EffekseerSetScale(EfkWebViewer::Context* context, int handle, float x, float y, float z)
	{
		context->manager->SetScale(handle, x, y, z);
	}

	void EXPORT EffekseerSetMatrix(EfkWebViewer::Context* context, int handle, const float* matrixElements)
	{
		Matrix43 matrix43;
		ArrayToMatrix43(matrixElements, matrix43);
		context->manager->SetMatrix(handle, matrix43);
	}

	float EXPORT EffekseerGetDynamicInput(EfkWebViewer::Context* context, int handle, int32_t index)
	{
		return context->manager->GetDynamicInput(handle, index);
	}

	void EXPORT EffekseerSetDynamicInput(EfkWebViewer::Context* context, int handle, int32_t index, float value)
	{
		context->manager->SetDynamicInput(handle, index, value);
	}

	void EXPORT EffekseerSendTrigger(EfkWebViewer::Context* context, int handle, int32_t index)
	{
		context->manager->SendTrigger(handle, index);
	}

	void EXPORT EffekseerSetAllColor(EfkWebViewer::Context* context, int handle, float r, float g, float b, float a)
	{
		Color color = Color(r, g, b, a);
		context->manager->SetAllColor(handle, color);
	}

	void EXPORT EffekseerSetTargetLocation(EfkWebViewer::Context* context, int handle, float x, float y, float z)
	{
		context->manager->SetTargetLocation(handle, x, y, z);
	}

	void EXPORT EffekseerSetPaused(EfkWebViewer::Context* context, int handle, int paused)
	{
		context->manager->SetPaused(handle, paused != 0);
	}

	void EXPORT EffekseerSetShown(EfkWebViewer::Context* context, int handle, int shown) { context->manager->SetShown(handle, shown != 0); }

	void EXPORT EffekseerSetSpeed(EfkWebViewer::Context* context, int handle, float speed) { context->manager->SetSpeed(handle, speed); }

	void EXPORT EffekseerSetRandomSeed(EfkWebViewer::Context* context, int handle, float seed) { context->manager->SetRandomSeed(handle, seed); }

	int32_t EXPORT EffekseerGetRestInstancesCount(EfkWebViewer::Context* context) { return context->manager->GetRestInstancesCount(); }

	int EXPORT EffekseerGetUpdateTime(EfkWebViewer::Context* context) { return context->manager->GetUpdateTime(); }

	int EXPORT EffekseerGetDrawTime(EfkWebViewer::Context* context) { return context->manager->GetDrawTime(); }

	// WebGPU has no vertex array objects nor the states of the host to restore
	int EXPORT EffekseerIsVertexArrayObjectSupported(EfkWebViewer::Context* context) { return 0; }

	void EXPORT EffekseerSetRestorationOfStatesFlag(EfkWebViewer::Context* context, int flag) {}

	// the distortion background: on WebGPU the color of the host is copied when the first distortion is drawn
	// (the color GPUTexture needs COPY_SRC), the rectangle is the whole render target
	void EXPORT EffekseerCaptureBackground(EfkWebViewer::Context* context, int x, int y, int width, int height)
	{
		if (context == nullptr)
			return;
		context->SetBackgroundCaptureEnabled(true);
	}

	void EXPORT EffekseerResetBackground(EfkWebViewer::Context* context)
	{
		if (context == nullptr)
			return;
		context->SetBackgroundCaptureEnabled(false);
	}

	void EXPORT EffekseerSetLogEnabled(int flag) { isEffekseerLogEnabled = flag > 0; }
}
