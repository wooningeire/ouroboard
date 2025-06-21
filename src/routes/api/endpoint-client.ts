import { PUBLIC_API_URL } from "$env/static/public";
import type { GetEndpoint, OutputOf, PayloadOf, PostEndpoint } from "./endpoint-server";

export const apiGetter = <T extends GetEndpoint>(urlString: string) => {
    const url = new URL(urlString, PUBLIC_API_URL);

    return async (
        payload: PayloadOf<T>,
        options?: RequestInit,
    ) => {
        const urlObj = new URL(url);
        for (const [key, value] of Object.entries(payload as Record<string, string>)) {
            urlObj.searchParams.set(key, value);
        }

        const response = await fetch(urlObj, options);
        return await response.json() as OutputOf<T>;
    };
};



export const apiPoster = <T extends PostEndpoint<any>>(urlString: string, method: string="POST") => {
    const url = new URL(urlString, PUBLIC_API_URL);

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

        return await response.json() as OutputOf<T>;
    };
};