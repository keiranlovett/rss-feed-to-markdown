const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const sanitize = require('sanitize-filename');
const TurndownService = require('turndown');

// Fetch the RSS feed
async function fetchAndParseFeed(feedUrl) {
  const response = await axios.get(feedUrl);
  const feedXml = response.data;
  return parseStringPromise(feedXml);
}

// Process the feed entries and generate Markdown files
const generateMarkdown = (template, entry) => {
  const id = entry['yt:videoId']?.[0] || entry['id']?.[0] || entry.guid?.[0]?.['_'] || entry.guid?.[0] || '';
  const date = entry.published?.[0] || entry.pubDate?.[0] || entry.updated?.[0] || '';
  const link = entry.link?.[0]?.$?.href || entry.link?.[0] || '';
  const title = entry.title?.[0]?.replace(/[^\w\s-]/g, '') || '';
  const content = entry.description?.[0] || entry['media:group']?.[0]?.['media:description']?.[0] || entry.content?.[0]?.['_'] || '';
  const markdown = new TurndownService({codeBlockStyle: 'fenced', fenced: '```', bulletListMarker: '-'}).turndown(content);
  const description = entry.summary?.[0] || content.replace(/(<([^>]+)>)/gi, "").split(" ").splice(0, 50).join(" ") || '';
  const author = entry.author?.[0]?.name?.[0] || entry['author']?.[0]?.name?.[0] || entry['dc:creator']?.[0] || 'Unknown Author';
  const video = entry['media:group']?.[0]?.['media:content']?.[0]?.$?.url || '';
  const image = entry['media:group']?.[0]?.['media:thumbnail']?.[0]?.$.url || '';
  const image_types = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
  const images = (entry['enclosure'] || entry['media:content'])?.filter(e => image_types.includes(e.$['type']))?.map(e => e.$.url) || [];
  const categories = entry.category || [];
  const views = entry['media:group']?.[0]?.['media:community']?.[0]?.['media:statistics']?.[0]?.$.views || '';
  const rating = entry['media:group']?.[0]?.['media:community']?.[0]?.['media:starRating']?.[0]?.$.average || '';

  const output = template
    .replaceAll('[ID]', id)
    .replaceAll('[DATE]', date)
    .replaceAll('[LINK]', link)
    .replaceAll('[TITLE]', title.replace(/\s+/g, ' ').trim())
    .replaceAll('[DESCRIPTION]', description.replace(/\s+/g, ' ').trim())
    .replaceAll('[CONTENT]', content)
    .replaceAll('[MARKDOWN]', markdown)
    .replaceAll('[AUTHOR]', author)
    .replaceAll('[VIDEO]', video)
    .replaceAll('[IMAGE]', image)
    .replaceAll('[IMAGES]', images.join(','))
    .replaceAll('[CATEGORIES]', categories.join(','))
    .replaceAll('[VIEWS]', views)
    .replaceAll('[RATING]', rating);

  return { output, date, title };
}

function saveMarkdown(outputDir, date, title, markdown) {
  const formattedDate = date ? new Date(date).toISOString().split('T')[0] : '';
  const slug = sanitize(`${formattedDate}-${title.toLowerCase().replace(/\s+/g, '-')}`).substring(0, 50);
  const fileName = `${slug}.md`;
  const filePath = path.join(outputDir, fileName);

  fs.writeFileSync(filePath, markdown);

  return filePath;
}

module.exports = { fetchAndParseFeed, generateMarkdown, saveMarkdown };
