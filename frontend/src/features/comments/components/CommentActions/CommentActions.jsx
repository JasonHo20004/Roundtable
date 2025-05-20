import React from 'react';
import Button from '#shared/components/UIElement/Button/Button'; // cite: 79
import Icon from '#shared/components/UIElement/Icon/Icon'; // cite: 75
import PopoverMenu from '#shared/components/UIElement/PopoverMenu/PopoverMenu'; // cite: 70
import './CommentActions.css';

export default function CommentActions({
                                           voteStatus,
                                           voteCount,
                                           isVoting,
                                           handleUpvote,
                                           handleDownvote,
                                           handleReplyClick,
                                           handleSaveComment,
                                           handleReportComment,
                                           handleEditComment,
                                           handleDeleteComment,
                                           onPopoverOpen, // Pass down from parent Comment
                                           onPopoverClose, // Pass down from parent Comment
                                           voteError,
                                           isOwner,
                                       }) {
    return (
        <div className="d-flex align-items-center gap-2 mt-2">
            {voteError && <div className="text-danger fs-icon me-2">Error: {voteError}</div>}
            {/* Vote Container */}
            <div
                className={`vote-container ${voteStatus || ''} d-flex align-items-center rounded-pill gap-2 bg-light p-1`}>
                <Button
                    mainClass="upvote-btn" contentType="icon"
                    dataBsToggle="tooltip" dataBsTrigger="hover focus" tooltipTitle="Upvote"
                    tooltipPlacement="top"
                    padding="1" onClick={handleUpvote} disabled={isVoting}>
                    <Icon
                        mainClass="upvote-icon"
                        name={voteStatus === "upvote" ? "upvoted" : "upvote"} // Changed from "upvoted" to match your state
                        size="15px"/>
                </Button>
                <span className="fs-icon">{voteCount ?? 0}</span>
                <Button
                    mainClass="downvote-btn" contentType="icon"
                    dataBsToggle="tooltip" dataBsTrigger="hover focus" tooltipTitle="Downvote"
                    tooltipPlacement="top"
                    padding="1" onClick={handleDownvote} disabled={isVoting}>
                    <Icon
                        mainClass="downvote-icon"
                        name={voteStatus === "downvote" ? "downvoted" : "downvote"} // Changed from "downvoted"
                        size="15px"/>
                </Button>
            </div>

            {/* Reply Button Container */}
            <div className="reply-container d-flex align-items-center rounded-pill gap-1 bg-light p-1">
                <Button
                    mainClass="reply-btn"
                    dataBsToggle="tooltip" dataBsTrigger="hover focus" tooltipTitle="Reply"
                    tooltipPlacement="top"
                    padding="1"
                    onClick={handleReplyClick}>
                    <Icon mainClass="comment-icon" name="comment" size="15px"/>
                    <span className="ms-1 fs-icon">Reply</span>
                </Button>
            </div>

            {/* Share Container */}
            <div className="share-container d-flex align-items-center rounded-pill gap-1 bg-light p-1">
                <Button
                    mainClass="share-btn"
                    dataBsToggle="tooltip" dataBsTrigger="hover focus" tooltipTitle="Share"
                    tooltipPlacement="top"
                    padding="1"
                    onClick={() => console.log('Share comment clicked')}>
                    <Icon mainClass="share-icon" name="share" size="15px"/>
                    <span className="ms-1 fs-icon">Share</span>
                </Button>
            </div>

            {/* Options using PopoverMenu */}
            <div className="option-container d-flex align-items-center">
                <PopoverMenu
                    mainClass="option-menu"
                    addClass="bg-white rounded shadow-sm border"
                    position="bottom-end"
                    onMenuOpen={onPopoverOpen} // Use passed handler
                    onMenuClose={onPopoverClose} // Use passed handler
                    trigger={
                        <Button
                            mainClass="option-btn" contentType="icon" padding="2" roundedPill
                            addClass="bg-light"
                            dataBsToggle="tooltip" dataBsTrigger="hover focus" tooltipTitle="More options"
                            tooltipPlacement="top"
                            ariaLabel="Comment Options">
                            <Icon mainClass="option-icon" name="three_dots" size="15px"/>
                        </Button>
                    }
                >
                    <Button mainClass="save-btn w-100" type="button" justifyContent="start" rounded={false}
                            padding={2} onClick={handleSaveComment}>
                        <Icon addClass="me-2 save-icon-class" name="floppy" size="15px"/>
                        <span>Lưu</span>
                    </Button>
                    <Button mainClass="report-btn w-100" type="button" justifyContent="start" rounded={false}
                            padding={2} onClick={handleReportComment}>
                        <Icon addClass="me-2 report-icon-class" name="flag" size="15px"/>
                        <span>Báo cáo</span>
                    </Button>
                    {isOwner && (
                        <Button mainClass="edit-btn w-100" type="button" justifyContent="start" rounded={false}
                                padding={2} onClick={handleEditComment}>
                            <Icon addClass="me-2 edit-icon-class" name="pencil" size="15px"/>
                            <span>Chỉnh sửa</span>
                        </Button>
                    )}
                    {isOwner && (
                        <Button mainClass="delete-btn w-100" type="button" justifyContent="start" rounded={false}
                                padding={2} onClick={handleDeleteComment}>
                            <Icon addClass="me-2 delete-icon-class" name="trash" size="15px"/>
                            <span>Xóa</span>
                        </Button>
                    )}
                </PopoverMenu>
            </div>
        </div>
    );
}