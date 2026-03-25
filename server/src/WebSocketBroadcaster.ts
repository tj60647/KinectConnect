/*
 * KinectConnect
 * Copyright (c) 2026 Thomas J McLeish
 * Licensed under the MIT License.
 */

import { Server as HttpServer } from "http";
import { Server as HttpsServer } from "https";
import { WebSocketServer } from "ws";
import { OutgoingMessage } from "./KinectAdapter";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PROTOCOL_VERSION } = require("../../shared/protocol") as { PROTOCOL_VERSION: string };

export type SocketMessageHandler = (payload: unknown) => void;
export type ClientJoinedHandler = (sendToClient: (message: OutgoingMessage) => void) => void;

export class WebSocketBroadcaster {
  private readonly wss: WebSocketServer;

  public constructor(httpServer: HttpServer | HttpsServer) {
    this.wss = new WebSocketServer({ server: httpServer });
  }

  // Fires once per new connection. Use this to push current state (e.g. sensorInfo)
  // to just the newly connected client without affecting everyone else.
  public onClientJoined(handler: ClientJoinedHandler): void {
    this.wss.on("connection", (socket) => {
      console.log(`[WebSocket] Client connected. Total clients: ${this.wss.clients.size}`);

      socket.on("close", () => {
        console.log(`[WebSocket] Client disconnected. Total clients: ${this.wss.clients.size}`);
      });

      const sendToClient = (message: OutgoingMessage): void => {
        if (socket.readyState === socket.OPEN) {
          const stamped: Record<string, unknown> = { ...message, protocolVersion: PROTOCOL_VERSION };
          socket.send(JSON.stringify(stamped));
        }
      };

      handler(sendToClient);
    });
  }

  public onClientMessage(handler: SocketMessageHandler): void {
    this.wss.on("connection", (socket) => {
      socket.on("message", (raw) => {
        try {
          const json = JSON.parse(raw.toString()) as unknown;
          handler(json);
        } catch {
          // Ignore malformed JSON payloads in this beginner demo.
        }
      });
    });
  }

  public broadcast(message: OutgoingMessage): void {
    const stamped: Record<string, unknown> = { ...message, protocolVersion: PROTOCOL_VERSION };
    const payload = JSON.stringify(stamped);

    for (const client of this.wss.clients) {
      if (client.readyState === client.OPEN) {
        client.send(payload);
      }
    }
  }
}
