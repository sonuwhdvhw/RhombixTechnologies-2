import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getStories: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createStory: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const viewStory: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=stories.d.ts.map