import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Dashboard route by default', () => {
  render(<App />);
  // Look for known content on the Dashboard page or layout
  const header = screen.getByText(/Employee Attendance/i);
  expect(header).toBeInTheDocument();
});
