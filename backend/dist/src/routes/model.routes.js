"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const model_controller_1 = require("../controllers/model.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Configure multer for CSV upload
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path_1.default.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = (0, multer_1.default)({ storage });
// Public Routes
router.get('/', model_controller_1.getModels);
router.get('/:id', model_controller_1.getModelById);
router.get('/:id/compatibility', model_controller_1.getModelCompatibility);
router.post('/request', model_controller_1.requestModel);
// Admin Routes
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['Super Admin', 'Admin']), model_controller_1.createModel);
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['Super Admin', 'Admin']), model_controller_1.updateModel);
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['Super Admin', 'Admin']), model_controller_1.deleteModel);
router.post('/:id/compatibility', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['Super Admin', 'Admin']), model_controller_1.addCompatibilityRelationship);
router.post('/bulk-import', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['Super Admin', 'Admin']), upload.single('file'), model_controller_1.bulkImportModels);
exports.default = router;
