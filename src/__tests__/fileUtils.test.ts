import { describe, it, expect } from "vitest";
import { isValidFileName, getNameAndExtension, getRenamedPath } from "../utils/fileUtils";

describe("fileUtils - isValidFileName", () => {
  it("有効なファイル名を判定すること", () => {
    expect(isValidFileName("photo.jpg")).toBe(true);
    expect(isValidFileName("01_新しいファイル-テスト.png")).toBe(true);
    expect(isValidFileName("フォルダ名")).toBe(true);
  });

  it("無効なファイル名（禁止文字・空文字など）を拒否すること", () => {
    expect(isValidFileName("")).toBe(false);
    expect(isValidFileName("   ")).toBe(false);
    expect(isValidFileName(null)).toBe(false);
    expect(isValidFileName(undefined)).toBe(false);
    expect(isValidFileName(".")).toBe(false);
    expect(isValidFileName("..")).toBe(false);
    expect(isValidFileName("test.")).toBe(false);
    expect(isValidFileName("file/name.jpg")).toBe(false);
    expect(isValidFileName("file\\name.jpg")).toBe(false);
    expect(isValidFileName("file:name.jpg")).toBe(false);
    expect(isValidFileName("file*name.jpg")).toBe(false);
    expect(isValidFileName("file?name.jpg")).toBe(false);
    expect(isValidFileName('file"name.jpg')).toBe(false);
    expect(isValidFileName("file<name.jpg")).toBe(false);
    expect(isValidFileName("file>name.jpg")).toBe(false);
    expect(isValidFileName("file|name.jpg")).toBe(false);
  });

  it("Windows予約デバイス名（CON, PRN, AUX, NUL等）を拒否すること", () => {
    expect(isValidFileName("CON")).toBe(false);
    expect(isValidFileName("con.txt")).toBe(false);
    expect(isValidFileName("PRN")).toBe(false);
    expect(isValidFileName("aux.jpg")).toBe(false);
    expect(isValidFileName("NUL")).toBe(false);
    expect(isValidFileName("COM1")).toBe(false);
    expect(isValidFileName("com9.png")).toBe(false);
    expect(isValidFileName("LPT1")).toBe(false);
    expect(isValidFileName("lpt9.log")).toBe(false);
    // 予約名を含んでいても別名なら許可されること
    expect(isValidFileName("CONCERT.jpg")).toBe(true);
    expect(isValidFileName("PRN_TEST.txt")).toBe(true);
  });
});

describe("fileUtils - getNameAndExtension", () => {
  it("拡張子付きファイル名を正しく分離すること", () => {
    expect(getNameAndExtension("photo.jpg")).toEqual({
      baseName: "photo",
      extension: ".jpg",
    });
    expect(getNameAndExtension("archive.tar.gz")).toEqual({
      baseName: "archive.tar",
      extension: ".gz",
    });
  });

  it("拡張子なしファイルやドットファイルを正しく処理すること", () => {
    expect(getNameAndExtension("MyFolder")).toEqual({
      baseName: "MyFolder",
      extension: "",
    });
    expect(getNameAndExtension(".gitignore")).toEqual({
      baseName: ".gitignore",
      extension: "",
    });
  });
});

describe("fileUtils - getRenamedPath", () => {
  it("Windowsパスのファイル名を正しく置き換えること", () => {
    expect(getRenamedPath("C:\\Users\\Photos\\old.jpg", "new.jpg")).toBe(
      "C:\\Users\\Photos\\new.jpg"
    );
  });

  it("POSIXパスのファイル名を正しく置き換えること", () => {
    expect(getRenamedPath("/home/photos/old.jpg", "new.jpg")).toBe(
      "/home/photos/new.jpg"
    );
  });
});
