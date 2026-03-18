import { render, screen, waitFor } from '@testing-library/react';
import { ThemeToggle } from '@/components/theme-switcher';

jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}));

const { useTheme } = jest.requireMock('next-themes') as {
  useTheme: jest.Mock;
};

describe('ThemeToggle', () => {
  it('keeps hook order stable when mounting', async () => {
    const setTheme = jest.fn();
    useTheme.mockReturnValue({ theme: 'dark', setTheme });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<ThemeToggle />);

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeTruthy();
    });

    const loggedErrors = consoleSpy.mock.calls.flat().join(' ');
    expect(loggedErrors).not.toContain(
      'Rendered more hooks than during the previous render',
    );
    consoleSpy.mockRestore();
  });
});
