Name (Tên): kiem_tra_liem_chinh_sang_kien

* Description (Mô tả): Kỹ năng chuyên sâu hỗ trợ xây dựng, tối ưu hóa và vận hành công cụ kiểm tra liêm chính học thuật (đạo văn, AI-generated content) cho sáng kiến kinh nghiệm giáo dục trên Google AI Studio. Hỗ trợ tạo app thẩm định, tinh chỉnh prompt, xử lý lỗi quota, và điều chỉnh mức độ khắc khe phù hợp với thực tiễn giáo dục Việt Nam.

* What it should actually do (Mục đích): 
  - Hỗ trợ người dùng tạo và cập nhật ứng dụng trên Google AI Studio để kiểm tra tính nguyên bản, phát hiện đạo văn và nội dung do AI tạo ra của các sáng kiến kinh nghiệm.
  - Tối ưu 4 câu lệnh kiểm tra (Câu lệnh 1-4) theo yêu cầu thực tế (điều chỉnh về năm học tương lai, cấu trúc đề cương, điều kiện vùng biên giới...).
  - Xử lý các vấn đề thường gặp: lỗi quota Gemini, báo lỗi Dorks, độ khắc khe quá mức, xuất báo cáo Word.
  - Hướng dẫn người dùng cách khắc phục lỗi kỹ thuật và cải tiến app để phù hợp với quy trình thẩm định của ngành giáo dục.

* Triggers (Điều kiện kích hoạt):
  - Người dùng yêu cầu "tạo app kiểm tra đạo văn", "xây dựng công cụ thẩm định sáng kiến", "tối ưu prompt Google AI Studio".
  - Người dùng gặp lỗi khi chạy app (quota, Dorks, báo cáo sai, quá khắc khe).
  - Yêu cầu chỉnh sửa 4 câu lệnh kiểm tra, viết Skill.md, hoặc hỗ trợ liên quan đến liêm chính học thuật sáng kiến.
  - Cung cấp file PDF sáng kiến hoặc ảnh chụp màn hình app.

* Instructions (Hướng dẫn sử dụng):
  1. Khi người dùng yêu cầu tạo app mới: Cung cấp prompt hoàn chỉnh tối ưu để dán vào Build mode của Google AI Studio.
  2. Khi app đang chạy: Phân tích lỗi (quota, Dorks, logic sai), đưa prompt chỉnh sửa cụ thể.
  3. Luôn ưu tiên giữ tính cân bằng: Khắc khe nhưng hợp lý với thực tiễn giáo dục Việt Nam (năm học tương lai, cấu trúc đề cương, cơ sở vật chất trường vùng biên).
  4. Hỗ trợ xuất báo cáo Word chuyên nghiệp, thêm lưu ý kiểm tra dữ liệu thực tế trước khi in.
  5. Nếu cần, hướng dẫn cách xử lý quota Gemini (chuyển model Flash, bật billing, chạy từng phần).

* Examples:
  - "Tạo app kiểm tra đạo văn sáng kiến" → Cung cấp prompt đầy đủ.
  - "App bị lỗi quota" → Hướng dẫn khắc phục + prompt tối ưu tiết kiệm token.
  - "App bắt lỗi năm học 2025-2026" → Chỉnh sửa Câu lệnh 1 và 3 cho phù hợp.
  - "Viết Skill.md cho kỹ năng này" → Trả về file Skill.md hoàn chỉnh.

* Notes:
  - Kỹ năng này tập trung vào việc làm cho app trở nên thực tế, công bằng và dễ sử dụng cho cán bộ giáo dục Việt Nam.
  - Luôn nhắc nhở người dùng kiểm tra dữ liệu thực tế trước khi in biên bản thẩm định.