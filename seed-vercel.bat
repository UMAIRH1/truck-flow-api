@echo off
REM Vercel Seed Script for Windows
REM Run this after deploying to Vercel

echo ==================================
echo TruckFlow - Vercel Seed Script
echo ==================================
echo.

set /p VERCEL_URL="Enter your Vercel backend URL (e.g., https://your-backend.vercel.app): "
set /p SEED_SECRET="Enter your SEED_SECRET (from Vercel env vars): 