import cloudinary from '../config/cloudinary.js';
import catchAsync from '../utils/catchAsync.js';

// Upload a file to Cloudinary
export const uploadFile = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file provided',
    });
  }

  const b64 = req.file.buffer.toString('base64');
  const dataURI = `data:${req.file.mimetype};base64,${b64}`;

  const isImage = req.file.mimetype.startsWith('image/');

  const result = await cloudinary.uploader.upload(dataURI, {
    resource_type: isImage ? 'image' : 'raw',
    folder: 'taskalgo/attachments',
    format: isImage ? undefined : req.file.originalname.split('.').pop(),
  });

  return res.status(201).json({
    success: true,
    data: {
      file: {
        url: result.secure_url,
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
        publicId: result.public_id,
      },
    },
  });
});
