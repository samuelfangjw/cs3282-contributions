import fs from "fs";
import config from "./config.js";
import { Octokit } from "octokit";

const octokit = new Octokit({
  auth: config.github_token,
});

const getContributions = async () => {
  // fetch Issues and PRs created by user
  let issues = await octokit.paginate(
    octokit.rest.issues.listForRepo,
    {
      owner: "TEAMMATES",
      repo: "TEAMMATES",
      state: "all",
      creator: config.username,
      since: config.since,
    },
    (res) => res.data
  );

  // hope there are no errors :)

  fs.writeFileSync("./issues.json", JSON.stringify(issues));

  // fetch PRs reviewed by user
  let reviews = await octokit.paginate(
    octokit.rest.pulls.listReviewCommentsForRepo,
    {
      owner: "TEAMMATES",
      repo: "TEAMMATES",
      since: config.since,
    },
    (res) => res.data.filter((review) => review.user.login == config.username)
  );

  fs.writeFileSync("./reviews.json", JSON.stringify(reviews));

  // get issue corresponding to review comment
  const reviewIssues = {}

  for (const review of reviews) {
    const url = review.pull_request_url;
    if (url in reviewIssues) {
      continue;
    }

    const issue = await octokit.request(url);
    reviewIssues[url] = issue.data;
  }
  
  fs.writeFileSync("./review-issues.json", JSON.stringify(reviewIssues));
};

getContributions();
