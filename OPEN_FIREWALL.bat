@echo off
echo ===========================================
echo   FIXING FIREWALL FOR LOCAL WEB3 (PORT 8545)
echo ===========================================
echo.
echo 1. Deleting old rules...
netsh advfirewall firewall delete rule name="Allow Hardhat Node" >nul 2>&1

echo 2. Adding new rule for TCP Port 8545 (All Profiles)...
netsh advfirewall firewall add rule name="Allow Hardhat Node" dir=in action=allow protocol=TCP localport=8545 profile=any

echo.
echo ===========================================
echo   SUCCESS! PORT 8545 SHOULD BE OPEN.
echo ===========================================
echo.
echo Please try reloading the page on your phone:
echo http://192.168.1.18:8545
echo.
pause
