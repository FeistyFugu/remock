import MockedResponse from "./mockedResponse";

export default class MappedResponses {
    private static instance: MappedResponses;
    private responses: MockedResponse[] = [];

    private constructor() {
        setInterval(() => {
            const originalLength = this.responses.length;
            
            this.responses = this.responses.filter(
                responses => responses.lastAccess === undefined || responses.lastAccess + (15 * 60 * 1000) > Date.now());
            
            const diffLength = originalLength - this.responses.length;
            if (diffLength >= 1) {
                console.log(`Deleted ${diffLength} items`);
            }
        }, 60 * 1000);
    };

    static getInstance(): MappedResponses {
        if (!MappedResponses.instance) {
            MappedResponses.instance = new MappedResponses();
        }
        return MappedResponses.instance;
    }

    private findResponseIndexById(id: string): number {
        return this.responses.findIndex(responses => responses.id === id);
    }
    
    find(method: string, url: string, body: any = undefined): MockedResponse | undefined {
        let reponse = this.responses.find(mock => mock.matches(method, url, body));
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
        this.responses[index].lastAccess = Date.now();
        return this.responses[index];
    }

    list(): MockedResponse[] {
        return [...this.responses];
    }
    
    add(responseToAdd: MockedResponse) {
        if (this.update(responseToAdd)) {
            return;
        }
        responseToAdd.lastAccess = Date.now();
        this.responses.push(responseToAdd);
    }

    update(updatedMock: MockedResponse): boolean {
        let index = this.findResponseIndexById(updatedMock.id);
        if (index < 0) {
            return false;
        }
        delete this.responses[index];
        this.responses[index] = updatedMock;
        updatedMock.lastAccess = Date.now();
        return true;
    }

    delete(id: string): boolean {
        let index = this.findResponseIndexById(id);
        if (index < 0) {
            return false;
        }
        this.responses.splice(index, 1);
        return true;
    }

    clear() {
        this.responses = [];
    }
}