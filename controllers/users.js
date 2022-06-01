import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../models/user.js';


export const signin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });

        if (!existingUser) return res.status(404).JSON({ message: "User doesn't exist!." });

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);

        if (!isPasswordCorrect) return res.status(400).JSON({ message: "Invalid credentials." });

        // the 'test' that is seen in the line below is the token SECRET and should be stored as a ENV variable
        const token = jwt.sign({ email: existingUser.email, id: existingUser._id }, 'test', { expiresIn: "1h" });

        res.status(200).JSON({ result: existingUser, token });
    } catch (error) {
        res.status(500).JSON({ message: "Something went wrong in the signin controller" })
    }
}

export const signup = async (rwq, res) => {
    const { email, password, confirmPassword, firstName, lastName } = req.body;

    try {
        const existingUser = User.findOne({ email })

        if (existingUser) return res.status(400).JSON({ message: "User already exists" });

        if(password !== confirmPassword) return res.status(400).JSON({ message: "Passwords dont match." });

        const hashedPassword = await bcrypt.hash(password, 12);

        const result = await User.create({ email, password: hashedPassword, name: `${firstName} ${lastName}` });

        // the 'test' that is seen in the line below is the token SECRET and should be stored as a ENV variable
        const token = jwt.sign({ email: result.email, id: result._id }, 'test', { expiresIn: '1h' });

        res.status(200).JSON({ result, token })
    } catch (error) {
        res.status(500).JSON({ message: "Something went wrong in the signup controller" })
    }
}