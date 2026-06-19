"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.uploadFile = void 0;
const supabase_1 = require("../lib/supabase");
const errorHandler_1 = require("../middleware/errorHandler");
const uuid_1 = require("uuid");
const uploadFile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { bucket = 'media', folder = 'uploads' } = req.query;
        if (!req.file)
            throw (0, errorHandler_1.createError)('No file provided', 400);
        const ext = req.file.originalname.split('.').pop();
        const fileName = `${folder}/${userId}/${(0, uuid_1.v4)()}.${ext}`;
        const { data, error } = await supabase_1.supabaseAdmin.storage
            .from(String(bucket))
            .upload(fileName, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false,
        });
        if (error)
            throw (0, errorHandler_1.createError)(error.message, 400);
        const { data: { publicUrl }, } = supabase_1.supabaseAdmin.storage.from(String(bucket)).getPublicUrl(data.path);
        res.json({ url: publicUrl, path: data.path });
    }
    catch (err) {
        next(err);
    }
};
exports.uploadFile = uploadFile;
const deleteFile = async (req, res, next) => {
    try {
        const { bucket = 'media', path } = req.body;
        if (!path)
            throw (0, errorHandler_1.createError)('File path is required', 400);
        const { error } = await supabase_1.supabaseAdmin.storage.from(bucket).remove([path]);
        if (error)
            throw (0, errorHandler_1.createError)(error.message, 400);
        res.json({ message: 'File deleted' });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteFile = deleteFile;
//# sourceMappingURL=upload.js.map