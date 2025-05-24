import React from "react";

export default function Footer() {
    return (
        <footer className="bg-dark text-light py-4">
            <div className="container">
                <div className="row">
                    {/* Brand and Description */}
                    <div className="col-md-4">
                        <h5>Roundtable</h5>
                        <p>Nền tảng thảo luận và chia sẻ ý kiến hàng đầu. Kết nối cộng đồng, xây dựng cuộc trò chuyện có giá trị.</p>
                    </div>

                    {/* Navigation Links */}
                    <div className="col-md-4">
                        <h5>Quick Links</h5>
                        <ul className="list-unstyled">
                            <li><a href="/" className="text-light text-decoration-none">Home</a></li>
                            <li><a href="/about" className="text-light text-decoration-none">About Roundtable</a></li>
                            <li><a href="/help" className="text-light text-decoration-none">Help Center</a></li>
                        </ul>
                    </div>

                    {/* Social Media Links */}
                    <div className="col-md-4">
                        {/* <h5>Follow Us</h5>
                        <a href="https://www.facebook.com/tui.ten.thun/" className="text-light me-3"><i className="fab fa-facebook fa-lg"></i>Facebook</a>
                         */}
                        <div className="mt-3">
                            <h6 className="mb-2">Liên hệ với chúng tôi</h6>
                            <ul className="list-unstyled small">
                                <li><i className="fas fa-envelope me-2"></i>Email: support@roundtable.com</li>
                                
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="text-center pt-3 border-top mt-3">
                    <p className="mb-0">&copy; {new Date().getFullYear()} Roundtable. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
