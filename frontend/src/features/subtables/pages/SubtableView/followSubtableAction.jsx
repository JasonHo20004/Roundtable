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

        const response = await subtableService.followSubtable(subtableId);

        if (!response.success) {
            return {
                success: false,
                message: response.message || "Failed to follow subtable"
            };
        }

        return {
            success: true,
            message: "Successfully followed subtable",
            data: response.data
        };

    } catch (error) {
        console.error("[followSubtableAction] Error:", error);
        return {
            success: false,
            message: error.message || "An unexpected error occurred"
        };
    }
}