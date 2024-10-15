const core = require('@actions/core');
const github = require('@actions/github');
const { fetchAndParseFeed, generateRssMarkdown, generateAtomMarkdown, saveMarkdown } = require('./process');
const fs = require('fs');

async function run() {
  try {

    //node index.js feed_url= template_file= output_dir=test
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
    
    // Fetch and parse the RSS feed
    const feedData = await fetchAndParseFeed(feedUrl);

    const isAtomFeed = !!feedData?.feed?.entry;
    const entries = isAtomFeed ? feedData.feed.entry : feedData?.rss?.channel?.[0]?.item || [];

    // Process the feed entries and generate Markdown files
    entries.forEach((entry) => {
      const { output, date, title } = isAtomFeed
        ? generateAtomMarkdown(template, entry)
        : generateRssMarkdown(template, entry);
      const filePath = saveMarkdown(outputDir, date, title, output);

      console.log(`Markdown file '${filePath}' created.`);
    });
  } 
  catch (error) {
    core.setFailed(error.message);
  }
}

run();
