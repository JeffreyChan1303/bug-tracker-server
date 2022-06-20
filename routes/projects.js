import express from 'express';

import { getAllProjects, getAllProjectsBySearch, getMyProjects, getMyProjectsBySearch, getArchivedProjects, getArchivedProjectsBySearch, createProject } from '../controllers/projects.js';
import auth from '../middleware/auth.js';

const router = express.Router();


router.get('/allProjects', auth, getAllProjects);
router.get('/allProjects/search', auth, getAllProjectsBySearch);
router.get('/myProjects', auth, getMyProjects);
router.get('/myProjects/search', auth, getMyProjectsBySearch);
router.get('/projectArchive', auth, getArchivedProjects);
router.get('/projectArchive/search', auth, getArchivedProjectsBySearch);




router.post('/createProject', createProject);


export default router;