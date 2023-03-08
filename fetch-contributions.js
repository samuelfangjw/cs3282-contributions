import fs from "fs";
import config from "./config.js";
import { Octokit } from "octokit";

console.log(config);

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
  let prs = await octokit.paginate(
    octokit.rest.pulls.list,
    {
      owner: "TEAMMATES",
      repo: "TEAMMATES",
      state: "closed",
      direction: "desc",
      sort: "updated",
      per_page: 100,
    },
    (res, done) => {
      const updatedAt = res.data[0].updated_at;
      if (updatedAt < config.since) {
        done();
      }
      return res.data;
    }
  );

  let reviews = [];
  for (const pr of prs) {
    // too lazy to handle API rate limits
    // just go slow and hope there are no errors :)
    let toAdd = await octokit.paginate(
      octokit.rest.pulls.listReviews,
      {
        owner: "TEAMMATES",
        repo: "TEAMMATES",
        pull_number: pr.number,
      },
      (res) => {
        const data = res.data.filter(
          (review) =>
            review.user.login == config.username &&
            review.submitted_at >= config.since
        );

        data.forEach((d) => {
          d["title"] = pr.title;
          d["number"] = pr.number;
          d["pr_html_url"] = pr.html_url;
        });

        return data;
      }
    );
    
    for (const d of toAdd) {
      reviews.push(d);
    }
  }

  fs.writeFileSync("./reviews.json", JSON.stringify(reviews));
};

getContributions();
