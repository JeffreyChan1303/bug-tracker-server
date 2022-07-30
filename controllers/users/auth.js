import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

import UserModel from '../../models/user.js';

dotenv.config();

export const signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await UserModel.findOne({ email }, '-notifications');

    if (!existingUser) {
      return res.status(404).json({ message: "User doesn't exist!." });
    }

    if (existingUser.googleUser) {
      return res.status(404).json({ message: "This email signed up using google. Please sign in using google."})
    }

    if (!existingUser.verified) {
      return res
        .status(404)
        .json({ message: 'Please verify your email to login' });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isPasswordCorrect)
      return res.status(400).json({ message: 'Invalid credentials.' });

    const token = jwt.sign(
      {
        email: existingUser.email,
        id: existingUser._id,
        name: existingUser.name,
      },
      process.env.TOKEN_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(200).json({ userObject: existingUser, token });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Something went wrong in the signin controller' });
  }
};

export const googleSignin = async (req, res) => {
  const { userObject, token } = req.body;

  try {
    let existingUser = await UserModel.findOne(
      { email: userObject.email },
      '-notifications'
    );

    // if the user signed up as a regular user with the same email.
    if (existingUser && !existingUser.googleUser) {
      return res.status(404).json({ message: 'This account already exists as a regular user'})
    }

    // create a user if it doesn't exist. This is because this api call would not have happened if the google login failed
    if (!existingUser) {
      existingUser = await UserModel.create({
        email: userObject.email,
        password: token, // this password is the token that was given by google. basically an unreachable password
        name: userObject.name,
        googleUser: true,
      });
    }

    const newToken = jwt.sign(
      {
        email: existingUser.email,
        id: existingUser._id,
        name: existingUser.name,
      },
      process.env.TOKEN_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(200).json({ userObject: existingUser, token: newToken })
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: 'Something went wrong in the google signin controller',
    });
  }
};

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.GMAIL_USER, // generated ethereal user
    pass: process.env.GMAIL_PASS, // generated ethereal password
  },
});

export const signup = async (req, res) => {
  const { email, password, confirmPassword, firstName, lastName } = req.body;
  console.log(password);
  console.log(confirmPassword);

  try {
    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'User with this email already exists' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords dont match.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const userObject = await UserModel.create({
      email,
      password: hashedPassword,
      name: `${firstName} ${lastName}`,
    });

    // email verification
    jwt.sign(
      {
        user: userObject._id,
      },
      process.env.TOKEN_SECRET,
      {
        expiresIn: '1d',
      },
      (err, emailToken) => {
        const url = `${process.env.CLIENT}/verification/${emailToken}`;

        transporter.sendMail({
          from: '"bug tracker" <info@juicybugtracker.com>', // sender address
          to: email,
          subject: 'Verify Email',
          text: 'TEST TEST TEST TEST',
          html: `Please click this email to verify your email: <a href="${url}">${url}</a>`,
        });
      }
    );

    return res.status(200).json();
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: 'Something went wrong in the signup controller' });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const { user: userId } = jwt.verify(token, process.env.TOKEN_SECRET);

    const { verified } = await UserModel.findById(userId, 'verified');
    if (verified)
      return res.status(200).json({ message: 'User is already verified' });
    console.log(verified);

    await UserModel.findByIdAndUpdate(userId, { verified: true });

    return res.status(200).json({ message: 'User was successfully verified' });
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: 'Failed to verify token' });
  }
};

export const sendVerification = async (req, res) => {
  const { email } = req.body;

  try {
    const userObject = await UserModel.findOne({ email }, '_id');

    if (!userObject) {
      return res.status(404).json({ message: 'Email does not exist' });
    }

    // TEST EMAIL VERIFICATION
    jwt.sign(
      {
        user: userObject._id,
      },
      process.env.TOKEN_SECRET,
      {
        expiresIn: '1d',
      },
      (err, emailToken) => {
        const url = `${process.env.CLIENT}/verification/${emailToken}`;

        transporter.sendMail({
          from: '"bug tracker" <info@juicybugtracker.com>', // sender address
          to: email,
          subject: 'Verify Email',
          text: 'TEST TEST TEST TEST',
          html: `Please click this email to verify your email: <a href="${url}">${url}</a>`,
        });
      }
    );
    console.log('email verification link has been sent');

    return res
      .status(200)
      .json({ message: 'Successfully sent verification link' });
  } catch (error) {
    console.log(error);
    return res
      .status(404)
      .json({ message: 'Failed to send verification link' });
  }
};
