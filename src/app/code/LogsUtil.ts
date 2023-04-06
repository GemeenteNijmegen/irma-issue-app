import { CloudWatchLogsClient, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';


export class LogsUtil {

  static async logToCloudWatch(client: CloudWatchLogsClient, message: string, logGroupName?: string, logStreamName?: string) {
    if (!logGroupName || !logStreamName) {
      throw Error('LogGroup or LogStream name not provided');
    }

    const input = {
      logGroupName: logGroupName,
      logStreamName: logStreamName,
      logEvents: [{
        timestamp: Date.now(),
        message: message,
      }],
    };
    const command = new PutLogEventsCommand(input);

    await client.send(command);

  }

}