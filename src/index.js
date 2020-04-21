const puppeteer = require("puppeteer");
const Media = require("./models/media");

(async () => {
  data = await Media.find();
  oldurls = data.map((model) => model.toObject().url);
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
            $(e)
              .find("td:eq(0)")
              .text()
              .replace("c.", "")
              .replace("undefined", "")
              .replace(",", "")
              .trim()
              .split("[")[0]
        )
        .toArray()
    );
    title = await page.evaluate(() =>
      $(".sortable.jquery-tablesorter tbody tr")
        .map((i, e) => $(e).find("td:eq(2) a").attr("title"))
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
    objs = [];
    for (i in title) {
      if ([null, ""].includes(timeline[i])) {
        timeline[i] = timeline[i - 1];
      } else {
        value = Number(timeline[i].split(" ")[0].split("–")[0]);
        multiply = timeline[i].includes("BBY") ? -1 : 1;
        if (value == 0) {
          value = 0.1;
        }
        timeline[i] = multiply * value;
      }
      if (title[i].replace("_", " ").includes("A New Hope")) {
        timeline[i] = 0;
      }
      if (
        [
          "novel",
          "gamebook",
          "young",
          "adventure",
          "junior",
          "short",
          "short story",
        ].includes(type[i])
      ) {
        type[i] = "book";
      }
      if (!oldurls.includes(title[i])) {
        objs.push({
          media: type[i],
          releasedate: releasedate[i],
          timeline: Number(timeline[i]),
          title: title[i],
        });
      } else {
        console.log(`...${title[i]} already included`);
      }
    }
    for (i in objs) {
      const { title } = objs[i];
      console.log(
        `<==-.=.=.=.=.=.=.=.=.-==>${
          Number(i) + Number(oldurls.length) * 1
        }<==-.=.=.=.=.=.=.=.=.-==>`
      );
      if (!title.includes("page does not exist")) {
        await page.goto(baseUrl + title);
        image = await page.evaluate(() => $(".pi-theme-Media img").attr("src"));
        if (["", null].includes(image)) {
          image =
            "https://vignette.wikia.nocookie.net/starwars/images/4/42/StarWarsOpeningLogo.svg/revision/latest?cb=20120211213511";
        }
        url = title;
        await Media.create({
          ...objs[i],
          title: await page.evaluate(
            () =>
              $(".page-header__title")
                .text()
                .replace("Star Wars:", "")
                .split("(")[0]
          ),
          series: await page.evaluate(
            () =>
              $('.pi-theme-Media .pi-item[data-source="series"] .pi-data-value')
                .text()
                .replace("Star Wars:", "")
                .split("[")[0]
          ),
          universe: universes[x].toLowerCase(),
          image,
          url,
        });
        console.log(`...${title} appending`);
      } else {
        console.log(`...${title}`);
      }
    }
  }

  await browser.close();
})();
