import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
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

describe('ImageViewer Rename Support', () => {
  const defaultProps = createDefaultImageViewerProps({
    onRenameImage: vi.fn(),
  });

  it('F2キー押下でリネームモーダルが表示されること', async () => {
    const { getByRole } = render(<ImageViewer {...defaultProps} />);
    fireEvent.keyDown(window, { key: 'F2' });

    await waitFor(() => {
      const input = getByRole('textbox') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.value).toBe('test1.jpg');
    });
  });

  it('右クリックメニューに「名前を変更」が表示され、クリックでモーダルが開くこと', async () => {
    const { container, findByText, getByRole } = render(<ImageViewer {...defaultProps} />);
    const overlay = container.querySelector('.viewer-overlay')!;

    fireEvent.contextMenu(overlay, { clientX: 100, clientY: 100 });

    const renameMenuItem = await findByText('context_menu.rename');
    expect(renameMenuItem).toBeInTheDocument();

    fireEvent.click(renameMenuItem);

    await waitFor(() => {
      const input = getByRole('textbox') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.value).toBe('test1.jpg');
    });
  });
});
