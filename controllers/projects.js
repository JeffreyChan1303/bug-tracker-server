import mongoose from 'mongoose';
import { ProjectMessage, ProjectArchive } from '../models/projectModels.js';

export const getAllProjects = async (req, res) => {
    const { page } = req.query;
    
    try {
        const itemsPerPage = 8;
        const startIndex = (Number(page) - 1) * itemsPerPage; // gets the starting index for the page in the database
        const total = await ProjectMessage.countDocuments({}); // this is to know the last page we can go to

        const projects = await ProjectMessage.find().sort({ _id: -1 }).limit(itemsPerPage).skip(startIndex);


        res.status(200).json({ data: projects, currentPage: Number(page), numberOfPages: Math.ceil(total / itemsPerPage) });
    } catch (error) {
        res.status(404).json({ error: error.message });        
    }
}

export const getAllProjectsBySearch = async (req, res) => {
    const { page, searchQuery } = req.query;

    try {
        const title = new RegExp(searchQuery, "i"); // 'i' stands for ignore case
        const itemsPerPage = 8;
        const startIndex = (Number(page) - 1) * itemsPerPage;
        const total = await ProjectMessage.countDocuments({ $or: [ { title } ] }); 

        // $or means: either find me the title or other things in the array
        const projects = await ProjectMessage.find({ $or: [ { title } ] }).sort({ _id: -1 }).limit(itemsPerPage).skip(startIndex);

        res.status(200).json({ data: projects, currentPage: Number(page), numberOfPages: Math.ceil(total / itemsPerPage) });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const getMyProjects = async (req, res) => {
    const { page } = req.query;

    // checks if there is a user asking for the projects
    if (!req.userId) return res.status(401).json({ message: 'Unauthenticated' });
    const userId = req.userId;

    try {
        const itemsPerPage = 8;
        const startIndex = (Number(page) - 1) * itemsPerPage; // gets the starting index for the page in the database
        const total = await ProjectMessage.find({ creator: userId }).countDocuments({}); // this is to know the last page we can go to

        const projects = await ProjectMessage.find({ creator: userId }).sort({ _id: -1 }).limit(itemsPerPage).skip(startIndex);


        res.status(200).json({ data: projects, currentPage: Number(page), numberOfPages: Math.ceil(total / itemsPerPage) });
    } catch (error) {
        res.status(404).json({ error: error.message });        
    }
}

export const getMyProjectsBySearch = async (req, res) => {
    const { page, searchQuery } = req.query;

    if (!req.userId) return res.status(401).json({ message: 'Unauthenticated' });
    const userId = req.userId;

    try {
        const title = new RegExp(searchQuery, "i"); // 'i' stands for ignore case
        const itemsPerPage = 8;
        const startIndex = (Number(page) - 1) * itemsPerPage;

        const total = await ProjectMessage.countDocuments({ $and: [{ creator: userId }, { title } ] }); 

        // $or means: either find me the title or other things in the array
        const projects = await ProjectMessage.find({ $and: [{ creator: userId }, { title: title }] }).sort({ _id: -1 }).limit(itemsPerPage).skip(startIndex);

        res.status(200).json({ data: projects, currentPage: Number(page), numberOfPages: Math.ceil(total / itemsPerPage) });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const getArchivedProjects = async (req, res) => {
    const { page } = req.query;

    // checks if there is a user asking for the projects
    if (!req.userId) return res.status(401).json({ message: 'Unauthenticated' });
    const userId = req.userId;

    try {
        const itemsPerPage = 8;
        const startIndex = (Number(page) - 1) * itemsPerPage; // gets the starting index for the page in the database
        const total = await ProjectArchive.find().countDocuments({}); // this is to know the last page we can go to

        const projects = await ProjectArchive.find().sort({ _id: -1 }).limit(itemsPerPage).skip(startIndex);


        res.status(200).json({ data: projects, currentPage: Number(page), numberOfPages: Math.ceil(total / itemsPerPage) });
    } catch (error) {
        res.status(404).json({ error: error.message });        
    }
}

export const getArchivedProjectsBySearch = async (req, res) => {
    const { page, searchQuery } = req.query;

    if (!req.userId) return res.status(401).json({ message: 'Unauthenticated' });
    const userId = req.userId;

    try {
        const title = new RegExp(searchQuery, "i"); // 'i' stands for ignore case
        const itemsPerPage = 8;
        const startIndex = (Number(page) - 1) * itemsPerPage;

        const total = await ProjectArchive.countDocuments({ $and: [ { title } ] }); 

        // $or means: either find me the title or other things in the array
        const projects = await ProjectArchive.find({ $and: [{ title: title }] }).sort({ _id: -1 }).limit(itemsPerPage).skip(startIndex);

        res.status(200).json({ data: projects, currentPage: Number(page), numberOfPages: Math.ceil(total / itemsPerPage) });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const createProject = async (req, res) => {
    const project = req.body;

    if (!req.userId) return res.JSON({ message: 'Unauthenticated' });
    
    const newProject = new ProjectMessage({ ...project, creator: req.userId });
    console.log(newProject)

    try {
        await newProject.save();

        res.status(201).json(newProject);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}





export const updateProject = async (req, res) => {
    const { id: _id } = req.params;
    const project = req.body;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(404).send('No post with that ID');
    }

    const updatedProject = await ProjectMessage.findByIdAndUpdate(_id, project, {new: true })

    res.json(updatedProject);
}

export const getProjectDetails = async (req, res) => {
    const { id: _id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(404).send('No project with that ID');
    }

    try {
        const projectMessages = await ProjectMessage.findById(_id)

        res.status(200).json(projectMessages)
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
}

export const moveProjectToArchive = async (req, res) => {
    const { id: _id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(404).send('No project with that ID');
    }

    try {
        // await ProjectMessage.findByIdAndRemove(_id)

        //  This is now delete project to Archive
        // REMEMBER TO CHANGE THIS INTO ANOTHER NAME!!!
        ProjectMessage.findOne({ _id: _id }, function(err, result) {

            let swap = new (ProjectArchive)(result.toJSON()) //or result.toObject
        
            result.remove()
            swap.save()
        })

        res.json({ message: "Project deleted successfully." });
    } catch (error) {
        res.status(409).json({ message: error.message }); 
    }
}

export const deleteProjectFromArchive = async (req, res) => {
    const { id: _id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(404).send('No project with that ID');
    }

    try {
        await ProjectArchive.findByIdAndRemove(_id);

        res.status(204).json({ message: "Project deleted successfully." });
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}