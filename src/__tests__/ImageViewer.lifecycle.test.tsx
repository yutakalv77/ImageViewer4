import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
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

describe('ImageViewer Lifecycle and Hooks Consistency', () => {
  const defaultProps = createDefaultImageViewerProps();

  it('isOpen: false の初期状態では何も描画されないこと', () => {
    const { container } = render(<ImageViewer {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('isOpen: false から isOpen: true に切り替わってもフック不一致エラーを起こさず正常に表示されること', () => {
    const { container, rerender } = render(<ImageViewer {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();

    // 画像を開く（isOpen: true）
    expect(() => {
      rerender(<ImageViewer {...defaultProps} isOpen={true} />);
    }).not.toThrow();

    expect(container.querySelector('.viewer-overlay')).not.toBeNull();
  });

  it('isOpen: true から isOpen: false に切り替えて安全に非表示化されること', () => {
    const { container, rerender } = render(<ImageViewer {...defaultProps} isOpen={true} />);
    expect(container.querySelector('.viewer-overlay')).not.toBeNull();

    rerender(<ImageViewer {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });
});
