import { describe, it, expect } from "vitest";
import {
  clampZoom,
  stepZoom,
  clampLensSize,
  stepLensSize,
  calculateLensPosition,
  calculateBackgroundPosition,
  findViewerImageElement,
  getContainedImageRect,
  calculateHelperPosition,
  MIN_ZOOM,
  MAX_ZOOM,
  MIN_LENS_SIZE,
  MAX_LENS_SIZE,
} from "../utils/magnifierUtils";

describe("magnifierUtils - clampZoom & stepZoom", () => {
  it("clampZoom が範囲内に収めること", () => {
    expect(clampZoom(1.0)).toBe(MIN_ZOOM);
    expect(clampZoom(10.0)).toBe(MAX_ZOOM);
    expect(clampZoom(2.54)).toBe(2.5);
    expect(clampZoom(3.0)).toBe(3.0);
  });

  it("stepZoom がズーム倍率を増減できること", () => {
    expect(stepZoom(2.5, 1)).toBe(3.0);
    expect(stepZoom(2.5, -1)).toBe(2.0);
    expect(stepZoom(MAX_ZOOM, 1)).toBe(MAX_ZOOM);
    expect(stepZoom(MIN_ZOOM, -1)).toBe(MIN_ZOOM);
    expect(stepZoom(2.5, 0)).toBe(2.5);
  });
});

describe("magnifierUtils - clampLensSize & stepLensSize", () => {
  it("clampLensSize がサイズ範囲内に収めること", () => {
    expect(clampLensSize(100)).toBe(MIN_LENS_SIZE);
    expect(clampLensSize(600)).toBe(MAX_LENS_SIZE);
    expect(clampLensSize(240.4)).toBe(240);
  });

  it("stepLensSize がレンズサイズを増減できること", () => {
    expect(stepLensSize(240, 1)).toBe(260);
    expect(stepLensSize(240, -1)).toBe(220);
    expect(stepLensSize(MAX_LENS_SIZE, 1)).toBe(MAX_LENS_SIZE);
    expect(stepLensSize(MIN_LENS_SIZE, -1)).toBe(MIN_LENS_SIZE);
    expect(stepLensSize(240, 0)).toBe(240);
  });
});

describe("magnifierUtils - calculateLensPosition", () => {
  it("画面中央付近ではカーソルを中心に配置すること", () => {
    const pos = calculateLensPosition(500, 400, 200, 200, 1000, 800);
    expect(pos).toEqual({ x: 400, y: 300 });
  });

  it("左上端で画面外にはみ出さないよう0にクランプすること", () => {
    const pos = calculateLensPosition(50, 50, 200, 200, 1000, 800);
    expect(pos).toEqual({ x: 0, y: 0 });
  });

  it("右下端で画面外にはみ出さないよう最大値にクランプすること", () => {
    const pos = calculateLensPosition(980, 780, 200, 200, 1000, 800);
    expect(pos).toEqual({ x: 800, y: 600 });
  });
});

describe("magnifierUtils - calculateBackgroundPosition", () => {
  it("画像中心を指している時、背景の中心がレンズ中心に来ること", () => {
    const targetRect = { left: 100, top: 100, width: 400, height: 300 };
    // カーソルは画像中心 (300, 250)
    const result = calculateBackgroundPosition(300, 250, targetRect, 200, 200, 2);
    // safeWidth=400, safeHeight=300
    // ratioX = (300 - 100) / 400 = 0.5
    // ratioY = (250 - 100) / 300 = 0.5
    // bgWidth = 400 * 2 = 800
    // bgHeight = 300 * 2 = 600
    // bgX = 0.5 * 800 - 100 = 300
    // bgY = 0.5 * 600 - 100 = 200
    expect(result).toEqual({
      bgWidth: 800,
      bgHeight: 600,
      bgX: 300,
      bgY: 200,
    });
  });

  it("画像左上を指している時、ratioX/Yが0になりレンズ中心に左上が来ること", () => {
    const targetRect = { left: 100, top: 100, width: 400, height: 300 };
    const result = calculateBackgroundPosition(100, 100, targetRect, 200, 200, 2);
    expect(result).toEqual({
      bgWidth: 800,
      bgHeight: 600,
      bgX: -100,
      bgY: -100,
    });
  });
});

