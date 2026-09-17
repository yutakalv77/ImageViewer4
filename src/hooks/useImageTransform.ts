import { useState, useCallback, useMemo } from "react";
import {
  ImageTransform,
  INITIAL_TRANSFORM,
  getNextRotation,
  isTransformed as checkIsTransformed,
} from "../utils/transformUtils";

export interface UseImageTransformReturn {
  transform: ImageTransform;
  isTransformed: boolean;
  transformCount: number;
  rotateClockwise: () => void;
  rotateCounterClockwise: () => void;
  toggleFlipH: () => void;
  toggleFlipV: () => void;
  resetTransform: () => void;
}

/**
 * Custom hook to manage image rotation and flip state.
 */
export function useImageTransform(
  initial: ImageTransform = INITIAL_TRANSFORM
): UseImageTransformReturn {
  const [transform, setTransform] = useState<ImageTransform>(initial);
  const [transformCount, setTransformCount] = useState(0);

  const rotateClockwise = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      rotation: getNextRotation(prev.rotation, "cw"),
    }));
    setTransformCount((c) => c + 1);
  }, []);

  const rotateCounterClockwise = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      rotation: getNextRotation(prev.rotation, "ccw"),
    }));
    setTransformCount((c) => c + 1);
  }, []);

  const toggleFlipH = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      flipH: !prev.flipH,
    }));
    setTransformCount((c) => c + 1);
  }, []);

  const toggleFlipV = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      flipV: !prev.flipV,
    }));
    setTransformCount((c) => c + 1);
  }, []);

  const resetTransform = useCallback(() => {
    setTransform(INITIAL_TRANSFORM);
  }, []);

  const isTransformed = useMemo(
    () => checkIsTransformed(transform),
    [transform]
  );

  return {
    transform,
    isTransformed,
    transformCount,
    rotateClockwise,
    rotateCounterClockwise,
    toggleFlipH,
    toggleFlipV,
    resetTransform,
  };
}
