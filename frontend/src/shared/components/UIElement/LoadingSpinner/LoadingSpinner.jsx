import React from 'react';
import './LoadingSpinner.css';

/**
 * A customizable loading spinner component with overlay.
 *
 * @component
 *
 * @param {object} props - Component props
 * @param {string} [props.id] - Unique ID for the spinner
 * @param {string} [props.mainClass] - Main CSS class for the spinner
 * @param {string} [props.addClass] - Additional CSS classes
 * @param {React.CSSProperties} [props.style] - Inline styles
 * @param {string} [props.message='Đang tải...'] - Message to display below the spinner
 * @param {boolean} [props.isVisible=true] - Controls visibility of the spinner
 * @param {string} [props.spinnerColor] - Custom color for the spinner (overrides default)
 * @param {string} [props.messageColor] - Custom color for the message text (overrides default)
 * @param {number} [props.size=50] - Size of the spinner in pixels
 * @param {number} [props.overlayOpacity=0.7] - Opacity of the overlay background
 *
 * @example
 * // Basic usage
 * <LoadingSpinner />
 *
 * @example
 * // Customized spinner
 * <LoadingSpinner
 *   message="Đang xử lý yêu cầu..."
 *   spinnerColor="#FF0000"
 *   size={60}
 *   overlayOpacity={0.8}
 * />
 *
 * @example
 * // With visibility control
 * <LoadingSpinner isVisible={isLoading} />
 *
 * @example
 * // Adding custom classes
 * <LoadingSpinner
 *   mainClass="custom-spinner"
 *   addClass="my-3"
 * />
 */
const LoadingSpinner = ({
                            id,
                            mainClass = '',
                            addClass = '',
                            style = {},
                            message = 'Đang tải...',
                            isVisible = true,
                            spinnerColor,
                            messageColor,
                            size = 50,
                            overlayOpacity = 0.7
                        }) => {
    if (!isVisible) return null;

    // Calculate custom styles
    const spinnerStyle = {
        width: `${size}px`,
        height: `${size}px`,
        ...(spinnerColor && {borderTopColor: spinnerColor}),
        ...style
    };

    const messageStyle = messageColor ? {color: messageColor} : {};

    return (
        <div
            className={`loading-overlay ${addClass} ${mainClass}`.trim()}
            style={{backgroundColor: `rgba(17, 45, 78, ${overlayOpacity})`}}
            id={id}
        >
            <div className="loading-spinner-container">
                <div className="loading-spinner" style={spinnerStyle}></div>
                <p className="loading-message" style={messageStyle}>{message}</p>
            </div>
        </div>
    );
};

export default LoadingSpinner;
