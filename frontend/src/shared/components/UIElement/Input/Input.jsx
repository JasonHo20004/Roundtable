// src/shared/components/UIElement/Input/Input.jsx
import React from 'react';
import './Input.css'; // Keep your custom CSS if needed

export default function Input(props) {
    const {
        id,
        name,
        type = 'text', // 'text', 'file', 'password', 'email', 'number', 'textarea', etc.
        placeholder,
        value,
        onChange,
        onFocus,
        onBlur,
        onInvalid,
        onInput,
        style,
        label,
        accept, // prop for file inputs
        mainClass = '',
        addClass = '',
        isInvalid = false,
        isValid = false,
        feedback = '',
        required = false,
        rows = 3, // prop for textarea rows
        addonBefore, // Text/element for prepended addon
        addonAfter,  // Text/element for appended addon
        showLabelForFile = true,
    } = props;

    const validationClass = isInvalid ? 'is-invalid' : isValid ? 'is-valid' : '';
    // `form-control` is the base class for Bootstrap styled inputs/textareas
    // It will also include validation classes directly on the input/textarea element
    const combinedFormControlClasses = `form-control ${addClass} ${mainClass} ${validationClass}`.trim();

    // --- File Input Handling ---
    // File inputs do not support .form-floating. They have a standard input-group structure.
    if (type === 'file') {
        return (
            <div className={`mb-3 ${mainClass}`}> {/* Outer wrapper for margin and any mainClass styling */}
                {/* Render a standard label *above* the input for file types, if requested and available */}
                {label && showLabelForFile && <label htmlFor={id} className="form-label">{label}</label>}

                <div className={`input-group ${isInvalid || isValid ? 'has-validation' : ''}`}>
                    {addonBefore && <span className="input-group-text">{addonBefore}</span>}
                    <input
                        id={id}
                        name={name}
                        type="file"
                        accept={accept}
                        className={combinedFormControlClasses} // form-control and validation classes
                        onChange={onChange}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        onInvalid={onInvalid}
                        onInput={onInput}
                        style={style}
                        required={required}
                        // Use label as aria-label if visual label is hidden or not the primary label for the input itself
                        aria-label={label && !showLabelForFile ? label : placeholder || 'File input'}
                    />
                    {addonAfter && <span className="input-group-text">{addonAfter}</span>}
                    {/* Feedback messages for file inputs within the input-group */}
                    {feedback && isInvalid && <div className="invalid-feedback">{feedback}</div>}
                    {feedback && isValid && <div className="valid-feedback">{feedback}</div>}
                </div>
            </div>
        );
    }

    // --- Textarea Handling (with Floating Label & Input Group) ---
    if (type === 'textarea') {
        // .form-floating also needs validation classes if the input inside is validated
        const formFloatingValidationClass = isInvalid ? 'is-invalid' : isValid ? 'is-valid' : '';

        return (
            <div className={`input-group ${isInvalid || isValid ? 'has-validation' : ''} mb-3 ${mainClass}`}>
                {addonBefore && <span className="input-group-text">{addonBefore}</span>}
                <div className={`form-floating flex-grow-1 ${formFloatingValidationClass}`}>
                    <textarea
                        id={id}
                        name={name}
                        className={combinedFormControlClasses}
                        placeholder={placeholder || label || ' '} // Placeholder vital for floating label
                        value={value}
                        onChange={onChange}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        onInvalid={onInvalid}
                        onInput={onInput}
                        style={style} // Default height can be managed by 'rows' or custom CSS
                        required={required}
                        rows={rows}
                    />
                    {label && <label htmlFor={id}>{label}</label>}
                </div>
                {addonAfter && <span className="input-group-text">{addonAfter}</span>}
                {/* Feedback messages for textarea, as siblings to form-floating or addons within input-group */}
                {feedback && isInvalid && <div className="invalid-feedback">{feedback}</div>}
                {feedback && isValid && <div className="valid-feedback">{feedback}</div>}
            </div>
        );
    }

    // --- Standard Input Types (text, password, email, etc. with Floating Label & Input Group) ---
    // .form-floating also needs validation classes if the input inside is validated
    const formFloatingValidationClass = isInvalid ? 'is-invalid' : isValid ? 'is-valid' : '';

    return (
        <div className={`input-group ${isInvalid || isValid ? 'has-validation' : ''} mb-3 ${mainClass}`}>
            {addonBefore && <span className="input-group-text">{addonBefore}</span>}
            <div className={`form-floating flex-grow-1 ${formFloatingValidationClass}`}>
                <input
                    id={id}
                    name={name}
                    type={type}
                    className={combinedFormControlClasses}
                    placeholder={placeholder || label || ' '} // Placeholder vital for floating label
                    value={value}
                    onChange={onChange}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onInvalid={onInvalid}
                    onInput={onInput}
                    style={style}
                    required={required}
                />
                {label && <label htmlFor={id}>{label}</label>}
            </div>
            {addonAfter && <span className="input-group-text">{addonAfter}</span>}
            {/* Feedback messages, as siblings to form-floating or addons within input-group */}
            {feedback && isInvalid && <div className="invalid-feedback">{feedback}</div>}
            {feedback && isValid && <div className="valid-feedback">{feedback}</div>}
        </div>
    );
}