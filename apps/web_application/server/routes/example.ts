import { Elysia, t } from 'elysia';

export const exampleRoutes = new Elysia()
    .get('/hello', () => {
        return {
            status: 'success',
            data: 'Hello from Elysia running inside Next.js!',
            hardcoded: [
                { id: 1, name: 'Items 1' },
                { id: 2, name: 'Items 2' }
            ]
        };
    })
    .post('/echo', ({ body }) => body, {
        body: t.Object({
            message: t.String()
        })
    });