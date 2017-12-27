import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';
import schema from './schema/schema';
import { maskErrors } from 'graphql-errors';


const {formatError} = require('graphql');

const logErrors = error => {
  const data = formatError(error);
  const {originalError} = error;
  console.log(originalError);
  data.field = originalError && originalError.field;
  return data;
};

maskErrors(schema);

const app = express();

app.use('/graphql', graphqlHTTP({
  schema: schema,
  formatError: logErrors,
  graphiql: true
}));

app.listen(4000);