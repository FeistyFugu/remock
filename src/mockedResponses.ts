import MockedResponse from "./mockedResponse";

export default class MappedResponses {
    private static _instance: MappedResponses;
    private _responses: MockedResponse[] = [];
    private _mockExpiryTimeout: NodeJS.Timeout | undefined;

    private constructor() {};

    static getInstance(): MappedResponses {
        if (!MappedResponses._instance) {
            MappedResponses._instance = new MappedResponses();
        }
        return MappedResponses._instance;
    }

    setMockExpiry(expiryInMinutes: number = 0) {
        if (this._mockExpiryTimeout !== undefined) {
            return;
        }
        if (expiryInMinutes > 0) {
            this._mockExpiryTimeout = setInterval(() => {
                const originalLength = this._responses.length;
                
                this._responses = this._responses.filter(
                    responses => responses.lastAccess === undefined || responses.lastAccess + (expiryInMinutes * 60 * 1000) > Date.now());
                
                const diffLength = originalLength - this._responses.length;
                if (diffLength >= 1) {
                    console.log(`Deleted ${diffLength} items`);
                }
            }, 60 * 1000);
        }
    }

    private findResponseIndexById(id: string): number {
        return this._responses.findIndex(responses => responses.id === id);
    }
    
    find(method: string, url: string, body: any = undefined): MockedResponse | undefined {
        let reponse = this._responses.find(mock => mock.matches(method, url, body));
        if (reponse === undefined) {
            return undefined;
        }
        reponse.lastAccess = Date.now();
        return reponse;
    }

    get(id: string): MockedResponse | undefined {
        let index = this.findResponseIndexById(id);
        if (index < 0) {
            return undefined;
        }
        this._responses[index].lastAccess = Date.now();
        return this._responses[index];
    }

    list(): MockedResponse[] {
        return [...this._responses];
    }
    
    add(responseToAdd: MockedResponse) {
        if (this.update(responseToAdd)) {
            return;
        }
        responseToAdd.lastAccess = Date.now();
        this._responses.push(responseToAdd);
    }

    update(updatedMock: MockedResponse): boolean {
        let index = this.findResponseIndexById(updatedMock.id);
        if (index < 0) {
            return false;
        }
        delete this._responses[index];
        this._responses[index] = updatedMock;
        updatedMock.lastAccess = Date.now();
        return true;
    }

    delete(id: string): boolean {
        let index = this.findResponseIndexById(id);
        if (index < 0) {
            return false;
        }
        this._responses.splice(index, 1);
        return true;
    }

    clear() {
        this._responses = [];
    }
}