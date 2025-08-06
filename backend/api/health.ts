import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'WSOP Field Director Pro Backend is running on Vercel!',
    environment: process.env.NODE_ENV || 'production'
  });
}