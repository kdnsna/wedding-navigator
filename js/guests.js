/**
 * Wedding Navigator - 宾客管理模块
 */

// 宾客数据存储键
const GUEST_STORAGE_KEY = 'weddingGuests';
let currentFilter = 'all';
let editingGuestId = null;

/**
 * 初始化宾客页面
 */
function initGuestsPage() {
  renderGuestList();
  updateStatistics();
  bindFilterEvents();
}

/**
 * 获取所有宾客
 */
function getGuests() {
  try {
    const data = localStorage.getItem(GUEST_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('读取宾客数据失败:', e);
    return [];
  }
}

/**
 * 保存宾客列表
 */
function saveGuests(guests) {
  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guests));
  } catch (e) {
    console.error('保存宾客数据失败:', e);
  }
}

/**
 * 添加宾客
 */
function addGuest(guest) {
  const guests = getGuests();
  guest.id = Date.now().toString();
  guest.createdAt = new Date().toISOString();
  guests.push(guest);
  saveGuests(guests);
  return guest;
}

/**
 * 更新宾客
 */
function updateGuest(id, updates) {
  const guests = getGuests();
  const index = guests.findIndex(g => g.id === id);
  if (index !== -1) {
    guests[index] = { ...guests[index], ...updates, updatedAt: new Date().toISOString() };
    saveGuests(guests);
    return guests[index];
  }
  return null;
}

/**
 * 删除宾客
 */
function deleteGuest(id) {
  const guests = getGuests();
  const filtered = guests.filter(g => g.id !== id);
  saveGuests(filtered);
}

/**
 * 渲染宾客列表
 */
