# 💍 甜囍手册

> 主人 2026年11月14日婚礼的专属婚礼导航小程序

## 🎯 项目简介

「甜囍手册」是一款专为婚礼打造的全流程导航产品，集**婚书请柬**、**路书导航**、**流程时间线**于一体，让婚礼更加便捷、有序、温馨。

### ✨ 核心功能

- 📜 **婚书请柬**: 3种精美模板风格，支持高清图片/PDF导出
- 🗺️ **婚礼路书**: 多点路线串联，一键导航到各个场地
- ⏰ **流程时间线**: 婚礼当天完整时间轴，角色专属视图
- 📱 **移动端优先**: 专为手机使用场景优化

## 🎨 模板风格

| 风格 | 特点 |
|------|------|
| 🏮 中国传统红金风 | 经典喜庆、龙凤呈祥、大红金色系 |
| ✨ 现代简约风 | 简洁大方、现代时尚、黑白灰主调 |
| 🖤 极简高级风 | 极致简约、高端大气、留白艺术 |

## 🚀 快速开始

### 方式一：本地直接打开

```bash
# 克隆项目
git clone https://github.com/sanchui/wedding-navigator.git

# 进入项目目录
cd wedding-navigator

# 直接用浏览器打开 index.html
```

### 方式二：本地服务器

```bash
# 使用 Python 3
python -m http.server 8080

# 或使用 Node.js (npx)
npx serve .

# 然后访问 http://localhost:8080
```

### 方式三：部署到 GitHub Pages

项目已配置好 GitHub Pages 部署，推送到 `main` 分支后自动部署。

访问地址：`https://sanchui.github.io/wedding-navigator/`

## 📁 项目结构

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
│   ├── config.js        # 配置加载模块
│   ├── map.js          # 地图功能模块
│   └── export.js       # 导出功能模块
└── README.md
```

## ⚙️ 配置说明

所有配置都在 `setting.json` 文件中，修改后刷新页面即可生效。

### 新人信息

```json
{
  "bride": {
    "name": "新娘姓名"
  },
  "groom": {
    "name": "新郎姓名"
  }
}
```

### 婚礼日期

```json
{
  "wedding": {
    "date": "2026年11月14日",
    "dateShort": "2026-11-14",
    "time": "12:00",
    "weekday": "星期六"
  }
}
```

### 场地信息

```json
{
  "venues": [
    {
      "id": "home",
      "name": "新郎家",
      "type": "home",
      "address": "详细地址",
      "lng": 116.478912,
      "lat": 39.916527,
      "description": "描述"
    }
  ]
}
```

### 时间线配置

```json
{
  "timeline": [
    {
      "time": "08:00",
      "title": "环节标题",
      "description": "环节描述",
      "venue": "venue_id",
      "roles": ["groom", "bride"]
    }
  ]
}
```

### 婚书文案

```json
{
  "marriageWishes": [
    {
      "title": "文案标题",
      "content": "文案内容"
    }
  ]
}
```

## 🗺️ 高德地图配置

1. 前往 [高德开放平台](https://lbs.amap.com/) 注册账号
2. 创建应用，获取 Web JS API Key
3. 修改 `setting.json` 中的 `amapKey` 值：

```json
{
  "settings": {
    "amapKey": "你的高德地图Key"
  }
}
```

> ⚠️ 注意：使用占位 Key 时地图功能不可用，需要替换为真实 Key。

## 📦 技术栈

- **HTML5 + CSS3 + JavaScript** (原生，无框架依赖)
- **Tailwind CSS** (CDN 引入，样式快速开发)
- **高德地图 Web JS API** (地图展示与导航)
- **html2canvas + jsPDF** (图片/PDF 导出)

## 🎭 角色说明

| 角色 | 说明 |
|------|------|
| groom | 新郎 |
| bride | 新娘 |
| groomsmen | 伴郎 |
| bridesmaid | 伴娘 |
| parents | 父母 |
| driver | 司机 |
| all | 所有人 |

## 📱 使用说明

### 首页
- 查看倒计时和婚礼基本信息
- 快速进入各个功能模块

### 婚书请柬
1. 选择喜欢的模板风格
2. 编辑新郎新娘姓名
3. 选择或自定义婚书文案
4. 预览效果
5. 导出为 PNG 图片或 PDF 文件

### 婚礼路书
1. 查看多点串联的路线地图
2. 点击「导航」按钮一键唤起高德地图
3. 查看各场地详细信息和距离

### 流程时间线
1. 选择角色筛选，查看专属时间安排
2. 查看每个环节的时间、地点和参与人员
3. 做好时间规划

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT License

---

> 💕 祝天下有情人终成眷属！
