/*
 * KinectConnect
 * Copyright (c) 2026 Thomas J McLeish
 * Licensed under the MIT License.
 */

import { Server as HttpServer } from "http";
import { WebSocketServer } from "ws";
import { OutgoingMessage } from "./KinectAdapter";

export type SocketMessageHandler = (payload: unknown) => void;

export class WebSocketBroadcaster {
  private readonly wss: WebSocketServer;

  public constructor(httpServer: HttpServer) {
    this.wss = new WebSocketServer({ server: httpServer });
  }

  public onClientConnected(handler: SocketMessageHandler): void {
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
    const payload = JSON.stringify(message);

    for (const client of this.wss.clients) {
      if (client.readyState === client.OPEN) {
        client.send(payload);
      }
    }
  }
}
