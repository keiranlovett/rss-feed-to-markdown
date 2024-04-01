const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const sanitize = require('sanitize-filename');
//const chatGPT = require("./chatGPT");
//const urlreader = require("./getURL");

async function run() {
  try {
    const feedUrl = core.getInput('feed_url');
    const templateFile = core.getInput('template_file');
    const outputDir = core.getInput('output_dir');
    const summerize = core.getInput('summerize') || false;
    article = '';

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
    //const entries = feedData?.feed?.item || [];
    //const entries = feedData?.feed?.entry || [];
    const rss = feedData?.rss || [];
    //const channel = feedData?.rss?.channel || [];
    const items = feedData.rss.channel?.[0].item || [];
    console.log(`Feed items found.`, items.length);
    
    // Process the feed entries and generate Markdown files
    items.forEach((item) => {
      const title = "\""+item.title?.[0]?.replace(/[^\w\s-]/g, '') +"\"" || '';
      //const description = entry['media:group']?.[0]?.['media:description']?.[0] || '';
      const description = "\""+(item.description?.[0]?.replace(/["':]/g, '')).replace(/&nbsp;/g, " ")+"...\"" || '';
      const author = item.author?.[0]?.replace(/["':]/g, '') || '';
      //const id = entry['yt:videoId']?.[0] || '';

      
      thumbnail = '';
      try {
         thumbnail = item.enclosure[0].$.url ;
         //console.log(item.enclosure[0].$.url );
      }
      catch(err){
        //const thumbnail = '';
        //console.log(item.enclosure[0].$.url || '');
      }
      
      //console.log(item.enclosure[0].$.url || '');
      //console.log(item.enclosure[0]?.$?.url || '');
      //console.log(item.enclosure ? (item.enclosure[0] ? item.enclosure[0].$.url : '' ) : '');
      //  item.enclosure[0] ? item.enclosure[0].$.url : '';
      
      //const thumbnail = item.enclosure?.[$]?.[url] || '';
      //const thumbnail = item.enclosure?[0]?.$?.url || '';
      //const thumbnail = $(item).find('link[rel|="enclosure"]').attr('href') || '';
      //const thumbnail = item?.find("enclosure").attr('url') || '';
      
      const link = item.link?.[0] || '';
      const datepub = item.pubDate?.[0] || '';
      const date = item.pubDate?.[0] || '';

      //console.log(`Date '${date}'`, Date.parse(date));     
      const formattedDate = date ? new Date(Date.parse(date)).toISOString().split('T')[0] : '';

      //if (summerize == true) {
      //  article = fetchChatCompletion(urlreader.fetchURLContent(link) + " Summerize the above article in Markdown. ");
      //}

      const markdown = template
        .replace('[TITLE]', title)
        .replace('[DESCRIPTION]', description)
        .replace('[AUTHOR]', author)
        //.replace('[ID]', id)
        .replace('[THUMBNAIL]', thumbnail)
        .replace('[LINK]', link)
        .replace('[ENCLOSURE]', thumbnail)
        .replace('[DATE]', formattedDate)
        .replace('[PUBDATE]', formattedDate)
        .replace('[ARTICLE]', article)
           
      
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
