import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getProfile: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateProfile: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const searchUsers: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getSuggestedUsers: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=profiles.d.ts.map