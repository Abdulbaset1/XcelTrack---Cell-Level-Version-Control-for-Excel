import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders XcelTrack welcome message', () => {
  render(<App />);
  const welcomeElement = screen.getByText(/XcelTrack/i);
  expect(welcomeElement).toBeInTheDocument();
});