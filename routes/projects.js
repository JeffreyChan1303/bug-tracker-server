import express from 'express';

import { getAllProjectsBySearch, getMyProjectsBySearch, getArchivedProjectsBySearch, createProject, updateProject, getProjectDetails, moveProjectToArchive, deleteProjectFromArchive, updateUsersRoles, deleteUsersFromProject, getActiveProjects, getProjectTickets, getProjectUsers } from '../controllers/projects.js';
import auth from '../middleware/auth.js';

const router = express.Router();


router.get('/allProjects/search', auth, getAllProjectsBySearch);
router.get('/myProjects/search', auth, getMyProjectsBySearch);
router.get('/archivedProjects/search', auth, getArchivedProjectsBySearch);


router.post('/createProject', auth, createProject);
router.patch('/updateProject/:id', auth, updateProject);
router.get('/projectDetails/:projectId', auth, getProjectDetails);
router.get('/projectTickets/:projectId', auth, getProjectTickets)
router.get('/projectUsers/:projectId', auth, getProjectUsers);

router.put('/moveProjectToArchive/:id', auth, moveProjectToArchive);
router.delete('/deleteProjectFromArchive/:id', auth, deleteProjectFromArchive);

router.put('/updateUsersRoles/:id', auth, updateUsersRoles);
router.put('/deleteUsersFromProject/:projectId', auth, deleteUsersFromProject);


router.get('/activeProjects', auth, getActiveProjects);

export default router;