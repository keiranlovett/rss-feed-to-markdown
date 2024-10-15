const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const sanitize = require('sanitize-filename');
const TurndownService = require('turndown');
const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];

// Fetch the RSS feed
async function fetchAndParseFeed(feedUrl) {
  const response = await axios.get(feedUrl);
  const feedXml = response.data;
  return parseStringPromise(feedXml);
}

// Process RSS feed entries and generate Markdown files
const generateRssMarkdown = (template, entry) => {
  const id = entry['yt:videoId']?.[0] || entry['id']?.[0] || entry.guid?.[0]?.['_'] || entry.guid?.[0] || '';
  const date = entry.published?.[0] || entry.pubDate?.[0] || '';
  const link = entry.link?.[0]?.$ ? entry.link[0].$.href : entry.link?.[0] || '';
  const title = entry.title?.[0]?.replace(/[^\w\s-]/g, '') || '';
  const content = entry.description?.[0] || entry['media:group']?.[0]?.['media:description']?.[0] || '';
  const markdown = new TurndownService({codeBlockStyle: 'fenced', fenced: '```', bulletListMarker: '-'}).turndown(content);
  const description = content.replace(/(<([^>]+)>)/gi, "").split(" ").splice(0, 50).join(" ") || '';
  const author = entry.author?.[0]?.name?.[0] || entry['dc:creator']?.[0] || entry.author?.[0] || 'Unknown Author';
  const video = entry['media:group']?.[0]?.['media:content']?.[0]?.$?.url || '';
  const image = entry['media:group']?.[0]?.['media:thumbnail']?.[0]?.$.url || entry['media:thumbnail']?.[0]?.$.url || '';
  const images = (entry['enclosure'] || entry['media:content'])?.filter(e => imageTypes.includes(e.$['type']))?.map(e => e.$.url) || [];
  const categories = entry.category || [];
  const views = entry['media:group']?.[0]?.['media:community']?.[0]?.['media:statistics']?.[0]?.$.views || '';
  const rating = entry['media:group']?.[0]?.['media:community']?.[0]?.['media:starRating']?.[0]?.$.average || '';

  return generateOutput(template, { id, date, link, title, content, markdown, description, author, video, image, images, categories, views, rating });
}

// Process Atom feed entries and generate Markdown files
const generateAtomMarkdown = (template, entry) => {
  const id = entry.id?.[0] || '';
  const date = entry.published?.[0] || entry.updated?.[0] || '';
  const link = entry.link?.[0]?.$?.href || '';
  const title = typeof entry.title?.[0] === 'string' ? entry.title[0] : (entry.title?.[0]?._ || '');
  const safeTitle = title.replace(/[^\w\s-]/g, '') || '';
  const content = entry.content?.[0]?._ || '';
  const markdown = new TurndownService({codeBlockStyle: 'fenced', fenced: '```', bulletListMarker: '-'}).turndown(content);
  const description = entry.summary?.[0]?._ || (content ? content.replace(/(<([^>]+)>)/gi, "").split(" ").splice(0, 50).join(" ") : '') || '';
  const author = entry.author?.[0]?.name?.[0] || '';
  const video = '';
  const image = '';
  const images = [];
  const categories = entry.category?.map(cat => typeof cat === 'string' ? cat : cat.$.term) || [];
  const views = '';
  const rating = '';

  return generateOutput(template, { 
    id, 
    date, 
    link, 
    title: safeTitle, 
    content, 
    markdown, 
    description, 
    author, 
    video, 
    image, 
    images, 
    categories, 
    views, 
    rating 
  });
}

// Helper function to generate the output
const generateOutput = (template, data) => {
  const output = template
    .replaceAll('[ID]', data.id || '')
    .replaceAll('[DATE]', data.date || '')
    .replaceAll('[LINK]', data.link || '')
    .replaceAll('[TITLE]', (data.title || '').replace(/\s+/g, ' ').trim())
    .replaceAll('[DESCRIPTION]', typeof data.description === 'string' ? data.description.replace(/\s+/g, ' ').trim() : '')
    .replaceAll('[CONTENT]', data.content || '')
    .replaceAll('[MARKDOWN]', data.markdown || '')
    .replaceAll('[AUTHOR]', data.author || '')
    .replaceAll('[VIDEO]', data.video || '')
    .replaceAll('[IMAGE]', data.image || '')
    .replaceAll('[IMAGES]', (data.images || []).join(','))
    .replaceAll('[CATEGORIES]', (data.categories || []).join(','))
    .replaceAll('[VIEWS]', data.views || '')
    .replaceAll('[RATING]', data.rating || '');

  return { output, date: data.date || '', title: data.title || '' };
}

function saveMarkdown(outputDir, date, title, markdown) {
  const formattedDate = date ? new Date(date).toISOString().split('T')[0] : '';
  const slug = sanitize(`${formattedDate}-${title.toLowerCase().replace(/\s+/g, '-')}`).substring(0, 50);
  const fileName = `${slug}.md`;
  const filePath = path.join(outputDir, fileName);

  fs.writeFileSync(filePath, markdown);

  return filePath;
}

module.exports = { fetchAndParseFeed, generateRssMarkdown, generateAtomMarkdown, saveMarkdown };
