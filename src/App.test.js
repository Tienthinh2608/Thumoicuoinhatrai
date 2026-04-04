import { render, screen } from '@testing-library/react';
import App from './App';

test('renders wedding invite', () => {
  render(<App />);
  expect(screen.getByText(/THƯ MỜI CƯỚI/i)).toBeInTheDocument();
});
