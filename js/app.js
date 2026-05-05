/**
 * Wedding Navigator - 主应用模块
 */

// 全局状态
const AppState = {
  currentPage: 'home',
  selectedTemplate: 'traditional',
  selectedWish: 0,
  currentRoleFilter: 'all',
  config: null
};

/**
 * 初始化应用
 */
async function initApp() {
  try {
    // 加载配置
    const config = await ConfigManager.loadConfig();
    AppState.config = config;
    
    // 加载本地配置（如果有）
    const localConfig = ConfigManager.loadConfigFromLocal();
    if (localConfig) {
      AppState.config = { ...config, ...localConfig };
    }
    
    // 根据页面初始化
    const page = getCurrentPage();
    
    switch(page) {
      case 'invitation':
        initInvitationPage();
        break;
      case 'route':
        initRoutePage();
        break;
      case 'timeline':
        initTimelinePage();
        break;
      case 'guests':
        if (typeof initGuestsPage === 'function') {
          initGuestsPage();
        }
        break;
      case 'home':
      default:
        initHomePage();
    }
    
    // 初始化底部导航
    initBottomNav();
    
  } catch (error) {
    console.error('应用初始化失败:', error);
  }
}

/**
 * 获取当前页面类型
 */
function getCurrentPage() {
  const path = window.location.pathname;
  if (path.includes('invitation')) return 'invitation';
  if (path.includes('route')) return 'route';
  if (path.includes('timeline')) return 'timeline';
  if (path.includes('guests')) return 'guests';
  return 'home';
}

/**
 * 初始化首页
 */
function initHomePage() {
  const config = AppState.config;
  if (!config) return;

  // 更新新人名字
  const namesEl = document.getElementById('coupleNames');
  if (namesEl) {
    namesEl.textContent = `${config.groom.name} & ${config.bride.name}`;
  }

  // 更新婚礼日期
  const dateEl = document.getElementById('weddingDate');
  if (dateEl) {
    dateEl.textContent = `${config.wedding.weekday} · ${config.wedding.date}`;
  }

  // 更新婚礼信息卡片
  const dateInfoEl = document.getElementById('weddingDateInfo');
  if (dateInfoEl) {
    dateInfoEl.textContent = `${config.wedding.date} ${config.wedding.weekday}`;
  }

  const timeInfoEl = document.querySelector('#weddingDateInfo')?.parentElement?.nextElementSibling?.querySelector('span');
  if (timeInfoEl) {
    timeInfoEl.textContent = config.wedding.time;
  }

  const venueInfoEl = document.getElementById('venueInfo');
  if (venueInfoEl) {
    const venue = config.venues.find(v => v.type === 'venue');
    venueInfoEl.textContent = venue ? `${venue.name} · ${venue.address}` : '';
  }

  // 计算倒计时
  updateCountdown(config.wedding.dateShort);
}

/**
 * 更新倒计时
 */
