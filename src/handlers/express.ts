import serverless from 'serverless-http';
import { app } from '../web-server';

const server = serverless(app);

export const handler = async (event, context) => await server(event, context);
