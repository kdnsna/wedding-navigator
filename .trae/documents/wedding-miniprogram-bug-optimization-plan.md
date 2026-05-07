# 婚礼小程序 Bug 修复与优化计划

## 项目概况

"甜囍手册"——基于 uni-app (Vue3 + Vite) + 微信云开发的婚礼管理微信小程序，包含宾客端（7页）和主人端（10+页），使用 Pinia 状态管理，11个云函数。

---

## 一、严重 Bug（安全/正确性）

### BUG-1: createWedding ID 碰撞风险
- **文件**: `cloudfunctions/createWedding/index.js:61-68`
- **问题**: `generateUniqueId()` 仅生成8位随机字符串，碰撞概率较高（62^8 ≈ 218万亿种可能，但生日悖论下碰撞概率在约4.7亿次后达50%，对于小型应用虽可接受但缺乏唯一性保证）
- **修复**: 增加唯一性检查（查询数据库确认ID不存在），或使用更长的ID + 时间戳组合

### BUG-2: getWeather 硬编码 API Key
- **文件**: `cloudfunctions/getWeather/index.js:70`
- **问题**: 和风天气 API Key `ea363fcdd56742fa84a17c4b11b37bdc` 直接硬编码在源码中，属于安全漏洞
- **修复**: 移除硬编码 Key，仅使用 `process.env.HEFENG_KEY`，未配置时返回 mock 数据

### BUG-3: updateWedding 字段注入风险
- **文件**: `cloudfunctions/updateWedding/index.js:33-38`
- **问题**: `data` 参数直接展开写入数据库，恶意用户可通过构造 data 覆盖 `owner_openid`、`created_at` 等受保护字段
- **修复**: 在云函数中增加字段白名单过滤，明确禁止修改 `owner_openid`、`created_at`、`_id` 等系统字段

### BUG-4: submitRSVP 竞态条件
- **文件**: `cloudfunctions/submitRSVP/index.js:25-47`
- **问题**: 读取整个 guests 数组 → 内存修改 → 写回，并发提交时可能导致数据丢失（后写覆盖先写）
- **修复**: 使用云数据库事务（`db.runTransaction`）或改用 `_.push` + 条件更新代替全量写回

### BUG-5: recordView 竞态条件
- **文件**: `cloudfunctions/recordView/index.js:29-47`
- **问题**: 独立访客去重检查非原子操作，并发请求可能重复写入
- **修复**: 使用 `db.runTransaction` 包裹查询+写入，或对 viewers 集合添加唯一索引（wedding_id + openid）

### BUG-6: useOwnerGuard 形同虚设
- **文件**: `composables/useOwnerGuard.js:1-10`
- **问题**: 函数直接返回 `true`，不做任何权限校验。虽然云函数层面有 openid 鉴权，但前端无任何拦截，用户可直接访问主人端页面
- **修复**: 实现真实的前端权限守卫，检查 `userStore.isOwner && userStore.ownerVerified`，未授权时跳转

### BUG-7: getWedding 数据泄露
- **文件**: `cloudfunctions/getWedding/index.js:54-66`
- **问题**: 对非主人虽然隐藏了宾客手机号，但仍返回完整的 `wedding` 文档（含 `owner_openid`），存在信息泄露
- **修复**: 对非主人过滤掉 `owner_openid` 等敏感字段

### BUG-8: blessing/manage.vue 修改 computed 属性
- **文件**: `pages-owner/blessing/manage.vue:74-81`
- **问题**: `togglePin` 直接修改 computed 排序后的数组元素属性，这是 Vue 的反模式，可能导致响应式更新异常
- **修复**: 应修改 store 中的原始数据（`store.blessings.blessings`），而非 computed 返回的排序副本

---

## 二、中等优先级 Bug

### BUG-9: createWedding 无回滚机制
- **文件**: `cloudfunctions/createWedding/index.js:19-52`
- **问题**: 若 `Promise.all` 创建关联集合失败，wedding 主文档已创建但关联集合不完整，导致数据不一致
- **修复**: 使用 `db.runTransaction` 包裹所有创建操作，失败时回滚；或在 catch 中尝试清理已创建的文档

### BUG-10: 音乐播放器异常处理不完善
- **文件**: `pages/index/index.vue:201-234`
- **问题**: `initMusic` 失败后 `audioCtx` 可能处于异常状态，`toggleMusic` 中访问 `audioCtx.paused` 可能崩溃
- **修复**: 在 `initMusic` 的 onError 回调中将 `audioCtx` 置为 null；`toggleMusic` 中增加空值检查

### BUG-11: openNavigation 仅使用第一个场地
- **文件**: `pages/index/index.vue:270-282`
- **问题**: 导航始终使用 `venues[0]`，而非婚礼主场地。若用户添加了多个场地，第一个可能不是仪式场地
- **修复**: 优先查找 type 为 'venue' 或 'home' 的场地，而非直接取第一个

### BUG-12: timeline 时区问题
- **文件**: `pages/timeline/index.vue:125-137`
- **问题**: `getEventStatus` 使用 `toDateString()` 比较日期，在不同时区下可能判断错误
- **修复**: 使用日期字符串直接比较（`YYYY-MM-DD` 格式），避免 `new Date()` 的时区偏移

### BUG-13: RSVP 出席人数无上限
- **文件**: `pages/rsvp/index.vue:72`
- **问题**: 步进器的 `+` 按钮无上限约束，用户可输入极大值
- **修复**: 添加 `Math.min(form.guestCount + 1, 20)` 上限限制

