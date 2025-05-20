// src/features/users/loaders/profileLoader.jsx
import userService from '#services/userService';
import {redirect} from 'react-router';

async function profileLoader({params}) {
    const {userId: paramUserId} = params;

    if (!paramUserId) {
        console.error("ProfileLoader: userId parameter is missing.");
        return redirect('/404');
    }

    try {
        const fullResponse = await userService.getUserProfileByUserId(paramUserId);

        console.log('ProfileLoader: fullResponse:', fullResponse);

        if (fullResponse && fullResponse.success) {
            const profilePayload = fullResponse.profile || fullResponse.data;
            if (!profilePayload) {
                console.error('ProfileLoader: Profile data field (profile or data) is missing in the successful response.');
                // Consider throwing a Response that your route's errorElement can handle
                throw new Response("Profile data from API is malformed.", {status: 500});
            }
            return {
                userProfileData: profilePayload.user,
                paramUserId: paramUserId
            };
        } else {
            console.error('ProfileLoader: Failed to fetch profile -', fullResponse?.message);
            throw new Response(fullResponse?.message || "Profile not found", {status: fullResponse?.status || 404});
        }
    } catch (err) {
        console.error('ProfileLoader: Error fetching profile -', err);
        const status = err.status || (err instanceof Response ? err.status : 500);
        const message = err.message || "Could not load profile.";
        throw new Response(message, {status});
    }
}

export default profileLoader;