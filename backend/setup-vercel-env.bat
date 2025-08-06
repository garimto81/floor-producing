@echo off
echo Setting up Vercel environment variables...

vercel env add DATABASE_URL production < nul
echo postgres://neondb_owner:npg_fR8LyHXac2lO@ep-winter-scene-a1m0wkh6-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

vercel env add POSTGRES_URL production < nul  
echo postgres://neondb_owner:npg_fR8LyHXac2lO@ep-winter-scene-a1m0wkh6-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

vercel env add POSTGRES_URL_NON_POOLING production < nul
echo postgresql://neondb_owner:npg_fR8LyHXac2lO@ep-winter-scene-a1m0wkh6.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

vercel env add POSTGRES_PRISMA_URL production < nul
echo postgres://neondb_owner:npg_fR8LyHXac2lO@ep-winter-scene-a1m0wkh6-pooler.ap-southeast-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require

vercel env add JWT_SECRET production < nul
echo a33636923f438f9f69e9c8d6ff38f8130e648f8d10bec8a2d55cba1c57102dd7

vercel env add JWT_EXPIRES_IN production < nul
echo 7d

vercel env add JWT_REFRESH_EXPIRES_IN production < nul
echo 30d

vercel env add NODE_ENV production < nul
echo production

vercel env add DEFAULT_TIMEZONE production < nul
echo Asia/Seoul

vercel env add TOURNAMENT_TIMEZONE production < nul
echo Europe/Athens

vercel env add APP_NAME production < nul
echo "WSOP Field Director Pro"

vercel env add APP_VERSION production < nul
echo 1.0.0

vercel env add LOG_LEVEL production < nul
echo info

echo Environment variables setup completed!
pause