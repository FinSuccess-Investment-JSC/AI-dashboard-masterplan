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
| KNOC Opinet Singapore products + Dubai spot | Giá ngày giao dịch; crack tính từng ngày rồi bình quân tháng | KNOC khảo sát thứ Ba–thứ Bảy cho giá ngày T vào T+1; job kiểm hai lần/ngày. Nguồn ước tính giá Singapore, không phải realized margin BSR. | [Sản phẩm Singapore](https://www.opinet.co.kr/glopopdSelect.do), [Dubai spot](https://www.opinet.co.kr/gloptotSelect.do) |
| Petrolimex giá bán lẻ Vùng 1 | Từng kỳ điều chỉnh | Theo thông cáo, thường hằng tuần nhưng có thể đổi lịch; job kiểm hai lần mỗi ngày làm việc. Giá được OCR từ ảnh bảng giá gốc, chỉ nhận khi đủ ba mã và hợp lệ; lỗi giữ last-good. | [Thông cáo Petrolimex](https://home.petrolimex.com.vn/ndi/thong-cao-bao-chi.html) |
| EIA WPSR | Tuần | Hằng tuần, lịch nghỉ lễ có thể dời | [WPSR](https://www.eia.gov/petroleum/supply/weekly/) |
| EIA STEO | Dữ liệu/dự báo tháng; chart có thể bình quân năm | Hằng tháng | [EIA release schedule](https://www.eia.gov/reports/upcoming.php) |
| CFTC COT | Vị thế thứ Ba | Thường công bố thứ Sáu | [CFTC](https://www.cftc.gov/MarketReports/CommitmentsofTraders/ReleaseSchedule/index.htm) |
| IMF PortWatch | Lượt tàu theo ngày | Cập nhật tuần; job của dashboard kiểm tra daily | [OCHA vận hành bộ tải chính thức](https://github.com/OCHA-DAP/hdx-scraper-portwatch), [API metadata](https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services/Daily_Chokepoints_Data/FeatureServer/0?f=pjson) |
| JODI Oil · Saudi Arabia, Kuwait | Xuất khẩu dầu thô theo tháng, nghìn thùng/ngày ở nguồn | Cập nhật quanh ngày 20 mỗi tháng; job kiểm trong cửa sổ ngày 18–28 và thứ Hai. Hai nước có chuỗi liên tục ở bộ dữ liệu này; không gọi là tổng Trung Đông. Giữ mã đánh giá của JODI; mã 3 là chưa được đánh giá so sánh. | [JODI downloads](https://www.jodidata.org/oil/database/data-downloads.aspx), [JODI assessment](https://www.jodidata.org/oil/support/user-guide/assessments.aspx) |
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
- `scripts/refresh_release.py` là bộ điều phối; các adapter cũ tiếp tục kiểm schema/đơn vị/kỳ. Workflow commit data và manifest sau khi unit test qua, rồi yêu cầu Pages build cho cấu hình branch legacy. Cron cục bộ 06:15 ngừng dùng từ 06/10/2026 (xem §15).
- Wi vẫn cần MCP phiên agent vì chưa có credential API cho job. Các snapshot nội địa, chính sách, PDF/broker chưa có nguồn máy đọc được vẫn cập nhật theo công bố và giữ cờ hạn chế; không ghi là realtime.

## 14. Design system FinSuccess (29/09/2026)

- Quy tắc màu, chữ và bố cục lấy từ project Stock dashboard được lưu cục bộ trong `DESIGN_RULES.md`; theme dùng chung ở `assets/fin-success-theme.css`. Năm màu: navy `#1D2678`, blue `#2938A8`, turquoise `#59C5C8`, tím `#861C52`, vàng `#FFD45D`; nền trắng, chữ mực đậm và Arial/system sans.
- Áp dụng cho trang tổng và Dầu khí/Đường/Bank qua asset dùng chung. Màu theo ý nghĩa nguồn và cảnh báo vẫn tuân §1–3; `.data-gap`, `.gap-row`, cờ actual/estimate/forecast, dữ liệu và phân tích có ngày giữ nguyên. Không chuyển rule nhập forecast cổ phiếu sang dashboard ngành khi chưa có feature tương ứng.
- OPEC/non-OPEC chuyển từ bảng dài thành chart/sơ đồ trước tồn kho Mỹ; giữ nguyên snapshot T8/2026, các số khác kỳ/phạm vi không cộng. Non-OPEC chưa có đóng góp định lượng đồng kỳ nên chỉ sơ đồ định tính, không tạo số.
- QA bổ sung: unit tests cho parser nhiều bảng, ngày giá, quy đổi đơn vị, ROE quý/missing đầu kỳ, ngân hàng; UI kiểm 6 tab, sort/filter/kỳ, nguồn, thanh địa lý sticky desktop/390px. Lần sửa này không cập nhật lại các nguồn thị trường hiện có.

## 12. Ít chữ hơn, dễ nắm key hơn (20/09/2026, yêu cầu mới nhất — mindset áp dụng cho mọi tab, mọi dashboard)

- **Không ghi lên mặt dashboard những gì người đọc tự suy được từ hình.** Ví dụ đã bỏ: "Các năm mang E là dự báo; không phải số thực hiện" (nhãn E đã nói điều đó), "Mỹ, không đại diện tồn kho toàn cầu" (tiêu đề đã ghi Mỹ), "mỗi hình giữ kỳ và phạm vi riêng", "— bốn cổng đã có đủ số", đoạn đọc chart "đỉnh 2012 → đáy 2020 → …" (chart tự thể hiện). `chart-sub` chỉ còn đơn vị · kỳ · phương pháp ngắn. Dưới chart, `chart-caveat` (`assets/chart-cards.js`) chỉ giữ giới hạn có thể làm hiểu sai số liệu hoặc phạm vi (proxy, ước tính, hạn ngạch ≠ nhập thực, thiếu dữ liệu quan trọng). Bỏ dòng giải thích ký hiệu/kỳ có thể đọc từ trục hoặc nhãn (như `*` = tháng chưa đủ kỳ, YTD), nhắc lại nguồn và kỹ thuật giá (như Yahoo · close, close ≠ settlement, chuyển hợp đồng) nếu đã có trong **Chi tiết dữ liệu**. Mỗi lần thêm caveat phải kiểm phần chi tiết có giữ đủ nội dung trước khi bỏ khỏi mặt card. `.data-gap`/`.gap-row` vẫn giữ nguyên và hiển thị.
- **Một câu hedge chung không lặp lại trên từng card.** Dòng "Đối chiếu quá khứ: cần so cùng phạm vi chính sách…" đã bỏ hẳn; dòng "Tác động: …" nếu giống nhau ở nhiều card thì `research-layout.js` gom thành một dòng `.policy-impact` dưới tiêu đề section. Chú giải màu "Xanh: đang theo dõi · Xám: đã lưu" bỏ; badge chỉ hiện khi "Đã lưu".
- **Catalyst/Risk là một trang, không có tab con.** Bỏ "Dữ liệu & nguồn" và "Phân tích lưu": tín hiệu hiện thẳng dạng tile (câu hỏi cần kiểm chứng + chip thời gian, số lớn, Ảnh hưởng, Đổi đánh giá khi với ngưỡng nổi bật, Cách đối chiếu, giới hạn ngắn, chip bằng chứng ↗, details Góc nhìn analyst). Bên dưới là Kịch bản, rồi hai `details` đóng: **Bảng KPI & ngưỡng theo dõi** (monitor/watch-table gốc) và **Phân tích AI ngày dd/mm/yyyy · bản gốc, chưa cập nhật theo số mới** (bản phân tích cũ, giữ để đối chiếu). Bank giữ 6 chart Wi của tab dưới heading "Dữ liệu theo dõi" (không gấp vì có cảnh báo). `srcrow` của tab chuyển sang Sources. Details tự mở nếu chứa `.data-gap,.gap-row`.
- **Chủ đề nóng: toàn bộ nội dung nằm trong dropdown của chủ đề** (`fold(card,title,{all:true,open:true})`), mở sẵn để cảnh báo vẫn thấy được; heading cũ "7. Hormuz & dòng chảy — tab riêng" bỏ vì trùng tiêu đề fold. Bảng "Nguồn dữ liệu và khả năng tự động cập nhật" là nội dung nguồn → tab Sources.
- **Phần bắt buộc nhiều chữ thì trình bày để nắm key trong 5 giây.** `ResearchLayout.emphasize(root)` tự in đậm/đổi màu số có đơn vị, %, ngày (`.key-number`) trong prose của Policy, Catalyst, Chủ đề nóng, Tổng quan (bỏ qua bảng thường, link, caption, code). Cụm ý chính đánh dấu tay bằng `<mark class="key-phrase">` (ví dụ "dòng tiền về sớm hơn"). **Thay đổi so với quá khứ thì kẻ bảng** `.compare-table` (Trước / Sau / Ý nghĩa): Luật Dầu khí 2026 và các mốc phòng vệ thương mại đường đã chuyển từ đoạn văn/timeline sang bảng, giữ nguyên số liệu và văn bản gốc. Không bịa cột "Trước" khi văn bản không nêu; cột nào chưa xác nhận thì ghi rõ.
- QA: `tests/research-layout.cjs` kiểm không còn `.thesis-view-tabs`, số tín hiệu hiện không cần mở fold, chủ đề nóng mở sẵn và chứa nội dung, bảng nguồn đã sang Sources, có `.key-number`. So trước/sau vẫn phải giữ bảng số, link nguồn, SVG và `.data-gap/.gap-row`.

## 15. Áp rule chung từ Stock dashboard (06/10/2026)

- **Đổi kiểu chart:** mọi chart định lượng có bộ nút **Cột / Cột chồng / Thanh / Đường / Miền** (`assets/chart-types.js`, nạp đồng bộ trước script vẽ chart). Kiểu gốc do renderer của trang vẽ; kiểu khác vẽ lại từ cùng giá trị, không đổi đơn vị, kỳ hay ô trống. Lựa chọn lưu theo từng chart trong trình duyệt. Nút bị khóa khi không hợp lý, có tooltip lý do: **Cột chồng** chỉ khi chart khai báo `stackable:true` (chuỗi cộng được: khí nội địa + LNG, sản lượng 4 nước, trái phiếu, cơ cấu TOI); **Đường/Miền** chỉ cho chuỗi thời gian; **Thanh** tối đa 40 kỳ. Đường phủ trong chart combo (bình quân 7 ngày, tiêu thụ) giữ là đường. Miền chồng chỉ khi cộng được, đủ số và không âm; còn lại tô nhạt chồng lên nhau. Màu từng chuỗi giữ nguyên để khớp legend. Không áp cho chart so sánh một kỳ theo hạng mục (`hbarCompare`, chart nguồn), dải giá (`rangeDotChart`) và sơ đồ.
- **Bảng lớn thu gọn mặc định:** bảng số liệu nằm trong dropdown đóng (`.dtable`, `.wi-table-fold`). `assets/table-fold.js` tự gấp bảng mới trên 8 dòng chưa nằm trong `details`. Không gấp bảng chứa hoặc nằm trong `.data-gap/.gap-row`, bảng so sánh có bộ lọc (`.comparison-table`), `.compare-table` hoặc phần tử có `data-no-fold`.
- **Bảng màu:** chỉ dùng token trong `DESIGN_RULES.md`; sơ đồ luồng vốn Bank, chuỗi giá trị và chart nguồn đã chuyển khỏi màu xanh rêu cũ.
- **Cập nhật trên cloud:** GitHub Actions (`refresh-data.yml`, 07:30 và 15:30) là đường cập nhật duy nhất, không phụ thuộc máy bật; tự commit và publish khi test qua. Thông báo Zalo khi nguồn chuyển sang lỗi, phục hồi, có số mới hoặc job lỗi (chỉ báo lúc chuyển trạng thái). Wi (Bank) vẫn cần phiên Claude có WiMCP. Các bước chuyển sang GitHub của FISC ở `scripts/README.md`.


## 16. Lịch cập nhật theo kỳ của từng nguồn (06/10/2026)

- **Một danh mục duy nhất:** `updates/registry.json` liệt kê mọi khối dữ liệu (mã card `data-block-id`, nhóm, nguồn có link, lịch công bố, lịch kiểm, cách cập nhật, điều kiện kiểm). Thêm card dữ liệu mới thì phải thêm vào registry; `tests/test_update_scheduler.py` báo lỗi nếu card không có lịch.
- **Bốn nhóm:** A = script nguồn công khai (`refresh_release.py` + `polling_policy.py`, 07:30 và 15:30); B = Wi qua WiMCP; C = tài liệu/sự kiện Claude đọc; D = lời bình AI viết lại khi số liệu nền đổi (tối thiểu 7–28 ngày một lần). Khối tĩnh không có lịch.
- **Xếp hàng chờ:** `scripts/update_scheduler.py --run --watch` chạy trong cùng job GitHub: kiểm 17 watcher (RSS NSO, danh sách BCTC CafeF theo mã, IR doanh nghiệp, Bộ Công Thương, PSD USDA, báo cáo CTCK), thấy tài liệu mới hoặc đến lịch thì đưa mục B/C/D vào `updates/state.json`. Watcher lần đầu chỉ ghi mốc; mỗi mục được rà một lần khi registry mới tạo.
- **Claude routine 08:00 T2–T6** xử lý tối đa 6 mục/lượt theo `updates/ROUTINE.md`, kiểm số, chạy test, chuẩn bị release, push thẳng `main` (người dùng cho phép tự publish) và ghi `updates/routine-notify.txt` để workflow `routine-notify.yml` gửi Zalo/Telegram.
- **Lịch đã kiểm:** NSO công bố ngày 3 hằng tháng từ 05/2026 (QĐ 03/QĐ-CTK); BCTC quý ≤20 ngày (công ty mẹ 30), bán niên ≤45/60, năm kiểm toán ≤90 ngày (TT96/2020, VBHN 10/2026); điều hành giá xăng dầu thứ Năm (NĐ 80/2023, dự thảo thay thế có thể bỏ từ 2027); TRQ đường thường quyết định tháng 8–9, đấu giá tháng 9–10. USDA không còn báo cáo GAIN đường Việt Nam từ 2021, dùng PSD. VSSA và Hải quan không có trang đọc được bằng máy.
- **Last-good trên cloud:** `update_daily.py` đọc bản mới hơn giữa `data/daily.json` và `data/daily-data.js`; trước 06/10/2026 runner không có `daily.json` nên nguồn lỗi bị xóa số (Petrolimex, Sugar futures). Nguồn A lỗi kéo dài được nhắc lại mỗi 7 ngày.
- **Wi không chép tay (06/10/2026):** hook PostToolUse trong `.claude/settings.json` (`scripts/wi_capture.py`) lưu nguyên văn mọi kết quả WiMCP vào `data/raw/wi/.inbox/`. `scripts/wi_ingest.py plan <mục>` liệt kê lệnh cần gọi (lấy từ `request` của từng file raw, có kỳ chồng lấn); `ingest <mục>` ghép theo `data/bank-wi-ingest.json`, ghi số Wi sửa vào `revisions` của file, chặn khi kết quả bị cắt (thiếu kỳ cũ trong cửa sổ). Lần chạy đầu thấy Wi sửa GDP Q2/2026 8,39% → 8,81% và xuất khẩu các tháng. Hook chỉ chạy khi phiên cloud có đúng một repo. BCTC quý của Wi (tên file gắn kỳ 2026q2) là giai đoạn 2, cần xong trước mùa BCTC 15/10.
- **Ưu tiên của dashboard ngành (06/10/2026, người dùng chốt):** dữ liệu thị trường cập nhật nhanh, mới nhất để analyst theo kịp xu hướng đầu tư. Số BCTC/báo cáo doanh nghiệp (BSR, PLX, PVD/PVS/GAS, SBT và nhóm đường, PV GAS thường niên, Wi BCTC quý ngân hàng) **chỉ cập nhật khi người dùng nhắn** — registry để `status: manual`, không watcher, không vào hàng chờ, không tốn token quét định kỳ. Ngành mới: khối dữ liệu thị trường/ngành vào nhóm A (script) hoặc B/C có lịch; khối số doanh nghiệp để manual. Trong cửa sổ phát hành, mọi lượt job (07:30, 15:30) đều kiểm lại nguồn A (cách nhau ≥ 6 giờ), nguồn ra sau lượt sáng vẫn lên web trong chiều.
- **Định giá doanh nghiệp hằng ngày (06/10/2026, người dùng làm rõ):** số theo giá thị trường (P/E, P/B, vốn hóa, giá) tự cập nhật mỗi phiên; số BCTC (doanh thu, biên, tồn kho, LNST, ROE…) chỉ cập nhật khi người dùng nhắn. `scripts/update_valuation.py` lấy `ratios/latest` của VNDirect (P/E 51006, P/B 51012, vốn hóa 51003) rồi điều chỉnh theo giá đóng cửa phiên mới nhất (`stock_prices`, phiên coi là đóng sau 15:15 với bản ghi sau ATC 14:45); giá nhảy quá 15% (sự kiện quyền) thì không điều chỉnh. Chạy mọi lượt job, lưu lịch sử 400 phiên (`data/company-valuation.json`), lỗi giữ số cũ (`last_good`), không gửi thông báo "đã cập nhật" hằng ngày. Tab so sánh ưu tiên số này; ô ngoài bảng dùng `data-valuation="MÃ:pe|pb|market_cap"` và `data-valuation-date="MÃ"`.
- **Phân loại cập nhật (06/10/2026, người dùng chốt; chạy hoàn toàn trên cloud, không cần máy người dùng bật):** (1) số có file/API → script GitHub mỗi lượt 07:30, 15:30, không tốn token — ưu tiên chuyển tối đa chart về loại này (vd cung cầu dầu toàn cầu nay tự đọc EIA STEO `3atab`, nguồn `world_balance`, thay bản gõ tay tháng 8); (2) số Wi → routine Claude hằng ngày 08:00 T2–T6 (`--tiers B`); (3) chart phải đọc tài liệu và (4) insight AI → routine Claude hằng tuần thứ Hai 08:30 (`--tiers C,D`), insight chỉ viết lại khi số nền đổi vượt ngưỡng `material` (registry); (5) số BCTC → khi người dùng nhắn.
- **Rà chart 06/10/2026:** 20 chart Dầu khí/Đường đã tự cập nhật từ script; chuyển thêm 3 chart cân đối đường Việt Nam (USDA PSD `sugar_vn_balance`, có niên vụ dự báo 2026/27) và cung cầu dầu toàn cầu (EIA STEO `world_balance`) sang script. Sugar No.11: khi Yahoo SB=F hỏng, script dùng một hợp đồng niêm yết gần nhất (vd SBH27), ghi rõ mã hợp đồng, không ghép chuỗi. Còn đọc tài liệu (routine tuần): sản lượng dầu khí VN (NSO; Wi bảng 41 có chuỗi tháng 82079/82080 nếu muốn chuyển sang nhóm B), giá đường trong nước/khu vực, mía ép, diện tích, giá mía, HFCS, nhập lậu ước tính. Số BCTC (PLX, BSR, PV GAS, SBT, nhóm đường) theo yêu cầu.

## 17. Dashboard Điện (06/10/2026)

- **Phạm vi người dùng chốt:** ngành điện; 4 nhóm doanh nghiệp (nhiệt điện, thủy điện, năng lượng tái tạo, lưới – xây lắp – thiết bị), 18 mã; chủ đề nóng gồm cả 3: El Niño & thủy văn, giá điện & tài chính EVN, chuyển dịch năng lượng. Nguồn chỉ mở trong nước (NSMO giá thị trường giờ, EVN hồ chứa) tạm bỏ qua, ghi rõ là khoảng trống ở Sources.
- **Trang:** `Dien/index.html` (`<body data-sector="power">`), dựng từ các mảnh trong phiên làm việc; các file dùng chung nhận ngành thứ tư qua `document.body.dataset.sector==='power'` (không dựa vào id chart). Mã card `dien-01`…`dien-29`, tất cả có lịch trong `updates/registry.json` (`power.*`).
- **Nhóm A (script, không tốn token):** `scripts/power_feeds.py` qua `update_daily.py`: `vn_power_daily` (bản tin vận hành ngày của EVN từ 28/05/2023; sai số tổng thành phần, trùng số, lệch ngày → loại vào `excluded`, không lấp), `wb_energy_monthly` (World Bank than, LNG, khí), `enso_oni`, `nino34_weekly` (NOAA CPC), `coal_newcastle`, `lng_jkm` (ICE, một hợp đồng, không ghép), `henry_hub` (EIA). Tổng tháng cộng từ bản tin ngày khớp thông cáo tháng EVN trong ±0,5%.
- **Nhóm C/D:** giá bán lẻ, tài chính EVN, cơ chế giá (NĐ 72/2025 → NĐ 278/2026), QHĐ VIII (QĐ 768), DPPA/mái nhà (NĐ 57, 58 → 243), thị trường bán buôn (TT 29/2026), pipeline LNG/BESS/hạt nhân, tranh chấp FIT → routine tài liệu thứ Hai. Lời bình chu kỳ viết lại khi ONI đổi ≥0,3 °C hoặc than/LNG đổi ≥10%.
- **Hạn chế còn ghi trên trang:** chưa có giá thị trường điện theo giờ (SMP) và mực nước hồ; công suất theo nguồn mới có số EVN ước cuối 2025; chưa có chuỗi sản lượng năm 2019–2025 đã đối chiếu.
- **Biểu đồ mùa vụ (08/10/2026):** tổng sản lượng tháng và sản lượng từng nguồn (thủy điện, khí & dầu, than, gió & mặt trời, nhập khẩu) dùng nhóm cột T01–T12, các năm gần nhất đứng cạnh nhau. Cộng từ chính bản tin EVN đang dùng; tháng thiếu ngày giữ giá trị quan sát, làm nhạt cột và ghi số ngày trong bảng, không quy đổi ra cả tháng. Bảng tỷ trọng nguồn gốc vẫn mở được trong Chi tiết dữ liệu của card thủy điện. Các nguồn tách thành card riêng nhưng cùng `vn_power_daily` và lịch cập nhật.
- **Nguồn đóng góp tăng trưởng (08/10/2026):** bên dưới chart mục tiêu tổng sản lượng 2030, so sản lượng lũy kế 9 tháng 2025–2026 bằng cột đôi theo 5 nhóm EVN công bố; bảng hiện mức tỷ kWh, chênh lệch tuyệt đối và % cùng kỳ. Xếp nhóm theo chênh lệch giảm dần để thấy nguồn tăng đáng kể. Phần tăng ròng của 5 nhóm có thể lệch tổng EVN do làm tròn/nhóm khác; ghi rõ khi tỷ lệ tăng trưởng tổng EVN công bố không khớp hai mức tổng được công bố. QĐ 768 chỉ cho tổng kWh mục tiêu 2030 và công suất MW theo nguồn; không suy sản lượng kWh 2030 theo nguồn từ công suất.

## Catalyst/Risk dạng kết luận trước (thí điểm Dầu khí, 08/10/2026)

- Thứ tự đọc: **Kết luận hiện tại** (tiêu đề + 2–3 ý có số + nghiêng theo 5 khâu) → **Bảng điểm tín hiệu** (mới nhất / so 1 tuần trước / ngưỡng / trạng thái / tác động tới; xếp Rủi ro → Sát ngưỡng → Hỗ trợ → Bối cảnh; bấm tên mở biểu đồ gốc) (cột trạng thái ghi thẳng Catalyst / Risk) → **Sắp tới** → fold **Chi tiết từng tín hiệu** (tile cũ) → KPI → Phân tích AI bản gốc.
- Câu kết luận, trạng thái và các ý catalyst/risk đều tính từ `SECTOR_DAILY` theo ngưỡng (Hormuz BQ7 30, crack gasoil Singapore 60, distillate Mỹ 115, cân đối EIA năm nay/năm sau). Số đổi qua ngưỡng thì câu chữ đổi theo; feed lỗi/thiếu thì là "Thiếu dữ liệu". Lịch chỉ ghi mốc định kỳ, mốc chưa xác nhận ghi rõ "Chưa xác nhận".
- Ngành khác giữ layout cũ cho tới khi người dùng duyệt bản Dầu khí.
- Rút gọn 08/10/2026 theo phản hồi "dài, nhiều chữ": bỏ gạch đầu dòng dưới kết luận và hai cột Catalyst|Risk vì lặp số với bảng; ô khâu chỉ còn mũi tên + 2–3 chữ; lịch chỉ ngày + sự kiện.
- Bỏ khối Kịch bản ở Dầu khí (08/10/2026, người dùng yêu cầu): khung 03/09 lệch giá hiện tại.
- Ẩn luôn các fold Chi tiết tín hiệu, Bảng KPI, Phân tích AI 03/09 và Góc nhìn analyst ở Dầu khí (class `.oil-compact`, 08/10/2026). Vẫn giữ trong DOM để srcrow sang Sources; muốn hiện lại thì bỏ class.

## Sub-tab trong tab lớn (thí điểm Dầu khí, 08/10/2026)

- `assets/pane-subtabs.js` (load sau research-editorial): chia tab lớn thành sub-tab cùng kiểu nút "Thế giới / Việt Nam" (`.supply-tabs .tabbtn`). Nhóm khai báo tường minh bằng selector theo từng tab; node được di chuyển, không nhân bản.
- Dầu khí: **Tổng quan** = Chuỗi giá trị / Mô hình kinh doanh / So sánh tài chính · **Policy** = Điều hành giá / Luật Dầu khí 2026 · **Sources** = Độ tin cậy / Nguồn dữ liệu / Tài liệu khác. Bức tranh ngành giữ sub-tab địa lý sẵn có; Catalyst/Risk đã gọn nên không chia; Chủ đề nóng giữ nút Đang theo dõi / Đã lưu.
- Sub-tab chỉ chứa một khối gấp thì tự mở khi bấm. Link bằng chứng trỏ vào sub-tab ẩn sẽ tự mở sub-tab đó.

## Áp cho tất cả ngành (08/10/2026)

- `assets/catalyst-board.js`: một hàm `renderBrief` dùng chung cho Dầu khí, Điện, Đường, Bank (kết luận → Tín hiệu → Sắp tới; class `.cr-*`, `.brief-compact`). Điện: ONI, Nino 3.4, than Newcastle, LNG JKM, sản lượng ngày, tỷ trọng thủy điện. Đường: Sugar No.11, giá WB, tồn kho/tiêu thụ VN, nhập khẩu, cung 4 trung tâm. Bank: 5 tín hiệu Wi hiện có (trạng thái từ monitor) + snapshot mã/nhóm đang chọn.
- `assets/pane-subtabs.js` có cấu hình theo ngành (oil/power/sugar/bank). Điện: Policy tách theo 3 thẻ; Đường chỉ tách Tổng quan và Sources (Policy chưa tách vì có khối rỗng); Bank tách Tổng quan, Policy, Sources, Bức tranh ngành giữ sub-tab địa lý sẵn có.
- Badge `.update-badge` và chú giải loại nội dung ẩn bằng CSS toàn cục (người dùng: nguồn đã ở icon ghi chú). Dữ liệu `data-update-kind` vẫn giữ trong DOM.

## 18. Dashboard Bất động sản (08/10/2026)

- **Phạm vi người dùng chốt:** nhà ở + khu công nghiệp + cho thuê + môi giới, 20 mã (VHM, NVL, KDH, NLG, DXG, PDR, DIG, CEO, AGG, TCH, NTL · KBC, IDC, BCM, SZC, SIP, VGC, LHG · VRE · DXS); hai tab riêng **Vốn & Trái phiếu** (mt10) và **Pháp lý dự án** (mt11). Kết luận về flow chuẩn: hợp, nhưng sub-tab địa lý Thế giới/Việt Nam thay bằng **Nhà ở / Khu công nghiệp** (hai động cơ khác nhau: tín dụng–pháp lý vs FDI–đất sạch).
- **Trang:** `Bat-dong-san/index.html` (`<body data-sector="realestate">`), block `bds-01`…`bds-40`. Các file dùng chung nhận ngành qua `document.body.dataset.sector==='realestate'`; `sector-layout.js`, `sector-content.js`, `sector-runtime.js` thoát sớm, phần riêng nằm ở `assets/realestate-dashboard.js` (chuỗi giá trị, pane Nhà ở/KCN tạo `#supply-world`/`#supply-vietnam` để `research-layout.js` dùng lại, chart Wi, KPI, đọc nhanh). `catalyst-board.js` có nhánh `re` tính bảng tín hiệu từ `window.REALESTATE_WI`. `research-layout.js` thêm route mt10, mt11 cho ngành này.
- **Nhóm B (Wi, không có feed script):** `data/realestate-wi-contract.json` liệt kê 9 lời gọi WiMCP (TPDN BĐS: cashflow, issuance tháng, lịch đáo hạn 2026/2027; vĩ mô: FDI BĐS 77101/77044, GDP BĐS 80032, CPI nhà ở 75777/75708, tín dụng 75926/75931, tiền gửi 75920, tái cấp vốn 81497, FDI thực hiện 76951, FDI CBCT 77100, IIP CBCT 202899; commodity thép 74362, xi măng 80961; sector_ratio_daily 157/159/160/161). Hook `wi_capture.py` lưu kết quả; `scripts/build_realestate_wi.py` dựng `data/realestate-wi-data.js` (+`.json`), giữ last-good khi thiếu. Lịch đáo hạn 2027 vượt trần hiển thị của tool → `--restore <file tool-results> <capture>`. Endpoint đáo hạn không lọc ngành phía server; lọc `sector_l1 = Bất động sản` khi dựng.
- **Nhóm C (routine tài liệu):** Bộ Xây dựng quý, CBRE/Savills/VARS, Cushman/JLL (KCN), văn bản pháp lý, tín dụng BĐS và lãi vay mua nhà, chủ đề nóng; số rời theo báo cáo, không nối thành chuỗi. Chart tài liệu (`chHousePrice`, `chKcnRent`, `chMortgage`, `chLandPrice`) nằm trong inline JS của trang.
- **Khoảng trống còn ghi trên trang:** chưa có chuỗi tín dụng kinh doanh BĐS theo tháng, lãi vay mua nhà theo chuỗi, số căn mở bán theo tháng; Q3/2026 của Bộ Xây dựng/CBRE chưa công bố; hệ số rủi ro tín dụng BĐS 2026 và cơ chế thuế quan Mỹ sau 24/07/2026 chưa xác minh.

## 19. Chỉnh UX đợt 3 (08/10/2026, áp cho mọi dashboard)

- **Bỏ mục "Dashboard doanh nghiệp"** (placeholder "Sẽ bổ sung dashboard") ở mọi ngành; sub-tab Tổng quan còn Chuỗi giá trị / Mô hình kinh doanh / So sánh tài chính (+ "Doanh nghiệp theo dõi" ở Điện và BĐS, "Mùa vụ & sản phẩm phụ" ở Đường vì còn nội dung riêng).
- **Không để ô trống trong lưới hai cột:** `assets/layout-balance.js` đếm thẻ theo từng đoạn giữa các hàng full-width; đoạn lẻ thì thẻ cuối chiếm cả hàng, chart bên trái, "Cách hiểu trong bối cảnh ngành" (lấy từ popover ⓘ) bên phải; thẻ không có lời đọc vẫn chiếm cả hàng (chart tối đa 760px, canh giữa). Thẻ chart đứng lẻ trước một lưới được nhập vào lưới đó. Thẻ chart mới nên luôn có `chart-insight`.
- **Catalyst/Risk:** kết luận, bảng Tín hiệu và Sắp tới là thẻ trắng chuẩn (class `card`), đầu trang dùng `.sectionhead` như các tab khác; bỏ khối nền navy.
- **Chủ đề nóng:** mỗi chủ đề là một sub-tab (nhãn = phần tên trước " · "), bỏ khung viền xanh và fold lồng nhau; bộ lọc Đang theo dõi/Đã lưu, xuất JSON và "Thêm chủ đề" nằm dưới nội dung; góc nhìn analyst là một fold nhỏ cuối chủ đề.

## 20. BĐS: tách Nhà ở / Khu công nghiệp ở mọi tab (08/10/2026, người dùng chọn giữ một dashboard)

- Bức tranh ngành: pane KCN có FDI CB-CT, vốn thực hiện, IIP, lấp đầy, **P/B–P/E BĐS công nghiệp (bds-41)**, giá thuê đất; pane Nhà ở giữ giá nhà, VLXD, lãi suất, P/B dân cư/cho thuê/môi giới.
- Policy: sub-tab thứ tư **Khu công nghiệp (bds-42)**: NĐ 35/2022, room tín dụng KCN được nới, NQ 254, bảng giá đất phía Nam, thuế quan Mỹ.
- Catalyst/Risk: bảng Tín hiệu có hàng nhóm "Nhà ở" / "Khu công nghiệp" (`group` trong `renderBrief`); bảng không bị `table-fold` gấp (`data-no-fold`).
- Chủ đề nóng: `data-topic-segment` → sub-tab gom theo nhãn Nhà ở / Khu công nghiệp / Chung; thêm chủ đề "Quỹ đất KCN" (bds-43). Pháp lý: cột "Mảng" ở bảng văn bản và dự án; thêm NĐ 35/2022.
- Vốn & Trái phiếu: ghi rõ số chung toàn ngành; builder tính phần đáo hạn của 7 mã KCN + công ty con (`KCN` trong `build_realestate_wi.py`).
- Sửa lỗi: `sector_ratio_recent` chọn capture có `to_time` mới nhất (`pick: max_to_time`); trước đó P/B phân ngành lấy nhầm số 06/10/2025.
