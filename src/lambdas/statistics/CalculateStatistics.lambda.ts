import { CloudWatchLogsClient, GetQueryResultsCommand, QueryStatus, StartQueryCommand } from '@aws-sdk/client-cloudwatch-logs';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { ScheduledEvent } from 'aws-lambda';

const dynamoDBClient = new DynamoDBClient({});
const logsClient = new CloudWatchLogsClient();

export async function handler(event: ScheduledEvent) {
  try {
    const scope = event.detail?.scope;
    const beginDate = event.detail?.beginDate;
    const endDate = event.detail?.beginDate ?? new Date();

    if (beginDate) {
      const dates = getDates(scope, beginDate, endDate);
      for (const date of dates) {
        if (scope == 'month') {
          await calculateMonlthyStatistics(date);
        } else {
          await calculateDailyStatistics(date);
        }
      };
    }

    if (scope == 'month') {
      // Do monthly calculations
      await calculateMonlthyStatistics(new Date());
    } else {
      // Do daily caluclation
      await calculateDailyStatistics(new Date());
    }
  } catch (err) {
    console.error(err);
  }
};


async function calculateMonlthyStatistics(date: Date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth()-1, 1, 0, 0, 0, 0);
  const lastDay = new Date(date.getFullYear(), date.getMonth(), 0, 0, 0, 0, 0);
  const dateStamp = firstDay.toISOString().substring(0, 7); // Date stamp
  const count = await getStatistics(firstDay.getTime(), lastDay.getTime());
  await storeInDynamodb(dateStamp, count, 'month');
}

async function calculateDailyStatistics(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()-1, 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate()-1, 23, 59, 59, 999);
  const dateStamp = start.toISOString().substring(0, 10); // Date stamp
  const count = await getStatistics(start.getTime(), end.getTime());
  await storeInDynamodb(dateStamp, count, 'day');
}

async function storeInDynamodb(dateStemp: string, value: string, type: string) {
  await dynamoDBClient.send(new PutItemCommand({
    Item: {
      type: { S: type },
      date: { S: dateStemp },
      value: { N: value },
    },
    TableName: process.env.TABLE_NAME!,
  }));
}

async function getStatistics(startTime: number, endTime: number) {
  // Start a query
  const query = await logsClient.send(new StartQueryCommand({
    logGroupName: process.env.LOG_GROUP,
    queryString: 'filter not isempty(subject) and issueAttempt == 1 \
                | stats count(subject) as issued',
    startTime: startTime,
    endTime: endTime,
  }));

  // Wait for query to be done
  let results = undefined;
  let count = 0;
  do {
    if (count > 60) {
      throw Error('Cannot get query results');
    }
    await sleep(1000);

    const response = await logsClient.send(new GetQueryResultsCommand({
      queryId: query.queryId,
    }));
    if (response.status == QueryStatus.Complete) {
      results = response.results;
    }
  } while (results == undefined);

  return results[0][0].value ?? '-1';
}

async function sleep(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}

function getDates(stepsize: 'day'| 'month', startDate: Date, stopDate: Date) {
  var dateArray = new Array();
  var currentDate = startDate;
  while (currentDate <= stopDate) {
    dateArray.push(new Date (currentDate));
    if (stepsize=='day') {
      currentDate.setDate(currentDate.getDate() + 1);
    } else {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }
  return dateArray;
}
