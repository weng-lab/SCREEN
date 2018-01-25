import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';
import schema from './schema/schema';
import { maskErrors, IsUserError } from 'graphql-errors';

const {formatError} = require('graphql');

const logErrors = error => {
  const data = formatError(error);
  const {originalError} = error;
  if (originalError && !originalError[IsUserError] ) {
    console.log(originalError);
  }
  return data;
};

maskErrors(schema);

const app = express();

const cors = function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

app.use('/graphql', cors);
app.use('/graphql', graphqlHTTP({
  schema: schema,
  formatError: logErrors,
  graphiql: true
}));

app.listen(4000);