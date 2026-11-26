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
      {key: 'realestate', label: 'BĐS dân cư'},
      {key: 'industrial', label: 'Khu công nghiệp'},
      {key: 'construction', label: 'Xây dựng · VLXD'},
      {key: 'retail', label: 'Bán lẻ'},
      {key: 'auto', label: 'Ô tô - Xe máy'},
      {key: 'power', label: 'Điện'},
      {key: 'oil', label: 'Dầu khí'},
      {label: 'Vận tải', children: [
        {key: 'port', label: 'Cảng & kho bãi'},
        {key: 'shipping', label: 'Vận tải biển'},
        {label: 'Hàng không', soon: true}
      ]},
      {key: 'rubber', label: 'Cao su'},
      {key: 'textile', label: 'Dệt may'},
      {key: 'seafood', label: 'Thủy sản', children: [
        {key: 'seafood', label: 'Cá tra', sub: 'pang', hash: 'mt2'},
        {key: 'seafood', label: 'Tôm', sub: 'shrimp', hash: 'mt2'}
      ]},
      {label: 'Hóa chất', children: [
        {key: 'fertilizer', label: 'Phân bón'},
        {label: 'Phốt pho', soon: true},
        {label: 'Xút', soon: true}
      ]},
      {label: 'Thực phẩm & đồ uống', children: [
        {key: 'agri', label: 'Nông nghiệp & thực phẩm'},
        {key: 'sugar', label: 'Đường'},
        {key: 'dairy', label: 'Sữa'},
        {key: 'beer', label: 'Bia'}
      ]},
      {key: 'pharma', label: 'Dược & y tế'},
      {key: 'telecom', label: 'Viễn thông'}
    ]}
  ]
};
