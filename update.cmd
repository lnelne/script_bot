@echo off

setlocal

set SV_PROT=http://
set SV_NAME=celeborn.dip.jp
set SV_PATH=/trac/share/browser/misc/LimeChat2/
set SV_FILE=%1
set SV_TYPE=?format=raw
set LC_PATH=%2
set LC_FILE=%1
if not [%3]==[] set LC_PATH=%2 %3

"%LC_PATH%\wget.exe" -O "%LC_PATH%\%LC_FILE%" "%SV_PROT%%SV_NAME%%SV_PATH%%SV_FILE%%SV_TYPE%"

endlocal
