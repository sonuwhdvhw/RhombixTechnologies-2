import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const sendFriendRequest: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const respondToRequest: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const removeFriend: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getFriends: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getPendingRequests: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=friendships.d.ts.map