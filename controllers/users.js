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
        const token = jwt.sign({ email: existingUser.email, id: existingUser._id }, 'test', { expiresIn: "1h" });

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
        const token = jwt.sign({ email: userObject.email, id: userObject._id }, 'test', { expiresIn: '1h' });

        res.status(200).json({ userObject, token })
    } catch (error) {
        res.status(500).json({ message: "Something went wrong in the signup controller" });
    }
}

export const getAllUsers = async (req, res) => {
    const { page } = req.query;
    
    try {
        const itemsPerPage = 8;
        const startIndex = (Number(page) - 1) * itemsPerPage; // gets the starting index for the page in the database
        const total = await UserModel.countDocuments({}); // this is to know the last page we can go to

        const users = await UserModel.find().sort({ _id: -1 }).limit(itemsPerPage).skip(startIndex);


        res.status(200).json({ data: users, currentPage: Number(page), numberOfPages: Math.ceil(total / itemsPerPage) });
    } catch (error) {
        res.status(404).json({ error: error.message });        
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
    const newNotification = { title: title, description: description}
    console.log(newNotification);
    // const { users, ...rest } = req.body;
    // console.log(rest)


    if (!req.userId) return res.JSON({ message: 'Unauthenticated' });

    try {

        let newUser;
        for (let i = 0; i < users.length; i++) {
            newUser = await UserModel.findByIdAndUpdate(users[i], { $push: { notifications: newNotification }}, { new: true });
        }
        // THIS IS WHERE I LEFT OFF!!!!!!!!!!!!!! REMEMBER TO complete this create function. implement this with a dynamic set of users
        // when the useres are inserted as a array from the front end!! also complete the other functions. then link everything together!!
        // also make the all notifications page and put the table so the user can see thier notifications!!.

        // const temp = await UserModel.findById(req.userId);
        // console.log('user:', temp)
        console.log(newUser);

    } catch (error) {
        console.log(error);

    }
}

export const deleteUserNotification = async (req, res) => {
    const userId = req.userId;
    if (!req.userId) return res.JSON({ message: 'Unauthenticated' });

    try {

    } catch (error) {

    }
}