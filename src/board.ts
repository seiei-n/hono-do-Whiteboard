import { Handler } from "hono";
import { generateHonoObject } from "hono-do";
import { defineStorage } from "hono-do/storage";

function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
            const r = (Math.random() * 16) | 0,
                v = c == "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        }
    );
}

export const Board = generateHonoObject("/board", async (app, { storage }) => {
    const sessions = new Map<string, WebSocket>();
    const [getImage, setImage, deleteImage] = await defineStorage<
        string | null
    >(storage, "image", null);

    app.post("/image", async (c) => {
        const req = await c.req.json();
        const image = req.image;
        if (image) {
            await setImage(image);
        }
        return c.text("OK");
    });

    app.get("/image", async (c) => {
        const image = await getImage();
        return c.json({ image });
    });

    app.get("/websocket", async (c) => {
        if (c.req.header("Upgrade") === "websocket") {
            return await handleWebSocketUpgrade();
        }
        return c.text("Not found", 404);
    });

    async function handleWebSocketUpgrade() {
        const [client, server] = Object.values(new WebSocketPair());
        const clientId = uuidv4();
        server.accept();

        sessions.set(clientId, server);

        server.addEventListener("message", (msg) => {
            if (typeof msg.data !== "string") return;
            broadcast(msg.data, clientId);
        });

        return new Response(null, { status: 101, webSocket: client });
    }

    function broadcast(message: string, senderClientId?: string) {
        for (const [clientId, webSocket] of sessions.entries()) {
            if (clientId === senderClientId) {
                continue;
            }

            try {
                webSocket.send(message);
            } catch (error) {
                sessions.delete(clientId);
            }
        }
    }
});
