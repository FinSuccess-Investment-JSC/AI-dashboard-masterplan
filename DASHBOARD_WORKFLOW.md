# Workflow chung cho dashboard ngành

Áp dụng cho Đường, Dầu khí và mọi dashboard ngành mới. Cập nhật 10/09/2026 theo các điều chỉnh mới nhất của người dùng; thay thế quy tắc cũ đưa nguồn vào tooltip hoặc giao toàn bộ nhận định cho analyst.

## 1. Vai trò của chart, nguồn, AI và analyst

- Mặt dashboard giữ tiêu đề chart, đơn vị, kỳ dữ liệu, legend, một hàng nguồn có link và ngày quan sát/ngày kiểm tra. Theo yêu cầu rút gọn ngày 12/09/2026, phương pháp, lịch chi tiết, giờ kiểm tra, link bổ sung và bảng gốc mở từ **Chi tiết dữ liệu** ở chân card; nút **ⓘ Insight** riêng cho AI. Cờ hạn chế quan trọng vẫn hiển thị.
- Icon ⓘ trả lời **“Chart này có ý nghĩa gì trong bối cảnh ngành?”**: tín hiệu → cơ chế tác động → nhóm doanh nghiệp/biến lợi nhuận → điều kiện kiểm chứng và giới hạn suy luận. Không chỉ đọc lại số, không gán quan hệ nhân quả khi chưa có bằng chứng.
- Phần giải thích chart do **AI** viết. AI cũng phụ trách Đọc nhanh, so sánh các nguồn, đọc báo cáo/PDF, nhận diện yếu tố cần follow, cập nhật Catalyst/Risk và đề xuất kịch bản từ dữ liệu công khai.
- **Analyst chỉ nhập key insight, thông tin/đánh giá riêng, giả định hoặc phản biện của mình.** Không bắt analyst viết lại phần AI đã có đủ dữ liệu để đọc và phân tích. Không tự gán một quan điểm do AI viết là quan điểm analyst.
- Tách quyền sở hữu nội dung với cách chạy: `ai` là người tạo/duy trì phân tích; `rule-based` là phép tính/tóm tắt theo quy tắc; `model-generated` chỉ dùng khi thực sự gọi mô hình. Không thay nhãn để giả lập việc đã gọi AI.
- Nhận định lưu từ bản cũ phải có ngày phân tích và được tách khỏi số vừa cập nhật. Khi dữ liệu đổi, không giữ nguyên câu “hiện tại” mà làm người đọc tưởng AI đã phân tích lại.
- **Data limitation giữ nguyên nội dung, vị trí và cảnh báo hiển thị** (`.data-gap`, `.gap-row`, bảng hạn chế nguồn). Không gom vào tooltip hoặc xóa khi chưa giải quyết được hạn chế. Cờ estimate/YTD/kế hoạch và dữ liệu thiếu vẫn thấy được.

## 2. Kiểm nguồn trước khi gắn tần suất

Ba khái niệm độc lập, bắt buộc phân biệt:

1. **Kỳ quan sát**: dữ liệu đo ngày/tuần/quý/năm/niên vụ nào?
2. **Lịch công bố của nguồn**: khi nào nguồn phát hành/sửa dữ liệu?
3. **Lịch kiểm tra của job**: hệ thống đi kiểm tra khi nào?

Không ghi chung “Định kỳ · tháng/quý/năm” trên một card. Mỗi card có lịch cụ thể, kiểm từ trang lịch phát hành, metadata, loại báo cáo thực sự đã sử dụng. Nếu nguồn là bài báo, bản tổng hợp hoặc chỉ có một snapshot không thể xác nhận lịch, ghi **“theo công bố, không cố định”**, không đoán lịch từ trục chart. Chuỗi ghép nhiều nguồn phải ghi rõ sự khác biệt hoặc tách card.

Các ví dụ đã kiểm trong bản này:

