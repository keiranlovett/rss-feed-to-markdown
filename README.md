# RSS Feed to Markdown

This GitHub Action converts RSS feed entries to Markdown files. It fetches RSS feeds, extracts relevant information from each entry, and generates Markdown files using a provided template.

## Input Variables

- `feed_url` (optional): The URL of a single RSS feed or a JSON array of feed URLs as a string.
- `feed_urls_file` (optional): Path to a JSON file containing an array of feed URLs.
- `template_file` (required): The path to the template file.
- `output_dir` (required): The directory where the generated Markdown files will be saved.

Note: You must provide either `feed_url` or `feed_urls_file`, but not both.

## Example Usage

### Usage Examples

#### Single Feed URL

```yaml
name: RSS Feed to Markdown

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  convert_feeds:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Run RSS Feed to Markdown Action
        uses: keiranlovett/rss-feed-to-markdown@main
        with:
          feed_url: 'https://www.example.com/rss-feed.xml'
          template_file: 'assets/template.md'
          output_dir: '_posts/events/'
```

#### Multiple Feed URLs (as JSON array in feed_url)

```yaml
name: Multiple RSS Feeds to Markdown

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  convert_feeds:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Run RSS Feed to Markdown Action
        uses: keiranlovett/rss-feed-to-markdown@main
        with:
          feed_url: '["https://www.example1.com/rss-feed.xml", "https://www.example2.com/rss-feed.xml", "https://www.example3.com/rss-feed.xml"]'
          template_file: 'assets/template.md'
          output_dir: '_posts/events/'
```

#### Multiple Feed URLs (using feed_urls_file)

```yaml
name: Multiple RSS Feeds to Markdown

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  convert_feeds:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Run RSS Feed to Markdown Action
        uses: keiranlovett/rss-feed-to-markdown@main
        with:
          feed_urls_file: 'feed_urls.json'
          template_file: 'assets/template.md'
          output_dir: '_posts/events/'
```

For the `feed_urls_file` example, create a JSON file named `feed_urls.json` in your repository with the following structure:

```json
[
  "https://www.example1.com/rss-feed.xml",
  "https://www.example2.com/rss-feed.xml",
  "https://www.example3.com/rss-feed.xml"
]
```

## Template File

1. Create a new Markdown file named `template.md`.
2. Customize the template to fit your desired output format. You can use Markdown syntax and add placeholders for dynamic content.
3. Use the following placeholders in your template:

- `[ID]`: Unique identifier for the entry
- `[DATE]`: Publication date
- `[LINK]`: URL of the entry
- `[TITLE]`: Title of the entry
- `[DESCRIPTION]`: Short description or summary
- `[CONTENT]`: Full content of the entry
- `[MARKDOWN]`: Content converted to Markdown
- `[AUTHOR]`: Author of the entry
- `[VIDEO]`: URL of associated video (if available)
- `[IMAGE]`: URL of the main image
- `[IMAGES]`: Comma-separated list of image URLs
- `[CATEGORIES]`: Comma-separated list of categories
- `[VIEWS]`: Number of views (if available)
- `[RATING]`: Rating of the entry (if available)

Example template:

```markdown
---
id: [ID]
link: [LINK]
title: [TITLE]
date: [DATE]
author: [AUTHOR]
keywords: [CATEGORIES]
image: [IMAGE]
images: [IMAGES]
description: >
  [DESCRIPTION]
---
# [TITLE]
##### By [AUTHOR]
_Published on [DATE]_

[MARKDOWN]

---
Categories: [CATEGORIES]
```

## Compile Project

To package the project, use [vercel/ncc](https://github.com/vercel/ncc) to compile all source code and dependencies into a single file:

```bash
npm i -g @vercel/ncc
ncc build index.js -o dist
```

## Contribution

Contributions are welcome! Feel free to submit issues or pull requests to improve the action.

If you have any questions or need further assistance, please open an issue in the repository.
