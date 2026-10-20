"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const brand_controller_1 = require("../controllers/brand.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Public Routes
router.get('/', brand_controller_1.getBrands);
router.get('/:id', brand_controller_1.getBrandById);
// Admin Routes
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['Super Admin', 'Admin']), brand_controller_1.createBrand);
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['Super Admin', 'Admin']), brand_controller_1.updateBrand);
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['Super Admin', 'Admin']), brand_controller_1.deleteBrand);
exports.default = router;
