'use strict';

const app = require('../../app.js');
const chai = require('chai');
const expect = chai.expect;
var event, context;

event = require('../../../events/cf-orgin.json')
// console.log(event)
// describe('Tests index', function () {
//     it('verifies successful response', 
async function test(){
    // console.log(event)
        const result = await app.lambdaHandler(event, context, function(e){
            console.log(e)
        })

        // console.log(result)
        // expect(result).to.be.an('object');
        // expect(result.statusCode).to.equal(200);
        // expect(result.body).to.be.an('string');

        // let response = JSON.parse(result.body);

        // expect(response).to.be.an('object');
        // expect(response.message).to.be.equal("is crawler");
        // expect(response.location).to.be.an("string");
}

test()
//     );
// });
