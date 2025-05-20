// backend/daos/user-post-details.dao.js
import {postgresInstance} from '#db/postgres.js';
import UserPostDetails from '#models/user-post-details.model.js';

/**
 * @typedef {Object} GetPostsOptions
 * @property {string} [sortBy='postCreatedAt'] - Column from the VIEW to sort by (e.g., 'postCreatedAt', 'voteCount', 'commentCount'). Must be whitelisted.
 * @property {'asc' | 'desc'} [order='desc'] - Sort order ('asc' or 'desc'). Default is 'desc' for recency.
 * @property {boolean} [includeRemoved=false] - Whether to include posts marked as removed.
 * @property {number | null} [limit=25] - Maximum number of posts to return (for pagination). Null for no limit.
 * @property {number} [offset=0] - Number of posts to skip (for pagination).
 */

class UserPostDetailsDAO {
    constructor() {
        this.viewName = 'UserPostDetails'; // IMPORTANT: Replace with your actual VIEW name
    }

    /**
     * Retrieves posts from the UserPostDetails view based on various criteria.
     * This method is used by PostService.getPosts().
     * @param {object} options - Filtering, sorting, and pagination options.
     * @param {object} [options.filterBy={}] - Filter criteria for the query.
     * @param {string} [options.sortBy='postCreatedAt'] - Field to sort by. Valid options: 'postCreatedAt', 'voteCount', 'commentCount'.
     * @param {string} [options.order='desc'] - Sort order ('asc' or 'desc').
     * @param {number} [options.limit=25] - Maximum number of posts to return.
     * @param {number} [options.offset=0] - Number of posts to skip (for pagination).
     * @returns {Promise<Array<object>>} A promise that resolves to an array of post detail objects from the view.
     * @throws {Error} If there's an error during database interaction.
     */
    async getPosts({
                       filterBy = {},
                       sortBy = 'postCreatedAt',
                       order = 'desc',
                       limit = 25,
                       offset = 0,
                   }) {
        try {
            const query = postgresInstance(this.viewName)
                .select('*');

            // Apply filters
            if (filterBy && typeof filterBy === 'object' && Object.keys(filterBy).length > 0) {
                query.where(filterBy);
            }

            // Validate and apply sorting
            const validSortByFields = ['postCreatedAt', 'voteCount', 'commentCount'];
            const validatedSortBy = validSortByFields.includes(sortBy) ? sortBy : 'postCreatedAt';
            const validatedOrder = ['asc', 'desc'].includes(order.toLowerCase()) ? order.toLowerCase() : 'desc';

            query.orderBy(validatedSortBy, validatedOrder);

            // Apply pagination
            if (typeof limit === 'number' && limit > 0) {
                query.limit(limit);
            }
            if (typeof offset === 'number' && offset >= 0) {
                query.offset(offset);
            }

            const posts = await query;
            console.log('[UserPostDetailsDAO:getPosts] Fetched posts:', posts.length);
            return posts.map(row => UserPostDetails.fromDbRow(row));

        } catch (error) {
            console.error('[UserPostDetailsDAO:getPosts] Error fetching posts:', error);
            throw error; // Re-throw to be handled by the calling service
        }
    }


    /**
     * Fetches detailed post information for a single post by its ID from the VIEW.
     * @param {string} postId - The UUID of the post.
     * @returns {Promise<UserPostDetails | null>} - A promise resolving to a UserPostDetails instance or null if not found.
     * @throws {Error} Throws database errors.
     */
    async getByPostId(postId) {
        if (!postId) return null;
        try {
            const viewRow = await postgresInstance(this.viewName)
                .where({postId: postId})
                .first();
            return UserPostDetails.fromDbRow(viewRow);
        } catch (error) {
            console.error(`[UserPostDetailsDAO] Error fetching by postId (${postId}):`, error);
            throw error;
        }
    }

