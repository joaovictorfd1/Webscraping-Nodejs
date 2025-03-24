const fs = require("fs");
const puppeteer = require("puppeteer");

(async () => {
  const url = "https://mercado.carrefour.com.br/c/bebidas";
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle2" });
  await page.waitForSelector(".swiper-slide", { timeout: 10000 });

  const products = new Set();

  for (let i = 0; i < 3; i++) {
    const newProducts = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".swiper-slide")).map(product => ({
        title: product.querySelector("span[title]")?.title || "N/A",
        price: product.querySelector("[data-test-id='price']")?.dataset.value || "N/A",
        image: product.querySelector("img")?.src || "N/A",
        link: product.querySelector("a")?.href || "N/A"
      }))
    );

    newProducts.forEach(prod => products.add(JSON.stringify(prod)));

    const nextButton = await page.$('svg[data-arrow-side="right"]');
    if (nextButton) {
      await nextButton.click();
      await new Promise(resolve => setTimeout(resolve, 300));
    } else {
      console.log("Botão 'próximo' não encontrado.");
      break;
    }
  }

  await browser.close();

  const uniqueProducts = Array.from(products).map(prod => JSON.parse(prod));

  if (uniqueProducts.length) {
    uniqueProducts.sort((a, b) => a.title.localeCompare(b.title));
    fs.writeFileSync("output.json", JSON.stringify(uniqueProducts, null, 2));
    console.log("Dados salvos em output.json");
  } else {
    console.log("Nenhum produto encontrado.");
  }
})();
