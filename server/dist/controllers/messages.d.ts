import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getConversations: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getMessages: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const sendMessage: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=messages.d.ts.map