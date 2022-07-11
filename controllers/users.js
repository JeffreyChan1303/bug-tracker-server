import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import UserModel from '../models/user.js';


export const signin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const existingUser = await UserModel.findOne({ email });

        if (!existingUser) return res.status(404).json({ message: "User doesn't exist!." });

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);

        if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials." });

        // the 'test' that is seen in the line below is the token SECRET and should be stored as a ENV variable
        const token = jwt.sign({ email: existingUser.email, id: existingUser._id, name: existingUser.name }, 'test', { expiresIn: "1h" });

        res.status(200).json({ userObject: existingUser, token });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong in the signin controller" })
    }
}

export const signup = async (req, res) => {
    const { email, password, confirmPassword, firstName, lastName } = req.body;

    try {
        const existingUser = await UserModel.findOne({ email })

        if (existingUser) return res.status(400).json({ message: "User already exists" });

        if(password !== confirmPassword) return res.status(400).json({ message: "Passwords dont match." });


        // function below is where the code breaks
        const hashedPassword = await bcrypt.hash(password, 12);

        const userObject = await UserModel.create({ email, password: hashedPassword, name: `${firstName} ${lastName}` });

        // the 'test' that is seen in the line below is the token SECRET and should be stored as a ENV variable
        const token = jwt.sign({ email: userObject.email, id: userObject._id, name: existingUser.name }, 'test', { expiresIn: '1h' });

        res.status(200).json({ userObject, token })
    } catch (error) {
        res.status(500).json({ message: "Something went wrong in the signup controller" });
    }
}


export const getAllUsersBySearch = async (req, res) => {
    const { page, searchQuery } = req.query;

    try {
        const search = new RegExp(searchQuery, "i"); // 'i' stands for ignore case
        const itemsPerPage = 8;
        const startIndex = (Number(page) - 1) * itemsPerPage;
        const total = await UserModel.countDocuments({ $or: [ { name: search }, { email: search } ] }); 

        // $or means: either find me the title or other things in the array
        const users = await UserModel.find({ $or: [ { name: search }, { email: search } ] }, '-notifications').sort({ _id: -1 }).limit(itemsPerPage).skip(startIndex);

        res.status(200).json({ data: users, currentPage: Number(page), numberOfPages: Math.ceil(total / itemsPerPage) });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const getUserNotifications = async (req, res) => {
    const { page } = req.query;
    const userId = req.userId;
    if (!userId) return res.JSON({ message: 'Unauthenticated' });

    try {
        const itemsPerPage = 8;
        const startIndex = (Number(page) - 1) * itemsPerPage;
        let { notifications } = await UserModel.findOne({ _id: userId }, 'notifications');
        const total = notifications.length;
        notifications.reverse();
        notifications = notifications.splice(startIndex, itemsPerPage);

        res.status(200).json({ data: notifications, currentPage: Number(page), numberOfPages: Math.ceil(total / itemsPerPage) })

        // req.status(200).json({ data: notifications, })

    } catch (error) {
        console.log(error)
        res.status(404).json({ message: error.message });
    }
}

export const getUserNotificationsBySearch = async (req, res) => {
    const { page, searchQuery } = req.query;
    const userId = req.userId;
    if (!userId) return res.JSON({ message: 'Unauthenticated' });

    try {
        const itemsPerPage = 8;
        const startIndex = (Number(page) - 1) * itemsPerPage;
        let { notifications } = await UserModel.findOne({ _id: userId }, 'notifications');
        // find search query within the title. This also reverses the array
        let tempArr = []
        for (let i = 0; i < notifications.length; i++) {
            if (notifications[i].title.includes(searchQuery)) {
                tempArr.push(notifications[i])
            }
        }
        notifications = tempArr;

        const total = notifications.length;
        notifications = notifications.splice(startIndex, itemsPerPage);

        console.log(notifications)
        // console.log(notifications)
        res.status(200).json({ data: notifications, currentPage: Number(page), numberOfPages: Math.ceil(total / itemsPerPage) })

        // req.status(200).json({ data: notifications, })

    } catch (error) {
        console.log(error)
        res.status(404).json({ message: error.message });
    }
}



export const createUsersNotification = async (req, res) => {
    const { users, title, description } = req.body;

    if (!req.userId) return res.JSON({ message: 'Unauthenticated' });

    const newNotification = { 
        title: title, 
        description: description, 
        createdAt: new Date, 
        createdBy: req.userId,
        new: false }

    try {
        //// !!!!!!!!! We will need to test out if this works with multiple user IDs!

        for (let i = 0; i < users.length; i++) {
            // if i is the last iteration
            if (i >= users.length - 1) {
                await UserModel.findByIdAndUpdate(users[i], { $push: { notifications: newNotification }, $inc: { unreadNotifications: 1 }}, { new: true });
            } else {
                UserModel.findByIdAndUpdate(users[i], { $push: { notifications: newNotification }, $inc: { unreadNotifications: 1 }}, { new: true });
            }
        }

        res.status(200)
    } catch (error) {
        console.log(error);
        res.status(404).json({ message: error.message })
    }
}

export const deleteUserNotification = async (req, res) => {
    const userId = req.userId;
    let { createdAt } = req.body;
    createdAt = new Date(createdAt);

    if (!req.userId) return res.JSON({ message: 'Unauthenticated' });

    try {
        const { notifications } = await UserModel.findById(userId, 'notifications')
        // this finds and deletes. assuming that the notifications do not have same time of creation now to the milisecond...
        let test;

        test = await UserModel.findByIdAndUpdate(userId, {
            $pull: {
                notifications: {
                    createdAt: createdAt,
                }
            }
        }, { new: true })
        // console.log(test)

        res.status(200)
    } catch (error) {
        console.log(error);
        res.status(404).json({ message: error.message })
    }
}

export const getUnreadNotifications = async(req, res) => {
    if (!req.userId) return res.JSON({ message: 'Unauthenticated' });

    try {
        const user = await UserModel.findById(req.userId, 'unreadNotifications');
        const numberOfUnreadNotifications = user.unreadNotifications;

        res.status(200).json(numberOfUnreadNotifications)
    } catch (error) {
        console.log(error);
        res.status(404).json({ message: error.message });
    }
}