import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getFeedPosts: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createPost: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getPost: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updatePost: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deletePost: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const toggleLike: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getUserPosts: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=posts.d.ts.map