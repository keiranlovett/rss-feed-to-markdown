const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const sanitize = require('sanitize-filename');

async function run() {
  try {
    const feedUrl = core.getInput('feed_url');
    const templateFile = core.getInput('template_file');
    const outputDir = core.getInput('output_dir');

    // Validate input values
    if (!fs.existsSync(templateFile)) {
      core.setFailed(`Template file '${templateFile}' does not exist.`);
      return;
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Output directory '${outputDir}' created.`);
    }

    // Read the template file
    const template = fs.readFileSync(templateFile, 'utf8');

    // Fetch the RSS feed
    const response = await axios.get(feedUrl);
    const feedXml = response.data;

    // Parse the XML feed
    const feedData = await parseStringPromise(feedXml);
    const entries = feedData?.feed?.entry || feedData?.rss?.channel?.[0]?.item || [];

    // Process the feed entries and generate Markdown files
    entries.forEach((entry) => {
      const id = entry['yt:videoId']?.[0] || entry['id']?.[0] || entry.guid?.[0]?.['_'] || entry.guid?.[0] || '';
      const date = entry.published?.[0] || entry.pubDate?.[0] || entry.updated?.[0] || '';
      const link = entry.link?.[0]?.$?.href || entry.link?.[0] || '';
      const title = entry.title?.[0]?.replace(/[^\w\s-]/g, '') || '';
      const description = entry.description?.[0] || entry['media:group']?.[0]?.['media:description']?.[0] || entry.content?.[0]?.['_'] || '';
      const author = entry.author?.[0]?.name?.[0] || entry['dc:creator']?.[0] || '';
      const video = entry['media:group']?.[0]?.['media:content']?.[0]?.$?.url || '';
      const thumbnail = entry['media:group']?.[0]?.['media:thumbnail']?.[0]?.$.url || '';
      const categories = entry.category || [];
      const views = entry['media:group']?.[0]?.['media:community']?.[0]?.['media:statistics']?.[0]?.$.views || '';
      const rating = entry['media:group']?.[0]?.['media:community']?.[0]?.['media:starRating']?.[0]?.$.average || '';

      const markdown = template
        .replaceAll('[ID]', id)  
        .replaceAll('[DATE]', date)
        .replaceAll('[LINK]', link)
        .replaceAll('[TITLE]', title)
        .replaceAll('[DESCRIPTION]', description)
        .replaceAll('[AUTHOR]', author)
        .replaceAll('[VIDEO]', video)
        .replaceAll('[THUMBNAIL]', thumbnail)
        .replaceAll('[CATEGORIES]', categories.join(', '))
        .replaceAll('[VIEWS]', views)
        .replaceAll('[RATING]', rating);

      const formattedDate = date ? new Date(date).toISOString().split('T')[0] : '';
      
      const slug = sanitize(`${formattedDate}-${title.toLowerCase().replace(/\s+/g, '-')}`).substring(0, 50);
      const fileName = `${slug}.md`;
      const filePath = path.join(outputDir, fileName);

      fs.writeFileSync(filePath, markdown);

      console.log(`Markdown file '${filePath}' created.`);
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
