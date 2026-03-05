/**
 * WebGPU-accelerated glow/bloom post-processing for the ecosystem graph.
 *
 * When WebGPU is available, we run a two-pass Gaussian blur compute shader on
 * a brightness-extracted texture to produce a fast bloom overlay. When WebGPU
 * is unavailable we fall back to a no-op (the Canvas 2D renderer handles glow
 * with shadow blur instead).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WebGPUGlow {
  /** true when the GPU pipeline is ready */
  ready: boolean;
  /** Apply bloom to the source canvas and composite onto the destination */
  applyBloom: (source: HTMLCanvasElement, dest: CanvasRenderingContext2D) => void;
  /** Release GPU resources */
  destroy: () => void;
}

// ---------------------------------------------------------------------------
// Shader source (WGSL)
// ---------------------------------------------------------------------------

const BLUR_SHADER = /* wgsl */ `
@group(0) @binding(0) var inputTex: texture_2d<f32>;
@group(0) @binding(1) var outputTex: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var<uniform> direction: vec2<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let dims = textureDimensions(inputTex);
  if (gid.x >= dims.x || gid.y >= dims.y) { return; }

  let weights = array<f32, 5>(0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);
  let texCoord = vec2<i32>(i32(gid.x), i32(gid.y));

  var color = textureLoad(inputTex, texCoord, 0) * weights[0];
  for (var i = 1; i < 5; i = i + 1) {
    let offset = vec2<i32>(i32(direction.x * f32(i) * 2.0), i32(direction.y * f32(i) * 2.0));
    let p1 = clamp(texCoord + offset, vec2<i32>(0), vec2<i32>(i32(dims.x) - 1, i32(dims.y) - 1));
    let p2 = clamp(texCoord - offset, vec2<i32>(0), vec2<i32>(i32(dims.x) - 1, i32(dims.y) - 1));
    color = color + textureLoad(inputTex, p1, 0) * weights[i];
    color = color + textureLoad(inputTex, p2, 0) * weights[i];
  }
  textureStore(outputTex, vec2<i32>(gid.xy), color);
}
`;

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

export async function initWebGPUGlow(width: number, height: number): Promise<WebGPUGlow> {
  // Feature detection
  if (typeof navigator === "undefined" || !navigator.gpu) {
    return noopGlow();
  }

  let adapter: GPUAdapter | null;
  try {
    adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
  } catch {
    return noopGlow();
  }
  if (!adapter) return noopGlow();

  let device: GPUDevice;
  try {
    device = await adapter.requestDevice();
  } catch {
    return noopGlow();
  }

  // Round to workgroup-aligned sizes
  const w = Math.max(8, Math.ceil(width / 8) * 8);
  const h = Math.max(8, Math.ceil(height / 8) * 8);

  const texDesc = (label: string): GPUTextureDescriptor => ({
    label,
    size: [w, h],
    format: "rgba8unorm",
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.STORAGE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.COPY_SRC,
  });

  const texA = device.createTexture(texDesc("bloom-a"));
  const texB = device.createTexture(texDesc("bloom-b"));

  const dirBufH = device.createBuffer({ size: 8, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const dirBufV = device.createBuffer({ size: 8, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(dirBufH, 0, new Float32Array([1, 0]));
  device.queue.writeBuffer(dirBufV, 0, new Float32Array([0, 1]));

  const module = device.createShaderModule({ code: BLUR_SHADER });
  const pipeline = device.createComputePipeline({
    layout: "auto",
    compute: { module, entryPoint: "main" },
  });

  const bgH = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: texA.createView() },
      { binding: 1, resource: texB.createView() },
      { binding: 2, resource: { buffer: dirBufH } },
    ],
  });

  const bgV = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: texB.createView() },
      { binding: 1, resource: texA.createView() },
      { binding: 2, resource: { buffer: dirBufV } },
    ],
  });

  // Staging buffer for readback
  const stagingBuffer = device.createBuffer({
    size: w * h * 4,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });

  // Temp canvas for source extraction
  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = w;
  tmpCanvas.height = h;
  const tmpCtx = tmpCanvas.getContext("2d", { willReadFrequently: true })!;

  let destroyed = false;

  const applyBloom = (source: HTMLCanvasElement, dest: CanvasRenderingContext2D) => {
    if (destroyed) return;

    // Draw source into tmp canvas at aligned size, then extract pixels
    tmpCtx.clearRect(0, 0, w, h);
    tmpCtx.drawImage(source, 0, 0, w, h);
    const imageData = tmpCtx.getImageData(0, 0, w, h);

    // Upload to GPU texture
    device.queue.writeTexture(
      { texture: texA },
      imageData.data.buffer,
      { bytesPerRow: w * 4, rowsPerImage: h },
      [w, h],
    );

    const encoder = device.createCommandEncoder();
    const wgX = Math.ceil(w / 8);
    const wgY = Math.ceil(h / 8);

    // Two-pass blur (horizontal then vertical) x2 for wider bloom
    for (let i = 0; i < 2; i++) {
      const passH = encoder.beginComputePass();
      passH.setPipeline(pipeline);
      passH.setBindGroup(0, bgH);
      passH.dispatchWorkgroups(wgX, wgY);
      passH.end();

      const passV = encoder.beginComputePass();
      passV.setPipeline(pipeline);
      passV.setBindGroup(0, bgV);
      passV.dispatchWorkgroups(wgX, wgY);
      passV.end();
    }

    // Copy result to staging
    encoder.copyTextureToBuffer(
      { texture: texA },
      { buffer: stagingBuffer, bytesPerRow: w * 4, rowsPerImage: h },
      [w, h],
    );

    device.queue.submit([encoder.finish()]);

    // Async readback — composite on next available frame
    stagingBuffer.mapAsync(GPUMapMode.READ).then(() => {
      if (destroyed) return;
      const data = new Uint8ClampedArray(stagingBuffer.getMappedRange().slice(0));
      stagingBuffer.unmap();
      const bloomImage = new ImageData(data, w, h);
      tmpCtx.putImageData(bloomImage, 0, 0);
      dest.globalCompositeOperation = "screen";
      dest.globalAlpha = 0.45;
      dest.drawImage(tmpCanvas, 0, 0, source.width, source.height);
      dest.globalCompositeOperation = "source-over";
      dest.globalAlpha = 1;
    }).catch(() => {
      // Silently ignore — bloom is cosmetic
    });
  };

  const destroy = () => {
    destroyed = true;
    texA.destroy();
    texB.destroy();
    dirBufH.destroy();
    dirBufV.destroy();
    stagingBuffer.destroy();
    device.destroy();
  };

  return { ready: true, applyBloom, destroy };
}

// ---------------------------------------------------------------------------
// No-op fallback
// ---------------------------------------------------------------------------

function noopGlow(): WebGPUGlow {
  return {
    ready: false,
    applyBloom: () => {},
    destroy: () => {},
  };
}
