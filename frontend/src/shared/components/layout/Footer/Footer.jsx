import React from "react";

export default function Footer() {
    return (
        <footer className="bg-dark text-light py-4">
            <div className="container">
                <div className="row">
                    {/* Brand and Description */}
                    <div className="col-md-4">
                        <h5>My Website</h5>
                        <p>Providing quality content and resources for developers worldwide.</p>
                    </div>

                    {/* Navigation Links */}
                    <div className="col-md-4">
                        <h5>Quick Links</h5>
                        <ul className="list-unstyled">
                            <li><a href="#" className="text-light text-decoration-none">Home</a></li>
                            <li><a href="#" className="text-light text-decoration-none">About</a></li>
                            <li><a href="#" className="text-light text-decoration-none">Services</a></li>
                            <li><a href="#" className="text-light text-decoration-none">Contact</a></li>
                        </ul>
                    </div>

                    {/* Social Media Links */}
                    <div className="col-md-4">
                        <h5>Follow Us</h5>
                        <a href="#" className="text-light me-3"><i className="fab fa-facebook fa-lg"></i></a>
                        <a href="#" className="text-light me-3"><i className="fab fa-twitter fa-lg"></i></a>
                        <a href="#" className="text-light me-3"><i className="fab fa-instagram fa-lg"></i></a>
                        <a href="#" className="text-light"><i className="fab fa-linkedin fa-lg"></i></a>
                    </div>
                </div>

                {/* Copyright */}
                <div className="text-center pt-3 border-top mt-3">
                    <p className="mb-0">&copy; {new Date().getFullYear()} My Website. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
