/**
 * Canvas-based image cropper for hero images.
 * Takes a source image + crop area, outputs a resized JPEG blob.
 */

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const HERO_WIDTH = 1200;
const HERO_HEIGHT = 675;
const JPEG_QUALITY = 0.85;

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (err) => reject(err));
    img.setAttribute("crossOrigin", "anonymous");
    img.src = url;
  });
}

export async function cropAndResizeImage(
  imageSrc: string,
  cropArea: CropArea
): Promise<File> {
  const img = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = HERO_WIDTH;
  canvas.height = HERO_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  ctx.drawImage(
    img,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    HERO_WIDTH,
    HERO_HEIGHT
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not create image blob"));
          return;
        }
        resolve(new File([blob], "hero.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      JPEG_QUALITY
    );
  });
}
