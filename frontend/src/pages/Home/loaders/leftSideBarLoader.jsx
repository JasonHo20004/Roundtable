import searchService from '#services/searchService';
import subtableService from "#services/subtableService.jsx";

export default async function leftSideBarLoader() {
    try {

    console.log('Loading sidebar data...');
    // Lấy danh sách cộng đồng
    const res = await searchService.searchCommunities({ q: '', limit: 8 });
    const communityList = res?.data?.communities || [];

    // Lặp qua để gắn media icon
    const communitiesWithMedia = await Promise.all(
      communityList.map(async (community) => {
        try {
          const mediaResponse = await subtableService.getSubtableMedia(
            community.icon,
            community.name
          );

          return {
            ...community,
            icon: mediaResponse.data.url,
          };
        } catch (error) {
          console.error(`Failed to load media for community ${community.name}:`, error);
          return community; // Giữ nguyên nếu lỗi
        }
      })
    );
    console.log('Communities with media:', communitiesWithMedia);

    // Trả dữ liệu dạng object đúng chuẩn
    return {
      communities: communitiesWithMedia,
    };
  } catch (error) {
    console.error('Error loading sidebar data:', error);
    return {
      communities: [],
    };
  }
}