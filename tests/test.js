const { generateRssMarkdown, saveMarkdown } = require("../process");
const fs = require("fs");
const path = require("path");
const { parseStringPromise } = require("xml2js");

// Mocking writeFileSync while keeping readFileSync operational
jest.mock("fs", () => {
  const actualFs = jest.requireActual("fs");
  return {
    ...actualFs,
    writeFileSync: jest.fn(),
  };
});

// Helper function to load files
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

const normalizeWhitespace = (str) => str.replace(/\s+/g, " ").trim();

test("Load and process XML and template", async () => {
  const examplePath = "examples/youtube";
  const xmlPath = `${examplePath}/feed.xml`;
  const templatePath = `${examplePath}/template.md`;

  const xmlFilePath = path.join(__dirname, xmlPath);
  const templateFilePath = path.join(__dirname, templatePath);

  const xmlContent = loadFile(xmlFilePath);
  const templateContent = loadFile(templateFilePath);

  if (!xmlContent || !templateContent) {
    throw new Error("Failed to load XML or template file");
  }

  const feedData = await parseStringPromise(xmlContent);
  console.log("feedData", feedData.feed.entry[0]);

  const entry = feedData.feed.entry[0];
  const { output, date, title } = generateRssMarkdown(templateContent, entry);

  console.log("Generated markdown:", output);
  expect(output).toBeDefined();
});

test("generateMarkdown should replace placeholders correctly", async () => {
  const examplePath = "examples/youtube";
  const xmlPath = `${examplePath}/feed.xml`;
  const templatePath = `${examplePath}/template.md`;

  // Load XML file
  const xmlFilePath = path.join(__dirname, xmlPath);
  const xmlContent = loadFile(xmlFilePath);

  // Load template file
  const templateFilePath = path.join(__dirname, templatePath);
  const templateContent = loadFile(templateFilePath);

  if (!xmlContent || !templateContent) {
    throw new Error("Failed to load XML or template file");
  }

  const feedData = await parseStringPromise(xmlContent);
  const entry = feedData.feed.entry[0];
  const { output, date, title } = generateRssMarkdown(templateContent, entry);

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

  console.log("Expected markdown:", normalizeWhitespace(expectedMarkdown));
  console.log("Generated markdown:", normalizeWhitespace(output));

  // Perform  assertions
  expect(normalizeWhitespace(output)).toBe(
    normalizeWhitespace(expectedMarkdown),
  );
  expect(date).toBe("2024-05-10T09:21:26+00:00");
  expect(title).toBe("My Title");
});

test("saveMarkdown should save file correctly", () => {
  const outputDir = "output";
  const date = "2024-05-10T09:21:26+00:00";
  const title = "My Title";
  const markdown = "Test Content";

  fs.writeFileSync.mockImplementation(() => {});

  const filePath = saveMarkdown(outputDir, date, title, markdown);

  const expectedFileName = path.join(outputDir, "2024-05-10-my-title.md");
  expect(fs.writeFileSync).toHaveBeenCalledWith(expectedFileName, markdown);
  expect(filePath).toBe(expectedFileName);
});
