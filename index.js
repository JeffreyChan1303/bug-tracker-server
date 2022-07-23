import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';

import dotenv from 'dotenv';
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

// connect application with mongodb atlas

// this should be stored in .env
// const CONNECTION_URL = 'mongodb+srv://jeffreychan:jeffreychan123@cluster0.wcviz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'
const PORT = process.env.PORT || 9000;

mongoose
  .connect(process.env.CONNECTION_URL, {})
  .then(() =>
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  )
  .catch((error) => console.log(error.message));
