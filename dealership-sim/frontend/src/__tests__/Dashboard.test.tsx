import { render, screen } from '@testing-library/react';
import Dashboard from '../features/dashboard/Dashboard';
import { createSeedState } from '../../../backend/src/data/seed';

describe('Dashboard', () => {
  it('shows cash KPI', () => {
    const state = createSeedState();
    render(<Dashboard state={state} />);
    expect(screen.getByText('Cash Balance')).toBeInTheDocument();
  });
});
