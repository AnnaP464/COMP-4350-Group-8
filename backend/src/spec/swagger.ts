import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Gamified Volunteering API",
      version: "1.0.0",
    },
  },
  apis: ["./src/routes/*.ts"], // files to scan for @swagger comments
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;