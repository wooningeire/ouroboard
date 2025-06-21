import { json, type RequestHandler } from "@sveltejs/kit";

export const get = <T=null, Payload extends Record<string, string>=any, Output=any>(
    handle: (
        payload: Payload,
        data: T,
        ...args: Parameters<RequestHandler>
    ) => ReturnType<RequestHandler> | Promise<Output>,
) => new GetEndpoint(handle);

export class GetEndpoint<T=null, Payload extends Record<string, string>=any, Output=any> {
    constructor(
        private readonly handle: (
            payload: Payload,
            data: T,
            ...args: Parameters<RequestHandler>
        ) => ReturnType<RequestHandler> | Promise<Output>,
    ) {}

    async callHandler(data: T, ...[event, ...args]: Parameters<RequestHandler>): Promise<Response> {
        const out = await this.handle(Object.fromEntries(event.url.searchParams) as Payload, data, event, ...args);
        if (out instanceof Response) {
            return out;
        }
        
        return json(out);
    }
    
    handler(data: T): RequestHandler {
        return (...args) => this.callHandler(data, ...args);
    }
}

export const post = <T=null, Payload extends Record<string, any>=any, Output=any>(
    handle: (
        payload: Payload,
        data: T,
        ...args: Parameters<RequestHandler>
    ) => ReturnType<RequestHandler> | Promise<Output>,
) => new PostEndpoint(handle);

export class PostEndpoint<T=null, Payload extends Record<string, any>=any, Output=any> {
    constructor(
        private readonly handle: (
            payload: Payload,
            data: T,
            ...args: Parameters<RequestHandler>
        ) => ReturnType<RequestHandler> | Promise<Output>,
    ) {}

    async callHandler(data: T, ...[event, ...args]: Parameters<RequestHandler>): Promise<Response> {
        const out = await this.handle((await event.request.json()) as Payload, data, event, ...args);
        if (out instanceof Response) {
            return out;
        }
        
        return json(out);
    }
    
    handler(data: T): RequestHandler {
        return (...args) => this.callHandler(data, ...args);
    }
}

export type PayloadOf<T> =
    T extends GetEndpoint<any, infer Payload, any> ? Payload :
    T extends PostEndpoint<any, infer Payload, any> ? Payload :
    never;
export type OutputOf<T> =
    T extends GetEndpoint<any, any, infer Output> ? Output :
    T extends PostEndpoint<any, any, infer Output> ? Output :
    never;
