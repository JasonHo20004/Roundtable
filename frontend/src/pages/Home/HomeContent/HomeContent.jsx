import React, {useEffect, useState} from "react";

import HomeSidebarContent from "#pages/Home/HomeSidebar/HomeSidebar.jsx";
import {Helmet} from "react-helmet";
import PostPreview from "#features/posts/components/PostPreview/PostPreview";
import homeService from "#services/homeService";
import Button from "#shared/components/UIElement/Button/Button";
import Icon from "#shared/components/UIElement/Icon/Icon";
import "./HomeContent.css"; // Đảm bảo import CSS

export default function HomeContent() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortType, setSortType] = useState('hot');

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                const data = await homeService.getHomeData(sortType);
                setPosts(data);
                setLoading(false);
            } catch (error) {
                console.error("Lỗi khi lấy dữ liệu bài viết:", error);
                setError("Không thể tải dữ liệu bài viết. Vui lòng thử lại sau.");
                setLoading(false);
            }
        };

        fetchPosts();
    }, [sortType]);

    const handleSortChange = (newSortType) => {
        console.log(`Changing sort type to: ${newSortType}`);
        setSortType(newSortType);
    };

    // Hiển thị tên hiển thị cho mỗi loại sắp xếp
    const getSortDisplayName = (type) => {
        switch (type) {
            case 'hot': return 'Hot (Đang thịnh hành)';
            case 'new': return 'New (Mới nhất)';
            case 'top': return 'Top (Nổi bật nhất)';
            case 'rising': return 'Rising (Đang lên)';
            default: return 'Hot (Đang thịnh hành)';
        }
    };

    if (loading) {
        return <div>Đang tải dữ liệu...</div>;
    }
    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="home-content-container">
            <Helmet>
                <title>Home</title>
                <meta name="description" content="Welcome to the home page!"/>
            </Helmet>

            <HomeSidebarContent/>

            {/* Thêm thanh tùy chọn sắp xếp với class sticky-sort */}
            <div className="sticky-sort-container">
                <div className="sort-options card p-2">
                    <div className="d-flex align-items-center">
                        <span className="me-2">Sắp xếp bài viết theo:</span>
                        <div className="btn-group">
                            <Button
                                dataBsToggle="dropdown"
                                dataBsTrigger="hover focus"
                                tooltipTitle="Tùy chọn sắp xếp"
                                tooltipPlacement="top"
                                padding="2"
                                addClass="d-flex align-items-center">
                                {getSortDisplayName(sortType)} <Icon name="down" size="12px" addClass="ms-1"/>
                            </Button>
                            <ul className="dropdown-menu">
                                <li><a className={`dropdown-item ${sortType === 'hot' ? 'active' : ''}`} 
                                      onClick={(e) => {e.preventDefault(); handleSortChange('hot');}} href="#">Hot (Đang thịnh hành)</a></li>
                                <li><a className={`dropdown-item ${sortType === 'new' ? 'active' : ''}`} 
                                      onClick={(e) => {e.preventDefault(); handleSortChange('new');}} href="#">New (Mới nhất)</a></li>
                                <li><a className={`dropdown-item ${sortType === 'top' ? 'active' : ''}`} 
                                      onClick={(e) => {e.preventDefault(); handleSortChange('top');}} href="#">Top (Nổi bật nhất)</a></li>
                                <li><a className={`dropdown-item ${sortType === 'rising' ? 'active' : ''}`} 
                                      onClick={(e) => {e.preventDefault(); handleSortChange('rising');}} href="#">Rising (Đang lên)</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Thêm div với class content-padding để tạo khoảng cách cho nội dung */}
            <div className="content-padding">
                <div className="posts-container">
                    {posts.length > 0 ? (
                        posts.map(post => {
                            const {subtable, author, ...postdetails} = post;

                            return (
                                <PostPreview
                                    key={postdetails.postId}
                                    post={postdetails}
                                    subtable={subtable}
                                    isJoined={false}
                                    onJoinClick={() => console.log(`Join clicked for ${post.subtable.namespace}`)}
                                />
                            );
                        })
                    ) : (
                        <div>Không có bài viết nào.</div>
                    )}
                </div>
            </div>
        </div>
    );
}