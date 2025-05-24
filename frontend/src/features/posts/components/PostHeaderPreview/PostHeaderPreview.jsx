// #features/posts/components/PostHeaderPreview/PostHeaderPreview.jsx
import React from "react";
import Avatar from "#shared/components/UIElement/Avatar/Avatar";
import Identifier from "#shared/components/UIElement/Identifier/Identifier";
import Button from "#shared/components/UIElement/Button/Button"; // Assuming you might add a Join button
import PostOptions from "#features/posts/components/PostOptions/PostOptions"; // Import the options component
import "./PostHeaderPreview.css";
import {formatTimeAgo} from "#utils/time.js";

export default function PostHeaderPreview(props) {
    const {subtable, post, isJoined, onJoinClick, onOptions /* pass specific handlers if needed */} = props;

    // Placeholder handlers for options - these could be passed down or defined here
    const handleSave = () => console.log("Preview Save clicked");
    const handleHide = () => console.log("Preview Hide clicked");
    const handleReport = () => console.log("Preview Report clicked");

    return (
        <div className="d-flex align-items-center justify-content-between mb-2">
            {/* Left side: Subtable Info */}
            <div className="d-flex align-items-center">
                <Avatar
                    src={subtable.icon}
                    alt={
                        <Identifier
                            type="subtable"
                            namespace={subtable.name}/>
                    }
                    width={20}
                    height={20}/>
                <div className="d-flex flex-row flex-wrap fs-8">
                    <Identifier
                        addClass="ms-2 fw-bold" // Make subtable name bold
                        type="subtable"
                        namespace={subtable.name}/>
                    &nbsp;•&nbsp;
                    <span className="text-muted">{formatTimeAgo(post.postCreatedAt)}</span>
                </div>
            </div>

            {/* Right side: Join Button (Conditional) & Options */}
            <div className="d-flex align-items-center gap-2">
                {!isJoined && ( // Example: Show Join button if not joined
                    <Button
                        size="sm" // Make join button smaller
                        onClick={onJoinClick}
                        addClass="join-btn px-3 py-1" // Custom class for styling
                    >
                        Join
                    </Button>
                )}
                {/* Use the PostOptions component */}
                <PostOptions
                    onSave={handleSave}
                    onHide={handleHide}
                    onReport={handleReport}
                />
            </div>
        </div>
    );
}