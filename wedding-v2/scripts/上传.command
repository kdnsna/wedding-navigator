#!/bin/bash
# 甜囍手册 · 上传：把代码推到微信平台，之后到 mp.weixin.qq.com「版本管理」设为体验版
CLI="/Applications/wechatwebdevtools.app/Contents/MacOS/cli"
DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "甜囍手册 · 上传新版本"
echo "------------------------"
read -r -p "版本号（如 2.1.0，直接回车用 2.1.0）: " VER
VER=${VER:-2.1.0}
read -r -p "更新说明（直接回车用默认）: " DESC
DESC=${DESC:-"甜囍手册更新"}

echo ""
echo "正在上传 v$VER …"
"$CLI" upload --project "$DIR" -v "$VER" -d "$DESC" && echo ""
echo "上传完成。下一步：打开 mp.weixin.qq.com → 管理 → 版本管理 → 选为体验版"
echo ""
read -n 1 -s -r -p "按任意键关闭窗口"