describe("magnifierUtils - findViewerImageElement", () => {
  it("containerがnullの時はnullを返すこと", () => {
    expect(findViewerImageElement(100, 100, null)).toBeNull();
  });

  it("コンテナ内の .viewer-image 要素を見つけられること", () => {
    const container = document.createElement("div");
    const img = document.createElement("img");
    img.className = "viewer-image";
    img.src = "asset://test.jpg";
    container.appendChild(img);

    const found = findViewerImageElement(100, 100, container);
    expect(found).toBe(img);
  });

  it("コンテナ内に .viewer-image がない時はnullを返すこと", () => {
    const container = document.createElement("div");
    const otherDiv = document.createElement("div");
    container.appendChild(otherDiv);

    const found = findViewerImageElement(100, 100, container);
    expect(found).toBeNull();
  });
});

describe("magnifierUtils - getContainedImageRect", () => {
  it("横長画像（幅フィット・上下余白）の描画領域を正しく計算すること", () => {
    // コンテナボックス: 1000x500 (ratio 2.0)
    // 元画像: 1600x400 (ratio 4.0 - より横長)
    const elemRect = { left: 0, top: 0, width: 1000, height: 500 };
    const rect = getContainedImageRect(elemRect, 1600, 400);

    // 幅いっぱいの 1000px、高さは 1000 / 4 = 250px、上下余白 (500 - 250) / 2 = 125px
    expect(rect).toEqual({
      left: 0,
      top: 125,
      width: 1000,
      height: 250,
    });
  });

  it("縦長画像（高さフィット・左右余白）の描画領域を正しく計算すること", () => {
    // コンテナボックス: 1000x500 (ratio 2.0)
    // 元画像: 500x500 (ratio 1.0 - より縦長/正方形)
    const elemRect = { left: 50, top: 20, width: 1000, height: 500 };
    const rect = getContainedImageRect(elemRect, 500, 500);

    // 高さいっぱいの 500px、幅は 500 * 1 = 500px、左右余白 (1000 - 500) / 2 = 250px
    expect(rect).toEqual({
      left: 300,
      top: 20,
      width: 500,
      height: 500,
    });
  });

  it("naturalWidthやnaturalHeightが無効な場合はelemRectをそのまま返すこと", () => {
    const elemRect = { left: 10, top: 10, width: 200, height: 200 };
    expect(getContainedImageRect(elemRect, 0, 0)).toEqual(elemRect);
  });
});

describe("magnifierUtils - calculateHelperPosition", () => {
  it("画面中央付近ではレンズの下側に右寄せ（右端揃え）で配置すること", () => {
    // lens: x=200, y=200, w=240, h=240
    // helper: w=200, h=60
    // container: 1000x800
    const pos = calculateHelperPosition(200, 200, 240, 240, 200, 60, 1000, 800);
    // y = 200 + 240 + 10 = 450
    // x = 200 + 240 - 200 = 240
    expect(pos).toEqual({ x: 240, y: 450 });
  });

  it("画面下部ではレンズの上側に反転して配置すること", () => {
    // lens: y=600, h=240, container: h=800
    // y = 600 + 240 + 10 = 850 > 800 - 8 なので反転
    // y = 600 - 60 - 10 = 530
    const pos = calculateHelperPosition(200, 600, 240, 240, 200, 60, 1000, 800);
    expect(pos).toEqual({ x: 240, y: 530 });
  });

  it("画面右端付近ではコンテナ右端でクランプされること", () => {
    // lens: x=850, y=200, w=200, h=200
    // helper: w=200, h=60
    // container: 1000x800
    // target x = 850 + 200 - 200 = 850
    // max x = 1000 - 200 - 8 = 792
    const pos = calculateHelperPosition(850, 200, 200, 200, 200, 60, 1000, 800);
    expect(pos).toEqual({ x: 792, y: 410 });
  });
});
