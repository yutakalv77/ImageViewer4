import { describe, it, expect } from 'vitest';
import { getBreadcrumbs, isVirtualPath, VIRTUAL_PATH_FAVORITES } from '../utils/pathUtils';

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
});
