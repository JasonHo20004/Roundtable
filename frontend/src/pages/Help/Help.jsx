import React from 'react';
import './Help.css';

function Help() {
  return (
    <div className="help-container">
      <div className="help-header">
        <h1>Trung tâm trợ giúp Roundtable</h1>
        <p className="help-subtitle">Hướng dẫn và câu hỏi thường gặp</p>
      </div>

      <div className="help-section">
        <h2>Câu hỏi thường gặp</h2>
        <div className="faq-container">
          <div className="faq-item">
            <h3>Làm thế nào để tạo tài khoản?</h3>
            <p>
              Để tạo tài khoản trên Roundtable, nhấp vào nút "Đăng ký" ở góc trên bên phải của trang. 
              Điền thông tin cần thiết như tên người dùng, email và mật khẩu, sau đó làm theo hướng dẫn để hoàn tất quá trình đăng ký.
            </p>
          </div>
          
          <div className="faq-item">
            <h3>Làm thế nào để tham gia một cộng đồng (Subtable)?</h3>
            <p>
              Để tham gia một Subtable, bạn có thể tìm kiếm cộng đồng quan tâm bằng thanh tìm kiếm, 
              hoặc duyệt qua danh sách cộng đồng phổ biến. Khi tìm thấy cộng đồng bạn muốn tham gia, 
              nhấp vào nút "Tham gia" để trở thành thành viên.
            </p>
          </div>
          
          <div className="faq-item">
            <h3>Làm thế nào để đăng bài viết?</h3>
            <p>
              Để đăng bài viết, trước tiên hãy chọn cộng đồng (Subtable) nơi bạn muốn đăng. 
              Sau đó, nhấp vào nút "Tạo bài viết" và chọn loại bài viết (văn bản, hình ảnh hoặc liên kết). 
              Điền tiêu đề, nội dung và nhấp "Đăng" để chia sẻ bài viết của bạn.
            </p>
          </div>
          
          <div className="faq-item">
            <h3>Hệ thống karma hoạt động như thế nào?</h3>
            <p>
              Karma là điểm số phản ánh đóng góp của bạn cho cộng đồng Roundtable. 
              Bạn nhận được karma khi bài viết hoặc bình luận của bạn được upvote, 
              và mất karma khi chúng bị downvote. Karma cao giúp xây dựng uy tín trong cộng đồng.
            </p>
          </div>
          
          <div className="faq-item">
            <h3>Làm thế nào để thay đổi thông tin cá nhân?</h3>
            <p>
              Để thay đổi thông tin cá nhân, hãy truy cập trang hồ sơ của bạn bằng cách nhấp vào tên người dùng ở góc trên bên phải, 
              sau đó chọn "Cài đặt hồ sơ". Tại đây, bạn có thể cập nhật ảnh đại diện, tiểu sử và các thông tin cá nhân khác.
            </p>
          </div>
        </div>
      </div>

      <div className="help-section">
        <h2>Hướng dẫn sử dụng</h2>
        <div className="guide-container">
          <div className="guide-item">
            <h3>Tìm kiếm nội dung</h3>
            <p>
              Sử dụng thanh tìm kiếm ở đầu trang để tìm bài viết, cộng đồng hoặc người dùng. 
              Bạn có thể lọc kết quả tìm kiếm theo loại, thời gian và mức độ phổ biến.
            </p>
          </div>
          
          <div className="guide-item">
            <h3>Tùy chỉnh feed của bạn</h3>
            <p>
              Trang chủ của bạn hiển thị nội dung từ các cộng đồng bạn đã tham gia. 
              Để tùy chỉnh feed, hãy tham gia thêm cộng đồng hoặc sử dụng tùy chọn sắp xếp (Mới nhất, Phổ biến, Thịnh hành).
            </p>
          </div>
          
          <div className="guide-item">
            <h3>Bình luận và thảo luận</h3>
            <p>
              Nhấp vào liên kết bình luận dưới bài viết để xem và tham gia thảo luận. 
              Bạn có thể trả lời bình luận cụ thể bằng cách nhấp vào nút "Trả lời" dưới bình luận đó.
            </p>
          </div>
        </div>
      </div>

      <div className="help-section">
        <h2>Liên hệ hỗ trợ</h2>
        <p>
          Nếu bạn không tìm thấy câu trả lời cho câu hỏi của mình, vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi:
        </p>
        <div className="contact-info">
          <p><strong>Email:</strong> support@roundtable.com</p>
          <p><strong>Thời gian phản hồi:</strong> Trong vòng 24 giờ làm việc</p>
        </div>
      </div>
    </div>
  );
}

export default Help;