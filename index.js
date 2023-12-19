import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';

import dotenv from 'dotenv';
import cron from 'node-cron';
import { exec } from 'child_process';

import ticketRoutes from './routes/tickets.js';
import projectRoutes from './routes/projects.js';
import userRoutes from './routes/users.js';

const app = express();
dotenv.config();

// setting up bodyParser so it can properly send out requests
app.use(bodyParser.json({ limit: '30mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '30mb', extended: true }));
app.use(cors());

// this means that all the routs for tickets must start with /ticket
app.use('/tickets', ticketRoutes);
app.use('/projects', projectRoutes);
app.use('/users', userRoutes);

// connect application with Heroku server
const PORT = process.env.PORT || 9000;

// connect application with mongodb atlas
mongoose
  .connect(process.env.MONGO_URL, {})
  .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch((error) => console.log(error.message));

// create cron job to wake the server every 5 minutes
console.log(new Date().toLocaleString());
cron.schedule('*/5 * * * *', () => {
  console.log('running a task every 5 minutes', new Date().toLocaleString(), '\n');
  exec(`curl ${process.env.SELF_PING_URL}`, (err, stdout) => {
    console.log(stdout);
  });
});
