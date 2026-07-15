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
  if (selectedModel === 'qwen3.5:4b') {
    const response = await fetch('http://127.0.0.1:11434/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        temperature: 0.7,
        max_tokens: 512,
        stream: true
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama error: ${errText || response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Ollama response body is not readable');
    }

    return {
      [Symbol.asyncIterator]: async function* () {
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              if (trimmed === 'data: [DONE]') continue;
              if (trimmed.startsWith('data: ')) {
                try {
                  const json = JSON.parse(trimmed.slice(6));
                  yield json;
                } catch (e) {
                  console.warn('Failed to parse Ollama SSE line:', trimmed, e);
                }
              }
            }
          }
          if (buffer) {
            const trimmed = buffer.trim();
            if (trimmed && trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
              try {
                const json = JSON.parse(trimmed.slice(6));
                yield json;
              } catch (e) {
                console.warn('Failed to parse Ollama SSE line:', trimmed, e);
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
    };
  }

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
