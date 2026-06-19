import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const uploadFile: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteFile: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=upload.d.ts.map