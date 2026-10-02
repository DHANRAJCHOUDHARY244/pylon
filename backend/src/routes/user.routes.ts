import { Router } from 'express';

import { userController } from '../controllers/user.controller.js';
import { authenticate, requireAdmin, validate } from '../middleware/index.js';
import { loginSchema, registerSchema, updateProfileSchema, changePasswordSchema } from '../validators/user.validator.js';

const router = Router();

router.post('/register', validate(registerSchema), userController.register);
router.post('/login', validate(loginSchema), userController.login);
router.get('/me', authenticate, userController.me);
router.patch('/me', authenticate, validate(updateProfileSchema), userController.updateMe);
router.post('/me/password', authenticate, validate(changePasswordSchema), userController.changePassword);
router.get('/', authenticate, requireAdmin, userController.list);

export default router;
