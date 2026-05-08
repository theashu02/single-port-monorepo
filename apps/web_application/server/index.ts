import { Elysia } from 'elysia';
import { exampleRoutes } from './routes/example';
import { authRoutes } from './routes/auth';

// We create the app instance but don't .listen()
const app = new Elysia({ prefix: '/api' })
    .use(exampleRoutes)
    .use(authRoutes);

export type App = typeof app;
export { app }; // Export the instance for Next.js to use