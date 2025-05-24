import React from 'react';
import Avatar from '#shared/components/UIElement/Avatar/Avatar'; // cite: 81
import Identifier from '#shared/components/UIElement/Identifier/Identifier'; // cite: 73
import {formatTimeAgo} from '#utils/time'; // cite: 13

export default function CommentHeader({author, createdAt}) {
    if (!author) {
        // Handle case where author might be null (e.g., deleted user)
        return (
            <div className="d-flex align-items-center mb-2">
                <span className="text-muted fs-8">[deleted] • {formatTimeAgo(createdAt)}</span>
            </div>
        );
    }

    return (
        <div className="d-flex align-items-center mb-2">
            <Avatar
                src={author.avatar}
                alt={<Identifier type="user" namespace={author.username}/>}
                width={20}
                height={20}
            />
            <div className="d-flex flex-row flex-wrap fs-8 align-items-center">
                <span className="ms-2 fw-bold">
                    {author.displayName || author.username} {/* Fallback to username */}
                </span>
                &nbsp;•&nbsp;
                <span className="text-muted">{formatTimeAgo(createdAt)}</span>
            </div>
        </div>
    );
}