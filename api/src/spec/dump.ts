// spec/dump.ts
import { writeFileSync } from "fs";
import swaggerSpec from "./swagger"; 

writeFileSync("./src/spec/openapi.json", JSON.stringify(swaggerSpec, null, 2));
