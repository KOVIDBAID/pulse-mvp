import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage();
 const base=process.env.PULSE_QA_URL || 'http://127.0.0.1:5173';
 await page.goto(base);await page.waitForTimeout(400);
 await page.evaluate(()=>sessionStorage.setItem('pulse-session-v1',JSON.stringify({role:'patient',userId:'PUL-KNP-0001',patientId:'PUL-KNP-0001'})));
 await page.reload();await page.goto(`${base}/#/patient/home`);
 await page.locator('.m-top b').filter({hasText:/^Today$/}).waitFor();
 await page.getByRole('button',{name:'Log',exact:true}).click();
 await page.locator('.m-top b').filter({hasText:/^Log an update$/}).waitFor();
 await page.goto(`${base}/#/dev/tests`);
 await page.getByText(/\d+\/\d+ passed/).waitFor();
 if(await page.locator('.test-row.fail').count()) throw new Error('In-app rule tests failed');
 console.log('PASS clicks: patient navigation and in-app rules');
} catch(e){console.log(`FAIL clicks: ${e.message}`);process.exitCode=1;}finally{await browser.close();}
