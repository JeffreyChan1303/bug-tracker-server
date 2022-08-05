import jwt from 'jsonwebtoken';

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];

    const isCustomAuth = token.length < 500;

    let decodedData;

    // parse the token in the request header. to get user data.
    if (token && isCustomAuth) {
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
      return res.status(401).json({ message: 'Unauthenticated' });
    }

    // checks if user is a demo user
    const demoUserIds = [
      '62ec0ba0bbfb2aaff8833587',
      '62ec0c69bbfb2aaff88335af',
      '62ec0c2cbbfb2aaff883359b',
    ];
    if (req.method !== 'GET') {
      for (let i = 0; i < demoUserIds.length; i += 1) {
        if (req.userId === demoUserIds[i]) {
          return res.status(401).json({
            message:
              'Demo users are not able to create or update items on the app',
          });
        }
      }
    }

    // this next variable is what defines what middleware is. something you do before an action
    return next();
  } catch (error) {
    return console.log(error);
  }
};

export default auth;
