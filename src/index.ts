import { IncomingMessage, ServerResponse } from "http";
import http from "http";
import MockedResponse from "./mockedResponse";
import MockedResponses from "./mockedResponses";

async function getRequestBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve) => {
        let data = "";
        req.on("data", chunk => {
            data = data + chunk.toString();
        });
        req.on("end", () => {
            resolve(data);
        });
    });
}

function respond(res: ServerResponse, statusCode: number, body: any = undefined) {
    res.setHeader("Content-type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.writeHead(statusCode);
    if (!body) {
        res.end();
    }
    res.end(JSON.stringify(body));
}

function getId(url: string): string | undefined | null {
    let matchGroup = url.match(/^\/mocked-responses\/(.*)/);
    if (matchGroup) {
        let id = matchGroup[1];
        if (id) {
            return id;
        }
        return null;
    } else {
        return undefined;
    }
}

function getMockedResponse(store: MockedResponses, req: IncomingMessage, res: ServerResponse) {
    if (req.url) {
        let id = getId(req.url);
        if (id === null) {
            let responses = store.list();
            respond(res, 200, responses);
        } else if (id === undefined) {
            respond(res, 400);
        } else {
            let response = store.get(id);
            if (response) {
                respond(res, 200, response);
            } else {
                respond(res, 404);
            }
        }
    } else {
        respond(res, 400);
    }
}

async function postMockedResponse(store: MockedResponses, req: IncomingMessage, res: ServerResponse) {
    let body = await getRequestBody(req);
    if (body) {
        let mockedResponse = new MockedResponse(body);
        store.add(mockedResponse);
        respond(res, 201);
    } else {
        respond(res, 400);
    }
}

async function putMockedResponse(store: MockedResponses, req: IncomingMessage, res: ServerResponse) {
    let body = await getRequestBody(req);
    if (body) {
        let mockedResponse = new MockedResponse(body);
        if (store.update(mockedResponse)) {
            respond(res, 200);
        } else {
            respond(res, 404);
        }
    } else {
        respond(res, 400);
    }
}

function deleteMockedResponse(store: MockedResponses, req: IncomingMessage, res: ServerResponse) {
    if (req.url) {
        let id = getId(req.url);
        if (id === null) {
            store.clear();
            respond(res, 200);
        } else if (id === undefined) {
            respond(res, 400);
        } else {
            let response = store.delete(id);
            if (response) {
                respond(res, 200);
            } else {
                respond(res, 404);
            }
        }
    } else {
        respond(res, 400);
    }
}

async function handleSetupRequest(store: MockedResponses, req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    let isSetupRequest = new RegExp("^\/mocked-responses\/.*")
    if (req.url && isSetupRequest.test(req.url)) {
        switch (req.method) {
            case "GET":
                getMockedResponse(store, req, res);
                break;
            case "POST":
                await postMockedResponse(store, req, res);
                break;
            case "PUT":
                await putMockedResponse(store, req, res);
                break;
            case "DELETE":
                deleteMockedResponse(store, req, res);
                break;
            default:
                res.setHeader("Allow", "GET, POST, PUT, DELETE");
                respond(res, 405, undefined);
        }
        return true;
    }
    return false;
}

async function activateMock(store: MockedResponses, req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    if (req.url && req.method) {
        let data = await getRequestBody(req);
        let body = JSON.parse(data);
        let mock = store.find(req.method, req.url, body);
        if (mock) {
            respond(res, mock.responseStatusCode, mock.responseBody);
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

let port = +process.argv[2];
let mockExpiryInMinutes = +process.argv[3];

if (!port) {
    port = 9191;
}

if (!mockExpiryInMinutes) {
    mockExpiryInMinutes = 0;
}

const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
        let store = MockedResponses.getInstance();
        store.setMockExpiry(mockExpiryInMinutes);
        if (await handleSetupRequest(store, req, res) || await activateMock(store, req, res)) {
            return;
        } else {
            respond(res, 404);
        }
    } catch (e) {
        respond(res, e.resultCode, e.message);
    }
});

server.listen(port, () => {
    console.log(`Listening on port ${port}.`);
    if (mockExpiryInMinutes) {
        console.log(`Mock expiry set to ${mockExpiryInMinutes} minutes.`);
    } else {
        console.log(`Mocks never expire.`);
    }
});
