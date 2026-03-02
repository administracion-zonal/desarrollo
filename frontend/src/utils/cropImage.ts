export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function getCroppedImg(
  imageSrc: string,
  croppedAreaPixels: CropArea,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.src = imageSrc;

    image.onload = () => {
      const canvas = document.createElement("canvas");

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject("Canvas error");
        return;
      }

      canvas.width = croppedAreaPixels.width;

      canvas.height = croppedAreaPixels.height;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject("Blob error");
            return;
          }

          resolve(blob);
        },
        "image/jpeg",
        0.95,
      );
    };

    image.onerror = () => reject("Image load error");
  });
}
