import { render, screen } from '@testing-library/react';
import App from './App';

test('redirects to Login by default', async () => {
  render(<App />);
  // Login page renders a "Sign In" button; assert its presence
  const signInBtn = await screen.findByRole('button', { name: /Sign In/i });
  expect(signInBtn).toBeInTheDocument();
});
