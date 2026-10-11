const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class CloudinaryStorage {
  constructor(cloudinaryClient, params) {
    this.cloudinary = cloudinaryClient;
    this.params = params;
  }

  _handleFile(req, file, callback) {
    let finished = false;
    const finish = (error, info) => {
      if (finished) return;
      finished = true;
      callback(error, info);
    };

    const uploadStream = this.cloudinary.uploader.upload_stream(this.params, (error, result) => {
      if (error) return finish(error);
      finish(null, {
        filename: result.public_id,
        public_id: result.public_id,
        path: result.secure_url,
        secure_url: result.secure_url,
        resource_type: result.resource_type,
        size: result.bytes
      });
    });

    file.stream.once('error', finish);
    uploadStream.once('error', finish);
    file.stream.pipe(uploadStream);
  }

  _removeFile(req, file, callback) {
    const publicId = file.public_id || file.filename;
    if (!publicId) return callback(null);

    this.cloudinary.uploader.destroy(publicId, {
      resource_type: file.resource_type || 'raw',
      invalidate: true
    }, (error) => callback(error));
  }
}

// Store uploaded notes and documents directly in Cloudinary.
const cloudStorage = new CloudinaryStorage(cloudinary, {
  folder: 'studysync-notes',
  allowed_formats: ['pdf', 'doc', 'docx', 'ppt', 'pptx'],
  resource_type: 'raw'
});

// File filter for uploads
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, and PPT files are allowed.'), false);
  }
};

// Create multer upload instance for documents
const upload = multer({
  storage: cloudStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024  // 10MB limit
  }
});

module.exports = { cloudinary, upload };
