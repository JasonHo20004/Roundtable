import React, {lazy, Suspense, useEffect, useState} from "react";
import {useLoaderData, useNavigation, useSearchParams} from "react-router";
import {Helmet} from "react-helmet";
import PostPreview from "#features/posts/components/PostPreview/PostPreview";
import LoadingSpinner from "#shared/components/UIElement/LoadingSpinner/LoadingSpinner";
import Identifier from "#shared/components/UIElement/Identifier/Identifier";
import Avatar from "#shared/components/UIElement/Avatar/Avatar";
import Link from "#shared/components/Navigation/Link/Link";

const SearchSidebarContent = lazy(() => import('../SearchSidebar/SearchSidebar'));

const SORT_OPTIONS = {
    RELEVANCE: 'Liên quan',
    NEWEST: 'Mới nhất',
    VOTES: 'Được đánh giá cao'
};

const SECTIONS = [
    {key: 'posts', label: 'Bài viết'},
    {key: 'communities', label: 'Cộng đồng'},
    {key: 'people', label: 'Người dùng'}
];

const TIME_OPTIONS = {
    ALL: 'Mọi lúc',
    DAY: 'Hôm nay',
    WEEK: 'Tuần này',
    MONTH: 'Tháng này',
    YEAR: 'Năm nay'
};

