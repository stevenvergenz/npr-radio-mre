import fetch from 'node-fetch';

import * as Api from './api';

const searchEndpoint = "http://opml.radiotime.com/Search.ashx?types=station&render=json&query=";
const detailEndpoint = "http://opml.radiotime.com/Describe.ashx?render=json&id=";

export async function search(term: string): Promise<Api.Outline[]> {
	const queryUrl = searchEndpoint + encodeURIComponent(term);
	const results = await fetch(queryUrl);
	const json = await results.json() as Api.Results<Api.Outline>;
	return json.body.filter(o => o.type === "audio");
}

export async function getStream(stationUrl: string): Promise<string[]> {
	const response = await fetch(stationUrl);
	const body = await response.text();
	return body.split('\n').filter(line => /^https?:.*\.mp3/u.test(line));
}
