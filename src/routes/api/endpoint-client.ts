import { PUBLIC_API_URL } from "$env/static/public";
import type { GetEndpoint, OutputOf, PayloadOf, PostEndpoint } from "./endpoint-server";

const errorString = async (urlObj: URL, response: Response) => {
    return `${urlObj} | ${response.status} ${response.statusText} | ${(await response.json()).message}`;
}


export const apiGetter = <T extends GetEndpoint>(urlString: string) => {
    const url = new URL(urlString, new URL(PUBLIC_API_URL, location.origin));

    return async (
        payload: PayloadOf<T>,
        options?: RequestInit,
    ) => {
        const urlObj = new URL(url);
        for (const [key, value] of Object.entries(payload as Record<string, string>)) {
            urlObj.searchParams.set(key, value);
        }

        const response = await fetch(urlObj, options);
        if (!response.ok) {
            throw new Error(await errorString(urlObj, response));
        }

        return await response.json() as OutputOf<T>;
    };
};



export const apiPoster = <T extends PostEndpoint<any>>(urlString: string, method: string="POST") => {
    const url = new URL(urlString, new URL(PUBLIC_API_URL, location.origin));

    return async (
        payload: PayloadOf<T>,
        options: RequestInit={},
    ) => {
        const urlObj = new URL(url);

        const {headers, ...rest} = options;

        const response = await fetch(urlObj, {
            body: JSON.stringify(payload),
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
            method,
            ...rest,
        });
        if (!response.ok) {
            throw new Error(await errorString(urlObj, response));
        }

        return await response.json() as OutputOf<T>;
    };
};