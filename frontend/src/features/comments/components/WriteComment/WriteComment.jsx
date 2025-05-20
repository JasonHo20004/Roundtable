// #features/posts/components/WriteComment/WriteComment.jsx
import React, {useEffect, useRef} from "react";
import {useFetcher} from "react-router";
import $ from 'jquery';

import Form from "#shared/components/UIElement/Form/Form";
import TextEdit from "#shared/components/UIElement/TextEditor/TextEditor"; // Corrected component name if needed
import Button from "#shared/components/UIElement/Button/Button";
import "./WriteComment.css";

export default function WriteComment(props) {
    const {
        postId,
        parentCommentId,
        onCancel,
        onCommentSubmit,
        initialContent = ''
    } = props;

    const editorRef = useRef(null);
    const fetcher = useFetcher();
    const isSubmitting = fetcher.state === "submitting";

    const actionPath = parentCommentId
        ? `/comments/${parentCommentId}/reply`
        : `/posts/${postId}/comment`;

    useEffect(() => {
        if (fetcher.state === "idle" && fetcher.data) {
            if (fetcher.data.status === 201 && fetcher.data.success) {
                console.log("Fetcher completed successfully:", fetcher.data.message);
                if (editorRef.current) {
                    editorRef.current.clearContent();
                }
                if (onCommentSubmit) {
                    console.log("Triggering onCommentSubmit callback...");
                    // Pass data if the parent needs it, otherwise just call it
                    onCommentSubmit(fetcher.data.data); // Pass the actual comment data if needed by parent
                }
            } else {
                // Handle cases where action returned data, but it wasn't status 201
                console.error("Comment submission failed (action returned data):", fetcher.data.message);
                alert(`Failed to post comment: ${fetcher.data.message || 'Action returned an error status.'}`);
            }
        } else if (fetcher.state === 'idle' && !fetcher.data) {
            console.log("Condition NOT Met: Fetcher is idle BUT fetcher.data is undefined/falsy.");
        }
        // Make sure onCommentSubmit is stable (useCallback in parent) if included, otherwise remove if not needed for logic here
    }, [fetcher.state, fetcher.data]);
    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
    }

    const handleBeforeSubmit = (event) => {
        if (!editorRef.current) {
            event.preventDefault();
            return;
        }
        const content = editorRef.current.getContent();
        // Improved check for effectively empty content (handles empty tags)
        const textContent = $(`<div>${content}</div>`).text().trim();
        const images = $(`<div>${content}</div>`).find('img').length; // Check for images too

        if (!textContent && images === 0) {
            console.log("Comment content is effectively empty. Preventing submission.");
            alert("Comment cannot be empty.");
            event.preventDefault();
        } else {
            console.log(`Submitting comment/reply via custom Form (fetcher mode) to ${actionPath}...`);
        }
    };

    return (
        <>
            <Form
                method='post'
                action={actionPath}
                onSubmit={handleBeforeSubmit}
                preventNavigation={true}
                fetcher={fetcher}
            >
                <div className="card write-comment-card">
                    <div className="card-body p-2">
                        <TextEdit // Ensure component name matches import
                            ref={editorRef}
                            placeholder="Nhập bình luận của bạn..."
                            name="content"
                            initialValue={initialContent} // Note: initialValue might not work well with Summernote's lifecycle. Consider setting content after init if needed.
                        />
                        {fetcher.state === "idle" && fetcher.data && fetcher.data.status !== 201 && (
                            <div className="text-danger mt-2 fs-8 p-1">
                                Error: {fetcher.data.message || "Failed to submit"}
                            </div>
                        )}
                    </div>
                    <div className="card-footer justify-content-end d-flex p-2">
                        <Button
                            onClick={handleCancel}
                            mainClass="write-comment-button"
                            addClass="cancel-button"
                            type="button"
                            disabled={isSubmitting}
                        >
                            Hủy
                        </Button>
                        &nbsp;
                        <Button
                            type="submit"
                            mainClass="write-comment-button"
                            addClass="submit-button"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Đang gửi..." : "Gửi"}
                        </Button>
                    </div>
                </div>
            </Form>
        </>
    );
}