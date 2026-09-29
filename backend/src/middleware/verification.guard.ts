import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../common/errors';

/**
 * Enforces that the requesting user has completed identity verification
 * and holds the VERIFIED_USER role.
 */
export function requireVerified(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  if (req.user.role !== 'VERIFIED_USER') {
    return next(
      new ForbiddenError('Identity verification required. Complete verification to access this feature.')
    );
  }

  next();
}
