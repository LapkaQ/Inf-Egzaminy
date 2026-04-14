import { api } from './api';

export const authService = {
  login: async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email); // FastAPI OAuth2 wymaga podania username
    formData.append('password', password);
    
    // fastapi korzysta domyślnie z application/x-www-form-urlencoded do logowania obslugiwanego przez OAuth2PasswordRequestForm
    const data = await api.postForm('/auth/login', formData);
    
    if (data.access_token) {
      localStorage.setItem('token', data.access_token);
    }
    return data;
  },
  
  register: async (email: string, password: string, name: string, role: string = 'student') => {
    // Rejestracja odbywa się normalnie poprzez aplikację JSON
    const data = await api.post('/auth/register', { 
      email, 
      password, 
      name, 
      role 
    });
    return data;
  },

  verifyEmail: async (token: string) => {
    const data = await api.post(`/auth/verify-email?token=${encodeURIComponent(token)}`, {});
    return data;
  },

  resendVerification: async (email: string) => {
    const data = await api.post('/auth/resend-verification', { email });
    return data;
  },

  forgotPassword: async (email: string) => {
    const data = await api.post('/auth/forgot-password', { email });
    return data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const data = await api.post('/auth/reset-password', { 
      token, 
      new_password: newPassword 
    });
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};
