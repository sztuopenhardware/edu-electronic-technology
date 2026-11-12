@echo off
chcp 65001 >nul
set "PATH=C:\Program Files\nodejs;%PATH%"
echo 正在启动《模拟电子技术A》Ngspice WASM 交互仿真教学平台...
npm run dev -- --open
pause
