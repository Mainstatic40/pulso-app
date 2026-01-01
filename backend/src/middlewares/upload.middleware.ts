import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ValidationError } from '../utils/app-error';

// Allowed file types for profile images
const PROFILE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PROFILE_MAX_SIZE = 2 * 1024 * 1024; // 2MB

// Allowed file types for attachments
const ATTACHMENT_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  // PDF
  'application/pdf',
  // Office documents
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Videos
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  // Text
  'text/plain',
  'text/csv',
];
const ATTACHMENT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ATTACHMENT_MAX_COUNT = 5;

// Storage configuration for profile images
const profileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/profiles'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

// Storage configuration for attachments
const attachmentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/attachments'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

// File filter for profile images
const imageFileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (PROFILE_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError('Only JPG, PNG, and WebP images are allowed'));
  }
};

// File filter for attachments
const attachmentFileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (ATTACHMENT_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError('File type not allowed. Allowed: images, PDF, Office docs, videos, text files'));
  }
};

// Multer instance for profile image upload
export const uploadProfileImage = multer({
  storage: profileStorage,
  limits: {
    fileSize: PROFILE_MAX_SIZE,
  },
  fileFilter: imageFileFilter,
}).single('profileImage');

// Multer instance for attachment upload (multiple files)
export const uploadAttachments = multer({
  storage: attachmentStorage,
  limits: {
    fileSize: ATTACHMENT_MAX_SIZE,
    files: ATTACHMENT_MAX_COUNT,
  },
  fileFilter: attachmentFileFilter,
}).array('files', ATTACHMENT_MAX_COUNT);

// Multer instance for single attachment
export const uploadSingleAttachment = multer({
  storage: attachmentStorage,
  limits: {
    fileSize: ATTACHMENT_MAX_SIZE,
  },
  fileFilter: attachmentFileFilter,
}).single('file');
