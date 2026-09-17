import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GeneralSettings } from '../components/settings/GeneralSettings';
import { PageNumberPosition } from '../types';

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'settings.general_title': '一般設定',
        'settings.startup_folder_label': '起動時にフォルダ',
        'settings.startup_none': '（なし）',
        'settings.startup_last': '最後に表示したフォルダ',
        'settings.theme_label': 'テーマ',
        'settings.theme_dark': 'ダーク',
        'settings.theme_light': 'ライト',
        'settings.theme_system': 'システム（OS設定）',
        'settings.language_label': '言語',
        'settings.page_number_position_label': 'ページ番号の表示位置',
        'settings.page_pos_top_center': '上部中央',
        'settings.page_pos_bottom_center': '下部中央',
        'settings.page_pos_top_left': '左上',
        'settings.page_pos_bottom_left': '左下',
        'settings.page_pos_top_right': '右上',
        'settings.page_pos_bottom_right': '右下',
        'settings.page_pos_hidden': '非表示',
        'settings.high_perf_label': '高負荷モード（パフォーマンス優先）',
        'settings.high_perf_desc': '有効にすると、CPUコアを最大限に活用してフォルダ内のサムネイルを裏で一括・先行生成します。サムネイル表示とスクロールが劇的に高速化されますが、一時的にCPU使用率やファンの回転数、バッテリー消費が高くなる場合があります。',
        'settings.bg_title': '背景画像の設定',
        'settings.bg_label': '背景画像を選択',
        'settings.storage_change': '変更...',
        'common.reset': 'リセット',
      };
      return translations[key] || key;
    },
  }),
}));

describe('GeneralSettings Component', () => {
  const defaultProps = {
    startupFolderType: 'none' as const,
    language: 'ja',
    theme: 'dark' as const,
    background: {
      path: null,
      opacity: 0.3,
      blur: 5,
      style: 'cover' as const,
    },
    pageNumberPosition: 'bottom-center' as PageNumberPosition,
    highPerformanceMode: false,
    onUpdateStartupFolderType: vi.fn(),
    onUpdateLanguage: vi.fn(),
    onUpdateTheme: vi.fn(),
    onUpdateBackground: vi.fn(),
    onPickBackgroundImage: vi.fn(),
    onUpdatePageNumberPosition: vi.fn(),
    onUpdateHighPerformanceMode: vi.fn(),
  };

  it('renders page number position setting label and 7 options', () => {
    render(<GeneralSettings {...defaultProps} />);

    expect(screen.getByText('ページ番号の表示位置')).toBeInTheDocument();

    const select = screen.getAllByRole('combobox').find(
      (el) => (el as HTMLSelectElement).value === 'bottom-center'
    ) as HTMLSelectElement;

    expect(select).toBeInTheDocument();
    expect(select.options.length).toBe(7);

    const optionLabels = Array.from(select.options).map((opt) => opt.textContent);
    expect(optionLabels).toEqual([
      '上部中央',
      '下部中央',
      '左上',
      '左下',
      '右上',
      '右下',
      '非表示',
    ]);
  });

  it('calls onUpdatePageNumberPosition when user selects a different position', () => {
    const onUpdatePageNumberPosition = vi.fn();
    render(
      <GeneralSettings
        {...defaultProps}
        onUpdatePageNumberPosition={onUpdatePageNumberPosition}
      />
    );

    const select = screen.getAllByRole('combobox').find(
      (el) => (el as HTMLSelectElement).value === 'bottom-center'
    ) as HTMLSelectElement;

    fireEvent.change(select, { target: { value: 'top-right' } });
    expect(onUpdatePageNumberPosition).toHaveBeenCalledWith('top-right');

    fireEvent.change(select, { target: { value: 'hidden' } });
    expect(onUpdatePageNumberPosition).toHaveBeenCalledWith('hidden');
  });

  it('renders high performance mode checkbox and description with proper accessibility attributes', () => {
    render(<GeneralSettings {...defaultProps} highPerformanceMode={false} />);

    expect(screen.getByText('高負荷モード（パフォーマンス優先）')).toBeInTheDocument();
    const descEl = screen.getByText(/有効にすると、CPUコアを最大限に活用してフォルダ内のサムネイルを裏で一括・先行生成します/);
    expect(descEl).toBeInTheDocument();
    expect(descEl).toHaveAttribute('id', 'high-perf-mode-desc');

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    expect(checkbox).toHaveAttribute('id', 'high-perf-mode-input');
    expect(checkbox).toHaveAttribute('aria-describedby', 'high-perf-mode-desc');
  });

  it('calls onUpdateHighPerformanceMode when checkbox is toggled', () => {
    const onUpdateHighPerformanceMode = vi.fn();
    render(
      <GeneralSettings
        {...defaultProps}
        highPerformanceMode={false}
        onUpdateHighPerformanceMode={onUpdateHighPerformanceMode}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(onUpdateHighPerformanceMode).toHaveBeenCalledWith(true);
  });
});
