import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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

        res.status(200).json({ result: existingUser, token });
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
        res.status(500).json({ message: "Something went wrong in the signup controller" })
    }
}