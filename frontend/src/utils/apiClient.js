// src/utils/apiClient.js (Create this new file or add to an existing utility file)

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Sends an API request.
 * @param {string} url - The endpoint URL.
 * @param {object} options - Fetch options.
 * @param {string} [options.method='GET'] - HTTP method.
 * @param {object|FormData|null} [options.body=null] - Request body (will be JSON stringified if not FormData).
 * @param {object} [options.headers={}] - Additional headers.
 * @returns {Promise<object>} - The JSON response data.
 * @throws {Error} - Throws an error with status and data on failure.
 */
export async function sendApiRequest(url, options = {}) {
    const {method = 'GET', body = null, headers = {}} = options;
    const fullUrl = `${API_BASE_URL}${url}`;

    // Determine if we're sending FormData
    const isFormData = body instanceof FormData;

    try {
        const response = await fetch(fullUrl, {
            method,
            body: body ? (isFormData ? body : JSON.stringify(body)) : null,
            headers: {
                // Only set Content-Type if not FormData
                ...(isFormData ? {} : {'Content-Type': 'application/json'}),
                ...headers,
            },
            credentials: 'include',
        });

        // Try to parse JSON body even for errors, as it might contain details
        const responseData = await response.json();
        console.log("responseData", responseData);

        if (!response.ok) {
            // Create a custom error object including status and response data
            const error = new Error(responseData.message || `Request failed with status ${response.status}`);
            error.status = response.status;
            error.data = responseData; // Attach the parsed error response body
            throw error;
        }

        // Return the parsed data on success
        return {
            status: response.status,
            ...responseData
        }

    } catch (err) {
        console.error(`API Request Error to ${fullUrl}:`, err);
        // Ensure the error has a status if possible, default to 500
        if (!err.status) {
            err.status = 500;
        }
        // Re-throw the error so the calling function (e.g., router action) can handle it
        throw err;
    }
}