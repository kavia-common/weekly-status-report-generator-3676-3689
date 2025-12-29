This folder contains static assets for the Weekly Status Report Generator demo.

Provided sample file:
- sample_weekly_tasks.xlsx
  Sheets:
    1) Tasks: Columns = ID, Summary, Assignee, Status, Start Date, Due Date, Updated, Project, Sprint, Story Points
       Rows: 12 realistic sample entries over the last 3 weeks, mixed statuses and assignees.
    2) StatusMapping: Columns = SourceStatus, StandardStatus
       Mappings include:
         Backlog -> To Do
         To Do -> To Do
         In Progress -> In Progress
         In Review -> In Progress
         Blocked -> In Progress
         Done -> Done

Access from the frontend via:
  /assets/sample_weekly_tasks.xlsx
