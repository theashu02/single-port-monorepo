import { Elysia } from 'elysia';
import { exampleRoutes } from './routes/example';
import { authRoutes } from './routes/auth';
import { profileRoutes } from './routes/profile';

// We create the app instance but don't .listen()
const app = new Elysia({ prefix: '/api' })
    .use(exampleRoutes)
    .use(authRoutes)
    .use(profileRoutes);

export type App = typeof app;
export { app };