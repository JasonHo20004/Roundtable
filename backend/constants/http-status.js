// src/constants/http-status.js

const HTTP_STATUS = {
    OK: 200,
    CREATED: 201, // Added for resource creation (like registration)
    NO_CONTENT: 204, // Added for successful actions with no body needed (e.g., maybe logout)
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401, // Typically for missing/invalid authentication credentials
    FORBIDDEN: 403, // Typically for authorized user lacking permissions (or specific states like unverified/banned)
    NOT_FOUND: 404,
    CONFLICT: 409, // Typically for resource creation conflicts (e.g., duplicate username/email)
    INTERNAL_SERVER_ERROR: 500,
};

export default HTTP_STATUS;