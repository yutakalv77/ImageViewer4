import { convertFileSrc } from "@tauri-apps/api/core";
import { EntryItem } from "../types";

interface ImageViewerProps {
  images: EntryItem[];
  currentIndex: number;
  onClose: () => void;
}

export function ImageViewer({ images, currentIndex, onClose }: ImageViewerProps) {
  if (currentIndex < 0 || currentIndex >= images.length) return null;

  const currentImage = images[currentIndex];

  return (
    <div className="viewer-overlay" onClick={onClose}>
      <img 
        src={convertFileSrc(currentImage.path)} 
        alt={currentImage.name} 
        onClick={(e) => e.stopPropagation()}
      />
      <div className="viewer-info">
        {currentIndex + 1} / {images.length} : {currentImage.name}
      </div>
    </div>
  );
}
