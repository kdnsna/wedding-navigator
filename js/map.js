/**
 * Wedding Navigator - 地图模块
 */

// 地图实例
let map = null;
let markers = [];
let infoWindow = null;

/**
 * 加载高德地图SDK
 */
function loadAmapScript(key) {
  return new Promise((resolve, reject) => {
    if (window.AMap) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}&plugin=AMap.Driving`;
    script.onload = resolve;
    script.onerror = () => {
      reject(new Error('高德地图加载失败'));
    };
    document.head.appendChild(script);
  });
}

/**
 * 初始化地图
 */
async function initMap(containerId, config) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('地图容器未找到');
    return null;
  }
  
  const amapKey = config.settings?.amapKey || 'YOUR_AMAP_KEY';
  
  try {
    await loadAmapScript(amapKey);
    
    // 创建地图实例
    map = new AMap.Map(containerId, {
      zoom: 12,
      center: [116.397428, 39.90923],
      viewMode: '2D',
      mapStyle: 'amap://styles/whitesmoke'
    });
    
    // 添加地图控件
    AMap.plugin(['AMap.ToolBar', 'AMap.Scale'], function() {
      map.addControl(new AMap.ToolBar());
      map.addControl(new AMap.Scale());
    });
    
    // 创建信息窗体
    infoWindow = new AMap.InfoWindow({
      offset: new AMap.Pixel(0, -30)
    });
    
    return map;
  } catch (error) {
    console.error('地图初始化失败:', error);
    showMapError(container);
    return null;
  }
}

/**
 * 显示地图错误提示
 */
function showMapError(container) {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background: #f5f5f5; color: #666;">
      <div style="font-size: 3rem; margin-bottom: 1rem;">🗺️</div>
      <div style="font-size: 1rem; margin-bottom: 0.5rem;">地图加载失败</div>
      <div style="font-size: 0.875rem; color: #999;">请检查高德地图Key是否正确配置</div>
    </div>
  `;
}

/**
 * 添加标记点
 */
function addMarkers(venues) {
  if (!map || !venues) return;
  
  // 清除现有标记
  clearMarkers();
  
  venues.forEach((venue, index) => {
    const icon = createMarkerIcon(venue.type, index + 1);
    
    const marker = new AMap.Marker({
      position: new AMap.LngLat(venue.lng, venue.lat),
      title: venue.name,
      icon: icon,
      offset: new AMap.Pixel(-20, -40)
    });
    
    // 标记点击事件
    marker.on('click', () => {
      showInfoWindow(marker, venue);
    });
    
    map.add(marker);
    markers.push(marker);
  });
  
  // 自动调整视野
  if (markers.length > 0) {
    map.setFitView();
  }
}

/**
 * 创建自定义标记图标
 */
function createMarkerIcon(type, number) {
  const colors = {
    home: '#FF6B6B',
    hotel: '#4ECDC4',
    venue: '#FFD93D',
    restaurant: '#95E1D3'
  };
  
  const color = colors[type] || '#C41E3A';
  
  return new AMap.MarkerImage(
    `data:image/svg+xml;base64,${btoa(`
      <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 0C9 0 0 9 0 20c0 15 20 30 20 30s20-15 20-30C40 9 31 0 20 0z" fill="${color}"/>
        <circle cx="20" cy="18" r="12" fill="white"/>
        <text x="20" y="23" text-anchor="middle" font-size="14" font-weight="bold" fill="${color}">${number}</text>
      </svg>
    `)}`,
    new AMap.Size(40, 50),
    new AMap.Pixel(0, 0),
    new AMap.Pixel(20, 40)
  );
}

/**
 * 显示信息窗体
 */
function showInfoWindow(marker, venue) {
  const content = `
    <div class="amap-info-content">
      <h4>${venue.name}</h4>
      <p>${venue.address}</p>
      ${venue.description ? `<p style="color: #C41E3A; margin-top: 0.5rem;">${venue.description}</p>` : ''}
    </div>
  `;
  
  infoWindow.setContent(content);
  infoWindow.open(map, marker.getPosition());
}

/**
 * 清除所有标记
 */
function clearMarkers() {
  if (map && markers.length > 0) {
    map.remove(markers);
  }
  markers = [];
}

/**
 * 规划驾车路线
 */
function planDrivingRoute(venues, waypoints = []) {
  if (!map || venues.length < 2) return;
  
  AMap.plugin('AMap.Driving', function() {
    const driving = new AMap.Driving({
      map: map,
      panel: null,
      policy: AMap.DrivingPolicy.LEAST_TIME,
      showTraffic: false,
      hideMarkers: true
    });
    
    const points = [
      { lnglat: [venues[0].lng, venues[0].lat] }
    ];
    
    // 添加途经点
    if (waypoints.length > 0) {
      waypoints.forEach(wp => {
        points.push({ lnglat: [wp.lng, wp.lat] });
      });
    }
    
    // 添加终点
    points.push({ lnglat: [venues[venues.length - 1].lng, venues[venues.length - 1].lat] });
    
    driving.search(points, function(status, result) {
      if (status === 'complete') {
        console.log('路线规划成功');
      } else {
        console.error('路线规划失败', result);
      }
    });
  });
}

/**
 * 启动高德地图导航
 */
function startNavigation(venue) {
  if (!venue || !venue.lng || !venue.lat) {
    showToast('无法获取位置信息');
    return;
  }
  
  // 判断设备类型
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  let url;
  
  if (isIOS) {
    // iOS使用uri.amap.com
    url = `https://uri.amap.com/navigation?to=${venue.lng},${venue.lat},${encodeURIComponent(venue.name)}&mode=car&callnative=1`;
  } else if (isAndroid) {
    // Android尝试唤起高德App
    url = `androidamap://navi?sourceApplication=WeddingNavigator&lat=${venue.lat}&lon=${venue.lng}&poiname=${encodeURIComponent(venue.name)}&style=2`;
  } else {
    // 其他设备使用网页版
    url = `https://uri.amap.com/navigation?to=${venue.lng},${venue.lat},${encodeURIComponent(venue.name)}&mode=car&callnative=1`;
  }
  
  // 尝试打开链接
  window.location.href = url;
  
  // 如果没有成功唤起App，3秒后打开网页版
  setTimeout(() => {
    if (!document.hidden) {
      window.open(`https://m.amap.com/navi/?start=&dest=${venue.lng},${venue.lat}&destName=${encodeURIComponent(venue.name)}&key=&mode=car`, '_blank');
    }
  }, 3000);
}

/**
 * 获取两点之间的距离（直线）
 */
function getDistance(venue1, venue2) {
  if (!venue1 || !venue2) return 0;
  
  const R = 6371; // 地球半径（公里）
  const dLat = (venue2.lat - venue1.lat) * Math.PI / 180;
  const dLon = (venue2.lng - venue1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(venue1.lat * Math.PI / 180) * Math.cos(venue2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c).toFixed(1);
}

/**
 * 计算预估行车时间
 */
function estimateDrivingTime(distance) {
  // 假设平均速度30km/h
  const hours = distance / 30;
  const minutes = Math.round(hours * 60);
  return minutes;
}

// 导出模块
window.MapManager = {
  initMap,
  addMarkers,
  clearMarkers,
  planDrivingRoute,
  startNavigation,
  getDistance,
  estimateDrivingTime
};
