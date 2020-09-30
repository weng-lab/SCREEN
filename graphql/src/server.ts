import app from "./app";

// start listening on the port
const port = app.get("port");
const server = app.listen(port, () => {
    console.log(`Server ready at http://localhost:${port}/graphql`);
});

export default server;
