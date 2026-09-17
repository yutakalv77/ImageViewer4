import { describe, it, expect } from 'vitest';
import {
  getBreadcrumbs,
  isVirtualPath,
  VIRTUAL_PATH_FAVORITES,
  isZipFile,
  isZipVirtualPath,
  isZipPath,
  parseZipPath,
  makeZipPath,
  getParentPath,
} from '../utils/pathUtils';

describe('pathUtils - ZIP path utilities', () => {
  it('isZipFile が .zip, .cbz を正しく判定すること', () => {
    expect(isZipFile('C:\\path\\file.zip')).toBe(true);
    expect(isZipFile('C:\\path\\file.CBZ')).toBe(true);
    expect(isZipFile('C:\\path\\file.png')).toBe(false);
    expect(isZipFile('')).toBe(false);
    expect(isZipFile(null)).toBe(false);
  });

  it('isZipVirtualPath が :: を含むパスを正しく判定すること', () => {
    expect(isZipVirtualPath('C:\\path\\file.zip::sub/img.jpg')).toBe(true);
    expect(isZipVirtualPath('C:\\path\\file.zip::')).toBe(true);
    expect(isZipVirtualPath('C:\\path\\file.zip')).toBe(false);
  });

  it('isZipPath が ZIP ファイルまたは仮想パスを判定すること', () => {
    expect(isZipPath('C:\\path\\file.zip')).toBe(true);
    expect(isZipPath('C:\\path\\file.zip::img.jpg')).toBe(true);
    expect(isZipPath('C:\\path\\file.jpg')).toBe(false);
  });

  it('parseZipPath が ZIP パスと内部パスを正しく分解すること', () => {
    expect(parseZipPath('C:\\path\\file.zip::folder/sub/01.jpg')).toEqual({
      zipPath: 'C:\\path\\file.zip',
      innerPath: 'folder/sub/01.jpg',
    });
    expect(parseZipPath('C:\\path\\file.zip::')).toEqual({
      zipPath: 'C:\\path\\file.zip',
      innerPath: '',
    });
    expect(parseZipPath('C:\\path\\file.zip')).toEqual({
      zipPath: 'C:\\path\\file.zip',
      innerPath: '',
    });
  });

  it('makeZipPath が仮想パスを正しく組み立てること', () => {
    expect(makeZipPath('C:\\path\\file.zip', 'folder/img.jpg')).toBe('C:\\path\\file.zip::folder/img.jpg');
    expect(makeZipPath('C:\\path\\file.zip', '')).toBe('C:\\path\\file.zip');
    expect(makeZipPath('C:\\path\\file.zip', '/folder/img.jpg/')).toBe('C:\\path\\file.zip::folder/img.jpg');
  });
});

describe('pathUtils - getParentPath', () => {
  it('通常パスの親フォルダを正しく取得すること', () => {
    expect(getParentPath('C:\\Users\\Owner\\Photos')).toBe('C:\\Users\\Owner');
    expect(getParentPath('/home/owner/photos')).toBe('/home/owner');
  });

  it('ZIP仮想パスの親パスを正しく取得すること', () => {
    // 深い階層 -> 上の階層
    expect(getParentPath('C:\\comics\\vol1.zip::chapter1/page01.jpg')).toBe('C:\\comics\\vol1.zip::chapter1');
    // サブフォルダ -> ZIPルート
    expect(getParentPath('C:\\comics\\vol1.zip::chapter1')).toBe('C:\\comics\\vol1.zip');
    // ZIP直下ファイル -> ZIPルート
    expect(getParentPath('C:\\comics\\vol1.zip::page01.jpg')).toBe('C:\\comics\\vol1.zip');
    // ZIPルート -> 親ディレクトリ
    expect(getParentPath('C:\\comics\\vol1.zip')).toBe('C:\\comics');
  });
});

describe('pathUtils - getBreadcrumbs', () => {
  const dummyT = (key: string) => key;

  it('空のパスの場合は空配列を返すこと', () => {
    expect(getBreadcrumbs('', dummyT)).toEqual([]);
    expect(getBreadcrumbs(null, dummyT)).toEqual([]);
    expect(getBreadcrumbs(undefined, dummyT)).toEqual([]);
  });

  it('Windowsパスを正しくパンくず分割すること', () => {
    const crumbs = getBreadcrumbs('C:\\Users\\Owner\\Photos', dummyT);
    expect(crumbs).toEqual([
      { name: 'C:', path: 'C:\\' },
      { name: 'Users', path: 'C:\\Users' },
      { name: 'Owner', path: 'C:\\Users\\Owner' },
      { name: 'Photos', path: 'C:\\Users\\Owner\\Photos' },
    ]);
  });

  it('POSIXパスを正しくパンくず分割すること', () => {
    const crumbs = getBreadcrumbs('/home/owner/photos', dummyT);
    expect(crumbs).toEqual([
      { name: '/', path: '/' },
      { name: 'home', path: '/home' },
      { name: 'owner', path: '/home/owner' },
      { name: 'photos', path: '/home/owner/photos' },
    ]);
  });

  it('仮想パスの場合は1つのパンくずアイテムを返すこと', () => {
    const crumbs = getBreadcrumbs(VIRTUAL_PATH_FAVORITES, dummyT);
    expect(crumbs.length).toBe(1);
    expect(crumbs[0].path).toBe(VIRTUAL_PATH_FAVORITES);
    expect(isVirtualPath(crumbs[0].path)).toBe(true);
  });

  it('ZIP仮想パスを階層的にパンくず分割すること', () => {
    const crumbs = getBreadcrumbs('C:\\comics\\vol1.zip::chapter1/page01.jpg', dummyT);
    expect(crumbs).toEqual([
      { name: 'C:', path: 'C:\\' },
      { name: 'comics', path: 'C:\\comics' },
      { name: 'vol1.zip', path: 'C:\\comics\\vol1.zip' },
      { name: 'chapter1', path: 'C:\\comics\\vol1.zip::chapter1' },
      { name: 'page01.jpg', path: 'C:\\comics\\vol1.zip::chapter1/page01.jpg' },
    ]);
  });
});

