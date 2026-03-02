import Cropper from "react-easy-crop";
import { useState } from "react";

import getCroppedImg from "../utils/cropImage";
import type { CropArea } from "../utils/cropImage";

interface Props {
  image: string;
  onComplete: (blob: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropper({ image, onComplete, onCancel }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });

  const [zoom, setZoom] = useState(1);

  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(
    null,
  );

  const onCropCompleteInternal = (_: unknown, areaPixels: CropArea) => {
    setCroppedAreaPixels(areaPixels);
  };

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;

    const blob = await getCroppedImg(image, croppedAreaPixels);

    onComplete(blob);
  };

  return (
    <div className="cropper-overlay">
      <div className="cropper-modal">
        <div className="cropper-area">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={true}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropCompleteInternal}
          />
        </div>

        {/* Zoom slider */}

        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="cropper-zoom"
        />

        {/* Buttons */}

        <div className="cropper-buttons">
          <button className="btn-primary" onClick={handleCrop}>
            Recortar
          </button>

          <button className="btn-danger" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
