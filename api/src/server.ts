import app from "./app";
import eventsRoutes from "./routes/events";

const PORT = process.env.PORT || 4000;

// Start listening
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}")`);
    console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});

app.use("/v1/org_events", eventsRoutes);