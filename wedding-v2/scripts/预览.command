#!/bin/bash
# 甜囍手册 · 真机预览：编译并生成预览二维码，微信扫码即可在手机上体验
CLI="/Applications/wechatwebdevtools.app/Contents/MacOS/cli"
DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "正在编译预览…"
"$CLI" preview --project "$DIR" -f image --qr-output "$DIR/../preview-qr.jpg"
if [ -f "$DIR/../preview-qr.jpg" ]; then
  echo ""
  echo "二维码已生成：preview-qr.jpg（用微信扫一扫即可预览）"
  open "$DIR/../preview-qr.jpg"
fi
echo ""
read -n 1 -s -r -p "按任意键关闭窗口"
