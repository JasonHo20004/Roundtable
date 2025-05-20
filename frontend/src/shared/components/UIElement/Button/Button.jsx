// src/shared/components/UIElement/Button/Button.jsx
import React, {useEffect, useRef} from 'react';
import './Button.css';

/**
 * A highly flexible and Bootstrap-compatible button component.
 *
 * Supports:
 * - Optional outline/background styles
 * - Optional rounded-pill styling (default) or standard corners
 * - Configurable content alignment (justify-content)
 * - Tooltip integration via Bootstrap
 * - External link handling
 * - Icon or text-based content types
 * - Utility props for accessibility, spacing, and interaction
 * - Button types for form interactions
 * - ARIA attributes for popup interactions
 *
 * @component
 *
 * @param {object} props
 * @param {string} [props.id] - Unique ID for the element.
 * @param {'icon'|'text'} [props.contentType] - Controls visual layout styling (e.g. icon buttons).
 * @param {(event: React.MouseEvent<HTMLButtonElement>) => void} [props.onClick] - Click handler.
 * @param {(event: React.MouseEvent<HTMLButtonElement>) => void} [props.onMouseDown] - Mouse down handler. Useful for preventing default behavior in certain scenarios (like popover triggers).
 * @param {{ color: string, depth?: string }} [props.outline] - Outline styling (e.g. `{ color: 'primary', depth: '2' }`).
 * @param {{ color: string }} [props.background] - Background styling (e.g. `{ color: 'success' }`). Implies solid button color (e.g., `btn-success`) if `outline` is not set.
 * @param {string|number} [props.padding] - Bootstrap padding size (e.g. `'3'`, `'p-1'`). Defaults to 'p-2'.
 * @param {string} [props.mainClass] - Main CSS class(es) applied before others.
 * @param {string} [props.addClass] - Extra CSS class(es) appended at the end.
 * @param {boolean} [props.rounded=true] - Whether the button should have fully rounded corners (`rounded-pill`). Set to `false` for standard Bootstrap button corners.
 * @param {'start'|'center'|'end'|'between'|'around'|'evenly'} [props.justifyContent='center'] - Controls horizontal alignment of content within the button using Bootstrap's flexbox `justify-content-*` classes. Common values: 'start', 'center', 'end'.
 * @param {string} [props.tooltipPlacement] - Tooltip placement (e.g., `'top'`, `'bottom'`). Requires `tooltipTitle`.
 * @param {string} [props.tooltipTitle] - Tooltip text. Enables Bootstrap tooltip.
 * @param {string} [props.dataBsToggle] - Bootstrap toggle attribute (e.g., `'tooltip'`, `'modal'`). Automatically set to 'tooltip' if `tooltipTitle` is provided.
 * @param {string} [props.dataBsTarget] - Bootstrap target attribute (e.g., for modals).
 * @param {string} [props.dataBsTrigger] - Bootstrap trigger attribute (e.g., for tooltips/popovers). Defaults to 'hover focus' for tooltips.
 * @param {string} [props.dataBsDismiss] - Bootstrap dismiss attribute (e.g., for modals/alerts).
 * @param {string} [props.ariaLabel] - ARIA label for accessibility, especially important for icon buttons. Defaults to `tooltipTitle` for icon buttons if not provided.
 * @param {boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'} [props.ariaHaspopup] - Indicates the availability and type of interactive popup element (like a menu or dialog) that can be triggered by the button.
 * @param {boolean} [props.ariaExpanded] - Indicates whether a popup element controlled by the button is currently expanded or collapsed.
 * @param {boolean} [props.disabled=false] - Whether the button is disabled.
 * @param {'button'|'submit'|'reset'} [props.type='button'] - Button type for forms.
 * @param {string} [props.form] - The ID of the form the button is associated with.
 * @param {React.ReactNode} props.children - The button's content (text, icon, etc.).
 * @param {string} [props.className] - Optional external className to override internal styling.
 *
 * @returns {JSX.Element} A fully styled, behavior-rich button element.
 *
 * @example
 * // Simple centered button (default alignment)
 * <Button background={{ color: 'primary' }}>
 * Centered Text
 * </Button>
 *
 * @example
 * // Content aligned left (start), full width
 * <Button
 * background={{ color: 'secondary' }}
 * justifyContent="start"
 * addClass="w-100"
 * >
 * <i className="bi bi-arrow-left me-2"></i> Left Aligned
 * </Button>
 *
 * @example
 * // Icon button with tooltip, standard corners
 * <Button
 * contentType="icon"
 * outline={{ color: 'secondary' }}
 * rounded={false}
 * tooltipTitle="Settings"
 * // ariaLabel="Settings" // Automatically inferred from tooltipTitle for icon buttons
 * >
 * <i className="bi bi-gear"></i>
 * </Button>
 *
 * @example
 * // Button acting as a popover trigger (for PopoverMenu)
 * <Button
 * background={{ color: 'info' }}
 * ariaHaspopup="listbox"
 * ariaExpanded={isPopoverOpen} // Controlled by state (e.g., const [isPopoverOpen, setOpen] = useState(false))
 * onClick={togglePopover}      // Function to toggle the popover state
 * onMouseDown={(e) => e.stopPropagation()} // Important for PopoverMenu interaction
 * >
 * Open Menu
 * </Button>
 *
 * @example
 * // Submit button associated with an external form
 * <Button type="submit" form="myFormId" background={{ color: 'primary' }}>
 * Submit External Form
 * </Button>
 */
