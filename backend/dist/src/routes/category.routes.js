"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = require("../controllers/category.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Public Routes
router.get('/', category_controller_1.getCategories);
router.get('/:id', category_controller_1.getCategoryById);
router.get('/:id/types', category_controller_1.getCategoryTypes);
router.get('/:id/brands', category_controller_1.getCategoryBrands);
// Admin Routes
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['Super Admin', 'Admin']), category_controller_1.createCategory);
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['Super Admin', 'Admin']), category_controller_1.updateCategory);
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['Super Admin', 'Admin']), category_controller_1.deleteCategory);
router.post('/:id/types', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['Super Admin', 'Admin']), category_controller_1.createCategoryType);
router.put('/types/:typeId', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['Super Admin', 'Admin']), category_controller_1.updateCategoryType);
exports.default = router;
