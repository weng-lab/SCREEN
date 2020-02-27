import { ApolloServer } from "apollo-server-express";
import express, { Request, Response } from "express";
import { generatedSchema } from './schema/schema';

const port = process.env.PORT || 3000;
const isPlaygroundActive = true || process.env.NODE_ENV !== "production";
const apolloServer = new ApolloServer({
    schema: generatedSchema,
    playground: isPlaygroundActive
});

const app = express();
app.set("port", port);
apolloServer.applyMiddleware({ app, cors: true });

// Health check
app.get("/healthz", (req: Request, res: Response) => {
    res.send("ok");
});

export default app;
