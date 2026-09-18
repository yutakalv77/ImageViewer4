import { describe, it, expect } from "vitest";
import { isTargetEditable, isTargetInputOrTextarea } from "../../utils/domUtils";

describe("domUtils - isTargetEditable", () => {
  it("input要素を判定できること", () => {
    const input = document.createElement("input");
    expect(isTargetEditable(input)).toBe(true);
  });

  it("textarea要素を判定できること", () => {
    const textarea = document.createElement("textarea");
    expect(isTargetEditable(textarea)).toBe(true);
  });

  it("contentEditable要素を判定できること", () => {
    const div = document.createElement("div");
    div.contentEditable = "true";
    expect(isTargetEditable(div)).toBe(true);
  });

  it("通常のdivやbutton、nullなどを判定できること", () => {
    expect(isTargetEditable(null)).toBe(false);
    expect(isTargetEditable(undefined as any)).toBe(false);

    const div = document.createElement("div");
    expect(isTargetEditable(div)).toBe(false);

    const button = document.createElement("button");
    expect(isTargetEditable(button)).toBe(false);
  });

  it("isTargetInputOrTextarea がエイリアスとして正しく動作すること", () => {
    const input = document.createElement("input");
    expect(isTargetInputOrTextarea(input)).toBe(true);

    const div = document.createElement("div");
    expect(isTargetInputOrTextarea(div)).toBe(false);
  });
});