    /**
     * Fetches a list of detailed posts belonging to a specific subtable from the VIEW.
     * @param {string} subtableId - The UUID of the subtable.
     * @param {GetPostsOptions} [options={}] - Options for sorting, filtering, and pagination.
     * @returns {Promise<UserPostDetails[]>} - A promise resolving to an array of UserPostDetails instances.
     * @throws {Error} Throws database errors.
     */
    async getBySubtableId(subtableId, options = {}) {
        if (!subtableId) {
            console.warn('[UserPostDetailsDAO] getBySubtableId called without subtableId.');
            return [];
        }

        const {limit, offset, sortBy, order, includeRemoved} = this._prepareQueryOptions(options);

        try {
            let query = postgresInstance(this.viewName)
                .select('*')
                .where({subtableId: subtableId});

            if (!includeRemoved) {
                query = query.andWhere({isRemoved: false});
            }

            query = query.orderBy(sortBy, order).offset(offset);

            if (limit !== null) {
                query = query.limit(limit);
            }

            const viewRows = await query;
            return viewRows.map(row => UserPostDetails.fromDbRow(row)).filter(details => details !== null);

        } catch (error) {
            console.error(`[UserPostDetailsDAO] Error fetching by subtableId (${subtableId}):`, error);
            throw error;
        }
    }

    /**
     * Fetches a list of detailed posts authored by a specific user from the VIEW.
     * @param {string} authorUserId - The UUID of the author (RegisteredUser).
     * @param {GetPostsOptions} [options={}] - Options for sorting, filtering, and pagination.
     * @returns {Promise<UserPostDetails[]>} - A promise resolving to an array of UserPostDetails instances.
     * @throws {Error} Throws database errors.
     */
    async getByAuthorUserId(authorUserId, options = {}) {
        if (!authorUserId) {
            console.warn('[UserPostDetailsDAO] getByAuthorUserId called without authorUserId.');
            return [];
        }

        const {limit, offset, sortBy, order, includeRemoved} = this._prepareQueryOptions(options);

        try {
            let query = postgresInstance(this.viewName)
                .select('*')
                .where({authorUserId: authorUserId});

            if (!includeRemoved) {
                query = query.andWhere({isRemoved: false});
            }

            query = query.orderBy(sortBy, order).offset(offset);

            if (limit !== null) {
                query = query.limit(limit);
            }

            const viewRows = await query;
            return viewRows.map(row => UserPostDetails.fromDbRow(row)).filter(details => details !== null);

        } catch (error) {
            console.error(`[UserPostDetailsDAO] Error fetching by authorUserId (${authorUserId}):`, error);
            throw error;
        }
    }

