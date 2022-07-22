import jwt from 'jsonwebtoken';

// this is the funtion that is called every time the user wants to activate a CRUD operation in the app.
// this only profides a user id for the req.userID parameter
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];

    const isCustomAuth = token.length < 500;

    let decodedData;

    if (token && isCustomAuth) {
      // 'test' is the secret and should be in env variables
      decodedData = jwt.verify(token, process.env.TOKEN_SECRET);

      req.userId = decodedData?.id;
      req.userName = decodedData?.name;
      req.userEmail = decodedData?.email;
    } else {
      decodedData = jwt.decode(token);

      req.userId = decodedData?.sub;
    }
    // returns if the user doesn't exist
    if (!req.userId)
      return res.status(401).json({ message: 'Unauthenticated in middleware' });

    // this next variable is what defines what middleware is. something you do before an action
    next();
  } catch (error) {
    console.log(error);
  }
};

export default auth;
