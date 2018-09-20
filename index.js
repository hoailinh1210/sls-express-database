const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const AWS = require('aws-sdk');

const USERS_TABLE = process.env.USERS_TABLE || 'test';
const IS_OFFLINE = process.env.IS_OFFLINE;
let dynamoDb ;

if (IS_OFFLINE === 'true'){
    dynamoDb = new AWS.DynamoDB.DocumentClient({
        region: 'localhost',
        endpoint: 'http://localhost:8000'
    })
}
else {
    dynamoDb = new AWS.DynamoDB.DocumentClient();
}

app.use(bodyParser.json({strict: false}));
app.use(bodyParser.urlencoded({extended: true}))

app.get('/',(req,res) => {
    res.send('Hello');
})

app.get('/users/:userId',(req,res)=>{
    const params = {
        TableName: USERS_TABLE,
        Key: {
            userId: req.params.userId
        }
    }
    
    dynamoDb.get(params,(error,result) => {
        if (error){
            console.log(error);
            return res.status(400).json({error: 'Could not get user'});
        }
        if (result.Item){
            const {userId, name} = result.Item;
            return res.json({userId, name});
        } else {
            return res.status(404).json({ error: 'User not found'});
        }
    });
})

app.post('/users',(req,res)=> {
    const {userId, name } = req.body;
    console.log(req.body);
    if (typeof userId !== 'string'){
        return res.status(400).json({error: '"userId" must be a string'});
    } else if (typeof name !== 'string'){
        return res.status(400).json({error: '"name" must be a string'});
    }

    const params = {
        TableName: USERS_TABLE,
        Item: {
            userId: userId,
            name: name
        }
    };

    dynamoDb.put(params,(error)=> {
        if (error){
            console.log(error);
            return res.status(400).json({ error: 'Could not create user'});
        }
        return res.json({ userId,name });
    });
});

module.exports.handler = serverless(app);