function updateCountdown(dateStr) {
  const countdownEl = document.getElementById('countdown');
  if (!countdownEl) return;
  
  const weddingDate = new Date(dateStr);
  const now = new Date();
  
  const diff = weddingDate - now;
  
  if (diff <= 0) {
    countdownEl.innerHTML = '今天是你的婚礼！';
    return;
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  countdownEl.innerHTML = `
    <span class="countdown-days">${days}</span>天
    <span class="countdown-hours">${hours}</span>时
    <span class="countdown-minutes">${minutes}</span>分
  `;
}

/**
 * 初始化底部导航
 */
function initBottomNav() {
  const navItems = document.querySelectorAll('.nav-item');
  const currentPage = getCurrentPage();
  
  navItems.forEach(item => {
    const href = item.getAttribute('href');
    if (href) {
      const isActive = (
        (currentPage === 'home' && href === 'index.html') ||
        (currentPage === 'invitation' && href === 'invitation.html') ||
        (currentPage === 'route' && href === 'route.html') ||
        (currentPage === 'timeline' && href === 'timeline.html')
      );
      
      if (isActive) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    }
  });
}

/**
 * 初始化婚书页面
 */
function initInvitationPage() {
  const config = AppState.config;
  if (!config) return;
  
  // 渲染预览
  renderInvitationPreview();
  
  // 绑定事件
  bindInvitationEvents();
}

/**
 * 渲染婚书预览
 */
function renderInvitationPreview() {
  const preview = document.getElementById('invitationPreview');
  if (!preview) return;
  
  const config = AppState.config;
  const template = AppState.selectedTemplate;
  const wish = config.marriageWishes[AppState.selectedWish];
  
  const templates = {
    traditional: `
      <div class="invitation-traditional animate-fadeIn">
        <div class="invitation-content">
          <div class="invitation-title">婚书</div>
          <div class="bride-name">${config.bride.name}</div>
          <div class="and-symbol">囍</div>
          <div class="groom-name">${config.groom.name}</div>
          <div class="marriage-wish">${wish.content}</div>
          <div class="wedding-date">${config.wedding.date} ${config.wedding.time}</div>
          <div class="wedding-venue">${config.venues.find(v => v.type === 'venue')?.address || ''}</div>
        </div>
      </div>
    `,
    modern: `
      <div class="invitation-modern animate-fadeIn">
        <div class="invitation-content">
          <div class="invitation-title">Wedding Invitation</div>
          <div class="bride-name">${config.bride.name}</div>
          <span class="and-symbol">&</span>
          <div class="groom-name">${config.groom.name}</div>
          <div class="marriage-wish">${wish.content}</div>
          <div class="wedding-date">${config.wedding.weekday} · ${config.wedding.date}</div>
          <div class="wedding-venue">${config.venues.find(v => v.type === 'venue')?.name || ''}</div>
        </div>
      </div>
    `,
    minimal: `
      <div class="invitation-minimal animate-fadeIn">
        <div class="invitation-content">
          <div class="invitation-title">Wedding</div>
          <div class="bride-name">${config.bride.name}</div>
          <div class="and-symbol">&</div>
          <div class="groom-name">${config.groom.name}</div>
          <div class="marriage-wish">${wish.content}</div>
          <div class="wedding-date">${config.wedding.date} · ${config.wedding.time}</div>
          <div class="wedding-venue">${config.venues.find(v => v.type === 'venue')?.address || ''}</div>
        </div>
      </div>
    `
  };
  
  preview.innerHTML = templates[template] || templates.traditional;
}

/**
 * 绑定婚书页面事件
 */
function bindInvitationEvents() {
  // 模板选择
  document.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      AppState.selectedTemplate = card.dataset.template;
      renderInvitationPreview();
    });
  });
  
  // 婚书文案选择
  document.querySelectorAll('.wish-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.wish-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      AppState.selectedWish = parseInt(item.dataset.index);
      renderInvitationPreview();
    });
  });
  
  // 导出按钮
  const exportPngBtn = document.getElementById('exportPng');
  const exportPdfBtn = document.getElementById('exportPdf');
  
  if (exportPngBtn) {
    exportPngBtn.addEventListener('click', () => {
      ExportManager.exportToPNG('invitationPreview', '婚礼请柬.png');
    });
  }
  
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', () => {
      ExportManager.exportToPDF('invitationPreview', '婚礼请柬.pdf');
    });
  }
  
  // 编辑表单
  bindEditorEvents();
}

/**
 * 绑定编辑器事件
 */
