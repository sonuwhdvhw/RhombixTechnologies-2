import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import { createError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

export const uploadFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { bucket = 'media', folder = 'uploads' } = req.query;

    if (!req.file) throw createError('No file provided', 400);

    const ext = req.file.originalname.split('.').pop();
    const fileName = `${folder}/${userId}/${uuidv4()}.${ext}`;

    const { data, error } = await supabaseAdmin.storage
      .from(String(bucket))
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) throw createError(error.message, 400);

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(String(bucket)).getPublicUrl(data.path);

    res.json({ url: publicUrl, path: data.path });
  } catch (err) {
    next(err);
  }
};

export const deleteFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bucket = 'media', path } = req.body;

    if (!path) throw createError('File path is required', 400);

    const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);

    if (error) throw createError(error.message, 400);

    res.json({ message: 'File deleted' });
  } catch (err) {
    next(err);
  }
};
