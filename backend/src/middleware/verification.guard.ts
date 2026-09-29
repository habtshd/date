import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../common/errors';

/**
 * Enforces that the requesting user has completed identity verification
 * and holds the VERIFIED status.
 */
export function requireVerified(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  if (req.user.verificationStatus !== 'VERIFIED') {
    return next(
      new ForbiddenError('Identity verification required. Complete verification to access this feature.')
    );
  }

  next();
}
