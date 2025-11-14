import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Dashboard route by default', () => {
  render(<App />);
  const dashboardLink = screen.getByText(/Dashboard/i);
  expect(dashboardLink).toBeInTheDocument();
});
