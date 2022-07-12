import mongoose from 'mongoose';
import { TicketMessage, TicketArchive } from '../models/ticketModels.js';
import { ProjectMessage } from '../models/projectModels.js';


export const getAllTicketsBySearch = async (req, res) => {
    const { page, searchQuery } = req.query;

    try {
        const title = new RegExp(searchQuery, "i"); // 'i' stands for ignore case
        const itemsPerPage = 8;
        const startIndex = (Number(page) - 1) * itemsPerPage;
        const total = await TicketMessage.countDocuments({ $or: [ { title } ] }); 

        // $or means: either find me the title or other things in the array
        const tickets = await TicketMessage.find({ $or: [ { title } ] }).sort({ _id: -1 }).limit(itemsPerPage).skip(startIndex);

        res.status(200).json({ data: tickets, currentPage: Number(page), numberOfPages: Math.ceil(total / itemsPerPage) });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}


export const getMyTicketsBySearch = async (req, res) => {
    const { page, searchQuery } = req.query;

    if (!req.userId) return res.status(401).json({ message: 'Unauthenticated' });
    const userId = req.userId;

    try {
        const title = new RegExp(searchQuery, "i"); // 'i' stands for ignore case
        const itemsPerPage = 8;
        const startIndex = (Number(page) - 1) * itemsPerPage;

        const total = await TicketMessage.countDocuments({ $and: [{ $or: [{ creator: userId }, { "developer._id": userId } ] }, { title: title }] }); 

        // $or means: either find me the title or other things in the array
        const tickets = await TicketMessage.find({ $and: [{ $or: [{ creator: userId }, { "developer._id": userId } ] }, { title: title }] }).sort({ _id: -1 }).limit(itemsPerPage).skip(startIndex);



        res.status(200).json({
            data: tickets,
            currentPage: Number(page),
            numberOfPages: Math.ceil(total / itemsPerPage),
        });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}


export const getArchivedTicketsBySearch = async (req, res) => {
    const { page, searchQuery } = req.query;

    if (!req.userId) return res.status(401).json({ message: 'Unauthenticated' });
    const userId = req.userId;

    try {
        const title = new RegExp(searchQuery, "i"); // 'i' stands for ignore case
        const itemsPerPage = 8;
        const startIndex = (Number(page) - 1) * itemsPerPage;

        const total = await TicketArchive.countDocuments({ $and: [ { title } ] }); 

        // $or means: either find me the title or other things in the array
        const tickets = await TicketArchive.find({ $and: [{ title: title }] }).sort({ _id: -1 }).limit(itemsPerPage).skip(startIndex);

        res.status(200).json({ data: tickets, currentPage: Number(page), numberOfPages: Math.ceil(total / itemsPerPage) });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}


export const createTicket = async (req, res) => {
    const ticket = req.body;

    if (!req.userId) return res.JSON({ message: 'Unauthenticated' });
    
    const newTicket = new TicketMessage({ ...ticket, creator: req.userId });
    console.log(newTicket);

    try {
        await newTicket.save();

        const { project, ticketHistory, comments, ...projectTicket } = ticket

        // add new ticket id into project
        const newProject = await ProjectMessage.findByIdAndUpdate(ticket.project._id, {
            $push: {
                tickets: newTicket._id
            } 
        }, { new: true })

        res.status(201).json(newTicket);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}

export const updateTicket = async (req, res) => {
    const { ticketId } = req.params;
    const newTicket = req.body;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
        return res.status(404).send('No post with that ID');
    }

    try {
        const oldTicket = await TicketMessage.findById(ticketId);

        // console.log(oldTicket)
        // update with this new ticket history
        newTicket.creator = oldTicket.creator
        newTicket.ticketHistory = oldTicket.ticketHistory;
        newTicket.updatedAt = new Date;
        newTicket.ticketHistory.push({
            title: oldTicket.title,
            description: oldTicket.description, 
            priority: oldTicket.priority,
            status: oldTicket.status,
            type: oldTicket.type,
            updatedAt: oldTicket.updatedAt,
        }) 

        const updatedTicket = await TicketMessage.findByIdAndUpdate(ticketId, newTicket, {new: true })

        res.status(200).json(updatedTicket);
    } catch (error) {
        console.log(error);
        res.status(404).json({ message: error.message });
    }
}

export const getTicketDetails = async (req, res) => {
    const { id: _id } = req.params;
    let ticket = {}

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(404).send('No ticket with that ID');
    }

    try {
        const ticketExists = await TicketMessage.exists({ _id: _id });

        if (ticketExists) {
            ticket = await TicketMessage.findById(_id);
        } else {
            ticket = await TicketArchive.findById(_id);
        }
        res.status(200).json(ticket)
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
}

export const moveTicketToArchive = async (req, res) => {
    const { id: _id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(404).send('No ticket with that ID');
    }

    try {
        TicketMessage.findOne({ _id: _id }, function(err, result) {
            let swap = new (TicketArchive)({...result.toJSON(), status: 'Archived', updatedAt: new Date }) //or result.toObject
        
            result.remove()
            swap.save()
        })

        res.json({ message: "Ticket moved to ticket archive successfully." });
    } catch (error) {
        res.status(409).json({ message: error.message }); 
    }
}

export const restoreTicketFromArchive = async (req, res) => {
    const { id: _id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(404).send('No ticket with that ID');
    }

    try {
        TicketArchive.findOne({ _id: _id }, function(err, result) {
            let swap = new (TicketMessage)({...result.toJSON(), status: 'Unassigned', updatedAt: new Date }) 
        
            result.remove()
            swap.save()
        })

        res.json({ message: "Ticket restored from archive successfully." });
    } catch (error) {
        res.status(409).json({ message: error.message }); 
    }
}

export const deleteTicketFromArchive = async (req, res) => {
    const { id: _id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(404).send('No ticket with that ID');
    }

    try {
        await TicketArchive.findByIdAndRemove(_id);

        res.status(204).json({ message: "Ticket deleted successfully." });
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}

export const addTicketComment = async (req, res) => {
    const comment = req.body;
    console.log(comment)
    const { ticketId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
        return res.status(404).send('No ticket with that ID');
    }

    if (!req.userId) return res.status(401).json({ message: "Unauthenticated" });

    try {
        const newTicket = await TicketMessage.findByIdAndUpdate(ticketId, { $push: { comments: { ...comment, createdAt: new Date } } }, { new: true });

        res.status(200).json({ message: "Comment successfully added" });
    } catch (error) {
        console.log(error);
        res.status(501).json({ message: error.message });
    }
}

export const deleteTicketComment = async (req, res) => {
    try {
        let { commentCreatedAt } = req.body;
        const { ticketId } = req.params;
        commentCreatedAt = new Date(commentCreatedAt);

        const newTicket = await TicketMessage.findByIdAndUpdate(ticketId, {
            $pull: {
                comments: {
                    createdAt: commentCreatedAt,
                }
            }
        }, { new: true })

        res.status(200).json({ message: "Comment successfully deleted" });
    } catch (error) {
        console.log(error)
        res.status(404).json({ message: error.message })
    }
}

export const getActiveTickets = async (req, res) => {
    if (!req.userId) return res.status(401).json({ message: 'Unauthenticated' });

    try {
        const numberOfActiveTickets = await TicketMessage.find({ $or: [{'developer._id': req.userId }, { creator: req.userId }] }).countDocuments()

        res.status(200).json(numberOfActiveTickets)
    } catch (error) {
        console.log(error);
        res.status(404).json({ message: error.message })
    }
}


export const getUnassignedTicketsBySearch = async (req, res) => {
    const { page, searchQuery } = req.query;
    if (!req.userId) return res.status(401).json({ message: 'Unauthenticated' });
    const user = `users.${req.userId}.name`;

    try {
        // this function gets all the tickets that are in the projects that the user is in
        const myProjects = await ProjectMessage.find({ $or: [{ creator: req.userId }, { [user]: RegExp('') }] }, `tickets users`)

        // make an array of all of the user's ticket ids
        let projectTicketIds = []
        for (let i = 0; i < myProjects.length; i++) {
            projectTicketIds = [...projectTicketIds, ...myProjects[i].tickets]
        }

        // query the database for the ticket ids and check for unnassigned tickets
        const unassignedTickets = await TicketMessage.find({ '_id': { $in: projectTicketIds }, status: 'Unassigned' }, 'title name priority status type updatedAt developer');

        // get page
        const itemsPerPage = 8;
        const startIndex = (Number(page) - 1) * itemsPerPage;
        const total = unassignedTickets.length
        // ! i need to somehow sort these tickets by date!!!

        res.status(200).json({ tickets: unassignedTickets.splice(startIndex, 8), numberOfTickets: total, currentPage: Number(page), numberOfPages: Math.ceil(total / itemsPerPage) })
    } catch (error) {
        console.log(error);
        res.status(404).json({ message: error.message})
    }
}

export const getTicketStatistics = async (req, res) => {

    if (!req.userId) return res.status(401).json({ message: 'Unauthenticated' });
    const userId = req.userId;

    try {
        const tickets = await TicketMessage.find({ $or: [{ creator: userId }, { 'developer._id': userId }] });

        let myTicketsStats = {
            numberOfBugTickets: 0,
            numberOfFeatureTickets: 0,
            lowPriority: 0,
            mediumPriority: 0,
            highPriority: 0,
        }
        for (let i = 0; i < tickets.length; i++) {
            if (tickets[i].type == "Bug") {
                myTicketsStats.numberOfBugTickets += 1;
            }
            if (tickets[i].type === "Feature") {
                myTicketsStats.numberOfFeatureTickets += 1;
            }
            if (tickets[i].priority === "Low") {
                myTicketsStats.lowPriority += 1;
            }
            if (tickets[i].priority === "Medium") {
                myTicketsStats.mediumPriority += 1;
            }
            if (tickets[i].priority === "High") {
                myTicketsStats.highPriority += 1;
            }
        }

        res.status(200).json(myTicketsStats);

    } catch (error) {
        console.log(error);
        res.status(404).json({ message: error.message });
    }
}

// also make this the assign function. change if user id input into the body of the request so we can input other perople's user Ids too.
export const claimTicket = async (req, res) => {
    const { ticketId } = req.params;
    const { userId } = req.body; // this is the other user that is send in the body when admin is assigning tickets.

    if (!req.userId) return res.status(401).json({ message: 'Unauthenticated' });


    try {
        const oldTicket = await TicketMessage.findById(ticketId);
        const project = await ProjectMessage.findById(oldTicket.project, `users.${req.userId} creator`);

        // this logic guards against unauthorized claims since req.userId needs to be in the project scope
        if (!(project.users[req.userId] || project.creator === req.userId)) {
            console.log('User not allowed to claim this ticket');
            res.status(401).json({ message: 'User is not allowed to claim this ticket' });
        }
        // this checks if the request is from an admin of the project
        if (userId) {
            if (project.users[req.userId]?.role !== admin) {
                res.status(401).json({ message: `You are not an admin of the project so you cannot assign tickets` });
            }
        }

        console.log(req.userId, req.userName)
        // claim ticket. update the ticket
        let newTicket = await TicketMessage.findByIdAndUpdate(ticketId, { 
            'developer._id': req.userId,
            'developer.name': req.userName,
            status: 'Development' ,
            updatedAt: new Date,
            $push: {
                ticketHistory: {
                    title: oldTicket.title,
                    description: oldTicket.description, 
                    priority: oldTicket.priority,
                    status: oldTicket.status,
                    type: oldTicket.type,
                    developer: oldTicket.developer,
                    updatedAt: oldTicket.updatedAt,
                }
            }

        }, { new: true });
        console.log(newTicket)


    
        res.status(200).json({ message: 'successfully claimed the ticket' })
    } catch (error) {
        console.log(error);
        res.status(404).json({ message: error.message });
    }
}