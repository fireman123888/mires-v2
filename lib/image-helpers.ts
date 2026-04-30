export const imageHelpers = {
  generateImageFileName: (provider: string): string => {
    const uniqueId = Math.random().toString(36).substring(2, 8);
    return `mires-${provider}-${uniqueId}`.replace(/[^a-z0-9-]/gi, "");
  },

  /**
   * Decode any base64 image (the server returns JPEG inside watermarking) into
   * a Canvas, then re-encode as a real PNG before triggering download. This
   * means the saved file is genuinely .png — not JPEG bytes with a .png suffix.
   */
  downloadAsPng: async (imageData: string, provider: string): Promise<void> => {
    const fileName = imageHelpers.generateImageFileName(provider);

    // Browser figures out the actual format from the bytes regardless of the
    // declared MIME, so this works whether the original is JPEG or PNG.
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to decode image"));
      img.src = `data:image/png;base64,${imageData}`;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.drawImage(img, 0, 0);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Failed to encode PNG"))),
        "image/png"
      );
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /** Kept for backwards compatibility — same behavior as downloadAsPng. */
  shareOrDownload: async (imageData: string, provider: string): Promise<void> => {
    return imageHelpers.downloadAsPng(imageData, provider);
  },

  formatModelId: (modelId: string): string => {
    return modelId.split("/").pop() || modelId;
  },
};
