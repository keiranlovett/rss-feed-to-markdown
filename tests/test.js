const {
  generateRssMarkdown,
  generateAtomMarkdown,
  saveMarkdown,
} = require("../process");
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

test("generateRssMarkdown should replace placeholders correctly", async () => {
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

test("generateAtomMarkdown should replace placeholders correctly", async () => {
  const examplePath = "examples/atom";
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
  const { output, date, title } = generateAtomMarkdown(templateContent, entry);

  const expectedMarkdown = `# Atom Entry Title
**Link:** https://example.com/atom-entry
**Description:** This is an Atom feed entry description.
**Author:** John Doe
**Published Date:** 2024-05-15T10:00:00Z
**Video:**
**Thumbnail:** ![Thumbnail]()
**Categories:** category1,category2
**Views:**
**Rating:** `;

  console.log("Expected Atom markdown:", normalizeWhitespace(expectedMarkdown));
  console.log("Generated Atom markdown:", normalizeWhitespace(output));

  // Perform assertions
  expect(normalizeWhitespace(output)).toBe(
    normalizeWhitespace(expectedMarkdown),
  );
  expect(date).toBe("2024-05-15T10:00:00Z");
  expect(title).toBe("Atom Entry Title");
});

test("generateAtomMarkdown should handle Sean Voisen's feed correctly", async () => {
  const examplePath = "examples/sean_voisen";
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
  console.log("feedData", JSON.stringify(feedData));
  const entry = feedData.feed.entry[0];
  const { output, date, title } = generateAtomMarkdown(templateContent, entry);

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

  console.log(
    "Expected Sean Voisen Atom markdown:",
    normalizeWhitespace(expectedMarkdown),
  );
  console.log(
    "Generated Sean Voisen Atom markdown:",
    normalizeWhitespace(output),
  );

  // Perform assertions
  expect(normalizeWhitespace(output)).toBe(
    normalizeWhitespace(expectedMarkdown),
  );
  expect(date).toBe("2023-05-21T00:00:00+00:00");
  expect(title).toBe("The Perils of Prediction");

  // Additional assertion to check specific parts
  const outputParts = output.split("**");
  expect(outputParts[4].trim()).toBe(
    "Thoughts on prediction and decision-making in the context of AI.",
  );
});

test("generateRssMarkdown should replace placeholders correctly", async () => {
  const examplePath = "examples/rss";
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
  const entry = feedData.rss.channel[0].item[0];
  const { output, date, title } = generateRssMarkdown(templateContent, entry);

  const expectedMarkdown = `# Example entry
**Link:** http://www.example.com/blog/post/1
**Description:** Here is some text containing an interesting description.
**Author:** John Doe
**Published Date:** Sun, 06 Sep 2009 16:20:00 +0000
**Video:**
**Thumbnail:** ![Thumbnail]()
**Categories:** Technology
**Views:**
**Rating:** `;

  console.log("Expected RSS markdown:", normalizeWhitespace(expectedMarkdown));
  console.log("Generated RSS markdown:", normalizeWhitespace(output));

  // Perform assertions
  expect(normalizeWhitespace(output)).toBe(
    normalizeWhitespace(expectedMarkdown),
  );
  expect(date).toBe("Sun, 06 Sep 2009 16:20:00 +0000");
  expect(title).toBe("Example entry");
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
