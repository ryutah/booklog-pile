'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

// ユーザー情報の型定義
interface User {
  id: string;
  username: string;
  email: string;
}

// Contextの型定義
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

// Contextの作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Axiosのインスタンスを作成し、共通のヘッダーを設定
export const apiClient = axios.create({
  baseURL: '/api',
});

// リクエストインターセプター：localStorageからトークンを取得してヘッダーに追加
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


// AuthProviderコンポーネント
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        // サーバーにユーザー情報を問い合わせる
        const response = await apiClient.get('/users/me');
        if (response.status === 200) {
          setUser(response.data);
        }
      } catch (error) {
        console.error('Authentication error', error);
        // トークンが無効なら削除
        localStorage.removeItem('accessToken');
      } finally {
        setIsLoading(false);
      }
    };
    verifyUser();
  }, []);

  const login = async (token: string) => {
    localStorage.setItem('accessToken', token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    try {
      // ログイン後にユーザー情報を再取得
      const response = await apiClient.get('/users/me');
      if (response.status === 200) {
        setUser(response.data);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Failed to fetch user after login', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
    router.push('/login');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// カスタムフック
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