| Nhóm nguồn | Kỳ dữ liệu | Lịch công bố / cách diễn giải | Bằng chứng |
| --- | --- | --- | --- |
| World Bank Pink Sheet | Tháng; bình quân năm tính từ tháng | Hằng tháng | [Commodity Markets](https://www.worldbank.org/en/research/commodity-markets), [World Bank mô tả báo cáo tháng](https://blogs.worldbank.org/en/opendata/energy-prices-eased-in-may--non-energy-edged-up-pink-sheet) |
| USDA FAS Sugar / PSD | Năm thị trường / niên vụ | 2 lần/năm, tháng 5 và 11; có thể revision | [USDA mô tả lịch](https://esmis.nal.usda.gov/publication/sugar-world-markets-and-trade). Không áp lịch WASDE tháng cho tất cả hàng hóa PSD. |
| EIA Spot Prices | Giá ngày giao dịch | Trang nguồn đang phát hành theo tuần; bình quân tháng/năm là phép tổng hợp | [EIA](https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm), [FRED Brent với ngày phát hành](https://fred.stlouisfed.org/series/DCOILBRENTEU) |
| EIA WPSR | Tuần | Hằng tuần, lịch nghỉ lễ có thể dời | [WPSR](https://www.eia.gov/petroleum/supply/weekly/) |
| EIA STEO | Dữ liệu/dự báo tháng; chart có thể bình quân năm | Hằng tháng | [EIA release schedule](https://www.eia.gov/reports/upcoming.php) |
| CFTC COT | Vị thế thứ Ba | Thường công bố thứ Sáu | [CFTC](https://www.cftc.gov/MarketReports/CommitmentsofTraders/ReleaseSchedule/index.htm) |
| IMF PortWatch | Lượt tàu theo ngày | Cập nhật tuần; job của dashboard kiểm tra daily | [OCHA vận hành bộ tải chính thức](https://github.com/OCHA-DAP/hdx-scraper-portwatch), [API metadata](https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services/Daily_Chokepoints_Data/FeatureServer/0?f=pjson) |
| Yahoo WTI futures | Giá từng hợp đồng theo ngày giao dịch | Ngày giao dịch, nguồn không chính thức; chỉ dùng phiên hoàn tất chung | [Yahoo WTI](https://finance.yahoo.com/quote/CL%3DF/futures/) |
| BCTC kiểm toán / báo cáo năm | Năm tài chính | Năm nếu thực sự dùng báo cáo năm; PLX BCTC quý là quý | Link công bố của đúng doanh nghiệp dưới card. Ví dụ [PV GAS báo cáo năm](https://www.pvgas.com.vn/bai-viet/category/bao-cao-thuong-nien). Không gán “quý” cho snapshot từ báo cáo broker. |
| Giá trong nước, sản lượng mía, HFCS, ước tính nhập lậu, snapshot broker | Theo mốc/niên vụ/năm/YTD ghi trên chart | Theo công bố không cố định với bộ nguồn hiện có | Giữ danh sách nguồn và hạn chế gốc; cần bảng nguồn từng quan sát trước khi tự động hóa. |

## 3. Metadata và màu pastel

Dùng chung `assets/dashboard-ui.css` và `assets/dashboard-ui.js`. Metadata nguồn/chart đặt trong HTML và mapping rõ ràng tại `assets/sector-content.js`; không suy loại dữ liệu từ tiêu đề.

| `data-update-kind` | Vai trò | Màu |
| --- | --- | --- |
| `public` | Dữ liệu public có cấu trúc, lịch cụ thể theo nguồn | Mint |
| `periodic` + `monthly` | Nguồn hằng tháng | Xanh nhạt |
| `periodic` + `quarterly` | Nguồn hằng quý | Tím xanh |
| `periodic` + `annual` | Nguồn hằng năm | Vàng kem |
| `periodic` + `semiannual` | Nguồn 2 lần/năm | Xanh lam nhạt |
| `document` | AI đọc PDF/tài liệu/bài công bố và tổng hợp | Tím nhạt |
| `ai` | AI phân tích / khung theo dõi | Xanh ngọc nhạt |
| `static` | Giải thích cơ chế/cấu trúc ít thay đổi | Xám |
| `analyst` | Góc nhìn riêng của analyst | Cam kem |
| `event` | Chính sách, thuế, điều hành giá theo sự kiện | Hồng |

Lịch tháng/quý/năm vẫn phải hiện rõ đối với `document`. `data-transform="derived"` là nhãn phụ “Tính toán”, không thay thế lịch/nguồn. `data-refresh-status` phân biệt `snapshot`, `loaded`, `derived`; không dùng “live” khi dữ liệu chỉ là lần tải gần nhất.

Hợp đồng dữ liệu cho IT: block ID, source IDs, update_kind, observation_frequency, publication_frequency, polling schedule, source URL, đơn vị, kỳ thực hiện/ước tính/dự báo, last_checked_at, last_success_at, latest_observation, hash dữ liệu, owner, reviewer, limitation. PDF cần tài liệu/trang/bảng và giá trị thô; dữ liệu tính toán cần công thức/input IDs. Nhận định AI cần ngày viết, phiên bản dữ liệu nền và trạng thái cần phân tích lại. Quan điểm analyst có tác giả/ngày và không bị job ghi đè.

## 4. Catalyst/Risk và Policy/Trade/Tax

- Catalyst/Risk là **công cụ theo dõi cho analyst**: KPI → số/kỳ mới nhất → ngưỡng hoặc xu hướng → hàm ý → nguồn và lần kiểm tra. Giá trị/điều kiện đo được tính tự động; AI đọc liên kết các biến. Không biến cả tab thành phần nhập tay của analyst.
- Ngưỡng AI đề xuất là giả định theo dõi, không phải ngưỡng thống kê đã kiểm định. Analyst có thể bổ sung hoặc thay đổi bằng quan điểm riêng.
- Dùng chart cho Policy khi có số thật: hạn ngạch công bố/phân giao, cấu phần thuế lịch sử, mức điều chỉnh giá từng kỳ, spread sản phẩm. Biện pháp định tính dùng sơ đồ truyền dẫn/timeline; không tạo thang điểm tác động giả để có chart.
- Thuế phải ghi mốc hiệu lực/phạm vi: biểu đồ thuế 2021 không khẳng định mức hiện hành sau rà soát 2026. Phân giao hạn ngạch không phải nhập khẩu thực tế.
- Hormuz: chart ngày là lớp theo dõi chính, thêm bình quân 7 ngày và chọn 30/90/365/toàn bộ; không hiển thị thêm chart bình quân tháng (theo yêu cầu mới). Lượt tàu không đồng nghĩa thùng dầu, dữ liệu AIS không phải quan sát hoàn hảo.

## 5. Luồng cập nhật đang có

- `scripts/update_daily.py`: tải 9 chuỗi EIA, Hormuz, 18 hợp đồng WTI, Brent futures, Sugar No.11 futures, giá đường World Bank tháng và sản lượng bốn trung tâm cung đường USDA PSD. `scripts/run_daily.sh` là entry point; `scripts/install_daily_schedule.py` cài idempotent cron 06:15 giờ Việt Nam, giữ nguyên cron khác.
- Lịch đã cài trên máy hiện tại. Máy phải hoạt động và có mạng lúc chạy; cron không tự chạy bù khi máy ngủ. Không có `git push`/publish tự động. Đưa lên server sau này dùng cùng entry point, khai báo Python bằng `DASHBOARD_PYTHON`.
- Đầu ra: `data/daily-data.js` cho browser/file preview, `data/update-status.json` cho kiểm tra; JSON cache và raw archives lưu cục bộ. Kiểm tra mỗi ngày ngay cả với nguồn phát hành tuần; không tự tạo quan sát mới nếu nguồn chưa phát hành.
- Kiểm schema, series ID, đơn vị, ngày hợp lệ/không trùng, lịch sử không tụt lùi/truncated. Có retry, lock và ghi file atomically; lỗi từng nguồn giữ last-good, báo lỗi riêng.
- Crack dùng **ngày giao dịch chung** của Brent/xăng/ULSD, đổi gallon × 42. BQ tháng dùng ngày có dữ liệu; đánh dấu tháng dở dang/YTD. Tồn kho tháng lấy quan sát tuần cuối có dữ liệu. Không điền ngày thiếu bằng 0 hoặc nối đường qua gap.
- WTI lấy ngày đóng cửa hoàn tất chung (timezone sàn), không ghép continuous series, không ghép ngày khác nhau, không gọi là settlement. Nếu không có đủ hợp đồng cùng ngày hợp lệ thì giữ bản tốt trước.
- Tóm tắt số liệu/KPI hiện được sinh **theo quy tắc**. Tooltip và khung phân tích do AI viết trong lần làm dashboard này; chưa cấu hình job gọi mô hình AI tự động. Khi tích hợp model, chỉ chạy khi dữ liệu nền/nguồn thay đổi, lưu version và không ghi đè analyst input.
- Dashboard đường có Sugar No.11 futures ngày (Yahoo SB=F, USX = US cent/lb), World Bank tháng và bốn trung tâm sản xuất USDA PSD. Những chuỗi nội địa/USDA Việt Nam cũ vẫn là snapshot. Job kiểm daily không làm World Bank hoặc USDA trở thành nguồn daily.

- **Bank · MCP Wi (11/09/2026):** Wi chỉ truy cập được qua connector trong phiên Claude (không có API key), nên không có job mạng cho Wi. Agent lưu response thô vào `data/raw/wi/` theo `data/bank-wi-contract.json` (ID/endpoint thật đã kiểm), rồi `scripts/build_bank_wi.py` validate và dựng `data/bank-wi-data.js` (giữ last-good khi thiếu/lỗi). Lịch công bố lấy từ metadata bảng Wi (vd tiền gửi/tín dụng SBV "trễ 1-3 tháng, ngày công bố không cố định"; lãi suất/tỷ giá/OMO "hằng ngày"; BCTC theo kỳ công bố quý). NHNN đổi phương pháp thống kê tiền gửi/M2 tháng 9-10/2025 → dùng bảng Wi "đã điều chỉnh" 301/302, không dùng bảng gốc 17/18 để tính YoY.

## 6. QA trước khi bàn giao

1. Kiểm tra lịch nguồn và ngày dữ liệu; nguồn thiếu lịch phải ghi rõ.
2. Kiểm chart, bảng, tooltip insight, link nguồn còn hiển thị, phương pháp mở được từ icon nguồn, data limitation nguyên vẹn.
3. Kiểm hover/focus/click/Escape, chuyển tab, khoảng thời gian Hormuz và viewport 390px.
4. Test phép tính cùng ngày, đơn vị, gap, dữ liệu rỗng/lỗi/tụt lùi và giữ last-good; không viết test chỉ để phản chiếu giao diện đơn giản.
5. Chạy updater thực tế, kiểm ngày từng nguồn, xác nhận cron giữ nguyên tác vụ khác. Ghi phạm vi chưa nối/publish và kết quả kiểm tra vào AI_WORKSPACE.

## 7. Bổ sung sau rà soát nguồn và bố cục (10/09/2026)

- Chuỗi giá trị phải có sơ đồ luồng hàng/phân nhánh: đầu vào → chế biến → khách hàng. Dịch vụ hỗ trợ/quan hệ thay thế dùng nét đứt và legend; không nối các ngành phụ thành chuỗi biến đổi vật chất sai. Sơ đồ có mô tả accessibility và cuộn ngang trên mobile.
- Tab 2 dùng tab con **Thế giới / Việt Nam**, ghi rõ địa lý từng tập dữ liệu. Mỹ là chỉ báo thuộc lớp thế giới, không phải tổng toàn cầu. So sánh các nước sản xuất đường không được gọi là tổng cân bằng thế giới; không cộng EU với các thành viên.
- Rà soát độ mới phải giữ nguyên định nghĩa hàng hóa, thị trường, đơn vị và loại giá. FRED DCOILBRENTEU lấy từ EIA nên đổi sang FRED không tự khắc phục độ trễ spot. [FRED metadata](https://fred.stlouisfed.org/series/DCOILBRENTEU).
- Brent futures [BZ=F](https://finance.yahoo.com/quote/BZ%3DF/) và đường futures [SB=F](https://finance.yahoo.com/quote/SB%3DF/) hiển thị riêng để theo dõi nhanh. Đây là dữ liệu Yahoo không chính thức; loại phiên hiện tại theo múi giờ sàn, giữ close (không gọi settlement), cảnh báo chuyển kỳ. Không ghép futures vào spot hay dùng thay spot để tính crack.
- [World Bank](https://www.worldbank.org/en/research/commodity-markets) bản phát hành 02/09/2026 có tháng 8/2026. Đọc đúng cột Sugar, world, đơn vị USD/kg; biểu đồ năm chỉ dùng đủ 12 tháng. Kiểm đường dẫn XLSX khi World Bank đổi tài nguyên, lỗi giữ last-good.
- [USDA PSD](https://apps.fas.usda.gov/psdonline/app/index.html): bộ tải chọn Production của Brazil, India, Thailand, European Union, nghìn tấn giá trị thô → triệu tấn. Trục là năm bắt đầu niên vụ từng nước; không coi là niên độ lịch thống nhất. Kỳ mới mang cờ ước tính/dự báo; ngày tải không phải ngày phát hành báo cáo.
- Các hạn chế dữ liệu hiện hữu vẫn hiển thị. Giữ nguyên `.data-gap`, `.gap-row`; không chuyển cảnh báo thiếu số/độ tin cậy thấp/giá trị sàn vào icon nguồn.


## 8. Card gọn (12/09/2026, yêu cầu mới nhất)

- `assets/chart-cards.js` chạy qua shared UI sau khi renderer đã dựng dữ liệu: một chân card, giữ các node nguồn/phương pháp/bảng gốc trong native details. Không xóa dữ liệu hoặc ẩn cảnh báo `.data-gap`, `.gap-row`; ghi chú giới hạn chưa gắn class cũng được bảo vệ theo mapping chart ID đã rà soát.
- Nền biểu đồ trắng; pastel dành cho badge loại nội dung. Lịch công bố gọn ở chân card, lịch đầy đủ trong details; không suy lịch từ tiêu đề. Kỳ tháng/niên vụ trình bày đúng kỳ, không biến khóa ngày đầu kỳ thành ngày quan sát thực tế.
- Nhóm tồn kho Mỹ dùng tab Dầu thô / Sản phẩm / Mùa vụ diesel / Cushing. Dải số tóm tắt lấy đúng giá trị/kỳ đang vẽ và chênh tuyệt đối so kỳ liền trước đang vẽ; thiếu giá trị thì bỏ phần chênh, không điền 0. Không thêm kết luận đầu tư.
- ⓘ Insight hỗ trợ hover/focus/click/Escape; popup đặt phía đủ khoảng trống để không che nút. Chi tiết dữ liệu mở bằng click/Enter; Escape đóng và trả focus. Tab tồn kho hỗ trợ phím mũi tên/Home/End.
- QA thay đổi chỉ giao diện: đối chiếu bảng số, link nguồn, SVG và cảnh báo với bản trước; kiểm desktop/390px và điều hướng. Không cần chạy lại mạng/updater khi không đổi nguồn hoặc phép tổng hợp dữ liệu. Luôn chạy `prepare_release.py` trước xuất bản, đối chiếu manifest sau deploy.


## 9. Catalyst/Risk theo tín hiệu (12/09/2026)

- Shared `assets/catalyst-board.js/css` chạy sau các renderer và shared UI. Mặc định mở 4 tín hiệu Dầu khí/Đường, 5 tín hiệu Bank; mỗi tín hiệu có số/kỳ, trạng thái, ảnh hưởng, điều kiện cần đổi đánh giá và giới hạn ngắn luôn hiện. Ngưỡng kế thừa là giả định theo dõi, không phải ngưỡng được kiểm định.
- Tab con Tín hiệu / Dữ liệu & nguồn / Phân tích lưu tách bảng theo dõi khỏi chi tiết. Toàn bộ node nguồn, chart, bảng và cảnh báo gốc được giữ trong đúng view; không nhét `.data-gap,.gap-row` vào details. Khi mở view bằng chứng, cảnh báo đầy đủ luôn hiện cùng dữ liệu. Bản lưu có ngày và nhắc chưa hiệu chỉnh, không được xem là phân tích lại hôm nay.
- Link bằng chứng mở biểu đồ gốc, tự chọn đúng major tab, địa lý hoặc tab tồn kho; không sao chép chart tạo ID trùng. Bấm Catalyst/Risk tới thẳng bảng tín hiệu; phần giới thiệu ngành vẫn truy cập được khi cuộn lên.
- Dầu khí lọc khâu kinh doanh; Đường đổi góc nhìn tự chủ mía/nguyên liệu nhập (không tự tính spread khi thiếu kỳ khớp). Bank dùng bộ lọc nhóm/mã đã có: hiển thị riêng các tỷ lệ Wi của mã, trạng thái theo quy tắc vẫn ghi rõ toàn ngành, không tự chấm bank bằng số ngành.
- Kịch bản mở từng phương án, tóm lược khung cũ với ngày rõ; không gán xác suất mới hay mục tiêu mới. Missing/error/stale có cờ riêng, không suy thiếu số thành tích cực.
- QA: link bằng chứng từ trạng thái địa lý/nhóm khác, keyboard các tab, missing Wi, giữ bảng/số/link/cảnh báo/analyst drafts, zero duplicate IDs, desktop/390px. Phải đối chiếu bản public sau release.

## 10. Luồng nghiên cứu 5 tab (18/09/2026)

- `assets/research-layout.js/css` chạy sau các renderer, ChartCards và Catalyst Board: Tổng quan ngành / Bối cảnh thị trường / Policy–Tax–Trade / Catalyst–Risk / Chủ đề nóng. Tổng quan giữ chuỗi giá trị, vai trò doanh nghiệp và bảng so sánh; số giá/KPI và đọc nhanh nằm ở Bối cảnh. Cung cầu và giá–chi phí–margin dùng chung tab con Thế giới/Việt Nam với mapping địa lý tường minh.
- Key players được chuyển về Tổng quan. Bank giữ số Wi và bộ lọc đang có; bảng đường 09/01/2024 giữ nhãn bản lưu. Dầu khí chưa có bộ định giá đồng kỳ: hiển thị khoảng trống, không tự điền số. P/E/ROE/tăng trưởng là lớp chung; multiple bổ sung theo mô hình kinh doanh và lợi nhuận giữa chu kỳ.
- Policy và Catalyst dùng native details đóng mặc định. Cảnh báo `.data-gap,.gap-row` vẫn hiển thị cùng khối liên quan. Chi tiết giữ nguồn, ảnh hưởng, thời gian, điều kiện kiểm chứng và đối chiếu lịch sử; chưa có dữ liệu nghiên cứu sự kiện thì không khẳng định tương quan giá cổ phiếu hoặc tác động định lượng.
- `assets/research-editorial.js`: trạng thái xanh = đang theo dõi, xám = đã lưu; không đồng nghĩa chiều khuyến nghị đầu tư. AI cung cấp khung; analyst nhập tác giả, góc nhìn/phản biện và quyết định lưu. IndexedDB `finsuccess-research`, store `entries`, khóa ngành/loại/id; giao dịch lưu thành công mới đổi UI. Lỗi lưu không báo thành công. JSON export giữ bản sao. Đây là lưu trữ trên trình duyệt, chưa có backend đồng bộ; không gọi là database chung/publication.
- Chủ đề mới có tiêu đề, nội dung/điều kiện kết thúc, analyst và link tùy chọn. Mùa vụ đường và ràng buộc bảng cân đối bank là nội dung cấu trúc, chuyển về Tổng quan/Bối cảnh. Hormuz là chủ đề sự kiện. Lưu không xóa dữ liệu; có thể mở lại.
- Tiêu đề biểu đồ ngắn; đơn vị, kỳ, phương pháp và hạn chế giữ nguyên. Futures có chọn ngày/tuần/tháng/năm, khoảng 3 tháng/1 năm/toàn bộ/tùy chọn; `SectorMath.periodClose` lấy close cuối có số theo kỳ UTC, tuần bắt đầu thứ Hai, không điền gap bằng 0. Kỳ đầu/cuối có thể chưa đủ. Không áp selector giả cho snapshot/niên vụ.
- QA: `tests/research-layout.cjs` (Playwright) kiểm 5 tab, geography, kỳ chart, khoảng không hợp lệ, accordion/Escape, link bằng chứng, mobile 390px, IndexedDB reload, archive/restore, JSON export. `tests/site-navigation.cjs` kiểm hub và 15 tab. So sánh trước/sau phải giữ bảng, nguồn, số SVG và cảnh báo; không chạy updater mạng cho thay đổi UI.

## 11. Bảng tài chính công khai và Sources (18/09/2026, điều chỉnh mới nhất)

- Luồng mới có 6 tab: Tổng quan ngành / Bức tranh ngành / Policy–Tax–Trade / Catalyst–Risk / Chủ đề nóng / Sources. Mô hình kinh doanh đứng trước bảng tài chính; dữ liệu company deep-dive cũ rút khỏi Overview theo yêu cầu người dùng, thay bằng chỗ gắn dashboard riêng. Nguồn và hạn chế của phần rút ra lưu trong Sources.
- `financial-comparison.js` đọc `data/company-comparison.js`: chọn năm/quý, tìm mã/lọc nhóm, chọn nhóm chỉ tiêu và sort số thực (missing luôn cuối). Nguồn public Stock Analysis/S&P Global, 21/22 mã; QNS chưa có. Giá theo ngày nguồn 16–17/09/2026, không gọi realtime. Năm tài chính theo issuer, không đổi FY2026 của SBT/LSS thành năm dương lịch.
- `scripts/update_company_comparison.py` chạy thủ công, lưu raw, kiểm mã/sàn/đơn vị, ghi atomically và giữ last-good nếu lỗi. `--offline` dựng lại từ archive. Không gắn cron hoặc publish. ROE/ROA quý dùng lợi nhuận riêng quý, không annualize; vốn/tài sản đầu kỳ phải đúng kỳ liền trước. Khoản thiếu không thành 0. Nợ ngắn hạn cần đủ vay ngắn + phần dài hạn đến hạn. Cash không cộng đầu tư ngắn hạn. Số chuẩn hóa chưa đối chiếu toàn bộ BCTC gốc; nguồn/định nghĩa hiển thị trong Sources.
- Ngân hàng: không áp gross margin/phân loại nợ vay doanh nghiệp công nghiệp; LN/tổng thu nhập và CIR dùng thu nhập trước dự phòng theo nguồn. Cash ngân hàng là nhóm chuẩn hóa của provider, cảnh báo không so ngang cash công nghiệp. ROA/CIR là chỉ tiêu bổ sung; không ghép NIM/CASA/NPL Wi vào bảng mới khi khác kỳ/định nghĩa. Dữ liệu Wi ngành và tín hiệu còn nguyên.
- Theo yêu cầu mới, `research-sources.js` đưa nguồn/phương pháp vào nút **Nguồn** hover/focus/click/Escape và đăng ký ở tab Sources. Đây là ngoại lệ thay thế quy tắc nguồn luôn hiện trước đó; kỳ/đơn vị và hạn chế trọng yếu vẫn trên biểu đồ. KPI đi thẳng đầu Bức tranh ngành, bỏ wrapper đọc nhanh/bản lưu. Thanh Thế giới/Việt Nam sticky theo chiều cao nav thực tế.

## 13. Tự động kiểm và xuất bản dữ liệu công khai (28/09/2026)

- GitHub Actions kiểm dầu/đường/Eximbank lúc 07:30 và 15:30 giờ Việt Nam; lượt 15:30 kiểm thêm bảng so sánh doanh nghiệp. Phân biệt giờ kiểm với kỳ quan sát và lịch công bố như §2. Chỉ chuẩn bị release/Pages build khi hash số liệu hoặc trạng thái nguồn đổi; nguồn lỗi giữ last-good, không đổi kỳ quan sát thành giờ kiểm.
- `scripts/refresh_release.py` là bộ điều phối; các adapter cũ tiếp tục kiểm schema/đơn vị/kỳ. Workflow commit data và manifest sau khi unit test qua, rồi yêu cầu Pages build cho cấu hình branch legacy. Cron cục bộ 06:15 còn là bản dự phòng, không xuất bản.
- Wi vẫn cần MCP phiên agent vì chưa có credential API cho job. Các snapshot nội địa, chính sách, PDF/broker chưa có nguồn máy đọc được vẫn cập nhật theo công bố và giữ cờ hạn chế; không ghi là realtime.
- OPEC/non-OPEC chuyển từ bảng dài thành chart/sơ đồ trước tồn kho Mỹ; giữ nguyên snapshot T8/2026, các số khác kỳ/phạm vi không cộng. Non-OPEC chưa có đóng góp định lượng đồng kỳ nên chỉ sơ đồ định tính, không tạo số.
- QA bổ sung: unit tests cho parser nhiều bảng, ngày giá, quy đổi đơn vị, ROE quý/missing đầu kỳ, ngân hàng; UI kiểm 6 tab, sort/filter/kỳ, nguồn, thanh địa lý sticky desktop/390px. Lần sửa này không cập nhật lại các nguồn thị trường hiện có.

## 12. Ít chữ hơn, dễ nắm key hơn (20/09/2026, yêu cầu mới nhất — mindset áp dụng cho mọi tab, mọi dashboard)

- **Không ghi lên mặt dashboard những gì người đọc tự suy được từ hình.** Ví dụ đã bỏ: "Các năm mang E là dự báo; không phải số thực hiện" (nhãn E đã nói điều đó), "Mỹ, không đại diện tồn kho toàn cầu" (tiêu đề đã ghi Mỹ), "mỗi hình giữ kỳ và phạm vi riêng", "— bốn cổng đã có đủ số", đoạn đọc chart "đỉnh 2012 → đáy 2020 → …" (chart tự thể hiện). `chart-sub` chỉ còn đơn vị · kỳ · phương pháp ngắn; `chart-caveat` (`assets/chart-cards.js`) chỉ giữ cờ trọng yếu không suy được từ hình (proxy, ước tính, hạn ngạch ≠ nhập thực, close ≠ settlement, `*` = tháng chưa đủ kỳ). `.data-gap`/`.gap-row` vẫn giữ nguyên.
- **Một câu hedge chung không lặp lại trên từng card.** Dòng "Đối chiếu quá khứ: cần so cùng phạm vi chính sách…" đã bỏ hẳn; dòng "Tác động: …" nếu giống nhau ở nhiều card thì `research-layout.js` gom thành một dòng `.policy-impact` dưới tiêu đề section. Chú giải màu "Xanh: đang theo dõi · Xám: đã lưu" bỏ; badge chỉ hiện khi "Đã lưu".
- **Catalyst/Risk là một trang, không có tab con.** Bỏ "Dữ liệu & nguồn" và "Phân tích lưu": tín hiệu hiện thẳng dạng tile (câu hỏi cần kiểm chứng + chip thời gian, số lớn, Ảnh hưởng, Đổi đánh giá khi với ngưỡng nổi bật, Cách đối chiếu, giới hạn ngắn, chip bằng chứng ↗, details Góc nhìn analyst). Bên dưới là Kịch bản, rồi hai `details` đóng: **Bảng KPI & ngưỡng theo dõi** (monitor/watch-table gốc) và **Phân tích AI ngày dd/mm/yyyy · bản gốc, chưa cập nhật theo số mới** (bản phân tích cũ, giữ để đối chiếu). Bank giữ 6 chart Wi của tab dưới heading "Dữ liệu theo dõi" (không gấp vì có cảnh báo). `srcrow` của tab chuyển sang Sources. Details tự mở nếu chứa `.data-gap,.gap-row`.
- **Chủ đề nóng: toàn bộ nội dung nằm trong dropdown của chủ đề** (`fold(card,title,{all:true,open:true})`), mở sẵn để cảnh báo vẫn thấy được; heading cũ "7. Hormuz & dòng chảy — tab riêng" bỏ vì trùng tiêu đề fold. Bảng "Nguồn dữ liệu và khả năng tự động cập nhật" là nội dung nguồn → tab Sources.
- **Phần bắt buộc nhiều chữ thì trình bày để nắm key trong 5 giây.** `ResearchLayout.emphasize(root)` tự in đậm/đổi màu số có đơn vị, %, ngày (`.key-number`) trong prose của Policy, Catalyst, Chủ đề nóng, Tổng quan (bỏ qua bảng thường, link, caption, code). Cụm ý chính đánh dấu tay bằng `<mark class="key-phrase">` (ví dụ "dòng tiền về sớm hơn"). **Thay đổi so với quá khứ thì kẻ bảng** `.compare-table` (Trước / Sau / Ý nghĩa): Luật Dầu khí 2026 và các mốc phòng vệ thương mại đường đã chuyển từ đoạn văn/timeline sang bảng, giữ nguyên số liệu và văn bản gốc. Không bịa cột "Trước" khi văn bản không nêu; cột nào chưa xác nhận thì ghi rõ.
- QA: `tests/research-layout.cjs` kiểm không còn `.thesis-view-tabs`, số tín hiệu hiện không cần mở fold, chủ đề nóng mở sẵn và chứa nội dung, bảng nguồn đã sang Sources, có `.key-number`. So trước/sau vẫn phải giữ bảng số, link nguồn, SVG và `.data-gap/.gap-row`.
