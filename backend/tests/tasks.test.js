const request = require('supertest');
const {server,app} = require('../index');
const mongoose = require('mongoose');

describe("get api/tasks",()=>{
    it("should return tasks Done!!!",async()=>{
        const res = await request(app).get('/api/tasks');
        expect(res.statusCode).toEqual(200);
    });
});

afterAll(async () => {
    await mongoose.connection.close();
    await server.close();
});