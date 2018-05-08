import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';
import { maskErrors, IsUserError, setDefaultHandler, defaultHandler } from 'graphql-errors';
import { GraphQLError, printSchema } from 'graphql';

const Raven = require('raven');
const {formatError} = require('graphql');

const useRaven = process.env.NODE_ENV === 'production';

useRaven && Raven.config('https://e43513f517284972b15c8770e626f645@sentry.io/676439').install();

// We have to manually force load order here because of double references to db_cache
import './db/db_cache'; // Force db load
import schema from './schema/schema'; // Import schema after

const logErrors = req => error => {
  const data = formatError(error);
  const {originalError} = error;
  if (originalError && !originalError[IsUserError] ) {
    useRaven && Raven.captureException(originalError, { req, extra: { source: error.source, originalMessage: error.originalMessage } });
  } else if (!originalError && !(error instanceof GraphQLError)) {
    useRaven && Raven.captureException(error, { req, extra: { source: error.source} });
  }
  return data;
};

const oldDefault = defaultHandler;
setDefaultHandler(err => {
  if (!err[IsUserError]) {
    err.originalMessage = err.message;
  }
  return oldDefault(err);
});
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

useRaven && app.use(Raven.requestHandler());

app.use('/graphql', cors);
app.use('/graphql', graphqlHTTP(req => ({
  schema: schema,
  formatError: logErrors(req),
  graphiql: true
})));

app.use('/graphqlschema', cors);
app.use('/graphqlschema', function (req, res, next) {
  res.write(printSchema(schema));
  res.end();
});

useRaven && app.use(Raven.errorHandler());


app.listen(4000);
