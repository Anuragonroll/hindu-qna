@echo off
cd /d "%~dp0..\..\Mini-Max\hindu-qna"
call npx pm2 resurrect > nul 2>&1
exit /b 0
