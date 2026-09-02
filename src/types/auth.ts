export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
}

export interface AccessTokenPayload {
  sub?: string;
  userId?: number;
  name?: string;
  role?: string;
  exp?: number;
}
