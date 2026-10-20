import { Router } from 'express';
import {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
} from '../controllers/brand.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Public Routes
router.get('/', getBrands);
router.get('/:id', getBrandById);

// Admin Routes
router.post('/', authenticate, authorize(['Super Admin', 'Admin']), createBrand);
router.put('/:id', authenticate, authorize(['Super Admin', 'Admin']), updateBrand);
router.delete('/:id', authenticate, authorize(['Super Admin', 'Admin']), deleteBrand);

export default router;
