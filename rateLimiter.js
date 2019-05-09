const RateLimiterWithList = (maxNumOfReq, interval, Client) => {	
    return (ip, cb) => {
	    Client.llen(ip, (err, numOfReq) => {  
	    	if (err) {
	    		return cb(err.message);
	    	}
	    	if (numOfReq >= maxNumOfReq) {
	    		return cb('ERROR "too many requests per minute"');
	    	} else {
				Client.exists(ip, (err, reply) => {		
			    	if (err) {
			    		return cb(err.message);
			    	}						
					if (reply === 0) {
			    		Client.multi()
			    		.rpush(ip,ip)
			    		.expire(ip, interval)
			    		.exec((err, replies) => {	
			    			const numOfReq = replies[0];			    				    				    		
			                if (numOfReq > maxNumOfReq) {
			                	return cb('ERROR "too many requests per minute"');
			                }	
			                return cb(null, numOfReq);				                			    				
			    		})
					}  else {
			    		Client.rpushx(ip, ip, (err, reply) => {	
					    	if (err) {
					    		return cb(err.message);
					    	}			    			
			    			const numOfReq = reply;				    						    			
			                if (numOfReq > maxNumOfReq) {
			                	return cb('ERROR "too many requests per minute"');
			                }					    			    							    				    			 
							return cb(null, numOfReq);
			    		});
					}
				});
	    	}
		});
    }			
};

const RateLimiterWithString = (maxNumOfReq, interval, Client) => {	
    return (ip, cb) => {
		Client.multi()
		.set(ip, 0, 'EX', interval, 'NX')
		.incr(ip)
		.exec((err, replies) => {	
	    	if (err) {
	    		return cb(err.message);
	    	}			
			const numOfReq = replies[1];			    				    				    		
            if (numOfReq > maxNumOfReq) {
            	return cb('ERROR "too many requests per minute"');
            }					    				    			 
			return cb(null, numOfReq);				                			    				
		})		
	}	
};

module.exports = {
	RateLimiterWithList,
	RateLimiterWithString
}