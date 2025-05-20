import React from 'react';
import './Avatar.css';

/**
 * A simple circular avatar image component.
 *
 * Supports custom sizing, classes, and styling. Great for user profile pictures.
 *
 * @component
 *
 * @param {object} props
 * @param {string} props.src - Image source URL.
 * @param {string} [props.alt] - Alternative text for accessibility.
 * @param {string} [props.mainClass] - Main CSS class for styling.
 * @param {string} [props.addClass] - Additional CSS class names.
 * @param {number|string} [props.width] - Width of the avatar (e.g., `50`, `'3rem'`).
 * @param {number|string} [props.height] - Height of the avatar.
 * @param {React.CSSProperties} [props.style] - Inline styles to apply.
 *
 * @returns {JSX.Element} A styled `<img>` element with rounded avatar styling.
 *
 * @example
 * <Avatar
 *   src="/images/user.png"
 *   alt="User Avatar"
 *   width={40}
 *   height={40}
 *   mainClass="shadow"
 *   addClass="border border-light"
 * />
 */
export default function Avatar(props) {
    return (
        <img
            src={props.src}
            alt={props.alt}
            className={`avatar rounded-circle ${props.addClass || ''} ${props.mainClass || ''}`.trim()}
            width={props.width}
            height={props.height}
            style={props.style}
        />
    );
}
