import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getNotifications: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const markAsRead: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=notifications.d.ts.map