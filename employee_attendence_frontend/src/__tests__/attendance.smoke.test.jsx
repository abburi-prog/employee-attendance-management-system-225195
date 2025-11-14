import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AttendancePage from '../pages/Attendance';

// Ensure tests run in MOCK mode by not setting REACT_APP_API_BASE.
// This smoke test validates that clicking Clock In then Clock Out updates the UI states.
describe('AttendancePage clock in/out smoke', () => {
  test('clock in then out updates today state and button disabled states', async () => {
    render(<AttendancePage />);

    // Initially should show not clocked in
    expect(screen.getByText(/Not clocked in/i)).toBeInTheDocument();

    const clockInBtn = screen.getByRole('button', { name: /Clock In/i });
    const clockOutBtn = screen.getByRole('button', { name: /Clock Out/i });

    // Clock in
    fireEvent.click(clockInBtn);

    await waitFor(() => {
      expect(screen.getByText(/Clocked in at/i)).toBeInTheDocument();
    });

    // After clock-in, Clock In disabled, Clock Out enabled
    expect(clockInBtn).toBeDisabled();
    expect(clockOutBtn).not.toBeDisabled();

    // Clock out
    fireEvent.click(clockOutBtn);

    await waitFor(() => {
      expect(screen.getByText(/Clocked out at/i)).toBeInTheDocument();
    });

    // After clock-out, Clock Out disabled, Clock In enabled again
    expect(clockOutBtn).toBeDisabled();
    expect(clockInBtn).not.toBeDisabled();
  });
});
