const readability = require('@mozilla/readability');
const axios = require('axios');


async function fetchURLContent(url) {
    //const article = '';
    try {
        const response = await axios.get(url, {
            
            //We can add more configurations in this object
            params: {
            //This is one of the many options we can configure
            },
            headers: {
                'Accept-Encoding': 'application/xml',
                //'Accept-Encoding': 'application/json',
            }
            });
            if(response.status == 200){
                // test for status you want, etc
                console.log(response.status)
            } 
        //article= response.data;
        //article = new readability(article).parse();
        return response;
    } catch (err) {
        console.log(err +" Error Parsing: " + url);
    }
    
}

module.exports = {
    fetchURLContent
}