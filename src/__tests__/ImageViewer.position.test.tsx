import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ImageViewer } from '../components/ImageViewer';
import { PageNumberPosition } from '../types';
import { createDefaultImageViewerProps } from './helpers/imageViewerTestHelper';

vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: vi.fn((path: string) => `asset://localhost/${encodeURIComponent(path)}`),
  invoke: vi.fn().mockResolvedValue({ data: [], mime: 'image/jpeg' }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      if (key === 'slideshow.viewer_info_single' && params) {
        return `${params.page} / ${params.total} - ${params.name}`;
      }
      return key;
    },
  }),
}));

describe('ImageViewer Page Number Position', () => {
  const defaultProps = createDefaultImageViewerProps();

  it('renders with default bottom-center position when prop is omitted', () => {
    const { container } = render(<ImageViewer {...defaultProps} />);
    const overlay = container.querySelector('.viewer-overlay');
    expect(overlay).toHaveClass('page-pos-bottom-center');

    const info = container.querySelector('.viewer-info');
    expect(info).toBeInTheDocument();
    expect(info).toHaveClass('pos-bottom-center');
    expect(info).toHaveTextContent('1 / 2 - test1.jpg');
  });

  const positions: PageNumberPosition[] = [
    'top-center',
    'bottom-center',
    'top-left',
    'bottom-left',
    'top-right',
    'bottom-right',
  ];

  positions.forEach((pos) => {
    it(`renders page indicator with pos-${pos} when pageNumberPosition="${pos}"`, () => {
      const { container } = render(
        <ImageViewer {...defaultProps} pageNumberPosition={pos} />
      );
      const overlay = container.querySelector('.viewer-overlay');
      expect(overlay).toHaveClass(`page-pos-${pos}`);

      const info = container.querySelector('.viewer-info');
      expect(info).toBeInTheDocument();
      expect(info).toHaveClass(`pos-${pos}`);
    });
  });

  it('does not render page indicator when pageNumberPosition="hidden"', () => {
    const { container } = render(
      <ImageViewer {...defaultProps} pageNumberPosition="hidden" />
    );
    const overlay = container.querySelector('.viewer-overlay');
    expect(overlay).toHaveClass('page-pos-hidden');

    const info = container.querySelector('.viewer-info');
    expect(info).toBeNull();
  });
});
