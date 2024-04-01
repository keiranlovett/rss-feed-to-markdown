const core = require('@actions/core');
const axios = require('axios');

const apiUrl = core.getInput('OPENAI_apiUrl') || 'https://api.openai.com/v1/chat/completions';
const apiKey = core.getInput('OPENAI_apiKey') || '';
const model = core.getInput('OPENAI_model') || 'gpt-3.5-turbo';

//const apiUrl = trim(process.env.apiUrl || 'https://api.openai.com/v1/chat/completions');
//const apiKey = trim(process.env.apiKey || ''); // @Please add here your openai key.

async function fetchChatCompletion(chatMessageContent) {
    try {
        const response = await axios.post(
            apiUrl,
            {
                timeout: 60000,
                messages: [
                    { role: 'system', content: chatMessageContent },
                ],
                model: model, // Specify the model to use
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
            }
        );

        console.log('Chat completion response:', response.data.choices);
        return response.data.choices;
    } catch (error) {
        console.error('Error:', error.response.data);
    }
}


module.exports = {
    fetchChatCompletion
}