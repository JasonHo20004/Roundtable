/**
 * Định dạng thời gian theo kiểu "X time ago"
 * @param {Date|string} date - Thời gian cần định dạng
 * @returns {string} Chuỗi thời gian đã định dạng
 */
export function formatTimeAgo(date) {
    const now = new Date();
    const pastDate = new Date(date);
    
    // Kiểm tra xem date có hợp lệ không
    if (isNaN(pastDate.getTime())) {
        return 'Invalid date';
    }
    
    const diffInSeconds = Math.floor((now - pastDate) / 1000);
    
    if (diffInSeconds < 60) {
        return `${diffInSeconds} sec. ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} min. ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hr. ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return `${diffInDays} days ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `${diffInMonths} months ago`;
    }
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} years ago`;
}