const express = require('express');
const requestIp = require('request-ip');
const {RateLimiterWithList, RateLimiterWithString} = require('./rateLimiter');
const redis = require('redis');
const Client = redis.createClient(process.env.REDIS_URL);
Client.on('connect', () => {
	console.log('connected');
});
const app = express();

app.use(requestIp.mw());
app.use((req, res, next) => {
	const rateLimiterWithString = RateLimiterWithString(60, 60, Client);
	rateLimiterWithString(req.clientIp, (err, numOfReq) => {
		if (err) {
			if (err === 'ERROR "too many requests per minute"')
				return res.status(403).send(err);
			else 
				return res.status(500).send(err);
		} 
		req.numOfReq = numOfReq;
	    next();			
	})
});

app.get('/', (req, res) => {
	res.status(200).send(`Req # : ${req.numOfReq}`);
});

app.listen(process.env.PORT || 3000, () => {
	console.log('server is running');
});
