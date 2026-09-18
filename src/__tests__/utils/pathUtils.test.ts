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
  isParentOf,
  findEntryIndexByPath,
} from '../../utils/pathUtils';

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

describe('pathUtils - isParentOf', () => {
  it('通常パスで1階層上の親ディレクトリであることを正しく判定すること', () => {
    expect(isParentOf('C:/Photos', 'C:\\Photos\\Trip')).toBe(true);
    expect(isParentOf('C:\\Photos', 'C:/Photos/Trip')).toBe(true);
    expect(isParentOf('C:/', 'C:\\Photos')).toBe(true);
    expect(isParentOf('C:', 'C:\\Photos')).toBe(true);
  });

  it('2階層以上下、同一パス、無関係のパスでは false を返すこと', () => {
    expect(isParentOf('C:/Photos', 'C:/Photos/2024/Trip')).toBe(false);
    expect(isParentOf('C:/Photos', 'C:/Photos')).toBe(false);
    expect(isParentOf('C:/Photos', 'C:/Other/Trip')).toBe(false);
    expect(isParentOf('', 'C:/Photos/Trip')).toBe(false);
    expect(isParentOf(null, 'C:/Photos/Trip')).toBe(false);
    expect(isParentOf('C:/Photos', null)).toBe(false);
  });

  it('ZIP仮想パスの親ディレクトリ関係を正しく判定すること', () => {
    expect(isParentOf('C:/test.zip::folder', 'C:\\test.zip::folder/sub')).toBe(true);
    expect(isParentOf('C:/test.zip', 'C:\\test.zip::folder')).toBe(true);
    expect(isParentOf('C:/', 'C:\\test.zip')).toBe(true);
  });
});

describe('pathUtils - findEntryIndexByPath', () => {
  const dummyEntries = [
    { name: 'Trip2023', path: 'C:/Photos/Trip2023', is_dir: true, thumbnail_path: null },
    { name: 'Trip2024', path: 'C:\\Photos\\Trip2024', is_dir: true, thumbnail_path: null },
    { name: 'photo.jpg', path: 'C:/Photos/photo.jpg', is_dir: false, thumbnail_path: null },
  ];

  it('パス（区切り文字・大文字小文字差異を含む）に合致するエントリのインデックスを返すこと', () => {
    expect(findEntryIndexByPath(dummyEntries, 'C:/Photos/Trip2024')).toBe(1);
    expect(findEntryIndexByPath(dummyEntries, 'c:\\photos\\trip2024\\')).toBe(1);
    expect(findEntryIndexByPath(dummyEntries, 'C:/Photos/Trip2023')).toBe(0);
    expect(findEntryIndexByPath(dummyEntries, 'C:/Photos/photo.jpg')).toBe(2);
  });

  it('合致しない場合や空配列の場合は -1 を返すこと', () => {
    expect(findEntryIndexByPath(dummyEntries, 'C:/Photos/NonExistent')).toBe(-1);
    expect(findEntryIndexByPath([], 'C:/Photos/Trip2024')).toBe(-1);
    expect(findEntryIndexByPath(dummyEntries, '')).toBe(-1);
    expect(findEntryIndexByPath(null, 'C:/Photos/Trip2024')).toBe(-1);
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

