import { ApolloServer } from "apollo-server-express";
import express, { Request, Response } from "express";
import { generatedSchema } from './schema/schema';
import cors from 'cors';

const port = process.env.PORT || 3000;
const playgroundEndpoint = process.env.PLAYGROUND_ENDPOINT || undefined;
const isPlaygroundActive = true || process.env.NODE_ENV !== "production";
const apolloServer = new ApolloServer({
    schema: generatedSchema,
    playground: !isPlaygroundActive
        ? undefined
        : playgroundEndpoint !== undefined
            ? {
                endpoint: playgroundEndpoint,
                shareEnabled: true,
            } as any
            : {
                shareEnabled: true,
            } as any,
    introspection: true,
});

const app = express();
app.use(cors());
app.set("port", port);
apolloServer.applyMiddleware({ app, cors: true });

// Health check
app.get("/healthz", (req: Request, res: Response) => {
    res.send("ok");
});

export default app;
