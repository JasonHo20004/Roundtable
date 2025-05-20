import React from 'react';

export default function CommentBody({body}) {
    if (!body) {
        return (
            <div className="fs-content mt-2 mb-2">
                <p>[deleted]</p>
            </div>
        )
    }
    return (
        <div
            className="fs-content mt-2 mb-2"
            dangerouslySetInnerHTML={{__html: body}}
        />
    );
}