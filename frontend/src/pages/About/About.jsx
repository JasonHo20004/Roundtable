import React from 'react';
import './About.css';

function About() {
  return (
    <div className="about-container">
      <div className="about-header">
        <h1>Về Roundtable</h1>
        <p className="about-subtitle">Nơi mọi người có tiếng nói bình đẳng</p>
      </div>

      <div className="about-section">
        <h2>Roundtable là gì?</h2>
        <p>
          Roundtable là một nền tảng mạng xã hội nơi mọi người có thể tham gia vào các cộng đồng dựa trên sở thích, chia sẻ nội dung, và tham gia vào các cuộc thảo luận. 
          Lấy cảm hứng từ Reddit, Roundtable được thiết kế để tạo ra một không gian mở cho đối thoại và cộng đồng đa dạng - nơi mọi tiếng nói đều có một chỗ ngồi tại bàn tròn.
        </p>
      </div>

      <div className="about-section">
        <h2>Các tính năng chính</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3>Xác thực người dùng</h3>
            <p>Đăng ký, đăng nhập và quản lý phiên một cách an toàn.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Tạo bài viết</h3>
            <p>Chia sẻ bài viết dạng văn bản, hình ảnh hoặc liên kết.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Bình luận & Thảo luận</h3>
            <p>Hệ thống bình luận đa cấp cho các cuộc thảo luận phong phú.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔺🔻</div>
            <h3>Hệ thống Vote</h3>
            <p>Upvote/Downvote cho bài viết và bình luận theo phong cách karma.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🧵</div>
            <h3>Cộng đồng (Subtables)</h3>
            <p>Tạo và tham gia vào các nhóm dựa trên sở thích.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Tìm kiếm & Lọc</h3>
            <p>Dễ dàng tìm kiếm bài viết, người dùng hoặc cộng đồng.</p>
          </div>
        </div>
      </div>

      <div className="about-section">
        <h2>Cách sử dụng Roundtable</h2>
        <ol className="usage-steps">
          <li><strong>Tạo tài khoản</strong> - Đăng ký để có thể tham gia đầy đủ vào cộng đồng.</li>
          <li><strong>Khám phá cộng đồng</strong> - Tìm và tham gia các Subtables phù hợp với sở thích của bạn.</li>
          <li><strong>Tham gia thảo luận</strong> - Bình luận, vote và tương tác với nội dung từ người dùng khác.</li>
          <li><strong>Chia sẻ nội dung</strong> - Đăng bài viết, hình ảnh hoặc liên kết để chia sẻ với cộng đồng.</li>
          <li><strong>Kết nối</strong> - Tương tác với người dùng khác thông qua bình luận và tin nhắn.</li>
        </ol>
      </div>

      <div className="about-section">
        <h2>Đội ngũ phát triển</h2>
        <p>
          Roundtable được phát triển bởi một nhóm sinh viên đam mê về công nghệ và trải nghiệm người dùng. 
          Chúng tôi tin rằng mạng xã hội có thể là nơi tích cực để chia sẻ ý tưởng và xây dựng cộng đồng.
        </p>
      </div>
    </div>
  );
}

export default About;