import express from 'express';
import accepts from 'accepts';

import { ApolloServer, ApolloError } from 'apollo-server-express';
import { GraphQLError, printSchema, graphql, parse, getIntrospectionQuery } from 'graphql';

const Raven = require('raven');
const { formatError } = require('graphql');

const useRaven = process.env.NODE_ENV === 'production';

useRaven && Raven.config('https://e43513f517284972b15c8770e626f645@sentry.io/676439').install();

import schema from './schema/schema'; // Import schema after

let schemajson = '';
graphql(schema, getIntrospectionQuery()).then(r => {
    const filteredData = (r.data as any).__schema.types.filter(type => null !== type.possibleTypes);
    const introspectionQueryResultData = { __schema: { types: filteredData } };
    const schema = JSON.stringify(introspectionQueryResultData, undefined, '  ');
    schemajson = schema;
});

const app = express();

const cors = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
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
    playground: true,
    formatError: error => {
        useRaven &&
            Raven.captureException(error, {
                extra: { source: error.source, originalMessage: error.originalMessage },
            });
        if (error instanceof ApolloError) {
            return error;
        } else {
            return new Error('Internal Server Error');
        }
    },
});

server.applyMiddleware({
    app,
    path: '/graphql',
});

app.use('/graphqlschema', cors);
app.use('/graphqlschema', function(req, res, next) {
    res.write(printSchema(schema));
    res.end();
});

app.use('/graphqlschemajson', cors);
app.use('/graphqlschemajson', function(req, res, next) {
    res.write(schemajson);
    res.end();
});

useRaven && app.use(Raven.errorHandler());

app.listen({ port: 4000 });
