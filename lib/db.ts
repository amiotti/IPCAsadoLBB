import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

function getClient() {
  if (!global.__prisma__) {
    global.__prisma__ = new PrismaClient();
  }
  return global.__prisma__;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient() as PrismaClient;
    const value = (client as any)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  }
});
