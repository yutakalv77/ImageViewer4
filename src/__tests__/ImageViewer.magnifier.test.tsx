import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { ImageViewer } from '../components/ImageViewer';
import { createDefaultImageViewerProps } from './helpers/imageViewerTestHelper';

vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: vi.fn((path: string) => `asset://localhost/${encodeURIComponent(path)}`),
  invoke: vi.fn().mockResolvedValue({ data: [], mime: 'image/jpeg' }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('ImageViewer Magnifier Support', () => {
  const defaultProps = createDefaultImageViewerProps();

  it('Zキー押下で拡大鏡モードがトグルされること', () => {
    const { container } = render(<ImageViewer {...defaultProps} />);
    const overlay = container.querySelector('.viewer-overlay')!;

    expect(overlay).not.toHaveClass('magnifier-mode');

    // Zキー押下でON
    fireEvent.keyDown(window, { key: 'z' });
    expect(overlay).toHaveClass('magnifier-mode');

    // 再度Zキー押下でOFF
    fireEvent.keyDown(window, { key: 'z' });
    expect(overlay).not.toHaveClass('magnifier-mode');
  });

  it('右クリックメニューに「拡大鏡」が表示され、クリックでトグルされること', async () => {
    const { container, findByText } = render(<ImageViewer {...defaultProps} />);
    const overlay = container.querySelector('.viewer-overlay')!;

    fireEvent.contextMenu(overlay, { clientX: 100, clientY: 100 });

    const magnifierItem = await findByText('context_menu.magnifier');
    expect(magnifierItem).toBeInTheDocument();

    fireEvent.click(magnifierItem);
    expect(overlay).toHaveClass('magnifier-mode');
  });

  it('拡大鏡モード中にEscapeキーを押すと拡大鏡モードが終了し、ビューワー自体は閉じないこと', () => {
    const onClose = vi.fn();
    const { container } = render(<ImageViewer {...defaultProps} onClose={onClose} />);
    const overlay = container.querySelector('.viewer-overlay')!;

    // 拡大鏡をONにする
    fireEvent.keyDown(window, { key: 'z' });
    expect(overlay).toHaveClass('magnifier-mode');

    // Escapeキーを押下
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(overlay).not.toHaveClass('magnifier-mode');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('拡大鏡モード中に+キーや-キーでズーム倍率が変更されること', () => {
    render(<ImageViewer {...defaultProps} />);

    // 拡大鏡をONにする
    fireEvent.keyDown(window, { key: 'z' });

    // 初期倍率は 2.5x
    expect(screen.getByText('2.5x')).toBeInTheDocument();

    // +キーでズームイン
    fireEvent.keyDown(window, { key: '+' });
    expect(screen.getByText('3.0x')).toBeInTheDocument();

    // -キーでズームアウト
    fireEvent.keyDown(window, { key: '-' });
    expect(screen.getByText('2.5x')).toBeInTheDocument();

    // Ctrl + + でズームイン
    fireEvent.keyDown(window, { key: '+', ctrlKey: true });
    expect(screen.getByText('3.0x')).toBeInTheDocument();

    // Ctrl + - でズームアウト
    fireEvent.keyDown(window, { key: '-', ctrlKey: true });
    expect(screen.getByText('2.5x')).toBeInTheDocument();
  });

  it('拡大鏡モード中にShift+-やテンキーShift++でレンズサイズが調整されること', () => {
    const { container } = render(<ImageViewer {...defaultProps} />);

    // 拡大鏡をONにする
    fireEvent.keyDown(window, { key: 'z' });

    // レンズ初期サイズは 240px
    let lens = container.querySelector('.magnifier-lens') as HTMLElement;
    expect(lens).toHaveStyle({ width: '240px', height: '240px' });

    // Shift + テンキー+ でレンズ拡大 (240 + 20 = 260px)
    fireEvent.keyDown(window, { key: '+', code: 'NumpadAdd', shiftKey: true });
    lens = container.querySelector('.magnifier-lens') as HTMLElement;
    expect(lens).toHaveStyle({ width: '260px', height: '260px' });

    // Shift + - でレンズ縮小 (260 - 20 = 240px)
    fireEvent.keyDown(window, { key: '-', code: 'Minus', shiftKey: true });
    lens = container.querySelector('.magnifier-lens') as HTMLElement;
    expect(lens).toHaveStyle({ width: '240px', height: '240px' });
  });
});
