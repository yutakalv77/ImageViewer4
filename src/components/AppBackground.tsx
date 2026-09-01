import { convertFileSrc } from "@tauri-apps/api/core";
import { useMemo } from "react";
import { useSettingsContext } from "../context/SettingsContext";

export function AppBackground() {
  const { background } = useSettingsContext();

  const backgroundStyle = useMemo(() => {
    if (!background?.path) return {};
    const opacity = typeof background.opacity === 'number' ? background.opacity : 0.3;
    const blur = typeof background.blur === 'number' ? background.blur : 5;
    const style = background.style || "cover";

    const styles: React.CSSProperties = {
      backgroundImage: `url("${convertFileSrc(background.path)}")`,
      opacity,
      filter: `blur(${blur}px)`,
    };
    if (style === "cover") {
      styles.backgroundSize = "cover";
      styles.backgroundPosition = "center";
      styles.backgroundRepeat = "no-repeat";
    } else if (style === "contain") {
      styles.backgroundSize = "contain";
      styles.backgroundPosition = "center";
      styles.backgroundRepeat = "no-repeat";
    } else if (style === "tile") {
      styles.backgroundSize = "auto";
      styles.backgroundRepeat = "repeat";
    }
    return styles;
  }, [background?.path, background?.opacity, background?.blur, background?.style]);

  if (!background?.path) return null;

  return <div className="app-background-layer" style={backgroundStyle}></div>;
}
