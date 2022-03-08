const { Response } = require('./shared/response');

exports.handler = async (event, context) => {
    try {

        // TODO: If authentication succesfull create session rediect to /issue, else send to home page 
        
        return Response.httpRedirect('/prod');
    } catch (err) {
        console.error(err);
        return Response.httpStatus(500);
    }
};