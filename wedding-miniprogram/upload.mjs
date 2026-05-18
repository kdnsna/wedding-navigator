import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ci from 'miniprogram-ci';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));

const appid = process.env.MINIPROGRAM_APPID || manifest['mp-weixin']?.appid;
const projectPath = process.env.MINIPROGRAM_PROJECT_PATH || path.join(__dirname, 'dist/build/mp-weixin');
const privateKeyPath = process.env.MINIPROGRAM_PRIVATE_KEY_PATH;
const version = process.env.MINIPROGRAM_VERSION || manifest.versionName || '1.0.0';
const desc = process.env.MINIPROGRAM_UPLOAD_DESC || `甜囍手册 ${version} 发布`;

function assertConfig(condition, message) {
  if (!condition) {
    console.error(`配置缺失：${message}`);
    process.exit(1);
  }
}

assertConfig(appid && !appid.startsWith('__UNI__'), '请配置 MINIPROGRAM_APPID 或 manifest.json mp-weixin.appid');
assertConfig(privateKeyPath, '请设置 MINIPROGRAM_PRIVATE_KEY_PATH 指向微信上传密钥');
assertConfig(fs.existsSync(projectPath), `构建目录不存在：${projectPath}，请先运行 npm run build:mp-weixin`);
assertConfig(fs.existsSync(privateKeyPath), `上传密钥不存在：${privateKeyPath}`);

const project = new ci.Project({
  appid,
  type: 'miniProgram',
  projectPath,
  privateKeyPath,
  ignores: ['node_modules/**/*'],
});

console.log(`开始上传 ${appid} v${version}...`);
try {
  const res = await ci.upload({
    project,
    version,
    desc,
    onProgressUpdate: (info) => {
      if (info.status === 'doing') console.log('  ->', info.message);
    },
  });
  console.log('上传成功', JSON.stringify(res, null, 2));
} catch (err) {
  console.error('上传失败:', err.message || err);
  process.exit(1);
}
