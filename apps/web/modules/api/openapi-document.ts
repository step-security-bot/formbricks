import { responsePaths } from "@/modules/api/management/responses/openapi";
import * as yaml from "yaml";
import { z } from "zod";
import { createDocument, extendZodWithOpenApi } from "zod-openapi";
import { ZResponse } from "@formbricks/database/zod/responses";

extendZodWithOpenApi(z);

const document = createDocument({
  openapi: "3.1.0",
  info: {
    title: "Formbricks API",
    description: "An API for managing surveys and responses.",
    version: "1.0.0",
  },
  paths: {
    ...responsePaths,
  },
  servers: [
    {
      url: "http://app.formbricks.com/api",
      description: "The production server.",
    },
  ],
  tags: [
    {
      name: "responses",
      description: "Operations for managing responses.",
    },
  ],
  components: {
    schemas: {
      response: ZResponse,
    },
  },
});

console.log(yaml.stringify(document));
