import React from 'react';
import './Identifier.css';

/**
 * A small identifier tag for referencing `namespace` entities like subtables or usernames.
 * Displays an abbreviated type (e.g., `s` for subtable, `u` for username) followed by the namespace.
 *
 * @component
 *
 * @param {object} props
 * @param {string} props.namespace - The name or key being identified (e.g., a username or subtable name).
 * @param {'subtable'|'username'|string} [props.type] - Type of entity. Determines abbreviation (`s` or `u`).
 * @param {string} [props.id] - Optional `id` for the wrapper element.
 * @param {string} [props.mainClass] - Main CSS class for styling.
 * @param {string} [props.addClass] - Additional custom classes.
 * @param {React.CSSProperties} [props.style] - Inline styles to apply.
 *
 * @returns {JSX.Element} A stylized identifier like `s/myTable` or `u/username`.
 *
 * @example
 * <Identifier type="user" namespace="johndoe" />
 * // Output: u/johndoe
 */
export default function Identifier(props) {
    const getTypeAbbreviation = (type) => {
        switch (type) {
            case 'subtable':
                return 's';
            case 'user':
                return 'u';
            default:
                return '';
        }
    };

    return (
        <div
            id={props.id}
            className={` identifier ${props.addClass || ''} ${props.mainClass || ''}`.trim()}
            style={props.style}
        >
            {getTypeAbbreviation(props.type)}/{props.namespace}
        </div>
    );
}
