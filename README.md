# Blinkify

Blinkify is a lightweight npm package that simplifies the creation of Solana Actions-compatible API endpoints.

## Installation

#### (Recommended) Using Bun

```bash
bun install blinkify
```

#### Using Node

```bash
npm install blinkify
```

## Usage

### Minimal Example

#### Note: If you are using Node.js instead of Bun you need to use the serve function instead of exporting, more info can be found [here](https://hono.dev/docs/getting-started/nodejs)

```typescript
import { createBlink, InputType } from "blinkify";

const app = createBlink({
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
      ],
    };
  },
  async createTransaction(c, account, values, context) {
    return {
      transaction: "",
      message: "Not implemented yet",
    };
  },
});

export default {
  port: 3000,
  fetch: app.fetch,
};
```

### Donation example

#### I'm going to use [umi](https://developers.metaplex.com/umi/getting-started) for this showcase but you can use anything you want.

```typescript
import { createBlink, InputType } from "blinkify";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplToolbox, transferSol } from "@metaplex-foundation/mpl-toolbox";
import { createNoopSigner, publicKey, sol } from "@metaplex-foundation/umi";
import { base64 } from "@metaplex-foundation/umi/serializers";

const umi = createUmi("https://api.mainnet-beta.solana.com");
umi.use(mplToolbox());

const DONATION_RECIPIENT = publicKey(
  "EhJqYmY93KYAs2bxhD13z7R6tMeGYgjia9wfW5Rwg3tV"
); // Replace this with your wallet address

const app = createBlink({
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
          type: InputType.Button,
          buttonText: "Donate 5 SOL",
          value: "5",
        },
        {
          type: InputType.Button,
          buttonText: "Donate 10 SOL",
          value: "10",
        },
        {
          type: InputType.Form,
          buttonText: "Donate",
          fields: [
            {
              name: "amount",
              required: true,
            },
          ],
        },
      ],
    };
  },
  async createTransaction(c, account, values, context) {
    const amount = parseFloat(values[0]);
    const user = createNoopSigner(publicKey(account));

    const transaction = (
      await transferSol(umi, {
        amount: sol(amount),
        destination: DONATION_RECIPIENT,
        source: user,
      }).setLatestBlockhash(umi)
    )
      .setFeePayer(user)
      .build(umi);

    return {
      transaction: base64.deserialize(
        umi.transactions.serialize(transaction)
      )[0],
      message: "message",
    };
  },
});

console.log("Started server on http://localhost:3000/");

export default {
  port: 3000,
  fetch: app.fetch,
};
```

# Blinkify API Reference

### `createBlink(options)`

Creates a Blinkify application.

### Parameters

`options`: An object with the following properties:

- `fetchBlink`: Function to define the blink interface

  - Type: `(c: Context, context?: Record<string, string>) => Promise<FetchBlinkResponse> | FetchBlinkResponse`
  - Parameters:
    - `c`: Hono Context object
    - `context`: Query params when fetching the blink
  - Returns: A `FetchBlinkResponse` object or a Promise that resolves to one

- `createTransaction`: Function to create and return a transaction

  - Type: `(c: Context, account: string, inputValues: string[], context?: Record<string, string>) => Promise<CreateTransactionResponse> | CreateTransactionResponse`
  - Parameters:
    - `c`: Hono Context object
    - `account`: Public key of the user as a string
    - `inputValues`: Array of input values from the user, only contains 1 value unless it's a multi input form
    - `context`: Optional object containing user context
  - Returns: A `CreateTransactionResponse` object or a Promise that resolves to one

- `settings` (optional): Configuration object
  - `app?: Hono`: Custom Hono app instance
  - `customCors?: boolean`: Disable default CORS if set to `true`
  - `customApiPath?: string`: Set a custom API path

### Returns

A Hono application instance configured with Blinkify routes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
