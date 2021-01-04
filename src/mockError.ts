export default class MockError extends Error {
    resultCode: number;
    
    constructor(message: string, resultCode: number = 500) {
        super(message);
        this.resultCode = resultCode;
    }
}