    /**
     * Fetches a list of posts for the home page from the VIEW.
     * Options for sorting, filtering, and pagination.
     * If `options.sortBy` is 'score', posts are scored and sorted by this custom score in the application.
     * Otherwise, sorting is performed by the database based on `options.sortBy` and `options.order`.
     *
     * @param {object} [options={}] - Options for querying.
     * @param {number} [options.limit] - Number of posts to return.
     * @param {number} [options.offset] - Number of posts to skip (for pagination).
     * @param {string} [options.sortBy='postCreatedAt'] - Column to sort by, or 'score' for custom scoring.
     * @param {string} [options.order='desc'] - Sort order ('asc' or 'desc').
     * @param {boolean} [options.includeRemoved=false] - Whether to include posts marked as removed.
     * @returns {Promise<UserPostDetails[]>} - A promise resolving to an array of formatted post objects.
     * @throws {Error} Throws database errors.
     */
    async getHomePosts(options = {}) {
        const isSortingByScore = options.sortBy === 'score';
        const { timeRange, timePreference } = options;
    
        const {
            limit,
            offset = 0,
            sortBy: dbSortBy,
            order,
            includeRemoved
        } = this._prepareQueryOptions(options);
    
        try {
            let query = postgresInstance(this.viewName).select('*');
    
            if (!includeRemoved) {
                query = query.where('isRemoved', false);
            }
    
            // Nếu là rising, chỉ lấy bài viết trong 24h
            if (timeRange === '24h') {
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                query = query.where('postCreatedAt', '>=', oneDayAgo);
            }
    
            // If not sorting by custom score, apply database-level sorting and pagination (if limit is provided)
            if (!isSortingByScore && !timePreference) {
                query = query.orderBy(dbSortBy, order).offset(offset);
                if (limit !== null && limit !== undefined) { // Ensure limit is explicitly set
                    query = query.limit(limit);
                }
            }

            const viewRows = await query;
            let posts = viewRows.map(row => UserPostDetails.fromDbRow(row)).filter(post => post !== null);

            let now = new Date();
            // Xử lý trường hợp timePreference = '3months' cho cả Hot và Top
            if (timePreference === '3months') {
                const threeMonthsAgo = new Date(now);
                threeMonthsAgo.setMonth(now.getMonth() - 3);
                
                // Chia bài viết thành 2 nhóm: trong 3 tháng và ngoài 3 tháng
                const recentPosts = [];
                const olderPosts = [];
                
                posts.forEach(post => {
                    const postDate = new Date(post.postCreatedAt);
                    if (postDate >= threeMonthsAgo) {
                        recentPosts.push(post);
                    } else {
                        olderPosts.push(post);
                    }
                });
                
                if (isSortingByScore) {
                    // Xử lý cho chế độ Hot
                    // Tính điểm cho cả hai nhóm
                    const scoredRecentPosts = this._calculateScores(recentPosts, now);
                    const scoredOlderPosts = this._calculateScores(olderPosts, now);
                    
                    // Sắp xếp mỗi nhóm theo điểm
                    scoredRecentPosts.sort((a, b) => order === 'asc' ? a._score - b._score : b._score - a._score);
                    
                    // Sắp xếp nhóm cũ hơn theo điểm và thời gian
                    scoredOlderPosts.sort((a, b) => {
                        // Nếu điểm khác nhau, sắp xếp theo điểm
                        if (b._score !== a._score) {
                            return order === 'asc' ? a._score - b._score : b._score - a._score;
                        }
                        // Nếu điểm bằng nhau, sắp xếp theo thời gian
                        const dateA = new Date(a.postCreatedAt);
                        const dateB = new Date(b.postCreatedAt);
                        return order === 'asc' ? dateA - dateB : dateB - dateA;
                    });
                    
                    // Ghép hai nhóm lại, ưu tiên nhóm gần đây
                    const combinedPosts = [...scoredRecentPosts, ...scoredOlderPosts];
                    
                    // Áp dụng phân trang
                    const startIndex = offset;
                    const endIndex = (limit !== null && limit !== undefined) ? offset + limit : combinedPosts.length;
                    const paginatedPosts = combinedPosts.slice(startIndex, endIndex);
                    
                    // Loại bỏ thuộc tính _score trước khi trả về
                    return paginatedPosts.map(p => {
                        const {_score, ...cleanPost} = p;
                        return cleanPost;
                    });
                } else {
                    // Xử lý cho chế độ Top (sortBy = voteCount)
                    // Sắp xếp mỗi nhóm theo số lượt vote
                    recentPosts.sort((a, b) => {
                        const voteA = a.voteCount || 0;
                        const voteB = b.voteCount || 0;
                        return order === 'asc' ? voteA - voteB : voteB - voteA;
                    });
                    
                    // Sắp xếp nhóm cũ hơn theo số lượt vote và thời gian
                    olderPosts.sort((a, b) => {
                        const voteA = a.voteCount || 0;
                        const voteB = b.voteCount || 0;
                        
                        // Nếu số vote khác nhau, sắp xếp theo số vote
                        if (voteA !== voteB) {
                            return order === 'asc' ? voteA - voteB : voteB - voteA;
                        }
                        
                        // Nếu số vote bằng nhau, sắp xếp theo thời gian
                        const dateA = new Date(a.postCreatedAt);
                        const dateB = new Date(b.postCreatedAt);
                        return order === 'asc' ? dateA - dateB : dateB - dateA;
                    });
                    
                    // Ghép hai nhóm lại, ưu tiên nhóm gần đây
                    const combinedPosts = [...recentPosts, ...olderPosts];
                    
                    // Áp dụng phân trang
                    const startIndex = offset;
                    const endIndex = (limit !== null && limit !== undefined) ? offset + limit : combinedPosts.length;
                    return combinedPosts.slice(startIndex, endIndex);
                }
            } else if (isSortingByScore) {
                // Xử lý bình thường cho các trường hợp khác của Hot
                const scoredPosts = this._calculateScores(posts, now);
                
                // Sort posts by the calculated score.
                scoredPosts.sort((a, b) => {
                    return order === 'asc' ? a._score - b._score : b._score - a._score;
                });
    
                // Apply pagination (limit and offset) after scoring and sorting
                const startIndex = offset;
                const endIndex = (limit !== null && limit !== undefined) ? offset + limit : scoredPosts.length;
                const paginatedPosts = scoredPosts.slice(startIndex, endIndex);
    
                // Remove the _score property before returning
                return paginatedPosts.map(p => {
                    const {_score, ...cleanPost} = p;
                    return cleanPost;
                });
            } else {
                // If not sorting by score, posts are already sorted and paginated by the DB (if limit was applied).
                return posts;
            }
     
        } catch (error) {
            console.error(`[UserPostDetailsDAO] Error fetching home posts:`, error);
            throw error;
        }
    }
    /**
     * Thêm phương thức mới để tính điểm cho bài viết
     * @param {UserPostDetails[]} posts - Mảng các bài viết
     * @param {Date} now - Ngày hiện tại
     */
    _calculateScores(posts, now) {
        return posts.map(post => {
            // 1. Time Score (newer is higher)
            const postDate = new Date(post.postCreatedAt);
            // Handle invalid dates robustly
            const ageInDays = (postDate && !isNaN(postDate.getTime())) ? (now - postDate) / (1000 * 60 * 60 * 24) : Infinity;
            const timeScore = (postDate && !isNaN(postDate.getTime())) ? Math.max(0, 100 - ageInDays) : 0;
    
            // 2. Vote Score (more votes is higher)
            const voteScore = (post.voteCount || 0) * 10; // Default to 0 if voteCount is null/undefined
    
            // 3. Comment Score (more comments is higher)
            const commentScore = (post.commentCount || 0) * 5; // Default to 0 if commentCount is null/undefined
    
            const totalScore = timeScore + voteScore + commentScore;
    
            return {
                ...post,
                _score: totalScore
            };
        });
    }
    
