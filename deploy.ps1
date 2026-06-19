# ============================================================
# Connectify - Auto Deploy Script
# Run: Right-click -> Run with PowerShell
# ============================================================

Write-Host "Installing Vercel CLI..." -ForegroundColor Cyan
npm install -g vercel

Write-Host "`nLogging into Vercel..." -ForegroundColor Cyan
vercel login

# ── Deploy Backend ──────────────────────────────────────────
Write-Host "`nDeploying Backend..." -ForegroundColor Green
Set-Location "C:\Users\premier\Desktop\Social app\server"

vercel --prod `
  --yes `
  --name connectify-api `
  -e NODE_ENV=production `
  -e SUPABASE_URL=https://qzcvkfrfkumfjkqjkymp.supabase.co `
  "-e" "SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6Y3ZrZnJma3VtZmprcWpreW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NjA1NDcsImV4cCI6MjA5NzMzNjU0N30.0pH5_kfHwMfbhT5vizW0THlE73zFU70jVxKzyQYg-4Y" `
  "-e" "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6Y3ZrZnJma3VtZmprcWpreW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc2MDU0NywiZXhwIjoyMDk3MzM2NTQ3fQ.6OOSEWznKuD_RMSvJhG6VN7XFGb1jQAMdLpA6UMYWy8" `
  -e JWT_SECRET=connectify-jwt-secret-2025-xK9mP2qR `
  "-e" "CLIENT_URL=https://connectify-fawn.vercel.app" `
  "-e" "PRODUCTION_CLIENT_URL=https://connectify-fawn.vercel.app"

Write-Host "`nBackend deployed!" -ForegroundColor Green
Write-Host "Check your backend URL above and update frontend env" -ForegroundColor Yellow
