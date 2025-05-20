import React, {forwardRef, useEffect, useImperativeHandle, useRef} from "react";
import $ from "jquery";
import "summernote/dist/summernote-lite.css";
import "summernote/dist/summernote-lite.min.js";
import './TextEditor.css';

const TextEditor = forwardRef((props, ref) => {
    const editorRefInternal = useRef(null);

    useEffect(() => {
        const $editorTextarea = $(editorRefInternal.current);

        if ($editorTextarea.next('.note-editor').length === 0) {
            $editorTextarea.summernote({
                placeholder: props.placeholder || "Please enter content",
                tabsize: 2,
                height: props.height || 150, // You might adjust default height here
                toolbar: [
                    ["font", ["bold", "underline", "clear"]],
                    ["para", ["ul", "ol", "paragraph"]],
                    ["insert", ["link"]],
                ],
                // Disable resize handle if statusbar is hidden
                disableResizeEditor: true, // Add this if hiding statusbar
                callbacks: {
                    // Add any necessary callbacks
                }
            });
        } 
        // else {
        //     console.log("Summernote already initialized on this element.");
        // }
        // Nếu có value → cập nhật nội dung
        if (props.value && $editorTextarea.summernote) {
            try {
                $editorTextarea.summernote('code', props.value);
            } catch (e) {
                console.error("Error setting summernote content:", e);
            }
        }

        return () => {
            const editorNode = editorRefInternal.current;
            if (editorNode && $(editorNode).next('.note-editor').length > 0) {
                if ($(editorNode).summernote) { // Check if method exists
                    try {
                        $(editorNode).summernote("destroy");
                    } catch (e) {
                        console.error("Error destroying summernote:", e);
                    }
                }
            }
        };
    }, [props.value]); // Dependencies

    useImperativeHandle(ref, () => ({
        // Exposed methods remain the same...
        getContent: () => {
            const $editorTextarea = $(editorRefInternal.current);
            const $editorDiv = $editorTextarea.next('.note-editor');
            if ($editorDiv.length > 0) {
                try {
                    return $editorTextarea.summernote("code");
                } catch (error) {
                    console.error("[getContent] Error calling summernote('code'):", error);
                    return "";
                }
            } else {
                return "";
            }
        },
        reset: () => {
            const $editorTextarea = $(editorRefInternal.current);
            if ($editorTextarea.next('.note-editor').length > 0) {
                $editorTextarea.summernote("reset");
            }
        },
        clearContent: () => {
            const $editorTextarea = $(editorRefInternal.current);
            if ($editorTextarea.next('.note-editor').length > 0) {
                $editorTextarea.summernote('code', '<p><br></p>');
            }
        },
        setContent: (content) => {
            const $editorTextarea = $(editorRefInternal.current);
            if ($editorTextarea.next('.note-editor').length > 0) {
                $editorTextarea.summernote('code', content);
            }
        }
    }), []);

    // Assign ref, remove ID
    return <textarea ref={editorRefInternal} name={props.name || "content"}/>;
});

export default TextEditor;