const TOKEN_KEY = 'admin_token';
const ADMIN_KEY = 'admin_data';

export const auth = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
  },

  getAdmin: (): any | null => {
    const data = localStorage.getItem(ADMIN_KEY);
    return data ? JSON.parse(data) : null;
  },

  setAdmin: (admin: any): void => {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
  },

  isAuthenticated: (): boolean => {
    return !!auth.getToken();
  },

  login: async (email: string, password: string): Promise<any> => {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.kvadrobobr.ru';
    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Неверный email или пароль');
    }

    const data = await response.json();
    auth.setToken(data.access_token);
    auth.setAdmin(data.admin);
    return data;
  },

  logout: (): void => {
    auth.removeToken();
  },
};

