// __tests__/setup.test.tsx
import { render, screen } from '@testing-library/react';

// Basic smoke test to verify test setup
describe('Test Setup Verification', () => {
  it('should render a simple component', () => {
    const TestComponent = () => <div data-testid="test">Hello Test</div>;

    render(<TestComponent />);

    expect(screen.getByTestId('test')).toBeInTheDocument();
    expect(screen.getByText('Hello Test')).toBeInTheDocument();
  });

  it('should handle basic assertions', () => {
    expect(true).toBe(true);
    expect(1 + 1).toBe(2);
    expect('test').toMatch(/test/);
  });
});
