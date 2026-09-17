import { Router } from 'express';
import { uploadFile } from '../controllers/uploadController.js';
import upload from '../middleware/upload.js';
import auth from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.post('/', upload.single('file'), uploadFile);

export default router;
