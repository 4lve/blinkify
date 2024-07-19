import type {
  ActionGetResponse,
  ActionPostResponse,
  LinkedAction,
} from "@solana/actions";
import { Hono, type Context } from "hono";
import { cors } from "hono/cors";

export enum InputType {
  Button,
  Form,
}

export interface Button {
  type: InputType.Button;
  value: string;
  buttonText: string;
  context?: Record<string, string>;
}

export interface Field {
  name: string;
  required: boolean;
}

export interface Form {
  type: InputType.Form;
  buttonText: string;
  fields: Field[];
  context?: Record<string, string>;
}

export interface FetchBlinkResponse {
  title: string;
  description: string;
  iconUrl: string;
  inputs: (Button | Form)[];
}

export interface CreateTransactionResponse {
  transaction: string;
  message?: string;
}

export function createBlink(props: {
  settings?: {
    app?: Hono;
    customCors?: boolean;
    customApiPath?: string;
  };
  fetchBlink: (c: Context) => Promise<FetchBlinkResponse> | FetchBlinkResponse;
  createTransaction: (
    c: Context,
    account: string,
    inputValues: (string | null)[],
    context?: Record<string, string>
  ) => Promise<CreateTransactionResponse> | CreateTransactionResponse;
}) {
  const app = props.settings?.app ? props.settings.app : new Hono();
  const apiPath = props.settings?.customApiPath || "";

  if (!props.settings?.customCors) {
    app.use(
      "/*",
      cors({
        allowMethods: ["GET", "POST", "OPTIONS"],
        origin: "*",
        allowHeaders: ["content-type", "accept-encoding", "authorization"],
      })
    );
  }

  app.get(apiPath, async (c) => {
    const data = await props.fetchBlink(c);

    return c.json<ActionGetResponse>({
      title: data.title,
      description: data.description,
      icon: data.iconUrl,
      label: "...", // This is pretty much useless
      links: {
        actions: data.inputs.map((input): LinkedAction => {
          const urlContext = new URLSearchParams(input.context).toString();

          if (input.type === InputType.Button) {
            return {
              href:
                apiPath +
                "/" +
                encodeURIComponent(input.value) +
                (urlContext ? `?${urlContext}` : ""),
              label: input.buttonText,
            };
          }

          return {
            href:
              apiPath +
              "/" +
              input.fields.map((v, index) => `{${index}}`).join("/") +
              (urlContext ? `?${urlContext}` : ""),

            label: input.buttonText,
            parameters: input.fields.map((field, index) => ({
              name: index.toString(),
              required: field.required,
              label: field.name,
            })),
          };
        }),
      },
    });
  });

  app.post(apiPath + "/*", async (c) => {
    let values: (string | null)[] = c.req.path.replace(apiPath, "").split("/");
    values.shift();
    values = values.map((v) => {
      if (v === "") {
        return null;
      }
      return decodeURIComponent(v!);
    });

    const context = c.req.query();

    const response = await props.createTransaction(
      c,
      (
        await c.req.json()
      ).account,
      values,
      context
    );

    return c.json<ActionPostResponse>({
      transaction: response.transaction,
      message: response.message,
    });
  });

  return app;
}
