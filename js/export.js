/**
 * Wedding Navigator - 导出功能模块
 */

// 动态加载html2canvas和jsPDF
async function loadExportLibraries() {
  // 加载html2canvas
  if (!window.html2canvas) {
    await loadScript('https://cdn.bootcdn.net/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
  }
  
  // 加载jsPDF
  if (!window.jspdf) {
    await loadScript('https://cdn.bootcdn.net/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  }
}

/**
 * 动态加载脚本
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * 导出为PNG图片
 */
async function exportToPNG(elementId, fileName = '婚礼请柬.png') {
  try {
    showLoading('正在生成图片...');
    
    await loadExportLibraries();
    
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('未找到要导出的元素');
    }
    
    // 设置背景色
    const originalBg = element.style.backgroundColor;
    element.style.backgroundColor = '#FFFFFF';
    
    const canvas = await html2canvas(element, {
      scale: 3, // 高清导出
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false
    });
    
    element.style.backgroundColor = originalBg;
    
    // 下载图片
    const link = document.createElement('a');
    link.download = fileName;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    
    hideLoading();
    showToast('图片导出成功！');
    
    return true;
  } catch (error) {
    console.error('PNG导出失败:', error);
    hideLoading();
    showToast('导出失败，请重试');
    return false;
  }
}

/**
 * 导出为PDF
 */
async function exportToPDF(elementId, fileName = '婚礼请柬.pdf') {
  try {
    showLoading('正在生成PDF...');
    
    await loadExportLibraries();
    
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('未找到要导出的元素');
    }
    
    const { jsPDF } = window.jspdf;
    
    // 获取元素尺寸
    const rect = element.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // 设置背景色
    const originalBg = element.style.backgroundColor;
    element.style.backgroundColor = '#FFFFFF';
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false
    });
    
    element.style.backgroundColor = originalBg;
    
    // 创建PDF (A4尺寸)
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = (height / width) * 210;
    
    const pdf = new jsPDF({
      orientation: pdfHeight > 297 ? 'portrait' : 'portrait',
      unit: 'mm',
      format: [pdfWidth, Math.max(pdfHeight, 100)]
    });
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(fileName);
    
    hideLoading();
    showToast('PDF导出成功！');
    
    return true;
  } catch (error) {
    console.error('PDF导出失败:', error);
    hideLoading();
    showToast('导出失败，请重试');
    return false;
  }
}

/**
 * 分享到微信/复制链接
 */
function copyShareLink() {
  const currentUrl = window.location.href.split('?')[0];
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(currentUrl).then(() => {
      showToast('链接已复制到剪贴板');
    }).catch(() => {
      showToast('复制失败，请手动复制');
    });
  } else {
    // 降级处理
    const textArea = document.createElement('textarea');
    textArea.value = currentUrl;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showToast('链接已复制到剪贴板');
  }
}

/**
 * 显示加载状态
 */
function showLoading(text = '加载中...') {
  let overlay = document.querySelector('.loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">${text}</div>
    `;
    document.body.appendChild(overlay);
  }
  overlay.querySelector('.loading-text').textContent = text;
  overlay.style.display = 'flex';
}

/**
 * 隐藏加载状态
 */
function hideLoading() {
  const overlay = document.querySelector('.loading-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

/**
 * 显示提示消息
 */
function showToast(message, duration = 2000) {
  let toast = document.querySelector('.toast-message');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 1rem 2rem;
      border-radius: 8px;
      z-index: 10000;
      font-size: 1rem;
      text-align: center;
    `;
    document.body.appendChild(toast);
  }
  
  toast.textContent = message;
  toast.style.display = 'block';
  toast.style.opacity = '1';
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 300);
  }, duration);
}

// 导出模块
window.ExportManager = {
  exportToPNG,
  exportToPDF,
  copyShareLink,
  showLoading,
  hideLoading,
  showToast
};
