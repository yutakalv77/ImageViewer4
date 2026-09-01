import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../components/ErrorBoundary';

const ProblemChild = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test crash error');
  }
  return <div>Normal Content</div>;
};

describe('ErrorBoundary', () => {
  it('should render children normally when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Normal Content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal Content')).toBeInTheDocument();
  });

  it('should catch error and render fallback UI when child throws', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('表示中にエラーが発生しました')).toBeInTheDocument();
    expect(screen.getByText('再試行')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('should call onReset and recover when retry button is clicked with fixed child', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onReset = vi.fn();

    const { rerender } = render(
      <ErrorBoundary onReset={onReset}>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('表示中にエラーが発生しました')).toBeInTheDocument();

    // Change child to non-throwing version
    rerender(
      <ErrorBoundary onReset={onReset}>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>
    );

    // Click retry to clear error state
    fireEvent.click(screen.getByText('再試行'));
    expect(onReset).toHaveBeenCalledTimes(1);

    expect(screen.getByText('Normal Content')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
