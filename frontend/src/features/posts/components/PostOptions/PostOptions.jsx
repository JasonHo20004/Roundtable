// #shared/components/PostPreview/PostOptions.jsx
import React from "react";
import PopoverMenu from "#shared/components/UIElement/PopoverMenu/PopoverMenu";
import Button from "#shared/components/UIElement/Button/Button";
import Icon from "#shared/components/UIElement/Icon/Icon";
import Form from "#shared/components/UIElement/Form/Form";
import {useFetcher} from "react-router";
import $ from 'jquery';

import "./PostOptions.css"; // Import your CSS file for styling
export default function PostOptions(props) {
    // Handlers passed via props from parent (Preview or Detailed)
    const {onSave, onHide, onReport,postId,checkYourPost,onUpdatePost} = props;

    const handleSavePost = () => {
        console.log("Save action triggered");
        if (onSave) onSave();
    };
    const handleHidePost = () => {
        console.log("Hide action triggered");
        if (onHide) onHide();
    };
    const handleReportPost = () => {
        console.log("Report action triggered");
        if (onReport) onReport();
    };
    //const navigate = useNavigate();
    const handleUpdatePost = () => {
        if(onUpdatePost){
            console.log("ccccccccccccccccccccccccccccccccccccccccccccccc");
            onUpdatePost();
        }
        // navigate(`/comments/${postId}/update`,{replace: true}); 
    }
    const actionPath = `/comments/${postId}/update`;
    const fetcher = useFetcher();


    return (
        <Form
            method='delete'
            fetcher={fetcher}
            action={actionPath}
            //onSubmit={handleSubmit}
            preventNavigation={true}
        >
            <div className="option-container d-flex align-items-center">
            <PopoverMenu
                mainClass="option-menu"
                addClass="bg-white rounded shadow-sm border" // Added border/shadow
                position="bottom-end"
                trigger={
                    <Button
                        mainClass="option-btn"
                        contentType="icon"
                        padding="2"
                        roundedPill // Make the trigger button pill-shaped
                        addClass="bg-light" // Keep background light like original actions
                        dataBsToggle="tooltip"
                        dataBsTrigger="hover focus"
                        tooltipTitle="Options"
                        tooltipPlacement="top"
                        ariaLabel="Post Options">
                        <Icon mainClass="option-icon" name="three_dots" size="15px"/>
                    </Button>
                }>
                {/* Using Button component consistently */}
                <Button mainClass="save-btn w-100" type="button" justifyContent="start" rounded={false} padding={2}
                        onClick={handleSavePost}>
                    <Icon addClass="me-2" name="floppy" size="15px"/>
                    <span>Lưu</span>
                </Button>
                <Button mainClass="hide-btn w-100" type="button" justifyContent="start" rounded={false} padding={2}
                        onClick={handleHidePost}>
                    <Icon addClass="me-2" name="hide" size="15px"/>
                    <span>Ẩn</span>
                </Button>
                <Button mainClass="report-btn w-100" type="button" justifyContent="start" rounded={false} padding={2}
                        onClick={handleReportPost}>
                    <Icon addClass="me-2" name="flag" size="15px"/>
                    <span>Báo cáo</span>
                </Button>
                {
                    checkYourPost && (
                        <Button mainClass="edit-post-btn w-100" type="button" justifyContent="start" rounded={false} padding={2}
                                onClick={handleUpdatePost}>
                            <Icon addClass="me-2" name="pencil" size="15px"/>
                            <span>Cập nhật</span>
                        </Button>
                       
                       
                    )
                }
                {
                    checkYourPost && (
                        <Button mainClass="delete-post-btn w-100" type="submit" justifyContent="start" rounded={false} padding={2}>
                            <Icon addClass="me-2" name="trash" size="15px"/>
                            <span>Xóa</span>
                        </Button>
                    )
                    
                }
            </PopoverMenu>
            </div>

        </Form>
        
    );
}