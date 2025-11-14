import { render, screen } from '@testing-library/react';
import App from './App';

test('redirects to Login by default', () => {
  render(<App />);
  // Login page renders a "Sign In" button; assert its presence
  const signInBtn = screen.getByRole('button', { name: /Sign In/i });
  expect(signInBtn).toBeInTheDocument();
});
