import axios, { AxiosInstance } from 'axios';

// import { useAuthStore } from '../state/authStore';

interface HttpConfig {
  baseURL: string;
  timeout: number;
  refreshURL: string;
  tokenKey: string;
  refreshKey: string;
}

interface NormalizedError {
  message: string;
  code: number;
}

export class HttpClient {
  private axios: AxiosInstance;
  private config: HttpConfig;
  private isRefreshing = false;
  private refreshQueue: ((token: string) => void)[] = [];

  constructor() {
    this.config = {
      baseURL: process.env.API_BASE_URL ?? 'http://localhost:3000',
      timeout: Number(process.env.API_TIMEOUT ?? 10000),
      refreshURL: process.env.API_REFRESH_URL ?? '/auth/refresh',
      tokenKey: 'access_token',
      refreshKey: 'refresh_token',
    };

    this.axios = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
    });
  }
}
