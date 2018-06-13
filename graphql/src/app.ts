import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';
import * as bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { maskErrors, IsUserError, setDefaultHandler, defaultHandler } from 'graphql-errors';
import { GraphQLError, printSchema, graphql, parse, introspectionQuery } from 'graphql';
import { ApolloEngine } from 'apollo-engine';

const Raven = require('raven');
const { formatError } = require('graphql');

const useRaven = process.env.NODE_ENV === 'production';

const config = require('./config.json');

useRaven && Raven.config('https://e43513f517284972b15c8770e626f645@sentry.io/676439').install();

import schema from './schema/schema'; // Import schema after

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

const config = require('./config.json');
// Unsure how to get base url when we are served from non-root / - like /screenv10_graphql/
app.get(
    '/graphql',
    // graphiqlExpress(req => ({ endpointURL: req && req.originalUrl ? console.log(req) || req.originalUrl.split('?')[0] : '/graphql' }))
    graphiqlExpress({ endpointURL: config.graphql.host })
);

app.use('/graphql', cors);
app.use(
    '/graphql',
    bodyParser.json(),
    graphqlExpress(req => ({
        schema: schema,
        formatError: logErrors(req),
        graphiql: true,
        tracing: true,
        cacheControl: false,
    }))
);

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

// Initialize engine with your API key. Alternatively,
// set the ENGINE_API_KEY environment variable when you
// run your program.
const engine = new ApolloEngine({
    apiKey: config.apolloengine_APIkey,
});

// Call engine.listen instead of app.listen(port)
engine.listen({
    port: 4000,
    expressApp: app,
});

// app.listen(4000);
