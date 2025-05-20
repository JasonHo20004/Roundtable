import React, { useEffect } from "react";
import Avatar from "#shared/components/UIElement/Avatar/Avatar";
import Identifier from "#shared/components/UIElement/Identifier/Identifier";
import Button from "#shared/components/UIElement/Button/Button"; // Assuming you might add a Join button
import PostOptions from "#features/posts/components/PostOptions/PostOptions"; // Import the options component
import {useState} from 'react'
export default function PostHeaderPreviewSubtable(props) {
    const {author, post, onOptions /* pass specific handlers if needed */} = props;
    
        // Placeholder handlers for options - these could be passed down or defined here
        const handleSave = () => console.log("Preview Save clicked");
        const handleHide = () => console.log("Preview Hide clicked");
        const handleReport = () => console.log("Preview Report clicked");

        const [date, setDate] = useState("");
        const [time, setTime] = useState("");
        const [check, setCheck] = useState(false)  

       

        //console.log(post.createdAt)

        useEffect(() => {
            const date = new Date(post.createdAt);
            const now = new Date();
            const diffMs = Math.abs(date - now); 
            if (date.getDate() !== now.getDate()) {
                const diffDays = diffMs / (1000 * 60 * 60 * 24); 
                const roundedDays = Math.floor(diffDays); 
                setDate(roundedDays + " days ago")
                console.log("Số ngày:", roundedDays);
                setCheck(true)
            }
            else{
                const diffHours = diffMs / (1000 * 60 * 60);
                const roundedHours = Math.floor(diffHours); 
                setDate(roundedHours + " minutes ago")
                console.log("Số giờ:", roundedHours);
            }
            // console.log("Current date:", now.toDateString());
            // console.log("Current time:", now.toTimeString());
            // const localDate = date.toLocaleDateString();     
            // const localTime = date.toLocaleTimeString();
            
        },[])
    
    
        return (
            <div className="d-flex align-items-center justify-content-between mb-2">
                {/* Left side: Subtable Info */}
                <div className="d-flex align-items-center">
                    <Avatar
                        src={`http://localhost:5000/images/${author.avatar}`}
                        alt={
                            <Identifier
                                type="user"
                                namespace={author.displayName}/>
                        }
                        width={20}
                        height={20}/>
                    <div className="d-flex flex-row flex-wrap fs-8">
                        <Identifier
                            addClass="ms-2 fw-bold" // Make subtable name bold
                            type="user"
                            namespace={author.displayName}/>
                        &nbsp;•&nbsp;
                        <span className="text-muted">{check?
                            date
                        :time}</span>
                    </div>
                </div>
    
                {/* Right side: Join Button (Conditional) & Options */}
                <div className="d-flex align-items-center gap-2">
                    <PostOptions
                        onSave={handleSave}
                        onHide={handleHide}
                        onReport={handleReport}
                    />
                </div>
            </div>
        );

}