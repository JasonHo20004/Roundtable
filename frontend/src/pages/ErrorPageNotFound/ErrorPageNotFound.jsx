import React, {useEffect, useState} from 'react';
import './ErrorPageNotFound.css';

export default function ErrorPageNotFound() {
    const [isVisible, setIsVisible] = useState(false);
    const [mousePosition, setMousePosition] = useState({x: 0, y: 0});

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
        window.location.href = '/';
    };

    return (
        <div className="error-page-container">
            <div className="error-background">
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

            <div className={`error-content ${isVisible ? 'visible' : ''}`}>
                <div className="error-icon-container"
                     style={{
                         transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`
                     }}>

                </div>
                <h1 className="error-title">NOT FOUND</h1>
                <h2 className="error-subtitle">Không tìm thấy trang</h2>
                <p className="error-description">
                    Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
                </p>

            </div>
        </div>
    );
}