function bindEditorEvents() {
  const config = AppState.config;

  const groomInput = document.getElementById('groomName');
  const brideInput = document.getElementById('brideName');
  const dateInput = document.getElementById('weddingDateInput');
  const timeInput = document.getElementById('weddingTimeInput');
  const venueInput = document.getElementById('weddingVenueInput');
  const addressInput = document.getElementById('weddingAddressInput');

  if (groomInput) {
    groomInput.value = config.groom.name;
    groomInput.addEventListener('change', (e) => {
      ConfigManager.updateConfig('groom.name', e.target.value);
      config.groom.name = e.target.value;
      renderInvitationPreview();
    });
  }

  if (brideInput) {
    brideInput.value = config.bride.name;
    brideInput.addEventListener('change', (e) => {
      ConfigManager.updateConfig('bride.name', e.target.value);
      config.bride.name = e.target.value;
      renderInvitationPreview();
    });
  }

  if (dateInput) {
    dateInput.value = config.wedding.dateShort;
    dateInput.addEventListener('change', (e) => {
      const date = new Date(e.target.value);
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
      ConfigManager.updateConfig('wedding.dateShort', e.target.value);
      ConfigManager.updateConfig('wedding.date', dateStr);
      ConfigManager.updateConfig('wedding.weekday', weekdays[date.getDay()]);
      config.wedding.dateShort = e.target.value;
      config.wedding.date = dateStr;
      config.wedding.weekday = weekdays[date.getDay()];
      renderInvitationPreview();
    });
  }

  if (timeInput) {
    timeInput.value = config.wedding.time;
    timeInput.addEventListener('change', (e) => {
      ConfigManager.updateConfig('wedding.time', e.target.value);
      config.wedding.time = e.target.value;
      renderInvitationPreview();
    });
  }

  if (venueInput) {
    const venue = config.venues.find(v => v.type === 'venue');
    venueInput.value = venue ? venue.name : '';
    venueInput.addEventListener('change', (e) => {
      const venueIdx = config.venues.findIndex(v => v.type === 'venue');
      if (venueIdx !== -1) {
        config.venues[venueIdx].name = e.target.value;
        ConfigManager.updateConfig('venues', config.venues);
        renderInvitationPreview();
      }
    });
  }

  if (addressInput) {
    const venue = config.venues.find(v => v.type === 'venue');
    addressInput.value = venue ? venue.address : '';
    addressInput.addEventListener('change', (e) => {
      const venueIdx = config.venues.findIndex(v => v.type === 'venue');
      if (venueIdx !== -1) {
        config.venues[venueIdx].address = e.target.value;
        ConfigManager.updateConfig('venues', config.venues);
        renderInvitationPreview();
      }
    });
  }
}

/**
 * 初始化路书页面
 */
async function initRoutePage() {
  const config = AppState.config;
  if (!config) return;
  
  // 初始化地图
  const mapInstance = await MapManager.initMap('routeMap', config);
  
  if (mapInstance) {
    // 添加标记点
    MapManager.addMarkers(config.venues);
    
    // 规划路线
    MapManager.planDrivingRoute(config.venues);
  }
  
  // 渲染路线列表
  renderRouteList();
}

/**
 * 渲染路线列表
 */
function renderRouteList() {
  const container = document.getElementById('routeList');
  if (!container) return;
  
  const config = AppState.config;
  
  container.innerHTML = config.venues.map((venue, index) => {
    const nextVenue = index < config.venues.length - 1 ? config.venues[index + 1] : null;
    const distance = nextVenue ? MapManager.getDistance(venue, nextVenue) : 0;
    const driveTime = nextVenue ? MapManager.estimateDrivingTime(distance) : 0;
    const arrivalInfo = venue.arrivalTime ? `🕐 预计 ${venue.arrivalTime} 到达` : '';
    const nextInfo = nextVenue ? `🚗 距下一站约 ${distance} 公里（约 ${driveTime} 分钟）` : '';

    return `
    <div class="route-item animate-slideUp" style="animation-delay: ${index * 0.1}s">
      <div class="route-marker ${venue.type}">
        ${ConfigManager.getVenueIcon(venue.type)}
      </div>
      <div class="route-info">
        <div class="route-name">${venue.name}</div>
        <div class="route-address">${venue.address}</div>
        ${venue.description ? `<div class="route-time">📌 ${venue.description}</div>` : ''}
        ${arrivalInfo ? `<div class="route-time" style="color: var(--color-primary); font-weight: 600;">${arrivalInfo}</div>` : ''}
        ${nextInfo ? `<div class="route-time" style="margin-top: 0.25rem;">${nextInfo}</div>` : ''}
      </div>
      <div class="route-action">
        <button class="nav-btn" onclick="MapManager.startNavigation(${JSON.stringify(venue).replace(/"/g, '&quot;')})">
          导航
        </button>
      </div>
    </div>
  `}).join('');
}

/**
 * 初始化时间线页面
 */
function initTimelinePage() {
  const config = AppState.config;
  if (!config) return;
  
  // 渲染角色筛选
  renderRoleFilter();
  
  // 渲染时间线
  renderTimeline();
}

