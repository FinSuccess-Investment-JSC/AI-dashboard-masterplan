/* Cây ngành cho thanh điều hướng bên trái (scripts/sector_package/site-sidebar.js). Một nguồn duy nhất cho mọi trang.
   key = khóa route trong site-navigation.js (DashboardSite.href). sub/hash = mở thẳng sub-tab trong trang ngành.
   soon = ngành chưa có dashboard: hiện mờ, không bấm được. Thêm ngành mới: thêm một dòng ở đây. */
window.FS_SITE_NAV = {
  version: '2026-11-26',
  groups: [
    {title: 'Ngành', items: [
      {key: 'bank', label: 'Ngân hàng'},
      {key: 'securities', label: 'Chứng khoán'},
      {key: 'insurance', label: 'Bảo hiểm'},
      {key: 'steel', label: 'Thép'},
      {key: 'realestate', label: 'Bất động sản'},
      {key: 'industrial', label: 'Khu công nghiệp'},
      {key: 'construction', label: 'Xây dựng · VLXD'},
      {key: 'retail', label: 'Bán lẻ'},
      {label: 'Ô tô - Xe máy', soon: true},
      {key: 'power', label: 'Điện'},
      {key: 'oil', label: 'Dầu khí'},
      {label: 'Vận tải', children: [
        {key: 'port', label: 'Cảng & kho bãi'},
        {key: 'shipping', label: 'Vận tải biển'},
        {label: 'Hàng không', soon: true}
      ]},
      {key: 'rubber', label: 'Cao su'},
      {key: 'textile', label: 'Dệt may'},
      {label: 'Thủy sản', children: [
        {key: 'pangasius', label: 'Cá tra'},
        {key: 'shrimp', label: 'Tôm'}
      ]},
      {label: 'Hóa chất', children: [
        {key: 'fertilizer', label: 'Phân bón'},
        {label: 'Phốt pho', soon: true},
        {label: 'Xút', soon: true}
      ]},
      {label: 'Thực phẩm & đồ uống', children: [
        {key: 'agri', label: 'Nông nghiệp & thực phẩm'},
        {key: 'sugar', label: 'Đường'},
        {label: 'Sữa', soon: true},
        {label: 'Bia', soon: true}
      ]},
      {key: 'pharma', label: 'Dược & y tế'},
      {key: 'telecom', label: 'Viễn thông'}
    ]}
  ]
};
