import { describe, it, expect } from 'vitest';
import { sortEntries, getFileExtension } from '../../utils/sortUtils';
import { EntryItem } from '../../types';

describe('sortUtils', () => {
  const sampleEntries: EntryItem[] = [
    { name: 'photo2.png', path: '/p2', is_dir: false, thumbnail_path: null, size: 200, modified: 2000, created: 1000 },
    { name: 'photo10.jpg', path: '/p10', is_dir: false, thumbnail_path: null, size: 100, modified: 1000, created: 2000 },
    { name: 'photo1.jpg', path: '/p1', is_dir: false, thumbnail_path: null, size: 300, modified: 3000, created: 3000 },
    { name: 'ZFolder', path: '/zf', is_dir: true, thumbnail_path: null },
    { name: 'AFolder', path: '/af', is_dir: true, thumbnail_path: null },
  ];

  it('getFileExtension が拡張子を正しく抽出すること', () => {
    expect(getFileExtension('test.jpg')).toBe('jpg');
    expect(getFileExtension('test.tar.gz')).toBe('gz');
    expect(getFileExtension('noext')).toBe('');
    expect(getFileExtension('.hidden')).toBe('');
    expect(getFileExtension('UPPER.PNG')).toBe('png');
  });

  it('フォルダは常に先頭、次にアーカイブ、最後にファイルが配置されること', () => {
    const entriesWithArchive: EntryItem[] = [
      { name: 'photo1.jpg', path: '/p1', is_dir: false, thumbnail_path: null },
      { name: 'archive.zip', path: '/a.zip', is_dir: false, is_archive: true, thumbnail_path: null },
      { name: 'FolderA', path: '/fa', is_dir: true, thumbnail_path: null },
    ];
    const sorted = sortEntries(entriesWithArchive, 'name', 'asc');
    expect(sorted[0].name).toBe('FolderA');
    expect(sorted[1].name).toBe('archive.zip');
    expect(sorted[2].name).toBe('photo1.jpg');
  });


  it('名前順（自然順）で昇順ソートされること', () => {
    const sorted = sortEntries(sampleEntries, 'name', 'asc');
    // フォルダ
    expect(sorted[0].name).toBe('AFolder');
    expect(sorted[1].name).toBe('ZFolder');
    // ファイル（photo1 -> photo2 -> photo10）
    expect(sorted[2].name).toBe('photo1.jpg');
    expect(sorted[3].name).toBe('photo2.png');
    expect(sorted[4].name).toBe('photo10.jpg');
  });

  it('名前順（自然順）で降順ソートされること', () => {
    const sorted = sortEntries(sampleEntries, 'name', 'desc');
    // フォルダ内降順
    expect(sorted[0].name).toBe('ZFolder');
    expect(sorted[1].name).toBe('AFolder');
    // ファイル内降順
    expect(sorted[2].name).toBe('photo10.jpg');
    expect(sorted[3].name).toBe('photo2.png');
    expect(sorted[4].name).toBe('photo1.jpg');
  });

  it('サイズ順（昇順・降順）でソートされること', () => {
    const asc = sortEntries(sampleEntries, 'size', 'asc');
    expect(asc[2].name).toBe('photo10.jpg'); // 100
    expect(asc[3].name).toBe('photo2.png');  // 200
    expect(asc[4].name).toBe('photo1.jpg');  // 300

    const desc = sortEntries(sampleEntries, 'size', 'desc');
    expect(desc[2].name).toBe('photo1.jpg');  // 300
    expect(desc[3].name).toBe('photo2.png');  // 200
    expect(desc[4].name).toBe('photo10.jpg'); // 100
  });

  it('作成日付順（昇順・降順）でソートされること', () => {
    const asc = sortEntries(sampleEntries, 'created', 'asc');
    expect(asc[2].name).toBe('photo2.png');  // 1000
    expect(asc[3].name).toBe('photo10.jpg'); // 2000
    expect(asc[4].name).toBe('photo1.jpg');  // 3000

    const desc = sortEntries(sampleEntries, 'created', 'desc');
    expect(desc[2].name).toBe('photo1.jpg');  // 3000
    expect(desc[3].name).toBe('photo10.jpg'); // 2000
    expect(desc[4].name).toBe('photo2.png');  // 1000
  });

  it('更新日付順（昇順・降順）でソートされること', () => {
    const asc = sortEntries(sampleEntries, 'modified', 'asc');
    expect(asc[2].name).toBe('photo10.jpg'); // 1000
    expect(asc[3].name).toBe('photo2.png');  // 2000
    expect(asc[4].name).toBe('photo1.jpg');  // 3000

    const desc = sortEntries(sampleEntries, 'modified', 'desc');
    expect(desc[2].name).toBe('photo1.jpg');  // 3000
    expect(desc[3].name).toBe('photo2.png');  // 2000
    expect(desc[4].name).toBe('photo10.jpg'); // 1000
  });

  it('種類順（拡張子順）でソートされること', () => {
    const asc = sortEntries(sampleEntries, 'type', 'asc');
    // jpg (.jpg) < png (.png)
    expect(asc[2].name).toBe('photo1.jpg');
    expect(asc[3].name).toBe('photo10.jpg');
    expect(asc[4].name).toBe('photo2.png');

    const desc = sortEntries(sampleEntries, 'type', 'desc');
    expect(desc[2].name).toBe('photo2.png'); // png
  });
});
