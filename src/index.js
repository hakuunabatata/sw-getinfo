const puppeteer = require("puppeteer");
const Media = require("./models/media");

(async () => {
  data = await Media.find()
  oldurls = data.map(model => model.toObject().url)
  baseUrl = "https://starwars.fandom.com/wiki/";
  universes = ["canon", "Legends"];
  browser = await puppeteer.launch({ headless: false });
  page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);
  for (x in universes) {
    await page.goto(baseUrl + `Timeline_of_${universes[x]}_media`);
    await page.addScriptTag({
      url: "https://code.jquery.com/jquery-3.2.1.min.js",
    });
    await page.evaluate(() => {});
    timeline = await page.evaluate(() =>
      $(".sortable.jquery-tablesorter tbody tr")
        .map(
          (i, e) =>
            (
              $(e).find("td:eq(0)").attr("data-sort-value") +
              " " +
              $(e).find("td:eq(0)").text()
            )
              .replace("c.", "")
              .replace("undefined", "")
              .split(" ")[0]
        )
        .toArray()
    );
    title = await page.evaluate(() =>
      $(".sortable.jquery-tablesorter tbody tr")
        .map((i, e) => $(e).find("td:eq(2) a").attr("title"))
        .toArray()
    );
    creator = await page.evaluate(() =>
      $(".sortable.jquery-tablesorter tbody tr")
        .map((i, e) => $(e).find("td:eq(3) a").text())
        .toArray()
    );
    releasedate = await page.evaluate(() =>
      $(".sortable.jquery-tablesorter tbody tr")
        .map((i, e) => $(e).find("td:eq(4)").text().trim())
        .toArray()
    );
    type = await page.evaluate(() =>
      $(".sortable.jquery-tablesorter tbody tr")
        .map((i, e) => $(e).attr("class").replace("unpublished ", ""))
        .toArray()
    );
    objs = []
    for (i in title) {
      if (timeline[i] == "") {
        timeline[i] = timeline[i - 1];
      }
      if (!oldurls.includes(title[i])) {
              objs.push({
                title: title[i],
                media: type[i],
                releasedate: releasedate[i],
                creator: creator[i],
                timeline: timeline[i]
              })
      }else{
        console.log(`...${title[i]} already included`)
      }
    }
    for (i in objs) {
      const { title, type, releasedate, creator, timeline} = objs[i]
      if (!title.includes("page does not exist")) {
        console.log(`...${title} appending`);
        await page.goto(baseUrl + title);
        url = baseUrl + title
        try{
        await Media.create( {
          ...objs[i],
          title: await page.evaluate(() =>
            $(".pi-theme-Media .pi-title").text()
          ),
          series: await page.evaluate(() =>
            $('.pi-theme-Media .pi-item[data-source="series"] a').text()
          ),
          universe: universes[x].toLowerCase(),
          image: await page.evaluate(() =>
            $(".pi-theme-Media img").attr("src")
          ),
          url
        })}catch(err){
          
        }
      } else {
        console.log(`...${title}`);
      }
    }
  }

  await browser.close();
})();
