import { useAuthStore } from '../../src/store/auth.store';

jest.mock('../../src/api/auth', () => ({
  authAPI: {
    signup: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
  },
}));

jest.mock('../../src/utils/storage', () => ({
  storage: {
    setTokens: jest.fn(),
    getAccessToken: jest.fn().mockResolvedValue(null),
    getRefreshToken: jest.fn().mockResolvedValue(null),
    getUser: jest.fn().mockResolvedValue(null),
    setUser: jest.fn(),
    clearAll: jest.fn(),
  },
}));

const { authAPI } = require('../../src/api/auth');

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ user: null, isSignedIn: false, isLoading: true, error: null });
});

describe('auth store', () => {
  it('init sets isLoading to false when no token', async () => {
    await useAuthStore.getState().init();
    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(useAuthStore.getState().isSignedIn).toBe(false);
  });

  it('login sets user and isSignedIn on success', async () => {
    const user = { id: '1', email: 'test@test.com', tier: 'free' };
    authAPI.login.mockResolvedValue({ user, access: 'tok', refresh: 'ref' });

    await useAuthStore.getState().login('test@test.com', 'password123');

    expect(useAuthStore.getState().user).toEqual(user);
    expect(useAuthStore.getState().isSignedIn).toBe(true);
  });

  it('signup sets user and isSignedIn on success', async () => {
    const user = { id: '2', email: 'new@test.com', tier: 'free' };
    authAPI.signup.mockResolvedValue({ user, access: 'tok', refresh: 'ref' });

    await useAuthStore.getState().signup('new@test.com', 'password123', 'New');

    expect(useAuthStore.getState().isSignedIn).toBe(true);
    expect(useAuthStore.getState().user).toEqual(user);
  });

  it('logout clears user and isSignedIn', async () => {
    useAuthStore.setState({ user: { id: '1' }, isSignedIn: true });
    authAPI.logout.mockResolvedValue(undefined);

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isSignedIn).toBe(false);
  });

  it('login propagates error on failure', async () => {
    authAPI.login.mockRejectedValue(new Error('Invalid credentials'));
    await expect(useAuthStore.getState().login('bad@test.com', 'wrong')).rejects.toThrow();
  });
});
