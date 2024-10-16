const core = require("@actions/core");
const github = require("@actions/github");
const {
  parseFeedUrls,
  fetchAndParseFeed,
  generateRssMarkdown,
  generateAtomMarkdown,
  saveMarkdown,
} = require("./process");
const fs = require("fs");

async function run() {
  try {
    const feedUrl = core.getInput("feed_url");
    const feedUrlsFile = core.getInput("feed_urls_file");
    const templateFile = core.getInput("template_file");
    const outputDir = core.getInput("output_dir");

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
    const template = fs.readFileSync(templateFile, "utf8");

    const feedUrls = parseFeedUrls(feedUrl, feedUrlsFile);

    if (feedUrls.length === 0) {
      core.setFailed("No valid feed URLs provided.");
      return;
    }

    if (feedUrls.length === 0) {
      core.setFailed("No valid feed URLs provided.");
      return;
    }

    await processFeeds(feedUrls, template, outputDir);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
