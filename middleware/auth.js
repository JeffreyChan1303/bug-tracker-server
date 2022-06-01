import e from 'express';
import jwt from 'jsonwebtoken';


// this is the funtion that is called every time the user wants to activate a CRUD operation in the app
const auth = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const isCustomAuth = token.length < 500;

        let decodedData;

        if (token && isCustomAuth) {
            // 'test' is the secret and should be in env variables
            decodedData = jwt.verify(token, 'test');

            req.userId = decodedData?.id;
        } else {
            decodedData = jwt.decode(token);

            req.userId = decodedData?.sub;
        }

        // this next variable is what defines what middleware is. something you do before an action 
        next()
    } catch (error) {
        console.log(error)
    }
}

export default auth;