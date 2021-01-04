import MockError from "./mockError";

export default class MockedResponse {
    id: string = "";
    method?: string = undefined;
    url?: string = undefined;
    urlPattern?: string;
    requestBody: any = undefined;
    responseStatusCode: number = 200;
    responseBody: any = undefined;
    lastAccess: number = Date.now();

    constructor(json: string) {
        let data: MockedResponse = JSON.parse(json);
        
        if (!data.id) {
            throw new MockError("'id' is required.", 400);
        }        
        if (!data.method) {
            throw new MockError("'method' is required.", 400);
        }
        if (!data.responseStatusCode) {
            throw new MockError("'responseStatusCode' is required.", 400);
        }
        if (data.url && data.urlPattern) {
            throw new MockError("Only 'url' or 'urlPattern' can be specified. Not both.", 400);
        }
        if (!data.url && !data.urlPattern) {
            throw new MockError("One of 'url' or 'urlPattern' must be specified.", 400);
        }

        this.id = data.id;
        this.method = data.method;
        this.urlPattern = data.urlPattern;
        this.url = data.url;
        this.requestBody = data.requestBody;
        this.responseStatusCode = data.responseStatusCode;
        this.responseBody = data.responseBody;
    }
    
    private compareBodyObject(obj1: any, obj2: any): boolean {
        if (!obj2 || typeof obj2 != "object") {
            return false;
        }
        for (let prop in obj1) {
            if (typeof obj1[prop] == "object" && typeof obj2[prop] == "object") {
                if (!this.compareBodyObject(obj1[prop], obj2[prop])) {
                    return false;
                }
            } else {
                if (obj1[prop] !== obj2[prop]) {
                    return false;
                }
            }
        }
        return true;
    }

    matches(method: string, url: string, body: any): boolean {
        if (this.method !== method) {
            return false;
        }
        if (this.url !== undefined && this.url !== url) {
            return false;
        }
        if (this.urlPattern !== undefined) {
            let exp = new RegExp(this.urlPattern);
            if (!exp.test(url)) {
                return false;
            }
        }
        if (this.requestBody !== undefined && !this.compareBodyObject(this.requestBody, body)) {
            return false;
        }
        return true;
    }
}