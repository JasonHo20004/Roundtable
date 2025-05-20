// Function to calculate and format "time ago" in Vietnamese
function formatTimeAgo(dateString) {
    if (!dateString) {
        return ''; // Handle empty input
    }

    try {
        // 1. Parse the input date string
        // IMPORTANT: Native Date.parse can be unreliable for non-ISO formats.
        // ISO 8601 format (like "2023-10-27T10:30:00Z") is generally best.
        const date = new Date(dateString);

        // Check if parsing was successful
        if (isNaN(date.getTime())) {
            console.error("Invalid date string provided:", dateString);
            return dateString; // Return original string if invalid
        }

        // 2. Get timestamps (in milliseconds)
        const pastTimestamp = date.getTime();
        const currentTimestamp = Date.now(); // Current time in milliseconds

        // 3. Calculate the difference in seconds
        const elapsedSeconds = Math.floor((currentTimestamp - pastTimestamp) / 1000);

        // Handle cases where the date might be slightly in the future due to clock skew
        if (elapsedSeconds < 0) {
            return "ngay bây giờ"; // Or handle as appropriate
        }

        // 4. Define time intervals in seconds
        const intervals = [
            {label: 'năm', seconds: 31536000}, // approx 365 days
            {label: 'tháng', seconds: 2592000},  // approx 30 days
            {label: 'ngày', seconds: 86400},   // 24 hours
            {label: 'giờ', seconds: 3600},    // 1 hour
            {label: 'phút', seconds: 60},     // 1 minute
            // Seconds are handled separately below
        ];

        // 5. Find the largest interval that fits
        for (let i = 0; i < intervals.length; i++) {
            const interval = intervals[i];
            const count = Math.floor(elapsedSeconds / interval.seconds);
            if (count >= 1) {
                return `${count} ${interval.label} trước`;
            }
        }

        // 6. Handle seconds or "just now"
        if (elapsedSeconds < 5) {
            return "vừa xong";
        } else if (elapsedSeconds < 60) {
            return `${elapsedSeconds} giây trước`;
        } else {
            // Fallback for exactly 0 seconds difference after rounding perhaps
            return "vừa xong";
        }

    } catch (error) {
        console.error("Error formatting time ago:", error);
        return dateString; // Return original string on error
    }
}

export {formatTimeAgo};