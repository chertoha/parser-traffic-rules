import fs from "fs/promises";
import path from "path";
import { chromium } from "playwright";

(async () => {
    const browser = await chromium.launch({ headless: false }); // Для видимого браузера
    const page = await browser.newPage();

     await page.goto('https://drivingtest.irish/test/');
  
  let total = [];
  let count = 0; 

  while (true) {

  

    const end = await page.$('.refresh-test');
    if (end){
      break;
    }

    count++;
      
      await page.waitForSelector('.q-container');
    const question = {
      ru: await page.textContent('.q-container h2 span+span'),
      en: await page.textContent('.q-container h3'),
      
      }

      await page.click('li.waves-effect');
      await page.waitForTimeout(200);
    
    const answers = [];
    const liElements = await page.$$('li.waves-effect');
      for (const li of liElements) {
         const letter = await li.$eval('.letter>span', el => el.textContent);
        const value = {
          ru: await li.$eval('.option', el => el.textContent),
          en: await li.$eval('.option-default', el => el.textContent),
        }
        const hasCorrectClass = await li.evaluate(node => node.classList.contains('correct'));

        answers.push({
          id: letter,
          value,
          isCorrect: hasCorrectClass,
        })
    }

    // const img = await page.$eval('img.materialboxed', img => img.getAttribute('src')) || null;
    
    let img = null;
    const imgElement = await page.$('img.materialboxed');
    if (imgElement) {
        const imgUrl = await imgElement.getAttribute('src');
        img = await downloadImage(imgUrl, `${count}`);

    }


    const description = {
      ru: await page.$eval('.explainer .text', el => el.textContent),
      en: await page.$eval('.explainer .text-default', el => el.textContent),
    }

    total.push({
      id: count,
      question,
      answers,
      img,
      description
    });

    console.log(total);

    await page.click('a.next-question');
    await page.waitForTimeout(200);


  }

  
  const dataFilePath = path.resolve("data", "19_05.json");
  await fs.writeFile(dataFilePath,  JSON.stringify(total));
  

    // Закрываем браузер
    // await browser.close();
})();



async function downloadImage(imgUrl, imageName){
  console.log(`https://drivingtest.irish${imgUrl}`);
  const response = await fetch(`https://drivingtest.irish${imgUrl}`);
  const buffer = await response.arrayBuffer();
  const savedImageName = imageName + "." + imgUrl.split(".")[1];
  const imagePath = path.resolve(
    "data",
    "images",
    savedImageName
  );
  await fs.writeFile(imagePath, Buffer.from(buffer));
  return imageName;
}