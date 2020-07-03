import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { resolve } from 'path';
import NprRadio from './app';

process.on('uncaughtException', err => MRE.log.error('app', err));
process.on('unhandledRejection', err => MRE.log.error('app', err))

const server = new MRE.WebHost({
	baseDir: resolve(__dirname, '..', 'public')
});
server.adapter.onConnection(context => new NprRadio(context, server.baseUrl));
