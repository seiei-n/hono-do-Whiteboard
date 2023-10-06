import { Hono } from "hono";

const app = new Hono<{
    Bindings: {
        BOARD: DurableObjectNamespace;
        ASSETS: Fetcher;
    };
}>();

app.all("/board/*", (c) => {
    const id = c.env.BOARD.idFromName("board");
    const obj = c.env.BOARD.get(id);
    return obj.fetch(c.req.raw);
});

app.get("*", (c) => c.env.ASSETS.fetch(c.req.url));

export default app;
export * from "./board";
