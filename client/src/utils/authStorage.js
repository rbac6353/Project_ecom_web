/**
 * เก็บ token และ user ใน sessionStorage แทน localStorage
 * ทำให้แต่ละแท็บล็อกอินแยกกันได้ (เหมาะสำหรับพรีเซ็นต์หลายบทบาทในหลายแท็บ)
 */
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const authStorage = {
  getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  },
  getUser() {
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setAuth(token, user) {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  setUser(user) {
    if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearAuth() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },
};

export default authStorage;
