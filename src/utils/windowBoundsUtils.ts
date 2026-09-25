export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WorkArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PrevVerticalBounds {
  y: number;
  height: number;
}

export interface VerticalFitCalculationResult {
  nextBounds: WindowBounds;
  nextPrevBounds: PrevVerticalBounds | null;
  action: "fit" | "restore";
}

/**
 * 現在のウィンドウが作業領域に対して垂直方向にフィット（垂直最大化）されているかを判定する
 * DPIスケーリングやウィンドウ枠の丸め誤差を許容するため tolerance を設ける
 */
export function isVerticallyFit(
  currentBounds: Pick<WindowBounds, "y" | "height">,
  workArea: Pick<WorkArea, "y" | "height">,
  tolerance: number = 2
): boolean {
  return (
    Math.abs(currentBounds.y - workArea.y) <= tolerance &&
    Math.abs(currentBounds.height - workArea.height) <= tolerance
  );
}

/**
 * 垂直フィット（垂直最大化）または復元の新しいウィンドウ境界を計算する純粋関数
 *
 * @param currentBounds 現在のウィンドウ位置・サイズ
 * @param workArea 現在のディスプレイの作業領域（タスクバーなどを除いた領域）
 * @param prevBounds 直前の垂直フィット前の位置・サイズ（復元用）
 * @param tolerance 垂直フィット判定の許容誤差（ピクセル）
 */
export function calculateVerticalFitBounds(
  currentBounds: WindowBounds,
  workArea: WorkArea,
  prevBounds: PrevVerticalBounds | null,
  tolerance: number = 2
): VerticalFitCalculationResult {
  const isAlreadyFit = isVerticallyFit(currentBounds, workArea, tolerance);

  if (isAlreadyFit && prevBounds) {
    // すでに上下ぴったりフィットしている場合は元の位置・高さに復元
    return {
      nextBounds: {
        x: currentBounds.x,
        y: prevBounds.y,
        width: currentBounds.width,
        height: prevBounds.height,
      },
      nextPrevBounds: null,
      action: "restore",
    };
  }

  // 垂直フィット実行
  return {
    nextBounds: {
      x: currentBounds.x,
      y: workArea.y,
      width: currentBounds.width,
      height: workArea.height,
    },
    nextPrevBounds: {
      y: currentBounds.y,
      height: currentBounds.height,
    },
    action: "fit",
  };
}