    _prepareQueryOptions(options = {}) {
        const defaults = {
            sortBy: 'postCreatedAt', // Default sort column
            order: 'desc',           // Default sort order
            includeRemoved: false,
            limit: null,             // Không giới hạn số lượng bài viết
            offset: 0
        };
        const finalOptions = {...defaults, ...options};
    
        // Whitelist allowed sort columns from the VIEW
        const allowedSortColumns = ['postCreatedAt', 'voteCount', 'commentCount', 'title', 'authorUsername', 'subtableName'];
        
        // Nếu sortBy là 'score', giữ nguyên giá trị này
        const sortBy = finalOptions.sortBy === 'score' 
            ? 'score' 
            : allowedSortColumns.includes(finalOptions.sortBy) 
                ? finalOptions.sortBy 
                : defaults.sortBy;
    
        const order = finalOptions.order?.toLowerCase() === 'asc' ? 'asc' : 'desc'; // Default to desc
    
        // Ensure limit is a positive integer or null
        const limit = (finalOptions.limit !== null && Number.isInteger(Number(finalOptions.limit)) && Number(finalOptions.limit) > 0)
            ? Number(finalOptions.limit)
            : null;
    
        // Ensure offset is a non-negative integer
        const offset = (Number.isInteger(Number(finalOptions.offset)) && Number(finalOptions.offset) >= 0)
            ? Number(finalOptions.offset)
            : defaults.offset;
    
        const includeRemoved = typeof finalOptions.includeRemoved === 'boolean' ? finalOptions.includeRemoved : defaults.includeRemoved;
        
        // Truyền các tham số bổ sung nếu có
        const result = {sortBy, order, includeRemoved, limit, offset};
        if (finalOptions.timeRange) {
            result.timeRange = finalOptions.timeRange;
        }
        if (finalOptions.timePreference) {
            result.timePreference = finalOptions.timePreference;
        }
    
        console.log(`[UserPostDetailsDAO] Prepared query options:`, result);
        return result;
    }

