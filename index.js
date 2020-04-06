const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  media = []
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
    for (i in title) {
      if (!title[i].includes("page does not exist")) {
        await page.goto(baseUrl + title[i]);
        if (timeline[i] == "") {
          timeline[i] = timeline[i - 1];
        }
        media.push({
          id: i,
          title: await page.evaluate(() =>
            $(".pi-theme-Media .pi-title").text()
          ),
          type: type[i],
          universe: universes[x].toLowerCase(),
          creator: creator[i],
          timeline: Number(timeline[i]),
          releasedate: releasedate[i],
          image: await page.evaluate(() =>
            $(".pi-theme-Media img").attr("src")
          ),
        });
        // console.log(`
        //   ===================${i}====================
        //   Title: ${media[i].title},
        //   Type: ${type[i]},
        //   Universe: ${universes[x]},
        //   Creator: ${creator[i]},
        //   Timeline: ${timeline[i]},
        //   Release Date: ${releasedate[i]}
        //   Image: ${media[i].image}
        //   `);
        fs.writeFile(
          __dirname + "/media.json",
          JSON.stringify(media),
          "utf-8",
          (err, data) => {
            if (err) throw err;
            ("ERROR");
          }
        );
      } else {
        console.log(`${title[i]}`);
      }
    }
  }

  await browser.close();
})();
