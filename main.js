import { Octokit } from '@octokit/core';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    let page = 1;
    const per_page = 100;

    let conflictsCount = 0;

    while (true) {
        const { data } = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
            owner: 'material-extensions',
            repo: 'vscode-material-icon-theme',
            state: 'open',
            per_page,
            page,
        });

        if (data.length === 0) break;

        for (const pull of data) {
            const { data: detailedPull } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
                owner: 'material-extensions',
                repo: 'vscode-material-icon-theme',
                pull_number: pull.number,
            });

            if (detailedPull.mergeable == false) {
                conflictsCount++;
                console.log(`PR #${pull.number}: ${pull.title}`);

                await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/labels', {
                    owner: 'material-extensions',
                    repo: 'vscode-material-icon-theme',
                    issue_number: pull.number,
                    labels: ['merge-conflicts'],
                });

                console.log('Marked this PR with the label "merge-conflicts"');
            }
        }
        page++;
    }

    console.log(`Total PRs with conflicts: ${conflictsCount}`);
})();