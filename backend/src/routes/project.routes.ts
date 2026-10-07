import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from '../controllers/project.controller';
import { validate } from '../middlewares/validation';
import {
  createProjectSchema,
  updateProjectSchema,
} from '../validators/project.validator';
import { authenticate } from '../middlewares/auth';

const router = Router();

// All project routes require authentication
router.use(authenticate);

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', validate(createProjectSchema), createProject);
router.put('/:id', validate(updateProjectSchema), updateProject);
router.delete('/:id', deleteProject);

export default router;
