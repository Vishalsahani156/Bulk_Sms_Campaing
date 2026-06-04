import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { verifyAccessToken, type TokenPayload } from "../modules/auth/auth.service.js";
import { unauthorized } from "../shared/errors.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: TokenPayload;
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate("authenticate", async (request: FastifyRequest) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw unauthorized("Missing or invalid authorization header");
    }
    const token = authHeader.slice(7);
    request.user = verifyAccessToken(token);
  });
};

export default fp(authPlugin);
