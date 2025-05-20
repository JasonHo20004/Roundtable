import subtableService from "#services/subtableService.jsx";

export default async function joinSubtableAction({ request }) {
    try {
        const formData = await request.formData();
        const subtableId = formData.get("subtableId");

        if (!subtableId) {
            return {
                success: false,
                message: "Subtable ID is required"
            };
        }

        const response = await subtableService.unfollowSubtable(subtableId);

        if (!response.success) {
            return {
                success: false,
                message: response.message || "Failed to unfollow subtable"
            };
        }

        return {
            success: true,
            message: "Successfully unfollowed subtable",
            data: response.data
        };

    } catch (error) {
        console.error("[unfollowSubtableAction] Error:", error);
        return {
            success: false,
            message: error.message || "An unexpected error occurred"
        };
    }
}