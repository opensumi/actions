import { call, getGitHubToken } from './core';
import { Octokit } from '@octokit/rest';
import dayjs from 'dayjs';
import {
  GitHubService,
  IOrganizationNewContributionsResult,
  TEAM_MEMBERS,
  TEAM_MEMBER_PR_REQUIREMENT,
  formatDateString,
} from '@opensumi/octo-service';

export const formatDate = (date: Date) => {
  return formatDateString(date, 'YYYY-MM-DD');
};

call(async ({ github, context, core }) => {
  const token = getGitHubToken();

  const owner = 'opensumi';
  const repo = 'core';
  const service = new GitHubService(
    new Octokit({
      auth: token,
    }),
  );
  // 获取当前日期
  let today = new Date();

  if (process.env.TARGET_TIME) {
    const day = dayjs(`${process.env.TARGET_TIME}-02`, 'YYYY-MM-DD');
    today = day.toDate();
  }
  console.log(`🚀 ~ file: monthlyReport.ts:665 ~ call ~ today:`, today);

  // 获取当前月份的第一天
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  // 获取下个月份的第一天，再倒退一天得到本月最后一天
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const lastDay = new Date(nextMonth.getTime() - 86400000);

  const results = await service.getOrganizationPRCount(
    owner,
    firstDay.getTime(),
    lastDay.getTime(),
  );
  const notUpToStandards = [];
  let content = '# Monthly Report of OpenSumi\n';
  content += `> This report counts OpenSumi organization data from ${formatDate(
    firstDay,
  )} to ${formatDate(lastDay)}.\n\n`;
  content +=
    'The monthly report aims to provide an overview of the [OpenSumi](https://github.com/opensumi), it contains the basis of all projects within the [OpenSumi](https://github.com/opensumi) organization, as well as a summary of the most significant changes and improvements made during the month.\n';
  content += '## Overview\n';
  const contributors = await service.getContributors(owner, repo);
  const newContributors = await service.getOrganizationNewContributors(
    owner,
    firstDay.toISOString(),
    lastDay.toISOString(),
  );
  const contributionIncrement = newContributors[`${owner}/${repo}`];

  const history = await service.getRepoHistory(
    owner,
    repo,
    firstDay.getTime(),
    lastDay.getTime(),
  );

  content += '### Basic (opensumi/core)\n';
  content +=
    'This content will show how the star, watch, fork and contributors count changed in the passed month.\n';

  content += '| Star | Watch | Fork | Contributors |\n';
  content += '| ---- | ----- | ---- | ------------ |\n';
  content += `| ${history.star_count}(↑${history.star_increment}) | - | - | ${
    contributors.length
  }${contributionIncrement ? `(↑${contributionIncrement.length})` : ''} |\n`;

  content += '### Issues & PRS (opensumi/core)\n';
  content +=
    'Issues & PRs show the new/closed issues/pull requests count in the passed month.\n';

  content += '| New Issues | Closed Issues | New PR | Merged PR |\n';
  content += '| ---------- | ------------- | ------ | --------- |\n';
  content += `| ${history.issue_increment} | ${history.issue_closed_increment} | ${history.pull_increment} | ${history.pull_closed_increment} |\n`;
  content += '\n';
  content += '## Contributors\n';
  content +=
    'This section will show the contribution of each developer in the OpenSumi organization in the passed month.\n';

  content += '| Contributor ID | Role | Working On | PRs Count |\n';
  content += '| -------------- | ---- | ---------- | --------- |\n';

  for (const login of Object.keys(results)) {
    const role = await service.getMemberRole(owner, login);
    content += `| [@${login}](https://github.com/${login}) | ${role.toUpperCase()} | ${results[
      login
    ].details.join(',')} | ${results[login].total} |\n`;

    if (
      role === TEAM_MEMBERS.MENTOR &&
      results[login].total < TEAM_MEMBER_PR_REQUIREMENT[TEAM_MEMBERS.MENTOR]
    ) {
      notUpToStandards.push({
        login,
        role,
        total: results[login].total,
        requirement: TEAM_MEMBER_PR_REQUIREMENT[TEAM_MEMBERS.MENTOR],
      });
    } else if (
      role === TEAM_MEMBERS.CORE_MEMBER &&
      results[login].total <
        TEAM_MEMBER_PR_REQUIREMENT[TEAM_MEMBERS.CORE_MEMBER]
    ) {
      notUpToStandards.push({
        login,
        role,
        total: results[login].total,
        requirement: TEAM_MEMBER_PR_REQUIREMENT[TEAM_MEMBERS.CORE_MEMBER],
      });
    } else if (
      role === TEAM_MEMBERS.CONTRIBUTOR &&
      results[login].total <
        TEAM_MEMBER_PR_REQUIREMENT[TEAM_MEMBERS.CONTRIBUTOR]
    ) {
      notUpToStandards.push({
        login,
        role,
        total: results[login].total,
        requirement: TEAM_MEMBER_PR_REQUIREMENT[TEAM_MEMBERS.CONTRIBUTOR],
      });
    }
  }
  content += '\n';
  content += '## TeamMember requirement\n';
  content +=
    'We require each team member to have corresponding contribution requirements while enjoying permissions.\n';
  content += '| Team Role | Requirement (PRs) |\n';
  content += '| --------- | ----------------- |\n';
  content += '| Mentor | 10 |\n';
  content += '| Core Member | 5 |\n';
  content += '| Contributor | 3 |\n';
  content += '\n';
  content += 'Some team members did not meet the requirement this month.\n';

  content += '| Contributor ID | Team Role | Count | Requirement (PRs) |\n';
  content += '| -------------- | --------- | --------- | ----------------- |\n';
  content += notUpToStandards
    .map(
      (standard) =>
        `| ${standard.login} | ${standard.role.toUpperCase()} | ${
          standard.total
        } | **${standard.requirement}** |`,
    )
    .join('\n');
  content += '\n';

  content += '## New Contributors\n';
  content += `It is OpenSumi team's great honor to have new contributors from community. We really appreciate your contributions. Feel free to tell us if you have any opinion and please share this open source project with more people if you could. If you hope to be a contributor as well, please start from [如何贡献代码](https://opensumi.com/zh/docs/develop/how-to-contribute) or [How To Contribute](https://opensumi.com/en/docs/develop/how-to-contribute).\n\n`;
  content += `Here is the list of new contributors:\n\n`;

  for (const repo of Object.keys(newContributors)) {
    if (newContributors[repo].length) {
      content += `**${repo}:**\n\n`;
      content += newContributors[repo]
        .map(
          (contributor: IOrganizationNewContributionsResult) =>
            `@${contributor.login}`,
        )
        .join('\n');
      content += '\n\n';
    }
  }
  content += '\n';
  content += 'Thanks goes to these wonderful people!';

  const title = `📈 Monthly Report of OpenSumi from ${formatDate(
    firstDay,
  )} to ${formatDate(lastDay)}`;

  await service.octo.issues.create({
    owner: 'opensumi',
    repo: 'reports',
    title,
    body: content,
    labels: ['📊 monthly-report'],
  });
});
