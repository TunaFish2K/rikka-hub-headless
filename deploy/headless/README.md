# RikkaHub Headless Deployment

在 Redroid（Android-in-Docker）容器中以无 UI 模式运行 RikkaHub，并通过 Frida 注入绕过 Firebase / 权限检查 / `webServerEnabled=false` 默认值等限制，使内置 Ktor Web 服务器对外提供 API 与前端页面。

**不修改原项目源码**，与上游解耦，APK 升级后直接替换即用。

> 实测：Android 13 (API 33) x86_64 / Ktor 3.4.3 / Frida 16.7.19，2025-07 验证通过。
> 关键路径：`am start RouteActivity` → Frida 装载 hook → `am start-foreground-service WebServerService#ACTION_START` → Koin lazy 实例化 `WebServerManager` → `webServerManager.start()` → Ktor 监听 `0.0.0.0:8080`

---

## 架构

```
┌─ Host (Linux, kernel 支持 binder/ashmem) ──────────────────────┐
│                                                              │
│  docker-compose.yml                                          │
│     │                                                        │
│     ▼                                                        │
│  ┌─────────────────────────────────────────┐                  │
│  │ redroid/redroid:13.0.0-latest  │  Android 13 (x86_64) │   │
│  │   • ADB on :5555                        │                  │
│  │   • Ktor Web on :8080 (端口透传到宿主)  │                  │
│  │   • /data 卷持久化 (Room DB + DataStore)│                  │
│  └─────────────────────────────────────────┘                  │
│         ▲                                                    │
│         │ frida -U -f me.rerere.rikkahub.debug -l <script>    │
│         │                                                    │
│  start.sh  ../frida/rikkahub-headless.js                    │
│                                                              │
│  health-check.sh (cron, 每分钟探活 → 自动重启)               │
└──────────────────────────────────────────────────────────────┘
                ▲
                │ 反向代理/隧道 (你自行处理，不在本计划内)
                │
              公网
```

### Frida Hook 工作原理

| Hook | 目标类/方法 | 作用 |
|---|---|---|
| H1-H3 | `com.google.firebase.remoteconfig.FirebaseRemoteConfig` | `fetchAndActivate / setConfigSettingsAsync / setDefaultsAsync` → no-op，返回 `Tasks.forResult(...)`；容器无 Play Services |
| H4 | `androidx.core.content.ContextCompat.checkSelfPermission` | 恒返回 `PERMISSION_GRANTED`，绕过 `POST_NOTIFICATIONS` / `ACCESS_LOCAL_NETWORK` 检查 |
| H5 | `Settings.webServerEnabled` final 字段 | 反射清 `FINAL` modifier 后置 `true`（辅助，主要靠下方 direct-call） |
| H6 | `androidx.core.app.ServiceCompat.startForeground` | no-op，容器无 NotificationManager UI |
| H7 | `android.app.Service.startForeground(int, Notification)` | no-op fallback |
| H8 | `me.rerere.rikkahub.RouteActivity.onCreate` | 立即 `finish()`，阻止 Compose 渲染崩溃 |
| H9 | `androidx.lifecycle.ProcessLifecycleOwner` | 透传（仅当 ChatService 注册 lifecycle observer 失败时需替换为 mock） |
| 直接调用 | `WebServerManager.start(port, name, false)` | Application.onCreate 完成后通过 Koin 取出 `WebServerManager` 直接启动，**完全绕过** `settings.webServerEnabled` 检查与 `startForegroundService()` 权限链 |

---

## 前置条件