### BUG-14: guide/edit.vue saveToStorage 未校验 weddingId
- **文件**: `pages-owner/guide/edit.vue:382-396`
- **问题**: 若 `userStore.weddingId` 为空，云端更新会失败但无明确提示
- **修复**: 在保存前检查 `weddingId` 是否存在，为空时提示用户

### BUG-15: 祝福发送者名称硬编码
- **文件**: `pages/blessing/index.vue:95`
- **问题**: 祝福发送者名称固定为 `'宾客'`，无法区分不同宾客
- **修复**: 允许用户输入自己的名称，或从 RSVP 记录中获取

### BUG-16: user.js loadFromStorage JSON 解析无容错
- **文件**: `stores/user.js:40-44`
- **问题**: 若本地存储数据损坏，`JSON.parse` 会抛出异常导致应用崩溃
- **修复**: 用 try-catch 包裹 `JSON.parse`，解析失败时清除损坏数据

### BUG-17: submitBlessing 无重复提交防护
- **文件**: `cloudfunctions/submitBlessing/index.js:25-38` + `pages/blessing/index.vue:87-114`
- **问题**: 快速点击可重复提交相同祝福内容
- **修复**: 前端添加提交中状态锁定（已有 `uni.showLoading` 但缺少防重复点击逻辑），云函数增加基于 openid + content 的去重

### BUG-18: generatePoster scene 参数未校验
- **文件**: `cloudfunctions/generatePoster/index.js:5-17`
- **问题**: `scene` 参数直接传入微信 API，未做长度和字符校验（微信限制 scene 最长32字符且仅允许特定字符）
- **修复**: 添加 scene 参数校验，超长时截断或拒绝

---

## 三、优化建议

### OPT-1: fetchWedding 调用过于频繁
- **问题**: album、blessing、timeline、guide 等页面的 `onShow` 都会在数据为空时调用 `fetchWedding`，导致重复网络请求
- **优化**: 在 store 中添加数据加载状态标记和时间戳，实现 TTL 缓存（如5分钟内不重复请求），或使用 stale-while-revalidate 策略

### OPT-2: 倒计时定时器频率过高
- **文件**: `pages/index/index.vue:352`
- **问题**: 每秒执行 `updateCountdown`，对于天级倒计时来说频率过高
- **优化**: 根据倒计时剩余时间动态调整频率（>1天时每分钟更新，<1天时每秒更新）

### OPT-3: getWedding 一次拉取全部数据
- **文件**: `cloudfunctions/getWedding/index.js:14-33`
- **问题**: 即使只需要相册数据，也会查询所有8个集合
- **优化**: 支持 `fields` 参数，按需查询指定集合

### OPT-4: formatTime 函数重复实现
- **问题**: `formatTime` 在 `blessing/index.vue` 和 `blessing/manage.vue` 中各实现了一遍
- **优化**: 提取到 `utils/index.js` 统一导出

### OPT-5: 祝福列表无分页
- **问题**: 祝福数据全部加载到内存，数据量大时性能下降
- **优化**: 云函数支持分页参数（skip/limit），前端实现滚动加载

### OPT-6: 天气数据无缓存
- **文件**: `cloudfunctions/getWeather/index.js`
- **问题**: 每次请求都调用外部 API，无缓存机制
- **优化**: 在云数据库中缓存天气数据（如1小时有效期），减少 API 调用

### OPT-7: saveToStorage 无防抖
- **文件**: `pages-owner/guide/edit.vue:382-396`
- **问题**: 每次保存操作都立即调用云函数，频繁编辑时产生大量请求
- **优化**: 对 `saveToStorage` 添加 debounce（已有工具函数），延迟1-2秒后批量保存

### OPT-8: Pinia store 数据不持久化
- **问题**: wedding store 数据不持久化，页面刷新后需重新从云端获取
- **优化**: 使用 `pinia-plugin-persistedstate` 或手动实现关键数据的本地缓存

### OPT-9: 天气图标映射不完整
- **文件**: `cloudfunctions/getWeather/index.js:85-98`
- **问题**: 仅映射了10种天气代码，和风天气有上百种天气代码
- **优化**: 补充常见天气代码映射（雪、霾、沙尘等），未匹配的默认使用通用图标

### OPT-10: 云函数缺少数据库索引建议
- **问题**: `viewers` 集合按 `wedding_id + openid` 查询，但可能未建复合索引
- **优化**: 在文档中说明建议的数据库索引配置

---

## 四、实施优先级排序

| 优先级 | 编号 | 说明 |
|--------|------|------|
| P0 | BUG-2 | API Key 泄露，需立即修复 |
| P0 | BUG-3 | 字段注入风险，可被恶意利用 |
| P0 | BUG-7 | 数据泄露 owner_openid |
| P1 | BUG-4 | RSVP 并发数据丢失 |
| P1 | BUG-5 | 访客统计并发问题 |
| P1 | BUG-6 | 前端权限守卫缺失 |
| P1 | BUG-8 | computed 属性修改导致响应式异常 |
| P1 | BUG-1 | ID 碰撞风险 |
| P2 | BUG-9~BUG-18 | 中等优先级 Bug |
| P3 | OPT-1~OPT-10 | 性能与体验优化 |

---

## 五、验证步骤

1. 修复后逐一测试每个云函数的输入校验和权限检查
2. 模拟并发请求测试 RSVP 和 recordView 的数据一致性
3. 验证非主人用户无法获取敏感字段
4. 检查前端主人端页面的权限拦截是否生效
5. 测试音乐播放器的异常场景
6. 验证祝福提交的防重复机制
