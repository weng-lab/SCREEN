import * as express from 'express';
import * as accepts from 'accepts';

import { ApolloServer } from 'apollo-server-express';
import { maskErrors, IsUserError, setDefaultHandler, defaultHandler } from 'graphql-errors';
import { GraphQLError, printSchema, graphql, parse, introspectionQuery } from 'graphql';

const Raven = require('raven');
const { formatError } = require('graphql');

const useRaven = process.env.NODE_ENV === 'production';

useRaven && Raven.config('https://e43513f517284972b15c8770e626f645@sentry.io/676439').install();

import schema from './schema/schema'; // Import schema after
import { request } from 'http';
import { graphiqlExpress } from './graphiql';

const logErrors = req => error => {
    const data = formatError(error);
    const { originalError } = error;
    if (originalError && !originalError[IsUserError]) {
        useRaven &&
            Raven.captureException(originalError, {
                req,
                extra: { source: error.source, originalMessage: error.originalMessage },
            });
    } else if (!originalError && !(error instanceof GraphQLError)) {
        useRaven && Raven.captureException(error, { req, extra: { source: error.source } });
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

let schemajson = '';
graphql(schema, introspectionQuery).then(r => {
    const filteredData = (r.data as any).__schema.types.filter(type => null !== type.possibleTypes);
    const introspectionQueryResultData = { __schema: { types: filteredData } };
    const schema = JSON.stringify(introspectionQueryResultData, undefined, '  ');
    schemajson = schema;
});

const app = express();

const cors = function(req, res, next) {
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

const config = require('./config.json');

const server = new ApolloServer({
    schema: schema,
    engine: {
        apiKey: config.apolloengine_APIkey,
    },
    introspection: true,
    playground: false, // TODO: true once https://github.com/prismagraphql/graphql-playground/issues/793 fixed
});

// TODO: remove when playground is true
// along with graphiql, renderGraphiQL, resolveGraphiQLString
app.use('/graphql', (req, res, next) => {
    if (req.method === 'GET') {
        const accept = accepts(req);
        const types = accept.types() as string[];
        const prefersHTML = types.find((x: string) => x === 'text/html' || x === 'application/json') === 'text/html';

        if (prefersHTML) {
            graphiqlExpress({
                endpointURL: config.graphql.host,
            })(req, res, next);
            return;
        }
    }
    next();
});

server.applyMiddleware({
    app,
    path: '/graphql',
});

app.use('/graphqlschemajson', cors);
app.use('/graphqlschema', function(req, res, next) {
    res.write(printSchema(schema));
    res.end();
});

app.use('/graphqlschema', cors);
app.use('/graphqlschemajson', function(req, res, next) {
    res.write(schemajson);
    res.end();
});

useRaven && app.use(Raven.errorHandler());

app.listen({ port: 4000 });
