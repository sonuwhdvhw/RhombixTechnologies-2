import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getComments: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createComment: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteComment: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=comments.d.ts.map