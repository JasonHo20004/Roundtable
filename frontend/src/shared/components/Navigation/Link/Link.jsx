import React from 'react';
import {Link as RouterLink} from 'react-router';
import './Link.css';

/**
 * A customizable wrapper around React Router's Link component.
 * Provides consistent styling, optional dropdown presentation, and access
 * to common Link features and standard anchor attributes.
 *
 * @param {object} props - The component props.
 * @param {string|object} props.href - The destination URL or location object.
 * @param {React.ReactNode} props.children - The content to display within the link.
 * @param {string} [props.className=''] - Additional CSS classes to apply to the link.
 * @param {boolean} [props.isDropdown=false] - If true, applies specific dropdown-item styling.
 * @param {any} [props.reloadDocument] - If this prop is present (regardless of its assigned value: true, false, or empty attribute), a full page reload will occur upon navigation. If this prop is omitted entirely, standard client-side routing occurs.
 * @param {boolean} [props.replace=false] - If true, clicking the link will replace the current entry in the history stack instead of adding a new one.
 * @param {any} [props.state] - Persists state data to the location object, accessible via `useLocation()`.
 * @param {boolean} [props.preventScrollReset=false] - If true, prevents the default scroll-to-top behavior on navigation.
 * @param {'route'|'path'} [props.relative] - Specifies whether the link is relative to the route hierarchy ('route') or the path ('path').
 * @param {string} [props.target] - Specifies where to open the linked document (e.g., '_blank', '_self'). Passed directly to the underlying anchor tag.
 * @param {string} [props.ariaLabel] - Defines a string value that labels the current element for accessibility purposes. Renamed from `aria-label` for JSX compatibility.
 * @param {object} [props.rest] - Any other props accepted by React Router's Link component or standard HTML anchor tags.
 */
export default function Link(props) {
    // Destructure known props. Note reloadDocument is destructured WITHOUT a default value.
    const {
        href,
        children,
        className = '',
        isDropdown = false,
        reloadDocument, // Intentionally no default value here
        replace = false,
        state,
        preventScrollReset = false,
        relative,
        target,
        ariaLabel,
        ...rest // Capture any other props
    } = props;

    // Combine base class, conditional dropdown class, and custom classes
    const combinedClasses = `${className || ''} link text-decoration-none ${
        isDropdown ? 'dropdown-item' : ''
    }`.trim();

    return (
        <RouterLink
            to={href}
            className={combinedClasses}
            // Pass `true` to ReactRouterLink's reloadDocument prop ONLY IF
            // the prop was present on our custom Link component.
            reloadDocument={reloadDocument}
            replace={replace}
            state={state}
            preventScrollReset={preventScrollReset}
            relative={relative}
            target={target}
            aria-label={ariaLabel} // Pass ariaLabel back as aria-label
            {...rest} // Spread remaining props (rest excludes already destructured props like reloadDocument)
        >
            {children}
        </RouterLink>
    );
}
