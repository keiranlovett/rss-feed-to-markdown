const core = require("@actions/core");
const github = require("@actions/github");
const {
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

    let feedUrls = [];
    if (feedUrl) {
      try {
        const parsedFeedUrl = JSON.parse(feedUrl);
        if (Array.isArray(parsedFeedUrl)) {
          feedUrls = parsedFeedUrl;
        } else {
          feedUrls.push(feedUrl);
        }
      } catch (error) {
        feedUrls.push(feedUrl);
      }
    } else if (feedUrlsFile) {
      if (!fs.existsSync(feedUrlsFile)) {
        core.setFailed(`Feed URLs file '${feedUrlsFile}' does not exist.`);
        return;
      }
      const feedUrlsContent = fs.readFileSync(feedUrlsFile, "utf8");
      try {
        feedUrls = JSON.parse(feedUrlsContent);
      } catch (error) {
        // If JSON parsing fails, treat it as a plain text file
        feedUrls = feedUrlsContent
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'));
      }
    } else {
      core.setFailed("Either feed_url or feed_urls_file must be provided.");
      return;
    }

    if (feedUrls.length === 0) {
      core.setFailed("No valid feed URLs provided.");
      return;
    }

    for (const url of feedUrls) {
      // Fetch and parse the RSS feed
      const feedData = await fetchAndParseFeed(url);

      const isAtomFeed = !!feedData?.feed?.entry;
      const entries = isAtomFeed
        ? feedData.feed.entry
        : feedData?.rss?.channel?.[0]?.item || [];

      // Process the feed entries and generate Markdown files
      entries.forEach((entry) => {
        const { output, date, title } = isAtomFeed
          ? generateAtomMarkdown(template, entry)
          : generateRssMarkdown(template, entry);
        const filePath = saveMarkdown(outputDir, date, title, output);

        console.log(`Markdown file '${filePath}' created.`);
      });
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
