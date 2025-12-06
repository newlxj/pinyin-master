@echo off
echo ================================
echo ��ϰ���򹹽�
echo ================================
 

echo.
echo [2/4] ����ǰ��Ӧ��...
call pnpm install
if %errorlevel% neq 0 (
    echo ǰ��������װʧ�ܣ�
    pause
    exit /b 1
)
 
echo.
echo [4/4] ����GoӦ��...
go mod tidy
@REM if %errorlevel% neq 0 (
@REM     echo Goģ������ʧ�ܣ�
@REM     pause
@REM     exit /b 1
@REM )

SET CGO_ENABLED=0
SET GOARCH=amd64

SET GOOS=windows
echo ��ʼ����GoӦ��...
echo Windows����...
go build -ldflags="-s -w" -o ..\pinyin-master.exe .

echo linux����...
SET GOOS=linux
go build -ldflags="-s -w" -o ..\pinyin-master .

 
pause 