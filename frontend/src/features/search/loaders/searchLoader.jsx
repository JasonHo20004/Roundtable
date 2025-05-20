// src/features/search/loaders/searchLoader.jsx
import searchService from '#services/searchService.jsx';

export default async function searchLoader({request}) {
    const url = new URL(request.url);
    const q = url.searchParams.get('q'); // Correctly gets 'q' from URL
    const type = url.searchParams.get('type') || 'posts';
    const sortBy = url.searchParams.get('sortBy') || 'relevance';
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    if (!q) { // Handles cases where q might be missing or empty
        return {query: null, results: {items: [], type}, type, sortBy, limit, error: 'Search q is missing or empty.'};
    }

    try {
        let response;
        let items = [];

        switch (type) {
            case 'communities':
                // Ensure response.data.communities or similar is correctly assigned to items
                response = await searchService.searchCommunities({q, limit});
                if (response?.data?.communities) items = response.data.communities;
                break;
            case 'people':
                response = await searchService.searchUsers({q, limit});
                if (response?.data?.users) items = response.data.users;
                break;
            case 'posts':
            default:
                response = await searchService.searchPosts({q, sortBy, limit});
                if (response?.data?.posts) items = response.data.posts;
                break;
        }
        return {query: q, results: {items, type}, type, sortBy, limit, error: null};
    } catch (err) {
        console.error(`Search loader error (type: ${type}):`, err);
        return {
            query: q,
            results: {items: [], type},
            type,
            sortBy,
            limit,
            error: err.message || `Failed to fetch search results for ${type}.`
        };
    }
}