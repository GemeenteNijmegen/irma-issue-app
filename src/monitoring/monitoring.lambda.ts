import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import axios from 'axios';

export function parseData(data: any) {
  const payload = Buffer.from(data, 'base64');
  const result = zlib.gunzipSync(payload);
  const json = JSON.parse(result.toString('utf-8'));
  return json;
}

function formatCloudwatchUrl(logGroup: string, logStream: string, timestamp: number) {
  const urlBase = 'https://eu-west-1.console.aws.amazon.com/cloudwatch/home?region=eu-west-1#logsV2:log-groups/log-group/';
  let urlString = urlBase + formatCloudwatchUrlString(logGroup) + '/log-events/' + formatCloudwatchUrlString(logStream);
  if (timestamp) {
    const millis = 5000;
    const timestampStart = timestamp - millis;
    const timestampEnd = timestamp + millis;
    urlString = urlString + '$3Fstart$3D' + timestampStart + '$26end$3D' + timestampEnd;
  }
  return urlString;
}

function formatCloudwatchUrlString(string: string) {
  return string.replace(/\$/g, '$2524').replace(/\//g, '$252F').replace(/\[/g, '$255B').replace(/\]/g, '$255D');
}

export function createMessage(logs: any): any {
  const logGroup = logs.logGroup;
  const logStream = logs.logStream;
  const logEvents = logs.logEvents;

  const templateBuffer = fs.readFileSync(path.join(__dirname, 'template.json'));
  const templateString = templateBuffer.toString();
  const message = { blocks: [] };
  for (let i = 0; i < logEvents.length; i++) {
    const event = logEvents[i];
    let blockString = templateString.replace('<HEADER>', 'Error in IRMA issue app lambda');
    blockString = blockString.replace('<LOGGROUP>', logGroup);
    let eventMessage = JSON.stringify('```' + event.message + '```');

    blockString = blockString.replace('<MESSAGE>', eventMessage);
    const urlString = formatCloudwatchUrl(logGroup, logStream, event.timestamp);
    blockString = blockString.replace('<URL>', urlString);
    const block = JSON.parse(blockString);
    message.blocks = message.blocks.concat(block);
  }
  return message;
}

async function sendMessage(message: string) {
  if (!process.env.SLACK_WEBHOOK_URL) {
    console.log('No slack webhook url set');
    return;
  }
  await axios.post(process.env.SLACK_WEBHOOK_URL, message);
}

export async function handler(input: any) {
  const logs = parseData(input.awslogs.data);
  const message = createMessage(logs);
  await sendMessage(message);
};
