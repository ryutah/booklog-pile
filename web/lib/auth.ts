import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  userId: string;
  iat: number;
  exp: number;
}

/**
 * リクエストヘッダーからJWTを抽出し、検証してユーザーIDを返す
 * @param request NextRequest
 * @returns ユーザーID (string) | null
 */
export function getUserIdFromRequest(request: NextRequest): string | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return null;
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined.');
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as DecodedToken;
    return decoded.userId;

  } catch (error) {
    // トークンが無効な場合 (期限切れなど)
    console.error('JWT verification failed:', error);
    return null;
  }
}
