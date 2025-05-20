import React, {useCallback, useEffect, useRef, useState} from 'react';
import './PopoverMenu.css';

/**
 * A popover menu component with a white background.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.trigger - The element that triggers the popover.
 * @param {React.ReactNode} props.children - The content (rows/items). Should be elements like button, a, span, div. Base styling is applied automatically.
 * @param {string} [props.position='bottom-end'] - Popover position ('bottom-start', 'bottom-end', 'top-start', 'top-end').
 * @param {object} [props.menuStyle={}] - Custom inline styles for the popover menu container.
 * @param {boolean} [props.controlledIsOpen] - Optional: Control visibility externally.
 * @param {function} [props.onClose] - Optional: Callback when popover should close (required if controlledIsOpen is used).
 * @param {string} [props.mainClass=''] - Additional class names for the outer container.
 * @param {string} [props.addClass=''] - Additional class names for the popover menu container.
 */
function PopoverMenu(props) {
    const {
        trigger,
        children,
        position = 'bottom-end',
        menuStyle = {},
        controlledIsOpen,
        onClose: controlledOnClose, // Renamed prop
        onOpen: controlledOnOpen,   // New prop for controlled
        mainClass = '',
        addClass = '',
        // --- NEW PROPS ---
        onMenuOpen, // Callback when menu opens internally
        onMenuClose // Callback when menu closes internally
    } = props;

    const [isOpenInternal, setIsOpenInternal] = useState(false);
    const triggerRef = useRef(null);
    const menuRef = useRef(null);

    // Determine if controlled or internal state is used
    const isControlled = controlledIsOpen !== undefined && controlledOnClose !== undefined;
    const isOpen = isControlled ? controlledIsOpen : isOpenInternal;

    // --- UPDATED open/close handlers ---
    const openMenu = useCallback(() => {
        if (isControlled) {
            controlledOnOpen?.(); // Call controlled open if provided
        } else {
            setIsOpenInternal(true);
            onMenuOpen?.();      // Call internal open callback
        }
    }, [isControlled, controlledOnOpen, onMenuOpen]);

    const closeMenu = useCallback(() => {
        if (isControlled) {
            controlledOnClose(); // Call controlled close
        } else {
            setIsOpenInternal(false);
            onMenuClose?.();     // Call internal close callback
        }
    }, [isControlled, controlledOnClose, onMenuClose]);

    const toggleMenu = useCallback(() => {
        // console.log('toggleMenu called. Current isOpen:', isOpen);
        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
        // console.log('toggleMenu executed. New isOpen:', !isOpen); // Log based on action taken
    }, [isOpen, openMenu, closeMenu]);


    useEffect(() => {
        if (!isOpen) return;

        const handleDocumentClick = (e) => {
            const insideTrigger = triggerRef.current?.contains(e.target);
            const insideMenu = menuRef.current?.contains(e.target);

            // Only close if click is outside BOTH trigger and menu
            if (!insideTrigger && !insideMenu) {
                // console.log("Clicked outside, closing menu.");
                closeMenu();
            }
        };

        // Use 'mousedown' to potentially catch the event earlier than 'click'
        // which might be stopped by other handlers (like the trigger's onClick).
        document.addEventListener('click', handleDocumentClick);
        return () => document.removeEventListener('click', handleDocumentClick);
    }, [isOpen, closeMenu]); // Dependency array includes isOpen and closeMenu

    const getPositionStyles = () => {
        // Default zIndex if none is provided in menuStyle
        const styles = {position: 'absolute', zIndex: 1050, ...menuStyle};
        const margin = '0.125rem'; // Example margin
        // ... (rest of your position logic)
        switch (position) {
            case 'bottom-start':
                styles.top = '100%';
                styles.left = '0';
                styles.marginTop = margin;
                break;
            case 'top-start':
                styles.bottom = '100%';
                styles.left = '0';
                styles.marginBottom = margin;
                break;
            case 'top-end':
                styles.bottom = '100%';
                styles.right = '0';
                styles.marginBottom = margin;
                break;
            case 'bottom-end':
            default:
                styles.top = '100%';
                styles.right = '0';
                styles.marginTop = margin;
                break;
        }
        return styles;
    };


    // Clone trigger, ensuring necessary props are added/overridden
    const triggerElement = React.cloneElement(trigger, {
        ref: triggerRef,
        onClick: (e) => {
            // Prevent document click listener from closing immediately
            e.stopPropagation();
            // Call original trigger onClick if it exists
            trigger.props.onClick?.(e);
            // Toggle menu if default wasn't prevented by original handler
            if (!e.defaultPrevented) {
                toggleMenu();
            }
        },
        // Ensure accessibility attributes are set
        'aria-haspopup': 'listbox', // or 'menu' depending on content
        'aria-expanded': isOpen,
        // Add other necessary props like id if the menu needs aria-labelledby
    });


    const popoverClasses = `popover-menu list-group list-group-flush shadow-sm ${addClass}`.trim();

    return (
        // Ensure the container allows absolute positioning of the menu
        <div className={`position-relative d-inline-block ${mainClass}`}>
            {triggerElement}
            {isOpen && (
                <div
                    ref={menuRef}
                    className={popoverClasses}
                    role="listbox" // or 'menu'
                    style={getPositionStyles()}
                    // Consider adding aria-labelledby if trigger has an ID
                >
                    {React.Children.map(children, (child) => {
                        // ... (your existing child mapping logic) ...
                        if (!React.isValidElement(child)) {
                            return child;
                        }

                        const baseItemClasses = 'list-group-item d-flex flex-row border-0';
                        let actionClass = '';
                        if (typeof child.type === 'string' && ['button', 'a'].includes(child.type.toLowerCase())) {
                            actionClass = 'list-group-item-action';
                        } else if (child.props.onClick) {
                            actionClass = 'list-group-item-action';
                        }

                        const existingClasses = child.props.className || '';
                        const finalClassName = `${baseItemClasses} ${actionClass} ${existingClasses}`.trim().replace(/\s+/g, ' ');

                        return React.cloneElement(child, {
                            className: finalClassName,
                            onClick: (e) => {
                                child.props.onClick?.(e);
                                if (!e.defaultPrevented && actionClass) {
                                    closeMenu(); // Close menu on item click
                                }
                            }
                        });
                    })}
                </div>
            )}
        </div>
    );
}

export default PopoverMenu;