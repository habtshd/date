export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', code = 'UNAUTHORIZED') {
    super(code, 401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden', code = 'FORBIDDEN') {
    super(code, 403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(code, 404, message);
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor(message = 'User account not found') {
    super(message, 'USER_NOT_FOUND');
  }
}

export class ProfileNotFoundError extends NotFoundError {
  constructor(message = 'Dating profile not found') {
    super(message, 'PROFILE_NOT_FOUND');
  }
}

export class VerificationRequiredError extends AppError {
  constructor(message = 'Identity verification is required to access this feature.') {
    super('VERIFICATION_REQUIRED', 403, message);
  }
}

export class ConversationLockedError extends AppError {
  constructor(message = 'Conversation is locked. Payment required to unlock messaging.') {
    super('CONVERSATION_LOCKED', 403, message);
  }
}

export class PaymentRequiredError extends AppError {
  constructor(message = 'Payment required to initiate or access this conversation.') {
    super('PAYMENT_REQUIRED', 402, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', code = 'CONFLICT') {
    super(code, 409, message);
  }
}

export class AlreadyMatchedError extends ConflictError {
  constructor(message = 'Users are already matched') {
    super(message, 'ALREADY_MATCHED');
  }
}

export class AlreadyBlockedError extends ConflictError {
  constructor(message = 'Interaction is blocked between these users') {
    super(message, 'ALREADY_BLOCKED');
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid request payload', details?: unknown) {
    super('VALIDATION_ERROR', 400, message, details);
  }
}

export class RateLimitedError extends AppError {
  constructor(message = 'Too many requests. Please try again later.') {
    super('RATE_LIMITED', 429, message);
  }
}
