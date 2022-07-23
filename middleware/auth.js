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
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthenticated in middleware' });
    }

    const demoUserIds = [
      '62d98b95ead4d66fa13d8b7f',
      '62d996ff2e5978350fc9614b',
      '62d99ef81755684b218a3090',
    ];
    if (req.method !== 'GET') {
      for (let i = 0; i < demoUserIds.length; i += 1) {
        if (req.userId === demoUserIds[i]) {
          return res
            .status(401)
            .json({
              message:
                'Demo users are not able to create or update items on the app',
            });
        }
      }
    }

    // this next variable is what defines what middleware is. something you do before an action
    next();
  } catch (error) {
    console.log(error);
  }
};

export default auth;
