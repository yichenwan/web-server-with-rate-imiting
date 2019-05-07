const redis = require('redis');
const Client = redis.createClient();
Client.on('connect', () => {
	console.log('connected');
});

const removeKey = (cb) => {
	Client.flushall((err, reply) => {
		// console.log('delete all keys');
		cb(null, reply);
	});	
}

const closeClient = (cb) => {
  Client.end(true);
}

const RateLimiterWithList = (maxNumOfReq, interval) => {	
    return (ip, cb) => {
	    Client.llen(ip, (err, numOfReq) => {  
	    	if (numOfReq >= maxNumOfReq) {
	    		return cb('ERROR "too many requests per minute"');
	    	} else {
				Client.exists(ip, (err, reply) => {				
					if (reply === 0) {
			    		Client.multi()
			    		.rpush(ip,ip)
			    		.expire(ip, interval)
			    		.exec((err, replies) => {	
			    			const numOfReq = replies[0];			    				    				    		
			                if (numOfReq > maxNumOfReq) {
			                	return cb('ERROR "too many requests per minute"');
			                }	
			    			Client.ttl(ip, (err, ttl) => {				    				    			 
								return cb(null, numOfReq, ttl);
							});					                			    				
			    		})
					}  else {
			    		Client.rpushx(ip, ip, (err, reply) => {		
			    			const numOfReq = reply;				    						    			
			                if (numOfReq > maxNumOfReq) {
			                	return cb('ERROR "too many requests per minute"');
			                }					    			    				
			    			Client.ttl(ip, (err, ttl) => {				    				    			 
								return cb(null, numOfReq, ttl);
							});	
			    		});
					}
				});
	    	}
		});
    }			
};

module.exports = {
	removeKey,
	closeClient,
	RateLimiterWithList,
}