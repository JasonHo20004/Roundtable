// src/features/subtables/pages/SubtableView/subtableViewLoader.jsx
import subtableService from "#services/subtableService.jsx";

export default async function subtableViewLoader({params}) {
    const {subtableName} = params;
    let loaderError = null;

    if (!subtableName) {
        loaderError = "Subtable name is missing.";
        throw new Response(JSON.stringify({message: loaderError}), {
            status: 400,
            statusText: "Bad Request"
        });
    }

    try {
        // Fetch details and posts concurrently
        console.log("Fetching details and posts for subtable:", subtableName);
        const detailsResponse = await subtableService.getSubtableDetails(subtableName);
        const postsResponse = await subtableService.getSubtablePosts(subtableName); // Use the correct function
        const iconResponse = await subtableService.getSubtableMedia(detailsResponse.data.icon,subtableName); // Use the correct function
        const bannerResponse = await subtableService.getSubtableMedia(detailsResponse.data.banner,subtableName); // Use the correct function
        const joinResponse = await subtableService.getJoinSubtable(detailsResponse.data.subtableId)
        console.log("Icon Response:", iconResponse);
        console.log("Banner Response:", bannerResponse);

        console.log("Details Response:", detailsResponse);
        console.log("Posts Response:", postsResponse);
        console.log("join data",joinResponse)

        let detailsData = null;
        let postsData = [];
        let iconData = null;
        let bannerData = null;
        let joinData = null
        let login = true

        // Process details response
        if (detailsResponse.success && detailsResponse.data) {
            // Assuming details are nested like this based on previous component structure
            detailsData = detailsResponse.data;
            console.log("Details Data:", detailsData);
        } else {
            console.warn(`Loader Warning: Could not fetch valid details for subtable "${subtableName}".`, detailsResponse);
            loaderError = (loaderError ? loaderError + '\n' : '') + (detailsResponse.message || `Failed to load details for ${subtableName}.`);
        }

        // Process posts response
        if (postsResponse.success && Array.isArray(postsResponse.data)) {
            postsData = postsResponse.data;
        } else {
            console.warn(`Loader Warning: Could not fetch valid posts for subtable "${subtableName}".`, postsResponse);
            loaderError = (loaderError ? loaderError + '\n' : '') + (postsResponse.message || `Failed to load posts for ${subtableName}.`);
        }
        // Process icon and banner responses
        if (iconResponse.success && iconResponse.data) {
            iconData = iconResponse.data.url;
        } else {
            console.warn(`Loader Warning: Could not fetch valid icon for subtable "${subtableName}".`, iconResponse);
            loaderError = (loaderError ? loaderError + '\n' : '') + (iconResponse.message || `Failed to load icon for ${subtableName}.`);
        }
        if (bannerResponse.success && bannerResponse.data) {
            bannerData= bannerResponse.data.url;
        } else {
            console.warn(`Loader Warning: Could not fetch valid banner for subtable "${subtableName}".`, bannerResponse);
            loaderError = (loaderError ? loaderError + '\n' : '') + (bannerResponse.message || `Failed to load banner for ${subtableName}.`);
        }
        if(joinResponse.success && joinResponse.data.isJoined)
        {
            joinData = true
        }
        else if(joinResponse.success && !joinResponse.data.isJoined) joinData = false
        else if(!joinResponse.success) login = false

        // Return fetched data and any accumulated errors
        console.log('iconData:', iconData);
        console.log('bannerData:', bannerData);
        return {
            detailsData, // Should contain { name, icon, banner, ... }
            postsData,   // Should be an array like [{ post: {...}, author: {...} }, ...] or similar
            iconData,    // URL or data for the icon
            bannerData,  // URL or data for the banner
            loaderError,
            joinData,
            login
        };

    } catch (error) {
        console.error("Loader Error fetching subtable data:", error);
        // Throwing a Response is often better for errorElement handling
        throw new Response(JSON.stringify({message: error.message || "Failed to fetch subtable data."}), {
            status: 500,
            statusText: "Internal Server Error"
        });
    }
}