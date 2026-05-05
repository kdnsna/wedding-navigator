/**
 * Wedding Navigator - 配置加载模块
 */

let config = null;

/**
 * 加载配置文件
 */
async function loadConfig() {
  try {
    const response = await fetch('./setting.json');
    if (!response.ok) {
      throw new Error('配置文件加载失败');
    }
    config = await response.json();
    return config;
  } catch (error) {
    console.error('配置加载错误:', error);
    // 使用默认配置
    config = getDefaultConfig();
    return config;
  }
}

/**
 * 获取配置
 */
function getConfig() {
  return config;
}

/**
 * 获取默认配置
 */
function getDefaultConfig() {
  return {
    bride: { name: '新娘', photo: '', phone: '' },
    groom: { name: '新郎', photo: '', phone: '' },
    wedding: {
      date: '2026年11月14日',
      dateShort: '2026-11-14',
      time: '12:00',
      weekday: '星期六'
    },
    venues: [
      { id: 'home', name: '新郎家', type: 'home', address: '北京市朝阳区', lng: 116.478912, lat: 39.916527, description: '接亲起点' },
      { id: 'hotel', name: '接亲酒店', type: 'hotel', address: '北京市朝阳区', lng: 116.459568, lat: 39.90923, description: '新娘所在酒店' },
      { id: 'venue', name: '婚礼大堂', type: 'venue', address: '北京市朝阳区', lng: 116.397428, lat: 39.904555, description: '婚宴举办地' }
    ],
    timeline: [],
    marriageWishes: [
      { title: '经典民国风', content: '两姓联姻，一堂缔约，良缘永结，匹配同称。看此日桃花灼灼，宜室宜家；卜他年瓜瓞绵绵，尔昌尔炽。谨以白头之约，书向鸿笺，好将红叶之盟，载明鸳谱。此证！' }
    ],
    settings: { amapKey: 'YOUR_AMAP_KEY', enableAnimation: true, enableMusic: false }
  };
}

/**
 * 保存配置到localStorage
 */
function saveConfigToLocal(data) {
  try {
    localStorage.setItem('weddingConfig', JSON.stringify(data));
  } catch (error) {
    console.error('保存配置失败:', error);
  }
}

/**
 * 从localStorage加载配置
 */
function loadConfigFromLocal() {
  try {
    const saved = localStorage.getItem('weddingConfig');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('读取本地配置失败:', error);
  }
  return null;
}

/**
 * 更新配置项
 */
function updateConfig(path, value) {
  if (!config) return;
  
  const keys = path.split('.');
  let current = config;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (current[keys[i]] === undefined) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
  saveConfigToLocal(config);
}

/**
 * 获取角色显示名称
 */
function getRoleDisplayName(role) {
  const roleNames = {
    'groom': '新郎',
    'bride': '新娘',
    'groomsmen': '伴郎',
    'bridesmaid': '伴娘',
    'parents': '父母',
    'driver': '司机',
    'all': '所有人'
  };
  return roleNames[role] || role;
}

/**
 * 获取角色图标
 */
function getRoleIcon(role) {
  const roleIcons = {
    'groom': '🤵',
    'bride': '👰',
    'groomsmen': '🎩',
    'bridesmaid': '💐',
    'parents': '👨‍👩‍👧',
    'driver': '🚗',
    'all': '👥'
  };
  return roleIcons[role] || '📌';
}

/**
 * 获取场地图标
 */
function getVenueIcon(type) {
  const venueIcons = {
    'home': '🏠',
    'hotel': '🏨',
    'venue': '⛪',
    'restaurant': '🍽️'
  };
  return venueIcons[type] || '📍';
}

// 导出模块
window.ConfigManager = {
  loadConfig,
  getConfig,
  updateConfig,
  saveConfigToLocal,
  loadConfigFromLocal,
  getRoleDisplayName,
  getRoleIcon,
  getVenueIcon
};
