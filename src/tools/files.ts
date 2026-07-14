export async function chooseFile() {
  if ((window as any).showOpenFilePicker) {
    const handle = await (window as any).showOpenFilePicker();
    return { ok: true, supported: true, handle };
  } else {
    return { ok: true, supported: false };
  }
}
