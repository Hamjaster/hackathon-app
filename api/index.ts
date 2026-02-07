import "dotenv/config";
import express from "express";
import { registerRoutes } from "../server/routes";
import { serveStatic } from "../server/static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

app.use(
    express.json({
        verify: (req: any, _res, buf) => {
            req.rawBody = buf;
        },
    }),
);

app.use(express.urlencoded({ extended: false }));

// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;

    res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
            console.log(
                `${req.method} ${path} ${res.statusCode} in ${duration}ms`,
            );
        }
    });

    next();
});

// Register API routes
await registerRoutes(httpServer, app);

// Error handler
app.use((err: any, _req: any, res: any, next: any) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
        return next(err);
    }

    return res.status(status).json({ message });
});

// Serve static files in production
serveStatic(app);

// Export for Vercel serverless
export default app;
