import React from 'react';
import {NavLink as RouterNavLink} from 'react-router';
import './NavLink.css';

/**
 * A customizable wrapper around React Router's NavLink component.
 * Provides consistent styling, active/pending state handling (via classes and/or styles),
 * optional dropdown presentation, and access to common NavLink/Link features.
 *
 * Leverages NavLink's ability to dynamically apply styles/classes based on matching state.
 *
 * @param {object} props - The component props.
 * @param {string|object} props.href - The destination URL or location object.
 * @param {React.ReactNode} props.children - The content to display within the link. Can also be a render prop `({ isActive, isPending }) => ReactNode`.
 * @param {string} [props.className=''] - Base CSS classes to apply to the link, regardless of state.
 * @param {string} [props.activeClassName='active'] - CSS class to apply when the link is active.
 * @param {string} [props.pendingClassName='pending'] - CSS class to apply when the navigation is pending (transitioning to the link's destination).
 * @param {object} [props.style={}] - Base inline styles to apply to the link, regardless of state.
 * @param {object} [props.activeStyle={}] - Inline styles to merge when the link is active. Overrides base styles.
 * @param {object} [props.pendingStyle={}] - Inline styles to merge when the navigation is pending. Overrides base and active styles.
 * @param {boolean} [props.isDropdown=false] - If true, applies specific dropdown-item styling class.
 * @param {boolean} [props.end=false] - If true, the link will only be considered active if the current URL matches the 'to' path exactly at its end.
 * @param {boolean} [props.caseSensitive=false] - If true, matching the 'to' path against the URL will be case-sensitive.
 * @param {any} [props.reloadDocument] - If this prop is present (regardless of its assigned value: true, false, or empty attribute), a full page reload will occur upon navigation. If omitted, client-side routing is used.
 * @param {boolean} [props.replace=false] - If true, clicking the link will replace the current entry in the history stack instead of adding a new one.
 * @param {any} [props.state] - Persists state data to the location object, accessible via `useLocation()`.
 * @param {boolean} [props.preventScrollReset=false] - If true, prevents the default scroll-to-top behavior on navigation.
 * @param {'route'|'path'} [props.relative] - Specifies whether the link is relative to the route hierarchy ('route') or the path ('path').
 * @param {string} [props.target] - Specifies where to open the linked document (e.g., '_blank', '_self'). Passed directly to the underlying anchor tag.
 * @param {string} [props.ariaLabel] - Defines a string value that labels the current element for accessibility purposes. Renamed from `aria-label` for JSX compatibility. Note: NavLink automatically sets `aria-current="page"` when active by default.
 * @param {object} [props.rest] - Any other props accepted by React Router's NavLink/Link component or standard HTML anchor tags.
 */
export default function NavLink(props) {
    // Destructure known props, giving defaults where applicable.
    // Note: reloadDocument is destructured WITHOUT a default value for presence checking.
    const {
        href,
        children,
        className = '',
        style: baseStyle = {},
        activeStyle = {},
        pendingStyle = {},
        isDropdown = false,
        end = false,
        caseSensitive = false,
        reloadDocument,
        replace = false,
        state,
        preventScrollReset = false,
        relative,
        target,
        ariaLabel,
        ...rest // Capture any other props
    } = props;

    // Function passed to ReactRouterNavLink's className prop
    const calculateClassName = ({isActive, isPending}) => {
        const baseClasses = ['nav-link', 'text-decoration-none'];   // Base classes for this component design
        if (isDropdown) baseClasses.push('dropdown-item');
        if (className) baseClasses.push(className);                         // Add user-provided base classes
        if (isActive) baseClasses.push('active');        // Add active class if active
        if (isPending) baseClasses.push('pending');     // Add pending class if pending
        return baseClasses.join(' ').trim();
    };

    // Function passed to ReactRouterNavLink's style prop
    const calculateStyle = ({isActive, isPending}) => {
        let combinedStyle = {...baseStyle}; // Start with base styles

        if (isActive) {
            combinedStyle = {...combinedStyle, ...activeStyle}; // Merge active styles
        }
        if (isPending) {
            combinedStyle = {...combinedStyle, ...pendingStyle}; // Merge pending styles (can override active)
        }
        return combinedStyle;
    };

    return (
        <RouterNavLink
            to={href}
            end={end}
            caseSensitive={caseSensitive}
            className={calculateClassName}      // Pass the function to calculate className
            style={calculateStyle}              // Pass the function to calculate style
            reloadDocument={reloadDocument}
            replace={replace}
            state={state}
            preventScrollReset={preventScrollReset}
            relative={relative}
            target={target}
            aria-label={ariaLabel}
            {...rest} // Spread remaining props (e.g., allows passing function as children)
        >
            {children}
        </RouterNavLink>
    );
}