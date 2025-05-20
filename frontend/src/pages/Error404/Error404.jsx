import React, {useEffect, useState} from 'react';
import './Error404.css';
import {useNavigate} from "react-router";

export default function Error404() {
    const [isVisible, setIsVisible] = useState(false);
    const [mousePosition, setMousePosition] = useState({x: 0, y: 0});

    const navigate = useNavigate();

    useEffect(() => {
        // Hiệu ứng fade in khi component mount
        setIsVisible(true);

        // Theo dõi vị trí chuột để tạo hiệu ứng parallax
        const handleMouseMove = (e) => {
            setMousePosition({
                x: (e.clientX - window.innerWidth / 2) / 50,
                y: (e.clientY - window.innerHeight / 2) / 50
            });
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    const handleGoHome = () => {
        navigate('/'); // Use navigate for SPA navigation
    };

    return (
        <div
            className="error-page-container d-flex justify-content-center align-items-center min-vh-100 position-relative overflow-hidden bg-light">
            <div className="error-background position-absolute top-0 start-0 w-100 h-100">
                <div className="error-circle circle-1"></div>
                <div className="error-circle circle-2"></div>
                <div className="error-circle circle-3"></div>
                <div className="error-circle circle-4"></div>
                <div className="error-circle circle-5"></div>
                <div className="error-circle circle-6"></div>
                <div className="error-circle circle-7"></div>
                <div className="error-circle circle-8"></div>
                <div className="error-circle circle-9"></div>
                <div className="error-circle circle-10"></div>
            </div>

            <div className={`error-content ${isVisible ? 'visible' : ''} text-center p-5 bg-white rounded-4 shadow-lg`}>
                <div className="error-icon-container mb-4"
                     style={{
                         transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`
                     }}>

                </div>

                <div className="error-text-container mb-4">
                    <h1 className="error-title display-1 fw-bold mb-2">404</h1>
                    <h2 className="error-subtitle h3 mb-3">That's an error</h2>
                    <p className="error-description text-muted">
                        The requested page was not found on this server.
                    </p>
                </div>


            </div>
        </div>
    );
}
