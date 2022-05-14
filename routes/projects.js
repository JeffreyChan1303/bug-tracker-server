import express from 'express';

import { getAllProjects, createProject } from '../controllers/projects.js';

const router = express.Router();


router.get('/allProjects', getAllProjects);
router.post('/createProject', createProject);


export default router;