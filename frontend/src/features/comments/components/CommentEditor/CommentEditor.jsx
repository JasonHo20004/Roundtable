import React, {useEffect, useRef} from 'react';
import {useFetcher} from 'react-router';
import $ from 'jquery';
import Form from '#shared/components/UIElement/Form/Form';
import TextEditor from '#shared/components/UIElement/TextEditor/TextEditor';
import Button from '#shared/components/UIElement/Button/Button';

export default function CommentEditor(props) {
    const {
        originalCommentBody,
        commentToEdit,
        onAttemptSave,      // Renamed from onSaveSuccess to reflect optimistic nature
        onSaveResponse,     // New callback to handle server response (success/failure)
        onCancel,
    } = props;

    const editorRef = useRef(null);
    const fetcher = useFetcher();
    const isSubmitting = fetcher.state === 'submitting';
    const actionPath = `/comments/${commentToEdit.commentId}/manage`;
    const httpMethod = 'PATCH';

    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.setContent(originalCommentBody);
        }
    }, [originalCommentBody]);

    useEffect(() => {
        if (fetcher.state === 'idle' && fetcher.data) {
            if (fetcher.data.success || fetcher.data.status === 200) {
                if (onSaveResponse) {
                    onSaveResponse(true, fetcher.data.data); // True for success, pass server data
                }
            } else {
                if (onSaveResponse) {
                    onSaveResponse(false, {message: fetcher.data.message || 'Could not update comment.'}); // False for failure
                } else {
                    // Fallback if onSaveResponse is not provided, though it should be
                    alert(`Error: ${fetcher.data.message || 'Could not update comment.'}`);
                }
            }
        }
    }, [fetcher.state, fetcher.data, onSaveResponse, commentToEdit.commentId]);

    const handleFormSubmit = () => {

        if (!editorRef.current) {
            // This scenario should ideally be prevented by disabling submit if editor not ready
            console.error("Editor ref not available at submission time.");
            return;
        }

        const newBody = editorRef.current.getContent();
        const textContent = $(`<div>${newBody}</div>`).text().trim();
        const images = $(`<div>${newBody}</div>`).find('img').length;

        if (!textContent && images === 0) {
            alert("Comment cannot be empty.");
            return;
        }

        // Call the onAttemptSave for the parent to optimistically update
        if (onAttemptSave) {
            onAttemptSave(newBody);
        }
    };


    return (
        <Form
            method={httpMethod}
            action={actionPath}
            onSubmit={handleFormSubmit} // This gets called by the Form component before fetcher makes the request
            preventNavigation={true}
            fetcher={fetcher}
        >
            <div className="comment-editor-container card write-comment-card">
                <div className="card-body p-2">
                    <TextEditor
                        ref={editorRef}
                        name="body"
                        initialValue={commentToEdit.body}
                        placeholder="Edit your comment..."
                        height={100}
                    />
                    {fetcher.data && !(fetcher.data.success || fetcher.data.status === 200) && (
                        <div className="text-danger mt-2 fs-8 p-1">
                            Error: {fetcher.data.message || "Failed to save changes."}
                        </div>
                    )}
                </div>
                <div className="card-footer justify-content-end d-flex p-2">
                    <Button
                        onClick={onCancel}
                        mainClass="write-comment-button cancel-button"
                        type="button"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    &nbsp;
                    <Button
                        type="submit"
                        mainClass="write-comment-button submit-button"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </Form>
    );
}