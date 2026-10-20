import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  getModels,
  getModelById,
  getModelCompatibility,
  createModel,
  updateModel,
  deleteModel,
  requestModel,
  bulkImportModels,
  exportSampleCsv,
  addCompatibilityRelationship
} from '../controllers/model.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Configure multer for CSV upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Public Routes
router.get('/', getModels);
router.get('/sample-csv', exportSampleCsv);
router.get('/:id', getModelById);
router.get('/:id/compatibility', getModelCompatibility);
router.post('/request', requestModel);

// Admin Routes
router.post('/', authenticate, authorize(['Super Admin', 'Admin']), createModel);
router.put('/:id', authenticate, authorize(['Super Admin', 'Admin']), updateModel);
router.delete('/:id', authenticate, authorize(['Super Admin', 'Admin']), deleteModel);
router.post('/:id/compatibility', authenticate, authorize(['Super Admin', 'Admin']), addCompatibilityRelationship);
router.post('/bulk-import', authenticate, authorize(['Super Admin', 'Admin']), upload.single('file'), bulkImportModels);

export default router;
