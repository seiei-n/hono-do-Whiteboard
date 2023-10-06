import { Hono } from "hono";

const app = new Hono<{
    Bindings: {
        DRAW: DurableObjectNamespace;
        ASSETS: Fetcher;
    };
}>();

app.all("/board/*", (c) => {
    const id = c.env.DRAW.idFromName("draw");
    const obj = c.env.DRAW.get(id);
    return obj.fetch(c.req.raw);
});

app.get("*", (c) => c.env.ASSETS.fetch(c.req.url));

export default app;
export * from "./draw";
