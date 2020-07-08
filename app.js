require('dotenv').config();

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const favicon = require('serve-favicon');
const hbs = require('hbs');
const mongoose = require('mongoose');
const logger = require('morgan');
const path = require('path');

const bcrypt = require('bcrypt');
const flash = require('connect-flash');

const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: 'Internship API',
      description: 'Custom Internship API',
      contact: {
        name: 'Ironhacker: Carlos, Leo and Vitor'
      },
      servers: ['http://localhost:3000']
    }
  },
  apis: ["./routes/*.js"]
}

const swaggerDocs = swaggerJsDoc(swaggerOptions)

const DisableTryItOutPlugin = function () {
  return {
    statePlugins: {
      spec: {
        wrapSelectors: {
          allowTryItOutFor: () => () => false
        }
      }
    }
  }
}

const options = {
  swaggerOptions: {
    plugins: [
      DisableTryItOutPlugin
    ]
  }
};

// require database configuration
const dbConnection = require('./configs/db.config');
const connectToMongo = async () => await dbConnection()
connectToMongo();


const app_name = require('./package.json').name;
const debug = require('debug')(`${app_name}:${path.basename(__filename).split('.')[0]}`);

const app = express();

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs, options))

// Middleware Setup
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const db = mongoose.connection;

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
    saveUninitialized: false,
    resave: false,
    store: new MongoStore({
      mongooseConnection: db,
      ttl: 24 * 60 * 60 * 1000
    })
  })
);


// Passport Setup
const User = require('./models/User');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// we serialize only the `_id` field of the user to keep the information stored minimum
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// when we need the information for the user, the deserializeUser function is called with the id that we previously serialized to fetch the user from the database
passport.deserializeUser((id, done) => {
  User.findById(id)
    .then(dbUser => {
      done(null, dbUser);
    })
    .catch(err => {
      done(err);
    });
});

app.use(flash());

passport.use(
  new LocalStrategy((username, password, done) => {
    User.findOne({ username: username })
      .then(found => {
        if (found === null) {
          done(null, false, { message: 'Wrong credentials' });
        } else if (!bcrypt.compareSync(password, found.password)) {
          done(null, false, { message: 'Wrong credentials' });
        } else {
          done(null, found);
        }
      })
      .catch(err => {
        done(err, false);
      });
  })
);

// Passport github strategy setup

const GithubStrategy = require('passport-github').Strategy;

passport.use(
  new GithubStrategy(
    {
      clientID: process.env.ID_GIT,
      clientSecret: process.env.SECRET_GIT,
      callbackURL: 'http://127.0.0.1:3000/auth/github/callback'
    },
    (accessToken, refreshToken, profile, done) => {
      // find a user with profile.id as githubId or create one
      User.findOne({ githubId: profile.id })
        .then(found => {
          if (found !== null) {
            // user with that githubId already exists
            done(null, found);
          } else {
            // no user with that githubId
            return User.create({ githubId: profile.id }).then(dbUser => {
              done(null, dbUser);
            });
          }
        })
        .catch(err => {
          done(err);
        });
    }
  )
);

//Passport Google strategy setup

const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

// Use the GoogleStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Google
//   profile), and invoke a callback with a user object.
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `/auth/google/callback` //google callback works with only referencial path.
},
(accessToken, refreshToken, profile, done) => {
  // find a user with profile.id as googleId or create one
  User.findOne({ googleId: profile.id })
    .then(found => {
      if (found !== null) {
        // user with that googleId already exists
        done(null, found);
      } else {
        // no user with that googleId
        return User.create({ googleId: profile.id }).then(dbUser => {
          done(null, dbUser);
        });
      }
    })
    .catch(err => {
      done(err);
    });
}
));
//Passport Linkedin strategy setup

const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;

passport.use(
  new LinkedInStrategy(
  {
    clientID: process.env.LINKEDIN_API_KEY,
    clientSecret: process.env.LINKEDIN_SECRET_KEY,
    callbackURL: "http://127.0.0.1:3000/auth/linkedin/callback"
},
(accessToken, refreshToken, profile, done) => {
  // find a user with profile.id as linkedIn or create one
  User.findOne({ linkedinId: profile.id })
    .then(found => {
      if (found !== null) {
        // user with that linkedIn already exists
        done(null, found);
      } else {
        // no user with that linkedIn
        return User.create({ linkedinId: profile.id }).then(dbUser => {
          done(null, dbUser);
        });
      }
    })
    .catch(err => {
      done(err);
    });
}
));

//Passport Xing strategy setup

const XingStrategy = require('passport-xing').Strategy;

passport.use(
  new XingStrategy(
  {
    consumerKey: process.env.XING_API_KEY,
    consumerSecret: process.env.XING_SECRET_KEY,
    callbackURL: "http://127.0.0.1:3000/auth/xing/callback"
},
(accessToken, refreshToken, profile, done) => {
  // find a user with profile.id as xingId or create one
  User.findOne({ xingId: profile.id })
    .then(found => {
      if (found !== null) {
        // user with that xingId already exists
        done(null, found);
      } else {
        // no user with that xingId
        return User.create({ xingId: profile.id }).then(dbUser => {
          done(null, dbUser);
        });
      }
    })
    .catch(err => {
      done(err);
    });
}
));

app.use(passport.initialize());
app.use(passport.session());
// End of Passport Setup

// Express View engine setup

app.use(require('node-sass-middleware')({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  sourceMap: true
}));


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));



// default value for title local
app.locals.title = 'Express - Generated with IronGenerator';


const index = require('./routes/index');
app.use('/', index);
const vacancy = require('./routes/vacancy');
app.use('/', vacancy);

const authRoutes = require('./routes/auth');
app.use('/', authRoutes);


module.exports = app;
