// src/shared/components/UIElement/Modal/Modal.jsx
import React, {useEffect, useRef} from 'react';

/**
 * A reusable Bootstrap modal component.
 *
 * @component
 *
 * @param {object} props
 * @param {string} props.id - The unique ID of the modal (used for toggling and accessibility).
 * @param {string} [props.mainClass] - Additional class(es) for the main modal container.
 * @param {string} [props.addClass] - Additional class(es) for the modal content.
 * @param {string} props.title - The title displayed in the modal header.
 * @param {React.ReactNode} props.children - The main content/body of the modal.
 * @param {React.ReactNode} [props.footer] - Custom footer content (can be buttons or any JSX).
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {function} props.onClose - Function to call when the modal is requested to be closed.
 *
 * @returns {JSX.Element} A Bootstrap-styled modal dialog.
 *
 * @example
 * <Modal
 *   id="deleteConfirm"
 *   title="Confirm Deletion"
 *   isOpen={isModalOpen}
 *   onClose={handleClose}
 *   footer={
 *     <div className="d-flex justify-content-end gap-2">
 *       <Button onClick={handleCancel}>Cancel</Button>
 *       <Button onClick={handleConfirm} className="btn-danger">Delete</Button>
 *     </div>
 *   }
 * >
 *   Are you sure you want to delete this item?
 * </Modal>
 */
export default function Modal(props) {
    const {
        id,
        mainClass,
        addClass,
        title,
        children,
        footer,
        isOpen,
        onClose,
    } = props;

    const modalRef = useRef(null);
    const triggerElementRef = useRef(null); // To store the element that opened the modal

    useEffect(() => {
        const modalElement = modalRef.current;
        if (!modalElement) return;

        let bootstrapModalInstance = window.bootstrap.Modal.getInstance(modalElement);

        if (isOpen) {
            // Store the currently focused element before showing the modal
            triggerElementRef.current = document.activeElement;

            if (!bootstrapModalInstance) {
                bootstrapModalInstance = new window.bootstrap.Modal(modalElement, {
                    // backdrop: 'static', // Example: prevent closing on backdrop click
                    // keyboard: false,    // Example: prevent closing with ESC key
                });
            }
            bootstrapModalInstance.show();

            const handleShown = () => {
                // Optional: For specific focus management after modal is fully visible
                // e.g., modalElement.querySelector('input:not([type="hidden"])')?.focus();
            };
            modalElement.addEventListener('shown.bs.modal', handleShown);

            return () => {
                modalElement.removeEventListener('shown.bs.modal', handleShown);
            };

        } else {
            if (bootstrapModalInstance) {
                bootstrapModalInstance.hide();
            }
        }
    }, [isOpen, id]);

    useEffect(() => {
        const modalElement = modalRef.current;
        if (!modalElement) return;

        const handleHidden = () => {
            // Return focus to the element that opened the modal
            if (triggerElementRef.current && typeof triggerElementRef.current.focus === 'function') {
                triggerElementRef.current.focus();
                triggerElementRef.current = null;
            }
        };

        const handleHide = () => {
            // Blur any active element within the modal before it's fully hidden
            // to prevent aria-hidden focus warnings.
            if (modalElement.contains(document.activeElement)) {
                if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                }
            }
        };

        modalElement.addEventListener('hide.bs.modal', handleHide);
        modalElement.addEventListener('hidden.bs.modal', handleHidden);

        return () => {
            modalElement.removeEventListener('hide.bs.modal', handleHide);
            modalElement.removeEventListener('hidden.bs.modal', handleHidden);
        };
    }, []); // These listeners are set up once.

    return (
        <div
            className={`modal fade ${mainClass || ''}`}
            id={id}
            ref={modalRef}
            tabIndex="-1"
            aria-labelledby={`${id}Label`}
        >
            <div className="modal-dialog">
                <div className={`modal-content ${addClass || ''}`}>
                    <div className="modal-header">
                        <h1 className="modal-title fs-5" id={`${id}Label`}>
                            {title}
                        </h1>
                        <button
                            type="button"
                            className="btn-close"
                            aria-label="Close"
                            onClick={onClose}
                        ></button>
                    </div>
                    <div className="modal-body">
                        {children}
                    </div>
                    {footer && (
                        <div className="modal-footer d-flex justify-content-center align-items-center">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}