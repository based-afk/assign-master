import { Router } from 'express';
import { getActivityLogs } from '../controllers/activity.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);
router.get('/', getActivityLogs);

export default router;
