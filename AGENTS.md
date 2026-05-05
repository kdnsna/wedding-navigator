# Wedding Navigator - 婚礼导航项目规范

## 项目概述

婚礼全流程导航产品，专为主人 2026年11月14日婚礼打造的专属婚礼导航网页应用。集婚书请柬、路书导航、流程时间线、宾客管理于一体。

## 技术栈

- **前端框架**：原生 HTML + CSS + JavaScript（无构建工具）
- **样式方案**：Tailwind CSS (CDN)
- **地图服务**：高德地图 Web API
- **字体**：思源宋体 (Google Fonts)
- **项目类型**：纯静态多页面 Web 应用
- **项目类型 (coze)**：web（可预览、可部署为静态服务）

## 目录结构

```
wedding-navigator/
├── index.html          # 首页/导航入口
├── invitation.html     # 婚书/请柬页面
├── route.html          # 路书/导航页面
├── timeline.html       # 流程时间线页面
├── setting.json        # 配置文件（新人信息、场地、时间线等）
├── css/
│   └── style.css       # 全局样式
├── js/
│   ├── app.js          # 主应用逻辑
│   ├── config.js       # 配置加载模块
│   ├── map.js          # 地图功能模块
│   └── export.js       # 导出功能模块
├── scripts/            # Coze 预览/部署脚本
│   ├── coze-preview-build.sh
│   ├── coze-preview-run.sh
│   ├── coze-deploy-build.sh
│   └── coze-deploy-run.sh
├── .coze               # Coze 项目配置
├── AGENTS.md           # 项目规范（本文档）
└── README.md
```

## 关键入口 / 核心模块

### 入口页面
- `index.html` - 首页，显示倒计时和新人大名，提供三个功能入口

### 功能页面
- `invitation.html` - 婚书请柬，支持三种模板风格（传统红金、现代简约、极简高级）
- `route.html` - 婚礼路书，多点路线串联，一键导航
- `timeline.html` - 流程时间线，婚礼当天完整时间轴

### 配置系统
- `setting.json` - 统一配置，包含新人信息、婚礼日期、场地坐标、时间线等
- `js/config.js` - 配置加载和校验模块

### 功能模块
- `js/app.js` - 主应用逻辑，首页和通用功能
- `js/map.js` - 高德地图集成，路线规划和导航
- `js/export.js` - 请柬导出功能（图片/PDF）

## 运行与预览

### 本地预览
```bash
# 使用 Python 方式
python -m http.server 8080

# 使用 Node.js 方式
npx serve .

# 直接打开
open index.html
```

### Coze 预览
```bash
# 构建
bash scripts/coze-preview-build.sh

# 运行
bash scripts/coze-preview-run.sh
# 预览地址: http://localhost:5000
```

### 部署方式
- GitHub Pages（已有配置）
- 任意静态文件托管服务
- Coze 部署（静态服务，端口 5000）

## 用户偏好与长期约束

1. **配置优先**：所有可定制内容都在 `setting.json` 中管理
2. **模板风格**：支持三种请柬风格切换
3. **移动端优化**：使用 Tailwind 的响应式类，确保手机端体验
4. **日期格式**：统一使用 "2026年11月14日" 格式

## Coze 配置说明

### .coze 结构
- 工作区根目录与技术项目根目录重合（`/workspace/projects`）
- `path = "."`，根 `.coze` 同时承担子项目 `.coze` 的职责

### 预览链路
- **preview_enable**: enabled
- **dev.build**: `scripts/coze-preview-build.sh`（空操作）
- **dev.run**: `scripts/coze-preview-run.sh`（Python http.server，端口 5000）

### 部署链路
- **deploy.profile.kind**: service
- **deploy.profile.flavor**: web
- **deploy.build**: `scripts/coze-deploy-build.sh`（空操作）
- **deploy.run**: `scripts/coze-deploy-run.sh`（Python http.server，端口 5000）

## 常见问题和预防

1. **高德地图 Key**：生产环境需要申请真实的高德地图 Web API Key
2. **跨域问题**：本地开发时注意 CORS 配置（如需代理）
3. **静态资源路径**：确保 css/js 路径相对于 HTML 文件正确
4. **端口冲突**：预览和部署都使用 5000 端口，脚本内置幂等性处理
