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
    const entries = feedData?.feed?.entry || [];

    // Process the feed entries and generate Markdown files
    entries.forEach((entry) => {
      const title = entry.title?.[0]?.replace(/[^\w\s-]/g, '') || '';
      const description = entry['media:group']?.[0]?.['media:description']?.[0] || '';
      const id = entry['yt:videoId']?.[0] || '';
      const date = entry.published?.[0] || '';

      const markdown = template
        .replaceAll('[TITLE]', title)
        .replaceAll('[DESCRIPTION]', description)
        .replaceAll('[ID]', id)
        .replaceAll('[DATE]', date);

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
