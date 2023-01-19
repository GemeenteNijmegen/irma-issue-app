# CloudWatch dashboard and queries
To provide insight in the issue statistics a CloudWatch dashboard is developed. 
This page contains a number of queries that are used to provide differen widges on the dashboard.



## Issue events per gemeente
```
fields subject, timestamp, gemeente, success, error
| filter not isempty(subject) # filter out other log lines
| stats count(subject) by gemeente # issues per gemeente in the given time frame
```

## Issue events per 2h
```
fields subject, timestamp, gemeente, success, error
| filter not isempty(subject) # filter out other log lines
| stats count(subject) by bin(2h) # Issue events per two hours 
```

