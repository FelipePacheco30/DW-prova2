import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDatabase } from "./db.js";
import { reservationsRouter } from "./routes/reservations.js";
import { tablesRouter } from "./routes/tables.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ message: "API Lhama Mia online." });
});

app.use("/api/reservas", reservationsRouter);
app.use("/api/mesas", tablesRouter);

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Erro interno no servidor.";
  response.status(400).json({ message });
});

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`[server] Rodando em http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("[server] Falha ao iniciar", error);
    process.exit(1);
  });