function renderGuestList() {
  const container = document.getElementById('guestList');
  if (!container) return;

  let guests = getGuests();

  // 应用筛选
  if (currentFilter !== 'all') {
    guests = guests.filter(g => g.status === currentFilter);
  }

  if (guests.length === 0) {
    const emptyMsg = currentFilter === 'all'
      ? '暂无宾客，请点击上方按钮添加'
      : '该分类下暂无宾客';
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #999;">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">👥</div>
        <div>${emptyMsg}</div>
      </div>
    `;
    return;
  }

  container.innerHTML = guests.map((guest, index) => `
    <div class="guest-item animate-slideUp" style="animation-delay: ${index * 0.05}s" data-id="${guest.id}">
      <div class="guest-main">
        <div class="guest-avatar">${guest.name.charAt(0)}</div>
        <div class="guest-info">
          <div class="guest-name">${guest.name}
            <span class="guest-relation">${getRelationLabel(guest.relation)}</span>
          </div>
          <div class="guest-detail">
            ${guest.phone ? `📞 ${guest.phone}` : ''}
            ${guest.count > 0 ? ` · 👤 ${guest.count}人` : ''}
            ${guest.diet && guest.diet.length ? ` · 🍽️ ${guest.diet.map(d => getDietLabel(d)).join('、')}` : ''}
          </div>
          ${guest.note ? `<div class="guest-note">📝 ${guest.note}</div>` : ''}
        </div>
        <div class="guest-status">
          <span class="status-badge ${guest.status}">${getStatusLabel(guest.status)}</span>
        </div>
      </div>
      <div class="guest-actions">
        <button class="action-btn edit" onclick="editGuest('${guest.id}')">编辑</button>
        <button class="action-btn delete" onclick="confirmDeleteGuest('${guest.id}')">删除</button>
      </div>
    </div>
  `).join('');
}

/**
 * 更新统计信息
 */
function updateStatistics() {
  const guests = getGuests();
  const total = guests.length;
  const attending = guests.filter(g => g.status === 'attending').length;
  const declined = guests.filter(g => g.status === 'declined').length;
  const pending = guests.filter(g => g.status === 'pending' || g.status === 'maybe').length;
  const totalPeople = guests
    .filter(g => g.status === 'attending')
    .reduce((sum, g) => sum + (parseInt(g.count) || 0), 0);
  const rate = total > 0 ? Math.round((attending / total) * 100) : 0;

  const statTotal = document.getElementById('statTotal');
  const statAttending = document.getElementById('statAttending');
  const statPending = document.getElementById('statPending');
  const statRate = document.getElementById('statRate');
  const statPeople = document.getElementById('statPeople');

  if (statTotal) statTotal.textContent = total;
  if (statAttending) statAttending.textContent = attending;
  if (statPending) statPending.textContent = pending;
  if (statRate) statRate.textContent = rate + '%';
  if (statPeople) statPeople.textContent = totalPeople;
}

/**
 * 绑定筛选事件
 */
function bindFilterEvents() {
  const filterContainer = document.getElementById('guestFilter');
  if (!filterContainer) return;

  filterContainer.querySelectorAll('.role-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterContainer.querySelectorAll('.role-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderGuestList();
    });
  });
}

/**
 * 显示添加宾客弹窗
 */
function showAddGuestModal() {
  editingGuestId = null;
  document.getElementById('modalTitle').textContent = '添加宾客';
  document.getElementById('guestForm').reset();
  document.getElementById('guestId').value = '';
  document.querySelectorAll('input[name="diet"]').forEach(cb => cb.checked = false);
  document.getElementById('guestModal').classList.add('active');
}

/**
 * 编辑宾客
 */
function editGuest(id) {
  const guests = getGuests();
  const guest = guests.find(g => g.id === id);
  if (!guest) return;

  editingGuestId = id;
  document.getElementById('modalTitle').textContent = '编辑宾客';
  document.getElementById('guestId').value = guest.id;
  document.getElementById('guestName').value = guest.name || '';
  document.getElementById('guestPhone').value = guest.phone || '';
  document.getElementById('guestRelation').value = guest.relation || 'family';
  document.getElementById('guestStatus').value = guest.status || 'pending';
  document.getElementById('guestCount').value = guest.count || 1;
  document.getElementById('guestNote').value = guest.note || '';

  // 设置饮食偏好
  document.querySelectorAll('input[name="diet"]').forEach(cb => {
    cb.checked = guest.diet && guest.diet.includes(cb.value);
  });

  document.getElementById('guestModal').classList.add('active');
}

/**
 * 保存宾客
 */
function saveGuest(event) {
  event.preventDefault();

  const name = document.getElementById('guestName').value.trim();
  if (!name) {
    showToast('请输入宾客姓名');
    return;
  }

  const diet = Array.from(document.querySelectorAll('input[name="diet"]:checked')).map(cb => cb.value);

  const guestData = {
    name,
    phone: document.getElementById('guestPhone').value.trim(),
    relation: document.getElementById('guestRelation').value,
    status: document.getElementById('guestStatus').value,
    count: parseInt(document.getElementById('guestCount').value) || 0,
    diet,
    note: document.getElementById('guestNote').value.trim()
  };

  if (editingGuestId) {
    updateGuest(editingGuestId, guestData);
    showToast('宾客信息已更新');
  } else {
    addGuest(guestData);
    showToast('宾客添加成功');
  }

  closeModal();
  renderGuestList();
  updateStatistics();
}

/**
 * 确认删除宾客
 */
function confirmDeleteGuest(id) {
  if (confirm('确定要删除这位宾客吗？')) {
    deleteGuest(id);
    renderGuestList();
    updateStatistics();
    showToast('已删除');
  }
}

/**
 * 关闭弹窗
 */
function closeModal() {
  document.getElementById('guestModal').classList.remove('active');
}

/**
 * 显示二维码
 */
function showQRCode() {
  const modal = document.getElementById('qrModal');
  const container = document.getElementById('qrcode');
  container.innerHTML = '';

  // 生成当前页面的二维码
  const url = window.location.href.split('?')[0];
  new QRCode(container, {
    text: url,
    width: 200,
    height: 200,
    colorDark: '#C41E3A',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M
  });

  modal.classList.add('active');
}

/**
 * 关闭二维码弹窗
 */
function closeQRModal() {
  document.getElementById('qrModal').classList.remove('active');
}

/**
 * 获取关系标签
 */
function getRelationLabel(relation) {
  const labels = {
    family: '家人',
    friend: '朋友',
    colleague: '同事',
    classmate: '同学',
    other: '其他'
  };
  return labels[relation] || relation;
}

/**
 * 获取状态标签
 */
function getStatusLabel(status) {
  const labels = {
    pending: '待回复',
    attending: '确认出席',
    declined: '无法出席',
    maybe: '待定'
  };
  return labels[status] || status;
}

/**
 * 获取饮食标签
 */
function getDietLabel(diet) {
  const labels = {
    vegetarian: '素食',
    halal: '清真',
    noSeafood: '忌海鲜',
    noPork: '忌猪肉'
  };
  return labels[diet] || diet;
}

// 点击弹窗外部关闭
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

// 导出函数
window.initGuestsPage = initGuestsPage;
window.showAddGuestModal = showAddGuestModal;
window.editGuest = editGuest;
window.saveGuest = saveGuest;
window.confirmDeleteGuest = confirmDeleteGuest;
window.closeModal = closeModal;
window.showQRCode = showQRCode;
window.closeQRModal = closeQRModal;
