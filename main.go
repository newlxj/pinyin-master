package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os/exec"
	"runtime"
	"time"
)

// 1. 将 dist 目录下的所有文件嵌入到二进制文件中
//
//go:embed dist/*
var content embed.FS

func main() {
	// 2. 获取嵌入文件系统中的 dist 子目录
	// 如果你的构建目录是 build，请将这里的 "dist" 改为 "build"
	distFS, err := fs.Sub(content, "dist")
	if err != nil {
		log.Fatal("无法读取静态文件目录:", err)
	}

	// 3. 设置文件服务器
	http.Handle("/", http.FileServer(http.FS(distFS)))
	port := 8877
	// 4. 寻找一个空闲端口，或者指定端口（这里使用随机空闲端口，避免冲突）
	listener, err := net.Listen("tcp", fmt.Sprintf(":%d", port))
	if err != nil {
		log.Fatal("无法启动监听:", err)
	}

	// port := listener.Addr().(*net.TCPAddr).Port
	url := fmt.Sprintf("http://localhost:%d", port)

	fmt.Printf("服务已启动: %s\n", url)
	fmt.Println("请勿关闭此窗口...")

	// 5. 启动 goroutine 自动打开浏览器
	go func() {
		// 稍微延迟一下确保服务就绪
		time.Sleep(500 * time.Millisecond)
		openBrowser(url)
	}()

	// 6. 启动 HTTP 服务
	if err := http.Serve(listener, nil); err != nil {
		log.Fatal(err)
	}
}

// 打开浏览器的跨平台实现
func openBrowser(url string) {
	var err error

	switch runtime.GOOS {
	case "linux":
		err = exec.Command("xdg-open", url).Start()
	case "windows":
		// Windows 下使用 cmd /c start
		err = exec.Command("cmd", "/c", "start", url).Start()
	case "darwin":
		err = exec.Command("open", url).Start()
	default:
		err = fmt.Errorf("unsupported platform")
	}

	if err != nil {
		log.Printf("无法自动打开浏览器: %v\n请手动访问: %s", err, url)
	}
}
