# Headless Deployment (VPS)

在云服务器上通过 Redroid（Android-in-Docker）无 UI 运行 RikkaHub，Frida 注入绕过启动检查并自动启动 Ktor Web 服务器。

宿主仅需 Docker，无需安装 ADB / Python / Frida。

## 前置条件

- Linux x86_64，内核 ≥ 5.0，支持 `binder` / `ashmem`（大多数发行版默认装载，AWS/Azure 嵌套虚拟化需自编译内核，见 [redroid-doc](https://github.com/remote-android/redroid-doc)）
- Docker + Docker Compose v2

## APK 准备

推荐使用 **nightly universal release APK**（通用架构，开箱即用）：

```bash
cd deploy/headless/
curl -L -o apk/app-debug.apk \
  "https://github.com/rikkahub/rikkahub/releases/download/nightly/app-universal-release.apk"
```

> 该 APK 为 release 构建，包名为 `me.rerere.rikkahub`。使用前需在 `docker-compose.yml` 中将 `PACKAGE` 改为 `me.rerere.rikkahub`，并在 `frida/rikkahub-headless.js` 中将 `PACKAGE` 常量改为 `me.rerere.rikkahub`。

如需自行构建 debug APK（包名 `me.rerere.rikkahub.debug`，默认 hook 脚本无需修改）：

```bash
cd /path/to/rikkahub
./gradlew assembleDebug
cp app/build/outputs/apk/debug/app-debug.apk deploy/headless/apk/
```

## 使用

```bash
cd deploy/headless/
docker compose up -d
```

成功后 `manager` 容器会自动：
1. 等待 Redroid 就绪
2. 通过 ADB 推送并启动 frida-server
3. 安装 APK
4. Frida 注入 hook 脚本
5. 发送 intent 启动 Ktor Web 服务器
6. 每分钟健康检查，连续 3 次失败自动重启

访问 `http://<vps-ip>:8080/` 确认运行状态。可自行绑定反向代理/隧道。

## 持久化

`redroid` 容器内 `/data` 分区通过 Docker volume `rikkahub-data` 挂载，重启后 Room 数据库、DataStore 设置、上传文件均保留。

## 日志

```bash
# 查看 manager 容器日志（编排 + 健康检查）
docker compose logs -f manager

# 查看 Frida hook 输出
docker compose exec manager tail -f /logs/runner.log
```

## 详细文档

见 [deploy/headless/README.md](deploy/headless/README.md)。
