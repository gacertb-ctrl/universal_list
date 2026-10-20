import { Router } from 'express';
import {
  getCategories,
  getCategoryById,
  getCategoryTypes,
  getCategoryBrands,
  createCategory,
  updateCategory,
  deleteCategory,
  createCategoryType,
  updateCategoryType
} from '../controllers/category.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Public Routes
router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.get('/:id/types', getCategoryTypes);
router.get('/:id/brands', getCategoryBrands);

// Admin Routes
router.post('/', authenticate, authorize(['Super Admin', 'Admin']), createCategory);
router.put('/:id', authenticate, authorize(['Super Admin', 'Admin']), updateCategory);
router.delete('/:id', authenticate, authorize(['Super Admin', 'Admin']), deleteCategory);

router.post('/:id/types', authenticate, authorize(['Super Admin', 'Admin']), createCategoryType);
router.put('/types/:typeId', authenticate, authorize(['Super Admin', 'Admin']), updateCategoryType);

export default router;
