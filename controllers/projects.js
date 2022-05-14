import ProjectMessage from '../models/ProjectMessage.js';

export const getAllProjects = async (req, res) => {
    try {
       const ProjectMessages = await ProjectMessage.find();

       res.status(200).json(ProjectMessages);
    } catch (error) {
        res.status(404).json({ error: error.message });        
    }
}

export const createProject = async (req, res) => {
    const ticket = req.body;

    const newTicket = new ProjectMessage(ticket);

    try {
        await newTicket.save();

        res.status(201).json(newTicket);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}