export default function SearchContent() {
    const {
        query: initialQuery,
        results: loaderResults,
        type: initialType,
        sortBy: initialSortBy,
        error: loaderError
    } = useLoaderData();
    const navigation = useNavigation();
    const [searchParams, setSearchParams] = useSearchParams();

    const [currentResults, setCurrentResults] = useState(loaderResults.items || []);
    const [currentSearchType, setCurrentSearchType] = useState(initialType || 'posts');
    const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || initialSortBy || SORT_OPTIONS.RELEVANCE);
    const [timeFilter, setTimeFilter] = useState(searchParams.get('time') || TIME_OPTIONS.ALL);
    const [error, setError] = useState(loaderError);
    const [isSwitchingType, setIsSwitchingType] = useState(false);

    const [targetSearchType, setTargetSearchType] = useState(initialType || 'posts');

    const query = searchParams.get('q') || initialQuery;

    useEffect(() => {
        setIsSwitchingType(false);
        setCurrentResults(loaderResults.items || []);
        setCurrentSearchType(loaderResults.type || 'posts');
        setError(loaderError);
    }, [loaderResults, loaderError]);

    const handleFilterOrTypeChange = (newType, newSortBy, newTimeFilter) => {
        const params = new URLSearchParams(searchParams);
        const oldType = params.get('type') || initialType || 'posts';

        params.set('q', query || "");
        params.set('type', newType);

        if (newType !== oldType) {
            setTargetSearchType(newType);
            setIsSwitchingType(true);
        }

        if (newType === 'posts') {
            if (newSortBy) params.set('sortBy', newSortBy);
            if (newTimeFilter) params.set('time', newTimeFilter);
        } else {
            params.delete('sortBy');
            params.delete('time');
        }
        setSearchParams(params);
    };

    const handleSectionChange = (newSectionKey) => {
        handleFilterOrTypeChange(newSectionKey, sortBy, timeFilter);
    };

    const handleSortChange = (event) => {
        const newSortBy = event.target.value;
        setSortBy(newSortBy);
        if (currentSearchType === 'posts') {
            handleFilterOrTypeChange(currentSearchType, newSortBy, timeFilter);
        }
    };

    const handleTimeChange = (event) => {
        const newTimeFilter = event.target.value;
        setTimeFilter(newTimeFilter);
        if (currentSearchType === 'posts') {
            handleFilterOrTypeChange(currentSearchType, sortBy, newTimeFilter);
        }
    };

    const renderSectionTabs = () => (
        <div className="section-tabs d-flex mb-3">
            {SECTIONS.map(section => (
                <button
                    key={section.key}
                    className={`btn me-2 ${currentSearchType === section.key ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handleSectionChange(section.key)}
                    disabled={isSwitchingType || navigation.state === "loading"}
                >
                    {section.label}
                </button>
            ))}
        </div>
    );

    const renderTimeOptions = () => (
        <select value={timeFilter} onChange={handleTimeChange} className="form-select form-select-sm"
                aria-label="Lọc theo thời gian" disabled={isSwitchingType || navigation.state === "loading"}>
            <option value="all">Mọi lúc</option>
            <option value="day">Hôm nay</option>
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
            <option value="year">Năm nay</option>
        </select>
    );

    const renderSortOptions = () => (
        <select value={sortBy} onChange={handleSortChange} className="form-select form-select-sm"
                aria-label="Sắp xếp kết quả tìm kiếm" disabled={isSwitchingType || navigation.state === "loading"}>
            <option value="relevance">Liên quan nhất</option>
            <option value="newest">Mới nhất</option>
            <option value="votes">Được đánh giá cao</option>
        </select>
    );

    const renderSearchResults = () => {
        return (
            <div style={{position: 'relative', minHeight: '200px'}}>
                {navigation.state === "loading" && !isSwitchingType && (
                    <LoadingSpinner
                        message={`Đang tải kết quả cho "${query}"...`}
                        overlayOpacity={0.01}
                    />
                )}
                {isSwitchingType && (
                    <LoadingSpinner
                        message={`Đang tải ${targetSearchType === 'communities' ? 'cộng đồng' : targetSearchType === 'people' ? 'thành viên' : 'bài viết'}...`}
                        overlayOpacity={0.01}
                    />
                )}
                {!isSwitchingType && navigation.state !== "loading" && (
                    <>
                        {error && <div className="alert alert-danger" role="alert">{error}</div>}
                        {!error && !query &&
                            <div className="text-center py-5"><h3>Nhập từ khóa tìm kiếm để tìm kết quả.</h3></div>}
                        {!error && query && (!currentResults || currentResults.length === 0) && (
                            <div className="text-center py-5" key={`no-results-${currentSearchType}`}><h3>Không tìm
                                thấy {currentSearchType} nào cho "{query}"</h3></div>
                        )}
                        {!error && query && currentResults && currentResults.length > 0 && (
                            (() => {
                                const resultsContainerKey = `search-results-${currentSearchType}`;
                                switch (currentSearchType) {
                                    case 'posts':
                                        return (
                                            <div className="posts-container" key={resultsContainerKey}>
                                                {currentResults.map(post => {
                                                    return (
                                                        <PostPreview
                                                            key={post.postId}
                                                            post={post}
                                                            subtable={post.subtable}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        );
                                    case 'communities':
                                        return (
                                            <div className="communities-container list-group" key={resultsContainerKey}>
                                                {currentResults.map(community => {
                                                    const displayName = community.name && community.name.toLowerCase() !== 'empty' ? community.name : "Tên không khả dụng";
                                                    const displayDescription = community.description && community.description.toLowerCase() !== 'empty' ? community.description : "Không có mô tả.";
                                                    const displayMemberCount = community.memberCount !== undefined && community.memberCount !== null && String(community.memberCount).toLowerCase() !== 'empty' ? community.memberCount : 0;
                                                    const linkName = community.name && community.name.toLowerCase() !== 'empty' ? community.name : community.subtableId;

                                                    return (
                                                        <Link
                                                            href={`/s/${linkName}`}
                                                            key={community.subtableId}
                                                            className="list-group-item list-group-item-action"
                                                        >
                                                            <div className="d-flex align-items-center">
                                                                <Avatar
                                                                    src={community.icon}
                                                                    alt={displayName}
                                                                    width={40}
                                                                    height={40}
                                                                    addClass="me-3 rounded-circle"
                                                                />
                                                                <div>
                                                                    {displayName !== "Tên không khả dụng" ? (
                                                                        <h5 className="mb-1"><Identifier type="subtable"
                                                                                                         namespace={displayName}/>
                                                                        </h5>
                                                                    ) : (
                                                                        <h5 className="mb-1 text-muted">{displayName}</h5>
                                                                    )}
                                                                    <p className="mb-1 text-muted small">{displayDescription}</p>
                                                                    <small
                                                                        className="text-muted">{displayMemberCount} thành
                                                                        viên</small>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        );
                                    case 'people':
                                        return (
                                            <div className="people-container list-group" key={resultsContainerKey}>
                                                {currentResults.map(person => {
                                                    const displayUsername = person.username && person.username.toLowerCase() !== 'empty' ? person.username : "Tên người dùng không khả dụng";
                                                    const displayDisplayName = person.displayName && person.displayName.toLowerCase() !== 'empty' ? person.displayName : displayUsername;
                                                    const displayBio = person.bio && person.bio.toLowerCase() !== 'empty' ? person.bio : "";
                                                    const userId = person.userId || person.id;
                                                    
                                                    return (
                                                        <Link
                                                            href={`/user/${userId}`}
                                                            key={userId}
                                                            className="list-group-item list-group-item-action"
                                                        >
                                                            <div className="d-flex align-items-center">
                                                                <Avatar
                                                                    src={person.avatar}
                                                                    alt={displayDisplayName}
                                                                    width={40}
                                                                    height={40}
                                                                    addClass="me-3 rounded-circle"
                                                                />
                                                                <div>
                                                                    <h5 className="mb-1">{displayDisplayName}</h5>
                                                                    {displayUsername !== "Tên người dùng không khả dụng" && (
                                                                        <Identifier type="user"
                                                                                    namespace={displayUsername}
                                                                                    addClass="mb-1 text-muted small"/>
                                                                    )}
                                                                    {displayBio && <small
                                                                        className="text-muted d-block">{displayBio}</small>}
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        );
                                    default:
                                        return <div className="text-center py-5" key={resultsContainerKey}><h3>Loại tìm
                                            kiếm không xác định.</h3></div>;
                                }
                            })()
                        )}
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="search-content">
            <Helmet>
                <title>{query ? `Kết quả tìm kiếm cho "${query}"` : 'Tìm kiếm'}</title>
                <meta name="description"
                      content={query ? `Kết quả tìm kiếm cho ${query}` : 'Tìm kiếm bài viết, cộng đồng và người dùng'}/>
            </Helmet>
            <div className="container py-4">
                {renderSectionTabs()}
                <div className="d-flex justify-content-start align-items-center mb-4">
                    {query && currentSearchType === 'posts' && (
                        <>
                            <div className="me-2">{renderSortOptions()}</div>
                            <div>{renderTimeOptions()}</div>
                        </>
                    )}
                </div>
                <div className="row">
                    <div className="col-lg-8">
                        {renderSearchResults()}
                    </div>
                    <div className="col-lg-4">
                        <Suspense fallback={
                            <LoadingSpinner
                                message="Đang tải thanh bên..."
                                overlayOpacity={0.01}
                                size={30}
                            />
                        }>
                            <SearchSidebarContent/>
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );
}