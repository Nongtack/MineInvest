import express from "express";
import serverless from "serverless-http";
import { registerApiRoutes } from "../../server/routes";

const app = express();

app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false }));

let _handler: ReturnType<typeof serverless> | null = null;

async function getHandler() {
  if (!_handler) {
    await registerApiRoutes(app);
    _handler = serverless(app);
  }
  return _handler;
}

export const handler = async (event: any, context: any) => {
  const h = await getHandler();
  return h(event, context);
};
