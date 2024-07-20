import { describe, it, expect } from "bun:test";
import { createBlink, InputType } from "../src";

Bun.serve({
  port: 3000,
  fetch: createBlink({
    fetchBlink(c, context) {
      return {
        title: "Hello, World!",
        description: "This is a test.",
        iconUrl: "https://www.google.com/favicon.ico",
        inputs: [
          {
            type: InputType.Button,
            buttonText: "Donate 1 SOL",
            value: "1",
          },
          {
            type: InputType.Form,
            buttonText: "Donate",
            fields: [
              {
                name: "account",
                required: true,
              },
              {
                name: "name",
                required: true,
              },
            ],
          },
        ],
      };
    },
    async createTransaction(c, account, values, context) {
      return {
        transaction: "",
        message: "Not implemented yet",
      };
    },
  }).fetch,
});

describe("should", () => {
  it("GET", async () => {
    const response = await fetch("http://localhost:3000");
    const text = await response.json();
    expect(text).toEqual({
      title: "Hello, World!",
      description: "This is a test.",
      icon: "https://www.google.com/favicon.ico",
      label: "Powered by Blinkify",
      links: {
        actions: [
          {
            href: "/1",
            label: "Donate 1 SOL",
          },
          {
            href: "/{0}/{1}",
            label: "Donate",
            parameters: [
              {
                name: "0",
                required: true,
                label: "account",
              },
              {
                name: "1",
                required: true,
                label: "name",
              },
            ],
          },
        ],
      },
    });
  });

  it("POST", async () => {
    const response = await fetch("http://localhost:3000/1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account: "123",
      }),
    });
    const json = await response.json();
    expect(json).toEqual({
      transaction: "",
      message: "Not implemented yet",
    });
  });
});
