import { useTranslation } from "react-i18next";
import {
  RectLike,
  calculateLensPosition,
  calculateBackgroundPosition,
  calculateHelperPosition,
} from "../utils/magnifierUtils";
import "./MagnifierLens.css";

export const HELPER_WIDTH = 290;
export const HELPER_HEIGHT = 70;

export interface MagnifierLensProps {
  isActive: boolean;
  zoom: number;
  lensSize: number;
  cursorPos: { x: number; y: number };
  imageSrc: string | null;
  imageRect: RectLike | null;
  containerRect: { width: number; height: number } | null;
}

/**
 * MagnifierLens component
 * Renders a rounded rectangular magnifier loupe and an external info panel
 * displaying the current zoom ratio and keyboard/wheel shortcut instructions.
 */
export function MagnifierLens({
  isActive,
  zoom,
  lensSize,
  cursorPos,
  imageSrc,
  imageRect,
  containerRect,
}: MagnifierLensProps) {
  const { t } = useTranslation();

  if (!isActive || !imageSrc || !imageRect || !containerRect) {
    return null;
  }

  const lensWidth = lensSize;
  const lensHeight = lensSize;

  const lensPos = calculateLensPosition(
    cursorPos.x,
    cursorPos.y,
    lensWidth,
    lensHeight,
    containerRect.width,
    containerRect.height
  );

  const bgPos = calculateBackgroundPosition(
    cursorPos.x,
    cursorPos.y,
    imageRect,
    lensWidth,
    lensHeight,
    zoom
  );

  const helperPos = calculateHelperPosition(
    lensPos.x,
    lensPos.y,
    lensWidth,
    lensHeight,
    HELPER_WIDTH,
    HELPER_HEIGHT,
    containerRect.width,
    containerRect.height
  );

  return (
    <>
      <div
        className="magnifier-lens"
        data-testid="magnifier-lens"
        style={{
          width: `${lensWidth}px`,
          height: `${lensHeight}px`,
          left: `${lensPos.x}px`,
          top: `${lensPos.y}px`,
        }}
      >
        <img
          src={imageSrc}
          alt="magnified"
          className="magnifier-image"
          style={{
            width: `${bgPos.bgWidth}px`,
            height: `${bgPos.bgHeight}px`,
            transform: `translate(${-bgPos.bgX}px, ${-bgPos.bgY}px)`,
          }}
        />
        <div className="magnifier-crosshair" aria-hidden="true" />
      </div>

      <div
        className="magnifier-info-panel"
        data-testid="magnifier-info-panel"
        style={{
          width: `${HELPER_WIDTH}px`,
          left: `${helperPos.x}px`,
          top: `${helperPos.y}px`,
        }}
      >
        <div className="magnifier-info-header">
          <span className="magnifier-info-badge">{zoom.toFixed(1)}x</span>
        </div>
        <div className="magnifier-info-body">
          <div className="magnifier-info-line">
            {t("magnifier.zoom_help", {
              defaultValue: "ズーム倍率変更：Ctrl+ホイールまたは+/-キー",
            })}
          </div>
          <div className="magnifier-info-line">
            {t("magnifier.size_help", {
              defaultValue: "レンズサイズ調整：Shift+ホイールまたは+/-キー",
            })}
          </div>
        </div>
      </div>
    </>
  );
}

