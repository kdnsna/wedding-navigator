import ci from 'miniprogram-ci';

const projectPath = '/Users/kdnsna/Documents/06-项目代码/wedding-navigator/wedding-miniprogram/dist/build/mp-weixin';
const privateKeyPath = '/Users/kdnsna/Desktop/private.wx2477cb578d01e89f.key';

const project = new ci.Project({
  appid: 'wx2477cb578d01e89f',
  type: 'miniProgram',
  projectPath,
  privateKeyPath,
  ignores: ['node_modules/**/*'],
});

console.log('开始上传...');
try {
  const res = await ci.upload({
    project,
    version: '1.0.7',
    desc: '大爷通过锤子自动上传',
    onProgressUpdate: (info) => {
      if (info.status === 'doing') console.log('  →', info.message);
    },
  });
  console.log('✅ 上传成功！', JSON.stringify(res, null, 2));
} catch (err) {
  console.error('❌ 上传失败:', err.message || err);
  process.exit(1);
}
