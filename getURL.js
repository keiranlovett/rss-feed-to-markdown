const readability = require('@mozilla/readability');
const axios = require('axios');


async function fetchURLContent(url) {
    const article = '';
    try {
        const response = await axios.get(url, {
            timeout: 30000,
            //We can add more configurations in this object
            params: {
            //This is one of the many options we can configure
            }
            });
            
        article= response.data;
        //article = new readability(article).parse();
        return article.data;
    } catch (err) {
        console.log(err +" Error Parsing: " + url);
    }
    
}

module.exports = {
    fetchURLContent
}