/**
 * 渲染角色筛选
 */
function renderRoleFilter() {
  const container = document.getElementById('roleFilter');
  if (!container) return;
  
  const roles = [
    { value: 'all', label: '全部' },
    { value: 'groom', label: '新郎' },
    { value: 'bride', label: '新娘' },
    { value: 'groomsmen', label: '伴郎' },
    { value: 'bridesmaid', label: '伴娘' },
    { value: 'parents', label: '父母' }
  ];
  
  container.innerHTML = roles.map(role => `
    <button class="role-filter-btn ${role.value === AppState.currentRoleFilter ? 'active' : ''}" 
            data-role="${role.value}">
      ${role.label}
    </button>
  `).join('');
  
  // 绑定点击事件
  container.querySelectorAll('.role-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.role-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.currentRoleFilter = btn.dataset.role;
      renderTimeline();
    });
  });
}

/**
 * 渲染时间线
 */
function renderTimeline() {
  const container = document.getElementById('timelineContainer');
  if (!container) return;
  
  const config = AppState.config;
  const filter = AppState.currentRoleFilter;
  
  // 过滤时间线
  const filteredTimeline = config.timeline.filter(item => {
    if (filter === 'all') return true;
    return item.roles.includes(filter);
  });
  
  if (filteredTimeline.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #999;">
        暂无相关时间安排
      </div>
    `;
    return;
  }
  
  // 获取当前时间用于高亮判断（仅婚礼当天有效）
  const now = new Date();
  const weddingDate = new Date(config.wedding.dateShort);
  const isWeddingDay = now.toDateString() === weddingDate.toDateString();
  const currentMinutes = isWeddingDay ? now.getHours() * 60 + now.getMinutes() : -1;

  container.innerHTML = filteredTimeline.map((item, index) => {
    const venue = config.venues.find(v => v.id === item.venue);
    const [itemHour, itemMin] = item.time.split(':').map(Number);
    const itemMinutes = itemHour * 60 + itemMin;

    // 判断节点状态：已完成 / 进行中 / 未开始
    let nodeStatus = '';
    let statusLabel = '';
    if (isWeddingDay) {
      if (currentMinutes >= itemMinutes + 30) {
        nodeStatus = 'completed';
        statusLabel = '✅ 已完成';
      } else if (currentMinutes >= itemMinutes) {
        nodeStatus = 'active';
        statusLabel = '🔴 进行中';
      } else if (currentMinutes >= itemMinutes - 30) {
        nodeStatus = 'upcoming';
        statusLabel = '⏳ 即将开始';
      }
    }

    // 计算距离下一个节点还有多久
    let countdownText = '';
    if (isWeddingDay && nodeStatus === 'upcoming' && currentMinutes > 0) {
      const diffMinutes = itemMinutes - currentMinutes;
      if (diffMinutes > 0 && diffMinutes <= 60) {
        countdownText = `还有 ${diffMinutes} 分钟`;
      }
    }

    return `
      <div class="timeline-item ${nodeStatus} animate-slideUp" style="animation-delay: ${index * 0.05}s" data-time="${item.time}">
        <div class="timeline-time">
          🕐 ${item.time}
          ${statusLabel ? `<span class="timeline-status ${nodeStatus}">${statusLabel}</span>` : ''}
          ${countdownText ? `<span class="timeline-countdown">${countdownText}</span>` : ''}
        </div>
        <div class="timeline-title">${item.title}</div>
        <div class="timeline-desc">${item.description}</div>
        ${venue ? `
          <div class="timeline-venue">
            ${ConfigManager.getVenueIcon(venue.type)} ${venue.name}
          </div>
        ` : ''}
        <div class="timeline-roles">
          ${item.roles.map(role => `
            <span class="role-tag">${ConfigManager.getRoleIcon(role)} ${ConfigManager.getRoleDisplayName(role)}</span>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  // 滚动到当前进行中的节点
  if (isWeddingDay) {
    setTimeout(() => {
      const activeItem = container.querySelector('.timeline-item.active');
      if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 500);
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initApp);

// 导出全局函数
window.AppState = AppState;
window.initApp = initApp;
