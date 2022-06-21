import express from 'express';

import { getAllProjects, getAllProjectsBySearch, getMyProjects, getMyProjectsBySearch, getArchivedProjects, getArchivedProjectsBySearch, createProject, updateProject, getProjectDetails, moveProjectToArchive, deleteProjectFromArchive } from '../controllers/projects.js';
import auth from '../middleware/auth.js';

const router = express.Router();


router.get('/allProjects', auth, getAllProjects);
router.get('/allProjects/search', auth, getAllProjectsBySearch);
router.get('/myProjects', auth, getMyProjects);
router.get('/myProjects/search', auth, getMyProjectsBySearch);
router.get('/archivedProjects', auth, getArchivedProjects);
router.get('/archivedProjects/search', auth, getArchivedProjectsBySearch);


router.post('/createProject', auth, createProject);
router.patch('/updateProject/:id', auth, updateProject);
router.get('/projectDetails/:id', auth, getProjectDetails);
router.put('/moveProjectToArchive/:id', auth, moveProjectToArchive);
router.delete('/deleteProjectFromArchive/:id', auth, deleteProjectFromArchive);


export default router;