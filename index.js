import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';

import ticketRoutes from './routes/tickets.js';

const app = express();


// this means that all the routs for tickets must start with /ticket
app.use('/tickets', ticketRoutes);

// setting up bodyParser so it can properly send out requests
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

// connect application with mongodb atlas

// this should be stored in .env
const CONNECTION_URL = 'mongodb+srv://jeffreychan:jeffreychan123@cluster0.wcviz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'
const PORT = process.env.PORT || 3001;

mongoose.connect(CONNECTION_URL, {})
    .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
    .catch((error) => console.log(error.message));
