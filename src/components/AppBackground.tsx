import { convertFileSrc } from "@tauri-apps/api/core";
import { useMemo } from "react";
import { useSettingsContext } from "../context/SettingsContext";

export function AppBackground() {
  const { background } = useSettingsContext();

  const backgroundStyle = useMemo(() => {
    if (!background.path) return {};
    const styles: React.CSSProperties = {
      backgroundImage: `url("${convertFileSrc(background.path)}")`,
      opacity: background.opacity,
      filter: `blur(${background.blur}px)`,
    };
    if (background.style === "cover") {
      styles.backgroundSize = "cover";
      styles.backgroundPosition = "center";
      styles.backgroundRepeat = "no-repeat";
    } else if (background.style === "contain") {
      styles.backgroundSize = "contain";
      styles.backgroundPosition = "center";
      styles.backgroundRepeat = "no-repeat";
    } else if (background.style === "tile") {
      styles.backgroundSize = "auto";
      styles.backgroundRepeat = "repeat";
    }
    return styles;
  }, [background.path, background.opacity, background.blur, background.style]);

  if (!background.path) return null;

  return <div className="app-background-layer" style={backgroundStyle}></div>;
}
