import fs from "fs";
import issues from "./issues.json" assert { type: "json" };
import reviews from "./reviews.json" assert { type: "json" };
import reviewIssues from "./review-issues.json" assert { type: "json" };

const weeks = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "Recess",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "Reading",
];

const sanitizeRow = (row) => {
  const [date, description] = row;
  const dateObj = new Date(date);
  let sanitizedDate = dateObj.toLocaleDateString("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  let startDate = new Date("2023-01-09");
  let i = -1;
  while (dateObj >= startDate) {
    i++;
    startDate = new Date(startDate.setDate(startDate.getDate() + 7));
  }

  if (i != -1) {
    sanitizedDate = weeks[i];
    // don't run this after reading wk :)
  }

  const sanitizedDescription = description.replace(/\[\[\#([^\]]+)\]\s/, "[");

  return [sanitizedDate, sanitizedDescription];
};

const generateRows = () => {
  const rows = [];

  for (const issue of issues) {
    if (issue.pull_request) {
      if (issue.state != "closed") {
        console.log(`Ignoring open PR: ${issue.title}\n`);
        continue;
      }
      const description = `Merged PR: [${issue.title.trim()} #${issue.number}](${issue.pull_request.html_url})`;
      const date = issue.closed_at;
      rows.push([date, description]);
    } else {
      const description = `Submitted Issue: [${issue.title.trim()} #${issue.number}](${issue.html_url})`;
      const date = issue.created_at;
      rows.push([date, description]);
    }
  }

  const sortedReviews = reviews.sort((a, b) =>
    a.created_at > b.created_at ? -1 : 1
  );

  const seen = new Set();

  for (const review of sortedReviews) {
    const url = review.pull_request_url;
    if (seen.has(url)) {
      continue;
    }
    seen.add(url);

    const issue = reviewIssues[url];
    const date = review.created_at;
    const description = `Reviewed PR: [${issue.title.trim()} #${issue.number}](${issue.html_url})`;
    rows.push([date, description]);
  }

  let sortedRows = rows.sort((a, b) => (a[0] > b[0] ? 1 : -1));
  sortedRows = sortedRows.map(sanitizeRow);

  return sortedRows;
};

const generateProgress = () => {
  const rows = generateRows();
  let progress = "";

  const preSemWork = rows.filter((x) => !weeks.includes(x[0]));
  if (preSemWork.length) {
    progress += "## CS3282 Pre-Sem Progress\n\n";
    progress += "|Date|Achievements|\n";
    progress += "|----|------------|\n";

    for (const row of preSemWork) {
      progress += `|${row[0]}|${row[1]}|\n`;
    }

    progress += "\n";
  }

  const semWork = rows.filter((x) => weeks.includes(x[0]));
  progress += "## CS3282 Progress\n\n";
  progress += "|Week|Achievements|\n";
  progress += "|----|------------|\n";

  for (const row of semWork) {
    progress += `|${row[0]}|${row[1]}|\n`;
  }

  fs.writeFileSync("./progress.md", progress);
};

generateProgress();
