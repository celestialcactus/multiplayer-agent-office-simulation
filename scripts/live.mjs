import {checkBedrock} from './bedrock-check.mjs';
try{
  await checkBedrock();
  process.env.OFFICE_MODE='bedrock';
  process.env.PORT=process.env.PORT||'5189';
  console.log('Starting live Bedrock office. Joining a workday enables billable model calls.');
  await import('../server/local.mjs');
}catch(e){console.error(e.message);process.exitCode=1}
