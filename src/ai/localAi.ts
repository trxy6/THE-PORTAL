let mlcEngine: any = null;

export function getMlcEngine() {
  return mlcEngine;
}

export async function loadModel(selectedModel: string, onProgress: (progressText: string) => void) {
  const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
  mlcEngine = await CreateMLCEngine(selectedModel, {
    initProgressCallback(progress) {
      onProgress(progress.text || 'Loading model weights...');
    }
  });
  return mlcEngine;
}

export async function unloadModel() {
  if (mlcEngine) {
    try {
      await mlcEngine.unload();
    } catch (e) {
      console.warn('Failed to unload engine:', e);
    }
    mlcEngine = null;
  }
}

export async function deleteModelCache() {
  await unloadModel();
  try {
    const keys = await window.caches.keys();
    for (const key of keys) {
      if (key.includes('web-llm') || key.includes('mlc')) {
        await window.caches.delete(key);
      }
    }
  } catch (err) {
    console.warn('Failed to delete cache keys:', err);
  }
}

export async function createChatCompletionStream(
  messages: Array<{ role: string; content: string }>,
  selectedModel: string,
  onProgress?: (progressText: string) => void
) {
  if (!mlcEngine) {
    await loadModel(selectedModel, onProgress || (() => {}));
  }
  return await mlcEngine.chat.completions.create({
    messages,
    temperature: 0.7,
    max_tokens: 512,
    stream: true
  });
}
