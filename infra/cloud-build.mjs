import {readFile,readdir,writeFile} from 'node:fs/promises';
import {deflateRawSync} from 'node:zlib';
import {spawnSync} from 'node:child_process';
import {PutObjectCommand,DeleteObjectCommand} from '@aws-sdk/client-s3';
import {CreateStackCommand,DeleteStackCommand,DescribeStacksCommand,waitUntilStackCreateComplete,waitUntilStackDeleteComplete} from '@aws-sdk/client-cloudformation';

// Explicit source allowlist: never package sessions, credentials, or the workspace.
async function sourceZip(){
 const paths=['Dockerfile','package.json','package-lock.json'];
 async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){if(e.isDirectory())await walk(dir+'/'+e.name);else if(e.isFile()&&/\.mjs$/.test(e.name))paths.push(dir+'/'+e.name)}}
 await walk('domain');await walk('server');const localParts=[],centralParts=[];let offset=0;
 for(const path of paths){const source=await readFile(path),data=deflateRawSync(source),name=Buffer.from(path);let crc=0xffffffff;for(const b of source){crc^=b;for(let n=0;n<8;n++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}crc=(crc^0xffffffff)>>>0;
  const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(8,8);local.writeUInt32LE(crc,14);local.writeUInt32LE(data.length,18);local.writeUInt32LE(source.length,22);local.writeUInt16LE(name.length,26);
  const central=Buffer.alloc(46);central.writeUInt32LE(0x02014b50);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(8,10);central.writeUInt32LE(crc,16);central.writeUInt32LE(data.length,20);central.writeUInt32LE(source.length,24);central.writeUInt16LE(name.length,28);central.writeUInt32LE(offset,42);
  localParts.push(local,name,data);centralParts.push(central,name);offset+=local.length+name.length+data.length;
 }
 const central=Buffer.concat(centralParts),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(paths.length,8);end.writeUInt16LE(paths.length,10);end.writeUInt32LE(central.length,12);end.writeUInt32LE(offset,16);
 return Buffer.concat([...localParts,central,end]);
}
export async function cloudBuild({cf,s3,boot,tag,account,region,profile}){
 const name='agent-office-build-'+Date.now(),key='builds/'+name+'.zip',registry=boot.Repository.split('/')[0],repo=boot.Repository.slice(registry.length+1),logGroup='/aws/codebuild/'+name;
 function aws(args){const r=spawnSync(process.env.AWS_CLI_PATH||'aws',['--profile',profile,'--region',region,...args,'--output','json','--no-cli-pager'],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||'AWS CLI failed');return r.stdout.trim()?JSON.parse(r.stdout):{}}
 const buildspec={version:'0.2',phases:{pre_build:{commands:[`aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin ${registry}`]},build:{commands:[`docker build --platform linux/arm64 -t ${tag} .`]},post_build:{commands:[`test "$CODEBUILD_BUILD_SUCCEEDING" = "1"`,`docker push ${tag}`]}}};
 const template={AWSTemplateFormatVersion:'2010-09-09',Resources:{Logs:{Type:'AWS::Logs::LogGroup',Properties:{LogGroupName:logGroup,RetentionInDays:7}},Role:{Type:'AWS::IAM::Role',Properties:{AssumeRolePolicyDocument:{Version:'2012-10-17',Statement:[{Effect:'Allow',Principal:{Service:'codebuild.amazonaws.com'},Action:'sts:AssumeRole',Condition:{StringEquals:{'aws:SourceAccount':account},ArnEquals:{'aws:SourceArn':`arn:aws:codebuild:${region}:${account}:project/${name}`}}}]},Policies:[{PolicyName:'BuildOnly',PolicyDocument:{Version:'2012-10-17',Statement:[{Effect:'Allow',Action:['s3:GetObject','s3:GetObjectVersion'],Resource:`arn:aws:s3:::${boot.Bucket}/${key}`},{Effect:'Allow',Action:['s3:GetBucketLocation'],Resource:`arn:aws:s3:::${boot.Bucket}`},{Effect:'Allow',Action:'ecr:GetAuthorizationToken',Resource:'*'},{Effect:'Allow',Action:['ecr:BatchCheckLayerAvailability','ecr:InitiateLayerUpload','ecr:UploadLayerPart','ecr:CompleteLayerUpload','ecr:PutImage'],Resource:`arn:aws:ecr:${region}:${account}:repository/${repo}`},{Effect:'Allow',Action:['logs:CreateLogStream','logs:PutLogEvents'],Resource:`arn:aws:logs:${region}:${account}:log-group:${logGroup}:*`}]}}]}},Project:{Type:'AWS::CodeBuild::Project',DependsOn:'Logs',Properties:{Name:name,ServiceRole:{'Fn::GetAtt':['Role','Arn']},TimeoutInMinutes:15,QueuedTimeoutInMinutes:5,ConcurrentBuildLimit:1,Artifacts:{Type:'NO_ARTIFACTS'},Environment:{Type:'ARM_CONTAINER',ComputeType:'BUILD_GENERAL1_SMALL',Image:'aws/codebuild/amazonlinux-aarch64-standard:3.0',PrivilegedMode:true},Source:{Type:'S3',Location:boot.Bucket+'/'+key,BuildSpec:JSON.stringify(buildspec)},LogsConfig:{CloudWatchLogs:{Status:'ENABLED',GroupName:logGroup}}}}}};
 await s3.send(new PutObjectCommand({Bucket:boot.Bucket,Key:key,Body:await sourceZip()}));let stackCreated=false,buildId,done=false;
 try{
  await cf.send(new CreateStackCommand({StackName:name,TemplateBody:JSON.stringify(template),Capabilities:['CAPABILITY_IAM']}));stackCreated=true;
  console.log('Creating temporary ARM build resources.');await waitUntilStackCreateComplete({client:cf,maxWaitTime:300,minDelay:5,maxDelay:10},{StackName:name});
  buildId=aws(['codebuild','start-build','--project-name',name]).build.id;let previous;
  for(let n=0;n<65;n++){
   const b=aws(['codebuild','batch-get-builds','--ids',buildId]).builds[0];if(b.currentPhase!==previous){console.log('Cloud build: '+b.currentPhase);previous=b.currentPhase}
   if(b.buildStatus!=='IN_PROGRESS'){done=true;await writeFile('.local/cloud-build-result.json',JSON.stringify({id:buildId,status:b.buildStatus,tag,phases:b.phases},null,2));if(b.logs?.streamName){const logs=aws(['logs','get-log-events','--log-group-name',logGroup,'--log-stream-name',b.logs.streamName]);await writeFile('.local/cloud-build.log',logs.events.map(e=>e.message).join(''))}if(b.buildStatus!=='SUCCEEDED')throw new Error('Cloud build '+b.buildStatus+'; see .local/cloud-build.log');return}
   await new Promise(r=>setTimeout(r,20000));
  }
  throw new Error('Cloud build polling timed out.');
 }finally{
  if(buildId&&!done)aws(['codebuild','stop-build','--id',buildId]);
  if(stackCreated){await cf.send(new DeleteStackCommand({StackName:name}));await waitUntilStackDeleteComplete({client:cf,maxWaitTime:300,minDelay:5,maxDelay:10},{StackName:name});console.log('Temporary build resources removed.');}
  await s3.send(new DeleteObjectCommand({Bucket:boot.Bucket,Key:key}));
 }
}
