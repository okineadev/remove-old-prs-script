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

            if (detailedPull.state === 'open' && detailedPull.mergeable == false) {
                conflictsCount++;
                console.log(`PR #${pull.number}: ${pull.title}`);

                await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
                    owner: 'material-extensions',
                    repo: 'vscode-material-icon-theme',
                    issue_number: pull.number,
                    body: `To improve the quality and to reduce the maintenance effort regular refactoring of the project is inevitable. As much as we appreciate your work and contribution in this pull request, we realised that it was created a while ago and some merge conflicts occurred. 
                    
We have decided to close all PRs that no longer correspond to the current code base. This gives us the opportunity to provide a better overview of the remaining open PRs. 
                    
We would like to offer you to update your changes to the main branch and reopen the PR if the contribution is still relevant for you. Please contact us, we will be happy to help you resolve any conflicts. 
                    
Thank you for your attention and good collaboration.`,
                });

                await octokit.request('PATCH /repos/{owner}/{repo}/pulls/{pull_number}', {
                    owner: 'material-extensions',
                    repo: 'vscode-material-icon-theme',
                    pull_number: pull.number,
                    state: 'closed',
                });

                console.log('Added a comment and closed this PR');
            }
        }
        page++;
    }

    console.log(`Total PRs with conflicts: ${conflictsCount}`);
})();