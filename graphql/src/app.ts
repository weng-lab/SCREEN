import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';
import schema from './schema/schema';
import { maskErrors } from 'graphql-errors';

maskErrors(schema);

const app = express();

app.use('/graphql', graphqlHTTP({
  schema: schema,
  graphiql: true
}));

app.listen(4000);