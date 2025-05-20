// src/features/users/components/UserInfo/UserInfo.jsx
import React from "react";
import './UserInfo.css';

function UserInfo({postKarma, commentKarma, createdDay}) {
    return (
        // Add a wrapper div with a class for styling
        <div className="user-info-container">
            <div className="karma">
                <div className="karma-item">
                    <h3>Post karma</h3>
                    <p>{postKarma}</p>
                </div>
                <div className="karma-item">
                    <h3>Comment karma</h3>
                    <p>{commentKarma}</p>
                </div>
            </div>
            <div className="created-day">
                <h3>Cake day</h3>
                <p>{createdDay}</p>
            </div>
        </div>
    );
}

export default UserInfo;