### 宿主机
- Linux（建议 x86_64，内核 ≥ 5.0，需支持 `binder` / `ashmem` 模块）
  - 大多数发行版默认装载；AWS/Azure 嵌套虚拟化实例常需自编译内核。详见 [redroid-doc](https://github.com/remote-android/redroid-doc)
- Docker + Docker Compose v2
- `adb` (Android platform-tools)
- `frida-tools` (Python)：`pip install frida-tools`
- `curl`, `jq`（可选）

### 文件准备

推荐使用 **nightly universal release APK**（通用架构，开箱即用）：

```bash
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

- 下载匹配 host 架构的 `frida-server` 二进制（与 frida-tools 大版本一致），从 https://github.com/frida/frida/releases 取，例如：
  ```
  wget https://github.com/frida/frida/releases/download/16.7.19/frida-server-16.7.19-android-x86_64.xz \
    -O frida/frida-server.xz
  xz -d frida/frida-server.xz
  mv frida/frida-server frida/frida-server-x86_64
  chmod +x frida/frida-server-x86_64
  ```

---

## 使用

### 1. 起容器
```bash
cd deploy/headless
docker compose up -d
```

### 2. 首次跑 PoC 验证（可选但建议）
```bash
./poc.sh
./analyze-poc.sh
```

PoC 输出在 `logs/poc-YYYYMMDD-HHMMSS/`。把崩溃栈贴回 issue 列表，按需补 hook（`H10` 等扩展点见下方"待扩展"）。

### 3. 正式启动 Web Server
```bash
./start.sh
```

成功后会输出：
```
[start.sh] ✓ Web server up at http://localhost:8080/
```

之后通过浏览器访问 `http://<host>:8080/`，或自行绑反代/隧道。

### 4. 健康检查（开 cron）
```cron
* * * * * /path/to/deploy/headless/health-check.sh >> /path/to/logs/watch.log 2>&1
```

连续 3 次失败自动调 `start.sh` 重启。

---

## 配置

`start.sh` 顶部支持环境变量覆盖：

| 变量 | 默认值 | 说明 |
|---|---|---|
| `PACKAGE` | `me.rerere.rikkahub.debug` | APK 包名 |
| `PORT` | `8080` | Web 端口 |
| `APK` | `./apk/app-debug.apk` | APK 路径 |
| `FRIDA_SERVER` | `./frida/frida-server-x86_64` | frida-server 二进制 |
| `HOOK_SCRIPT` | `./frida/rikkahub-headless.js` | hook 脚本 |
| `ADB_HOST` | `localhost:5555` | Redroid ADB |
| `FRIDA_LOG` | `./logs/frida.log` | Frida 输出 |

切换到 release APK 时：
```bash
PACKAGE=me.rerere.rikkahub APK=./apk/app-release.apk ./start.sh
# 同时修改 frida/rikkahub-headless.js 顶层 PACKAGE 常量
```

---

## 持久化

`docker-compose.yml` 通过 `rikkahub-data` 卷挂载 Android 的 `/data` 分区，重启容器后：
- Room 数据库（`databases/rikka_hub`）
- DataStore 设置（`files/datastore/settings.preferences_pb`）
- 上传文件（`files/upload/`）

均保留。注意：升级 APK 时 `app-debug` 后缀的包名变化会令 Android 视作新包，建议保持同一构建类型。

---

## 待扩展（按需补充的 hook 点）

当 PoC / 实战出现以下问题时，在 `frida/rikkahub-headless.js` 末尾追加：

| 现象 | 增补 hook |
|---|---|
| Room `jieba_dict` 加载失败 | H10：hook `DataSourceModule` 内 `openHelperFactory` 的 callback `onOpen`，跳过 `SELECT jieba_dict(?)` 调用，全文搜索降级 LIKE |
| `ProcessLifecycleOwner.get()` 抛 NPE | H11：替换 H9 的透传为返回 `mock LifecycleOwner` |
| proot workspace 报 `EPERM ptrace` | 容器加 `--cap-add=SYS_PTRACE` 或 `--privileged` |
| `start.sh` 因 frida-server 反复被 kill 失败 | 改用 `frida-inject` 或在 Dockerfile 镜像嵌入 frida-server 至 `/system/bin/` |

---

## 维护

- **APK 升级**：替换 `apk/app-debug.apk` → `docker compose restart` → `./start.sh`
- **上游新增崩溃点**：跑 `./poc.sh` → 看 `attempt1-logcat.txt` → 在 hook 脚本里补对应 hook
- **本仓库源码不动**：hook 脚本独立维护，随上游版本演进可按需增删 hook

---

## 风险提示

- Redroid 在云服务器上对内核模块有要求，部分 VPS 无法直接跑；建议先在本地或带 KVM 的实例验证
- Frida 注入会增加约 ~50MB RAM 与 1-2s 启动延迟
- 不要暴露 8080 端口到公网而不开密码；APK 内置 Web 服务器支持 JWT/密码认证，请在 Web UI 设置页或通过 DataStore 直接配置开启

---

## 目录结构

```
deploy/headless/
├── README.md                      本文档
├── docker-compose.yml             Redroid 容器定义
├── .gitignore                     忽略 logs / apk / frida 二进制
├── start.sh                       主启动脚本（frida spawn + 健康检查）
├── poc.sh                         PoC 验证脚本（无 hook 验证当前 APK 行为）
├── analyze-poc.sh                 PoC 日志自动分析
├── health-check.sh                健康监控（cron 调用）
├── apk/                           放弃置放的 APK
│   └── .gitkeep
├── frida/
│   ├── rikkahub-headless.js        Frida hook 脚本（核心）
│   └── frida-server-x86_64         需自行下载放置
└── logs/                          运行日志（被 .gitignore）
```