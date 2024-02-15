const express = require('express');
const { ApolloServer } = require('@apollo/server');

const path = require('path');
const cors = require('cors');

const { expressMiddleware } = require('@apollo/server/express4');
const { authMiddleware } = require('./utils/auth');
const { typeDefs, resolvers } = require('./schema');
const db = require('./config/connection');


const PORT = process.env.PORT || 3001;
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const app = express();

// to avoid referrer issues we use this middleware
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

// setting options for cors origins 
const corsOptions = {
  origin: 'https://budge-buddy.netlify.app', // Adjust this to your client's URL on netlify with no / at the end
  credentials: false, // we aren't tossing cookies around
  methods: ['GET', 'POST', 'OPTIONS'], // Allowed HTTP methods 
  allowedHeaders: ['Content-Type', 'Authorization'], // this allows auth headers to get passed from client to server this is the `authorization bearer token` stuff
};


app.use(cors(corsOptions));

// Create a new instance of an Apollo server with the GraphQL schema
const startApolloServer = async () => {
  await server.start();
  
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  

  // add cors false to this middleware
  app.use('/graphql', expressMiddleware(server, {
    context: authMiddleware,
    cors: false 
  }));

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));

    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
  } 

  db.once('open', () => {
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}!`);
      console.log(`Use GraphQL at http://localhost:${PORT}/graphql`);
    });
  });
};

startApolloServer();