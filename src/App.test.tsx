import React from 'react';
import { render } from '@testing-library/react';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: any) => <>{children}</>,
  Routes: ({ children }: any) => <>{children}</>,
  Route: ({ element }: any) => element,
  Navigate: () => null,
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
  useLocation: () => ({ pathname: '/', search: '', hash: '' }),
}), { virtual: true });

// Mock the contexts
jest.mock('./contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false, user: null }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}));

jest.mock('./contexts/ToastContext', () => ({
  ToastProvider: ({ children }: any) => <>{children}</>,
}));

jest.mock('./contexts/WebSocketContext', () => ({
  WebSocketProvider: ({ children }: any) => <>{children}</>,
}));

jest.mock('./contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: any) => <>{children}</>,
}));

jest.mock('./contexts/SettingsContext', () => ({
  SettingsProvider: ({ children }: any) => <>{children}</>,
}));

jest.mock('./pages/Landing', () => () => <div>Landing</div>);
jest.mock('./components/AuthForm', () => () => <div>AuthForm</div>);
jest.mock('./pages/Dashboard', () => () => <div>Dashboard</div>);
jest.mock('./pages/Profile', () => () => <div>Profile</div>);
jest.mock('./pages/Settings', () => () => <div>Settings</div>);
jest.mock('./components/Layout', () => ({ children }: any) => <div>{children}</div>);
jest.mock('./pages/AdminDashboard', () => () => <div>AdminDashboard</div>);
jest.mock('./components/AdminRoute', () => ({ children }: any) => <div>{children}</div>);
jest.mock('./pages/Editor', () => () => <div>Editor</div>);
jest.mock('./pages/History', () => () => <div>History</div>);
jest.mock('./components/ErrorBoundary', () => ({ children }: any) => <div>{children}</div>);

test('renders App component without crashing', () => {
  const App = require('./App').default;
  const { container } = render(<App />);
  expect(container).toBeInTheDocument();
});