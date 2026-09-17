import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MagnifierLens } from "../components/MagnifierLens";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => opts?.defaultValue || key,
  }),
}));

describe("MagnifierLens component", () => {
  const defaultProps = {
    isActive: true,
    zoom: 2.5,
    lensSize: 240,
    cursorPos: { x: 300, y: 200 },
    imageSrc: "blob:http://localhost/test-image",
    imageRect: { left: 100, top: 50, width: 600, height: 400 },
    containerRect: { width: 1000, height: 800 },
  };

  it("isActiveがfalseの場合はレンダリングされないこと", () => {
    const { container } = render(
      <MagnifierLens {...defaultProps} isActive={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("imageSrcやimageRectがnullの場合はレンダリングされないこと", () => {
    const { container: c1 } = render(
      <MagnifierLens {...defaultProps} imageSrc={null} />
    );
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(
      <MagnifierLens {...defaultProps} imageRect={null} />
    );
    expect(c2.firstChild).toBeNull();
  });

  it("正常にレンダリングされ、枠外情報パネルと倍率バッジが表示されること", () => {
    render(<MagnifierLens {...defaultProps} />);
    const lens = screen.getByTestId("magnifier-lens");
    expect(lens).toBeInTheDocument();

    const infoPanel = screen.getByTestId("magnifier-info-panel");
    expect(infoPanel).toBeInTheDocument();

    expect(screen.getByText("2.5x")).toBeInTheDocument();
    expect(
      screen.getByText("ズーム倍率変更：Ctrl+ホイールまたは+/-キー")
    ).toBeInTheDocument();
    expect(
      screen.getByText("レンズサイズ調整：Shift+ホイールまたは+/-キー")
    ).toBeInTheDocument();
  });

  it("ズーム倍率がスタイルに反映されること", () => {
    render(<MagnifierLens {...defaultProps} zoom={3.0} />);
    expect(screen.getByText("3.0x")).toBeInTheDocument();
  });

  it("拡大用のimg要素がレンダリングされsrcが渡されること", () => {
    render(<MagnifierLens {...defaultProps} />);
    const img = screen.getByAltText("magnified");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", defaultProps.imageSrc);
  });
});
