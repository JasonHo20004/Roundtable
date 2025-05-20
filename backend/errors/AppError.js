// src/errors/AppError.js
class AppError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

class BadRequestError extends AppError {
} // For invalid request data

class AuthenticationError extends AppError {
} // For login failures, invalid tokens etc.
class ForbiddenError extends AppError {
} // For permission issues, inactive accounts etc.
class NotFoundError extends AppError {
} // For non-existent resources
class UnauthorizedError extends AppError {
}
class ConflictError extends AppError {
} // For existing username/email
class VerificationError extends AppError {
} // For invalid/expired codes
class InternalServerError extends AppError {
} // For unexpected issues

export {
    AppError,
    BadRequestError,
    AuthenticationError,
    ForbiddenError,
    UnauthorizedError,
    NotFoundError,
    ConflictError,
    VerificationError,
    InternalServerError,
};