export default function Button(props) {
    const {
        id,
        contentType,
        onClick,
        onMouseDown,
        outline,
        background,
        padding,
        mainClass,
        addClass,
        rounded = true,
        justifyContent = 'center',
        tooltipPlacement = 'top',
        tooltipTitle,
        dataBsToggle,
        dataBsTarget,
        dataBsTrigger,
        dataBsDismiss,
        ariaLabel,
        ariaHaspopup,
        ariaExpanded,
        disabled = false,
        type = 'button',
        children,
        className,
        form,
    } = props;

    const buttonRef = useRef(null);
    const tooltipInstance = useRef(null);

    // --- Tooltip Effect ---
    useEffect(() => {
        const BootstrapTooltip = window.bootstrap?.Tooltip;
        if (tooltipTitle && BootstrapTooltip && buttonRef.current) {
            tooltipInstance.current = new BootstrapTooltip(buttonRef.current, {
                title: tooltipTitle,
                placement: tooltipPlacement,
                trigger: dataBsTrigger || 'hover focus',
                toggle: dataBsToggle && dataBsToggle !== 'tooltip' ? dataBsToggle : undefined,
            });
        }
        return () => {
            tooltipInstance.current?.dispose();
            tooltipInstance.current = null;
        };
    }, [tooltipTitle, tooltipPlacement, dataBsTrigger, dataBsToggle]);

    // --- Update Tooltip Title Dynamically ---
    useEffect(() => {
        if (tooltipInstance.current) {
            tooltipInstance.current.setContent?.({'.tooltip-inner': tooltipTitle}) ||
            (buttonRef.current && buttonRef.current.setAttribute('title', tooltipTitle));
        } else if (buttonRef.current && tooltipTitle && !window.bootstrap?.Tooltip) {
            buttonRef.current.setAttribute('title', tooltipTitle);
        } else if (buttonRef.current && !tooltipTitle) {
            buttonRef.current.removeAttribute('title');
        }
    }, [tooltipTitle]);

    // --- Click Handler ---
    const handleClick = (e) => {
        if (disabled) {
            e.preventDefault();
            return;
        }
        onClick?.(e);
        tooltipInstance.current?.hide();
    };

    // --- MouseDown Handler ---
    const handleMouseDown = (e) => {
        if (disabled) {
            e.preventDefault();
            return;
        }
        onMouseDown?.(e);
    };

    /// --- Determine Final Classes ---
    let finalClasses;

    if (className) {
        finalClasses = `${className}${disabled && !className.includes('disabled') ? ' disabled' : ''}`.trim().replace(/\s+/g, ' ');
    } else {
        const internalClasses = ['btn'];
        if (contentType === 'icon') {
            internalClasses.push('btn-icon');
        }

        let styleClass = '';
        if (outline) {
            styleClass = `btn-outline-${outline.color}`;
            if (outline.depth) styleClass += ` btn-outline-depth-${outline.depth}`;
            if (background) {
                if (['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark', 'white', 'transparent'].includes(background.color)) {
                    styleClass += ` bg-${background.color}`;
                } else {
                    console.warn(`Custom background color "${background.color}" used with outline; apply custom CSS if needed.`);
                }
            }
        } else if (background) {
            styleClass = `btn-${background.color}`;
        }
        if (styleClass) {
            internalClasses.push(styleClass);
        }

        if (rounded) {
            internalClasses.push('rounded-pill');
        }

        internalClasses.push(
            'd-flex',
            `justify-content-${justifyContent}`,
            'align-items-center'
        );
        internalClasses.push(padding ? (String(padding).startsWith('p-') ? padding : `p-${padding}`) : 'p-2');
        if (addClass) {
            internalClasses.push(addClass);
        }
        if (mainClass) {
            internalClasses.push(mainClass);
        }
        if (disabled) {
            internalClasses.push('disabled');
        }

        finalClasses = internalClasses.join(' ').trim().replace(/\s+/g, ' ');
    }

    // --- Props for the element ---
    const commonProps = {
        id: id,
        ref: buttonRef,
        className: finalClasses,
        onClick: handleClick,
        onMouseDown: handleMouseDown,
        ...(tooltipTitle && {'data-bs-toggle': dataBsToggle || 'tooltip'}),
        ...(tooltipTitle && {'data-bs-placement': tooltipPlacement}),
        ...(tooltipTitle && {'data-bs-trigger': dataBsTrigger || 'hover focus'}),
        ...(dataBsTarget && {'data-bs-target': dataBsTarget}),
        ...(dataBsDismiss && {'data-bs-dismiss': dataBsDismiss}),
        'aria-label': ariaLabel || (contentType === 'icon' && tooltipTitle ? tooltipTitle : undefined),
        'aria-haspopup': ariaHaspopup,
        'aria-expanded': ariaExpanded,
        disabled: disabled || undefined, // Ensure 'disabled' attribute is absent if not true
        type: type,
        form: form, // 'form' prop added to be passed to the HTML button
    };

    // Clean up undefined/null props to avoid rendering them as attributes
    Object.keys(commonProps).forEach(key => {
        if (commonProps[key] === undefined || commonProps[key] === null) {
            delete commonProps[key];
        }
    });

    return (
        <button {...commonProps}>
            {children}
        </button>
    );
}