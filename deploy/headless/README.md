# RikkaHub Headless Docker

本目录用于在 x86_64 Linux VPS 上通过 Redroid 运行当前仓库源码构建的 RikkaHub，并提供 Web UI。

## 一键启动

VPS 只需要 Docker、Docker Compose v2，以及开发机预先生成的 APK 成品。VPS 不再安装 Android SDK、Gradle、Node、pnpm、NDK 或 CMake。

先在开发机生成 APK（需要 JDK 17、Android SDK 和 pnpm）：

```bash
./deploy/headless/build-apk.sh
```

脚本首次运行会在 `~/.local/share/rikkahub-headless/headless-debug.jks` 创建长期签名密钥，后续升级必须保留并复用该文件。可通过 `RIKKAHUB_KEYSTORE_DIR` 或 `RIKKAHUB_KEYSTORE_FILE` 改变位置，密码和别名可通过对应的 `RIKKAHUB_KEYSTORE_*` 环境变量设置。

首次切换到固定密钥时，如果数据卷中仍安装着旧的临时 Debug 签名 APK，需要先备份应用数据并完成一次签名迁移；固定密钥投入使用后，后续 APK 可以直接覆盖升级。

产物位于：

```text
deploy/headless/apk/rikkahub.apk
deploy/headless/apk/rikkahub-version
deploy/headless/apk/rikkahub.apk.sha256
```

然后在 VPS 启动：

```bash
cd deploy/headless
test -f apk/rikkahub.apk
docker compose up -d --build
```

Docker 只构建包含预制 APK、ADB、Frida 与启动器的轻量 manager 运行镜像。APK 缺失或 SHA-256 校验失败时构建会立即终止。

如果不希望把整个源码仓库上传 VPS，可在开发机生成最小部署包：

```bash
./deploy/headless/package-deployment.sh
```

上传生成的 `rikkahub-headless-<version>.tar.gz`，在 VPS 解压后从仓库根目录运行 Compose 即可。

启动完成后访问：

```text
http://VPS_IP:8080
```

外部端口可通过环境变量修改：

```bash
RIKKAHUB_PORT=18080 docker compose up -d --build
```

应用内 Ktor 端口固定为 8080；修改外部端口不需要修改应用设置。

## 运行结构

- `redroid`：Android 13 x86_64，持久化 `/data`，Web 端口发布到宿主机。
- `manager`：内置当前源码构建的 APK、Frida Server、Hook 和健康检查循环。
- `rikkahub-data`：保存 Room、DataStore、上传文件、Skills 和 Workspace 数据。

manager 会等待 Android 启动、安装或升级 APK、启动 Frida Hook、拉起 Web Server，并在连续探活失败后自动重启应用链路。

## 常用命令

```bash
docker compose ps
docker compose logs -f manager
docker compose logs -f redroid
docker compose restart manager
docker compose down
```

源码或 Web UI 更新后，先在开发机重建 APK，再更新 VPS 上的三个 APK 产物并重建 manager：

```bash
./deploy/headless/build-apk.sh
docker compose up -d --build manager
```

彻底删除应用数据：

```bash
docker compose down -v
```

## Web 设置覆盖

Web 已覆盖 Provider、模型、提示词、助手、MCP、搜索、语音、注入、Web 认证和常用偏好设置，并新增：

- WebDAV/S3 备份配置
- Workspace 创建、Rootfs 安装与删除
- Assistant 的 Workspace 和 Skill 绑定

主题、通知、触觉、音量键、裁剪和 Donate/About 等 Android UI 专属选项不在 Headless Web 中呈现。

## 注意事项

- VPS 内核必须满足 Redroid 的 Binder 等要求；不是所有虚拟化 VPS 都兼容。
- `redroid` 使用 privileged 模式，Workspace/PRoot 也依赖相关内核能力。
- Debug 包名固定为 `me.rerere.rikkahub.debug`。签名密钥丢失或改变后 Android 无法直接覆盖升级，因此应备份外部 keystore。
- 不建议直接把 8080 暴露到公网。首次启动后应在 Web Server 设置中配置密码并启用 JWT，然后重启 manager，外层再配置 HTTPS 反向代理。
