import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WindowControls } from '../components/WindowControls';

describe('WindowControls', () => {
  it('最小化、最大化、閉じるボタンがクリックされたときに各ハンドラが呼ばれること', () => {
    const onMinimize = vi.fn();
    const onToggleMaximize = vi.fn();
    const onClose = vi.fn();

    render(
      <WindowControls 
        onMinimize={onMinimize} 
        onToggleMaximize={onToggleMaximize} 
        onClose={onClose} 
      />
    );

    fireEvent.click(screen.getByLabelText('Minimize window'));
    expect(onMinimize).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText('Maximize window'));
    expect(onToggleMaximize).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText('Close window'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