    /**
     * Searches posts based on q parameters using the UserPostDetails view
     * @param {string} q - Search q
     * @param {Object} options - Search options
     * @param {number} options.subtableId - Subtable ID
     * @param {string} options.sortBy - Sort by column
     * @param {string} options.time - Time range
     * @param {number} options.limit - Limit number of results
     * @param {number} options.offset - Offset for pagination
     * @returns {Promise<{posts: Array<UserPostDetails>, total: number}>} Search results and total count
     * @param q
     * @param options
     */
    async searchPosts(q, options = {}) {
        const {
            subtableId,
            sortBy = 'relevance',
            time = 'all',
            limit = 10,
            offset = 0
        } = options;

        try {
            if (typeof q !== 'string') {
                throw new Error('Search query `q` must be a string');
            }

            // Escape LIKE wildcards within the query itself
            const escapeLikePattern = (s) => s.replace(/[%_]/g, '\\$&');
            const escapedQuery = escapeLikePattern(q);
            // Further escape potential regex/special chars - adjust if using more complex search
            const searchQuery = escapedQuery.replace(/[!@#$%^&*(),.?":{}|<>]/g, '\\$&');

            // --- Define a function to apply the time filter ---
            const applyTimeFilter = (queryBuilder) => {
                switch (time) {
                    case 'day':
                        queryBuilder.where('postCreatedAt', '>=', postgresInstance.raw("CURRENT_TIMESTAMP - interval '1 day'"));
                        break;
                    case 'week':
                        queryBuilder.where('postCreatedAt', '>=', postgresInstance.raw("CURRENT_TIMESTAMP - interval '7 days'"));
                        break;
                    case 'month':
                        queryBuilder.where('postCreatedAt', '>=', postgresInstance.raw("CURRENT_TIMESTAMP - interval '1 month'"));
                        break;
                    case 'year':
                        queryBuilder.where('postCreatedAt', '>=', postgresInstance.raw("CURRENT_TIMESTAMP - interval '1 year'"));
                        break;
                    case 'all':
                    default:
                        break;
                }
            };

            // --- Build and Execute Count Query ---
            const countQueryBase = postgresInstance(this.viewName)
                .where('isRemoved', false)
                .where(function() {
                    this.where('title', 'ILIKE', `%${searchQuery}%`)
                        .orWhere('body', 'ILIKE', `%${searchQuery}%`);
                });

            if (subtableId) {
                countQueryBase.where('subtableId', subtableId);
            }
            applyTimeFilter(countQueryBase); // Apply time filter to count query

            const [{total}] = await countQueryBase.count('* as total');

            // --- Build Main Search Query ---
            let searchResultsQuery = postgresInstance(this.viewName)
                .select('*')
                .where('isRemoved', false)
                .where(function() {
                    this.where('title', 'ILIKE', `%${searchQuery}%`)
                        .orWhere('body', 'ILIKE', `%${searchQuery}%`);
                });

            if (subtableId) {
                searchResultsQuery.where('subtableId', subtableId);
            }
            applyTimeFilter(searchResultsQuery); // Apply time filter to results query

            // --- Apply Sorting ---
            switch (sortBy) {
                case 'newest':
                    searchResultsQuery = searchResultsQuery.orderBy('postCreatedAt', 'desc');
                    break;
                case 'votes':
                    // Highest votes first, then newest as tie-breaker
                    searchResultsQuery = searchResultsQuery
                        .orderBy('voteCount', 'desc')
                        .orderBy('postCreatedAt', 'desc');
                    break;
                case 'relevance':
                default:
                    // Relevance Score: Exact title > Partial title > Partial body, then newest
                    searchResultsQuery = searchResultsQuery.orderByRaw(`
                        CASE
                            WHEN "title" ILIKE ? THEN 3
                            WHEN "title" ILIKE ? THEN 2
                            WHEN "body"  ILIKE ? THEN 1
                            ELSE 0
                        END DESC,
                        "postCreatedAt" DESC
                    `, [`${searchQuery}`, `%${searchQuery}%`, `%${searchQuery}%`]); // Parameters passed safely
                    break;
            }

            // --- Apply Pagination & Execute ---
            searchResultsQuery = searchResultsQuery.limit(limit).offset(offset);
            const searchResults = await searchResultsQuery;

            // --- Map results and return ---
            return {
                posts: searchResults.map(row => UserPostDetails.fromDbRow(row)).filter(post => post !== null),
                total: parseInt(total, 10) || 0 // Ensure total is a non-negative integer
            };

        } catch (error) {
            console.error(`[UserPostDetailsDAO:searchPosts] Error searching for query "${q}" with options ${JSON.stringify(options)}:`, error);
            throw error; // Re-throw the error for upstream handling
        }
    }
}

export default new UserPostDetailsDAO();