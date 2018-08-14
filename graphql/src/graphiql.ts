import * as express from 'express';
import * as url from 'url';

import { resolveGraphiQLString } from './resolveGraphiQLString';
import { GraphiQLData } from './renderGraphiQL';

export function graphiqlExpress(options: GraphiQLData) {
    const graphiqlHandler = (req: express.Request, res: express.Response, next) => {
        const query = req.url && url.parse(req.url, true).query;
        resolveGraphiQLString(query, options, req).then(
            graphiqlString => {
                res.setHeader('Content-Type', 'text/html');
                res.write(graphiqlString);
                res.end();
            },
            error => next(error)
        );
    };

    return graphiqlHandler;
}
