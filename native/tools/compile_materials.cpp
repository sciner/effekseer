// Precompiles Effekseer materials for the WebGPU runtime: for every path.efkmat argument writes path.efkmatd
// (CompiledMaterial with the WebGPU shaders), which the MaterialLoader of the runtime loads before compiling
// the material itself. Built for node (NODERAWFS): node compile_materials.js a.efkmat b.efkmat ...

#include "Effekseer.h"
#include <EffekseerRendererWebGPU/EffekseerMaterialCompilerWebGPU.h>
#include <Effekseer/Material/Effekseer.CompiledMaterial.h>
#include <Effekseer/Material/Effekseer.MaterialCompiler.h>
#include <Effekseer/Material/Effekseer.MaterialFile.h>

#include <cstdio>
#include <fstream>
#include <iterator>
#include <vector>

static std::vector<uint8_t> VertexShader(Effekseer::CompiledMaterialBinary* binary, Effekseer::MaterialShaderType type)
{
	auto data = binary->GetVertexShaderData(type);
	return std::vector<uint8_t>(data, data + binary->GetVertexShaderSize(type));
}

static std::vector<uint8_t> PixelShader(Effekseer::CompiledMaterialBinary* binary, Effekseer::MaterialShaderType type)
{
	auto data = binary->GetPixelShaderData(type);
	return std::vector<uint8_t>(data, data + binary->GetPixelShaderSize(type));
}

int main(int argc, char* argv[])
{
	using namespace Effekseer;
	int failed = 0;
	auto compiler = new MaterialCompilerWebGPU();

	for (int i = 1; i < argc; i++)
	{
		std::ifstream in(argv[i], std::ios::binary);
		std::vector<uint8_t> original((std::istreambuf_iterator<char>(in)), std::istreambuf_iterator<char>());
		if (original.empty())
		{
			printf("failed to read %s\n", argv[i]);
			failed++;
			continue;
		}

		MaterialFile materialFile;
		if (!materialFile.Load(original.data(), static_cast<int32_t>(original.size())))
		{
			printf("invalid material %s\n", argv[i]);
			failed++;
			continue;
		}

		auto binary = compiler->Compile(&materialFile);
		if (binary == nullptr)
		{
			printf("failed to compile %s\n", argv[i]);
			failed++;
			continue;
		}

		CompiledMaterial compiled;
		compiled.UpdateData(VertexShader(binary, MaterialShaderType::Standard),
							PixelShader(binary, MaterialShaderType::Standard),
							VertexShader(binary, MaterialShaderType::Model),
							PixelShader(binary, MaterialShaderType::Model),
							VertexShader(binary, MaterialShaderType::Refraction),
							PixelShader(binary, MaterialShaderType::Refraction),
							VertexShader(binary, MaterialShaderType::RefractionModel),
							PixelShader(binary, MaterialShaderType::RefractionModel),
							CompiledMaterialPlatformType::WebGPU);
		binary->Release();

		std::vector<uint8_t> dst;
		compiled.Save(dst, materialFile.GetGUID(), original);

		std::string outPath = std::string(argv[i]) + "d";
		std::ofstream out(outPath, std::ios::binary);
		out.write(reinterpret_cast<const char*>(dst.data()), dst.size());
		printf("%s: %d bytes\n", outPath.c_str(), static_cast<int>(dst.size()));
	}

	compiler->Release();
	return failed;
}
