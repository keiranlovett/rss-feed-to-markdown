const { 
  parseFeedUrls, 
  generateFeedMarkdown,
  fetchAndParseFeed,
  processFeeds, 
  saveMarkdown
} = require('../process');
const fs = require('fs');
const path = require('path');
const { parseStringPromise } = require('xml2js');

// Mocking writeFileSync while keeping readFileSync operational
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    writeFileSync: jest.fn(),
  };
});



// Helper function to load test files
const loadFile = (filePath) => {
  try {
    console.log(`Loading file from path: ${filePath}`);
    // Check if file exists
    if (fs.existsSync(filePath)) {
      // Read file synchronously
      const fileContent = fs.readFileSync(filePath, "utf-8");
      console.log(`Loaded file content: ${fileContent}`);
      return fileContent;
    } else {
      console.log("File not found");
      return null;
    }
  } catch (error) {
    console.error(`Error loading file: ${error.message}`);
    return null;
  }
};

// Helper function for whitespace normalization in assertions
const normalizeWhitespace = (str) => str.replace(/\s+/g, ' ').trim();

describe('parseFeedUrls', () => {

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('should parse a single feed URL from JSON string', () => {
    const feedUrl = JSON.stringify(['http://example.com/feed']);
    const result = parseFeedUrls(feedUrl, null);
    expect(result).toEqual(['http://example.com/feed']);
  });

  it('should parse multiple feed URLs from JSON string', () => {
    const feedUrl = JSON.stringify(['http://example.com/feed1', 'http://example.com/feed2']);
    const result = parseFeedUrls(feedUrl, null);
    expect(result).toEqual(['http://example.com/feed1', 'http://example.com/feed2']);
  });

  it('should parse feed URLs from a file', () => {
    const feedUrlsFile = path.join(__dirname, 'feed_urls.txt');
    const result = parseFeedUrls(null, feedUrlsFile);
    expect(result).toEqual(['https://example1.com/feed.xml', 'https://example2.com/feed.xml']);
  });

  /*it('should throw an error if feed URLs file does not exist', () => {
    const feedUrlsFile = path.join(__dirname, 'feed_urls_missing.txt');
    const result = parseFeedUrls(null, feedUrlsFile);
    expect(result).toThrowError(`Feed URLs file '${feedUrlsFile}' does not exist.`);
  });*/
  
  it('should throw an error if neither feed_url nor feed_urls_file is provided', () => {
    expect(() => parseFeedUrls(null, null)).toThrowError('Either feed_url or feed_urls_file must be provided.');
  });
});

describe('Feed Markdown Generation', () => {

  const testMarkdownGeneration = async (xmlPath, templatePath, expectedMarkdown, expectedDate, expectedTitle) => {
    const xmlFilePath = path.join(__dirname, xmlPath);
    const templateFilePath = path.join(__dirname, templatePath);

    const xmlContent = loadFile(xmlFilePath);
    const templateContent = loadFile(templateFilePath);

    if (!xmlContent || !templateContent) throw new Error('Failed to load XML or template file');

    const feedData = await parseStringPromise(xmlContent);
    const entry = feedData.feed?.entry[0] || feedData.rss?.channel[0]?.item[0];
    const { output, date, title } = generateFeedMarkdown(templateContent, entry);

    expect(normalizeWhitespace(output)).toBe(normalizeWhitespace(expectedMarkdown));
    expect(date).toBe(expectedDate);
    expect(title).toBe(expectedTitle);
  };

  test('should handle specific youtube feed entries', async () => {
    const expectedMarkdown = `# My Title
      **Link:** https://www.youtube.com/watch?v=4BxrfhUwldc
      **Description:** My description here
      **Author:** Keiran Lovett
      **Published Date:** 2024-05-10T09:21:26+00:00
      **Video:** https://www.youtube.com/v/4BxrfhUwldc?version=3
      **Thumbnail:** ![Thumbnail](https://i1.ytimg.com/vi/4BxrfhUwldc/hqdefault.jpg)
      **Categories:**
      **Views:** 48
      **Rating:** 5.00`;
    await testMarkdownGeneration('examples/youtube/feed.xml', 'examples/youtube/template.md', expectedMarkdown, '2024-05-10T09:21:26+00:00', 'My Title');
  });

  test('should handle specific Atom feed entries', async () => {
    const expectedMarkdown = `# Atom Entry Title
      **Link:** https://example.com/atom-entry
      **Description:** This is an Atom feed entry description.
      **Author:** John Doe
      **Published Date:** 2024-05-15T10:00:00Z
      **Video:**
      **Thumbnail:** ![Thumbnail]()
      **Categories:** category1,category2
      **Views:**
      **Rating:**`;
    await testMarkdownGeneration('examples/atom/feed.xml', 'examples/atom/template.md', expectedMarkdown, '2024-05-15T10:00:00Z', 'Atom Entry Title');
  });

  test('should handle specific rss feed entries', async () => {
    const expectedMarkdown = `# Example entry
      **Link:** http://www.example.com/blog/post/1
      **Description:** Here is some text containing an interesting description.
      **Author:** John Doe
      **Published Date:** Sun, 06 Sep 2009 16:20:00 +0000
      **Video:**
      **Thumbnail:** ![Thumbnail]()
      **Categories:** Technology
      **Views:**
      **Rating:**`;
    await testMarkdownGeneration('examples/rss/feed.xml', 'examples/rss/template.md', expectedMarkdown, 'Sun, 06 Sep 2009 16:20:00 +0000', 'Example entry');
  });

  test('should handle sean_voisen test ', async () => {
    const expectedMarkdown = `# The Perils of Prediction
      **Link:** https://sean.voisen.org/blog/2023/05/perils-of-prediction/
      **Description:** Thoughts on prediction and decision-making in the context of AI.
      **Author:** Unknown Author
      **Published Date:** 2023-05-21T00:00:00+00:00
      **Video:** 
      **Thumbnail:** ![Thumbnail]()
      **Categories:** 
      **Views:** 
      **Rating:** `;
    await testMarkdownGeneration('examples/sean_voisen/feed.xml', 'examples/sean_voisen/template.md', expectedMarkdown, '2023-05-21T00:00:00+00:00', 'The Perils of Prediction');
  });

});
describe('File Handling and Parsing', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe('readAndWrite', () => {

    test('saveMarkdown should save file correctly', () => {
      const outputDir = 'output';
      const date = '2024-05-10T09:21:26+00:00';
      const title = 'My Title';
      const markdown = 'Test Content';

      fs.writeFileSync.mockImplementation(() => {});
      const filePath = saveMarkdown(outputDir, date, title, markdown);
      const expectedFileName = path.join(outputDir, '2024-05-10-my-title.md');

      expect(fs.writeFileSync).toHaveBeenCalledWith(expectedFileName, markdown);
      expect(filePath).toBe(expectedFileName);
    });
  });  
});