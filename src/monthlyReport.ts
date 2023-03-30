import { call, IGitHubKit } from './core';

// 格式化日期为 "yyyy-mm-dd" 的字符串
export const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const PER_PAGE = 100;
const HISTORY_RANGE = 2 * 7 * 24 * 60 * 60 * 1000;

export function range(from: number, to: number): number[] {
  const r: number[] = [];
  for (let i = from; i <= to; i++) {
    r.push(i);
  }
  return r;
}

export function getTimeStampByDate(t: Date | number | string): number {
  const d = new Date(t);

  return d.getTime();
}

export function getDateString(
  t: Date | number | string,
  format = 'yyyy/MM/dd'
): string {
  const d = new Date(getTimeStampByDate(t));

  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const date = d.getDate();

  const formattedString = format
    .replace('yyyy', String(year))
    .replace('MM', String(month))
    .replace('dd', String(date));

  return formattedString;
}

export interface IOrganizationPrResult {
  [login: string]: {
    details: string[];
    total: number;
  };
}

export interface IOrganizationNewContributionsResult {
  [full_name: string]: any;
}

export enum TEAM_MEMBERS {
  CONTRIBUTOR = 'contributor',
  CORE_MEMBER = 'core-member',
  MENTOR = 'mentor',
  NONE = 'none',
}

export const TEAM_MEMBER_PR_REQUIREMENT = {
  [TEAM_MEMBERS.CONTRIBUTOR]: 3,
  [TEAM_MEMBERS.CORE_MEMBER]: 5,
  [TEAM_MEMBERS.MENTOR]: 10,
};

class GitHubService {
  constructor(private github: IGitHubKit) {}

  get octo() {
    return this.github.rest;
  }

  async getRepoStargazers(
    owner: string,
    repo: string,
    page?: number,
    perPage = PER_PAGE
  ) {
    const result = await this.github.request(
      'GET /repos/{owner}/{repo}/stargazers',
      {
        owner,
        repo,
        page: page,
        per_page: perPage,
        headers: {
          Accept: 'application/vnd.github.v3.star+json',
        },
      }
    );
    return result;
  }

  async getRepoIssues(
    owner: string,
    repo: string,
    page?: number,
    perPage = PER_PAGE
  ) {
    const result = await this.github.request(
      'GET /repos/{owner}/{repo}/issues',
      {
        owner,
        repo,
        page: page,
        per_page: perPage,
        state: 'all',
        sort: 'updated',
        headers: {
          Accept: 'application/vnd.github.v3.json',
        },
      }
    );
    return result;
  }

  async getRepoPulls(
    owner: string,
    repo: string,
    page?: number,
    perPage = PER_PAGE
  ) {
    const result = await this.github.request(
      'GET /repos/{owner}/{repo}/pulls',
      {
        owner,
        repo,
        page: page,
        per_page: perPage,
        state: 'all',
        headers: {
          Accept: 'application/vnd.github.v3.json',
        },
      }
    );
    return result;
  }

  async getRepoStargazersCount(owner: string, repo: string) {
    const resp = await this.github.request('GET /repos/{owner}/{repo}', {
      owner,
      repo,
    });
    return resp.data.stargazers_count;
  }

  async getRepoStarRecords(owner: string, repo: string) {
    console.log('getRepoStarRecords');

    const patchRes = await this.getRepoStargazers(owner, repo);

    const headerLink = patchRes.headers['link'] || '';

    const MAX_REQUEST_AMOUNT = 15;

    let pageCount = 1;
    const regResult = /next.*page=(\d*).*?last/.exec(headerLink);

    if (regResult) {
      if (regResult[1] && Number.isInteger(Number(regResult[1]))) {
        pageCount = Number(regResult[1]);
      }
    }

    if (pageCount === 1 && patchRes?.data?.length === 0) {
      throw {
        response: patchRes,
        data: [],
      };
    }

    const requestPages: number[] = [];
    if (pageCount < MAX_REQUEST_AMOUNT) {
      requestPages.push(...range(1, pageCount));
    } else {
      range(1, MAX_REQUEST_AMOUNT).map((i) => {
        requestPages.push(Math.round((i * pageCount) / MAX_REQUEST_AMOUNT) - 1);
      });
      if (!requestPages.includes(1)) {
        requestPages.unshift(1);
      }
    }

    const resArray = await Promise.all(
      requestPages.map((page) => {
        return this.getRepoStargazers(owner, repo, page);
      })
    );

    const starRecordsMap: Map<string, number> = new Map();

    if (requestPages.length < MAX_REQUEST_AMOUNT) {
      const starRecordsData: {
        starred_at: string;
      }[] = [];
      resArray.map((res) => {
        const { data } = res;
        if (data) {
          starRecordsData.push(
            ...(data as {
              starred_at: string;
            }[])
          );
        }
      });
      for (let i = 0; i < starRecordsData.length; ) {
        starRecordsMap.set(getDateString(starRecordsData[i].starred_at), i + 1);
        i += Math.floor(starRecordsData.length / MAX_REQUEST_AMOUNT) || 1;
      }
    } else {
      resArray.map(({ data }, index) => {
        if (data.length > 0) {
          const starRecord = data[0] as {
            starred_at: string;
          };
          starRecordsMap.set(
            getDateString(starRecord.starred_at),
            PER_PAGE * (requestPages[index] - 1)
          );
        }
      });
    }

    const stargazersCount = await this.getRepoStargazersCount(owner, repo);

    starRecordsMap.set(getDateString(Date.now()), stargazersCount);

    const starRecords: {
      date: string;
      count: number;
    }[] = [];

    starRecordsMap.forEach((v, k) => {
      starRecords.push({
        date: k,
        count: v,
      });
    });

    return {
      records: starRecords,
      count: stargazersCount,
    };
  }

  async getRepoStarIncrement(
    owner: string,
    repo: string,
    from: number,
    to: number
  ) {
    console.log('getRepoStarIncrement');
    const patchRes = await this.getRepoStargazers(owner, repo);

    const headerLink = patchRes.headers['link'] || '';

    let pageCount = 1;
    const regResult = /next.*page=(\d*).*?last/.exec(headerLink);
    if (regResult) {
      if (regResult[1] && Number.isInteger(Number(regResult[1]))) {
        pageCount = Number(regResult[1]);
      }
    }

    if (pageCount === 1 && patchRes?.data?.length === 0) {
      throw {
        response: patchRes,
        data: [],
      };
    }

    let star_increment = 0;
    let latestStars = await this.getRepoStargazers(owner, repo, pageCount--);
    while (
      latestStars.data &&
      latestStars.data[0] &&
      new Date(latestStars.data[0].starred_at).getTime() >= from
    ) {
      star_increment += latestStars.data.length;
      latestStars = await this.getRepoStargazers(owner, repo, pageCount--);
    }

    // 不需要判断第一位
    let startIndex = 1;

    for (startIndex = 1; startIndex < latestStars.data.length; startIndex++) {
      if (
        latestStars.data[startIndex] &&
        new Date((latestStars.data[startIndex] as any).starred_at).getTime() >=
          from
      ) {
        break;
      }
    }

    star_increment += latestStars?.data?.length - startIndex;

    return {
      star_increment,
    };
  }

  async getRepoIssueStatus(
    owner: string,
    repo: string,
    from: number,
    to: number
  ) {
    console.log('getRepoIssueStatus');

    const patchRes = await this.getRepoIssues(owner, repo);

    const headerLink = patchRes.headers['link'] || '';

    let pageCount = 1;
    const regResult = /next.*page=(\d*).*?last/.exec(headerLink);

    if (regResult) {
      if (regResult[1] && Number.isInteger(Number(regResult[1]))) {
        pageCount = Number(regResult[1]);
      }
    }

    if (pageCount === 1 && patchRes?.data?.length === 0) {
      throw {
        response: patchRes,
        data: [],
      };
    }

    let issue_increment = 0;
    let issue_closed_increment = 0;
    let done = false;
    let issues;
    let curPage = 1;
    while (!done && curPage <= pageCount) {
      issues = await this.getRepoIssues(owner, repo, curPage++);
      for (let index = 0; index < issues?.data?.length; index++) {
        if (!issues.data[index]) {
          continue;
        }
        const updateTime = new Date(issues.data[index].updated_at).getTime();
        if (updateTime >= from && updateTime <= to) {
          if (!issues.data[index].html_url.includes('issues')) {
            // 说明获取到的为 PullRequest
            continue;
          }
          if (
            issues.data[index].closed_at &&
            new Date(issues.data[index].closed_at!).getTime() >= from
          ) {
            issue_closed_increment++;
          }
          if (
            issues.data[index].created_at &&
            new Date(issues.data[index].created_at!).getTime() >= from
          ) {
            issue_increment++;
          }
        } else {
          done = true;
        }
      }
    }

    return {
      issue_increment,
      issue_closed_increment,
    };
  }

  async getRepoPullStatus(
    owner: string,
    repo: string,
    from: number,
    to: number
  ) {
    console.log('getRepoPullStatus');

    const patchRes = await this.getRepoPulls(owner, repo);

    const headerLink = patchRes.headers['link'] || '';

    let pageCount = 1;
    const regResult = /next.*page=(\d*).*?last/.exec(headerLink);

    if (regResult) {
      if (regResult[1] && Number.isInteger(Number(regResult[1]))) {
        pageCount = Number(regResult[1]);
      }
    }

    if (pageCount === 1 && patchRes?.data?.length === 0) {
      throw {
        response: patchRes,
        data: [],
      };
    }

    let pull_increment = 0;
    let pull_closed_increment = 0;
    let done = false;
    let pulls;
    let curPage = 1;
    while (!done && curPage <= pageCount) {
      pulls = await this.getRepoPulls(owner, repo, curPage++);

      for (let index = 0; index < pulls?.data?.length; index++) {
        if (!pulls.data[index]) {
          continue;
        }
        const updateTime = new Date(pulls.data[index].updated_at).getTime();
        if (updateTime >= from && updateTime <= to) {
          if (
            pulls.data[index].closed_at &&
            new Date(pulls.data[index].closed_at!).getTime() >= from
          ) {
            pull_closed_increment++;
          }
          if (
            pulls.data[index].created_at &&
            new Date(pulls.data[index].created_at!).getTime() >= from
          ) {
            pull_increment++;
          }
        } else {
          done = true;
          continue;
        }
      }
    }

    return {
      pull_increment,
      pull_closed_increment,
    };
  }

  async getRepoHistory(
    owner: string,
    repo: string,
    from: number = Date.now() - HISTORY_RANGE,
    to = Date.now()
  ) {
    const issues = await this.getRepoIssueStatus(owner, repo, from, to);
    const pulls = await this.getRepoPullStatus(owner, repo, from, to);
    const star = await this.getRepoStarIncrement(owner, repo, from, to);
    const { count: star_count } = await this.getRepoStarRecords(owner, repo);

    return {
      from: new Date(from).toLocaleString('zh-cn'),
      to: new Date(to).toLocaleString('zh-cn'),
      star_count,
      ...issues,
      ...pulls,
      ...star,
    };
  }
  async getOrganizationRepos(org: string, isPrivate = false) {
    const result = await this.octo.repos.listForOrg({
      org,
    });
    if (isPrivate) {
      return result.data.filter((repo) => repo.private);
    }
    return result.data.filter((repo) => !repo.private);
  }

  async getOrganizationPRCount(
    owner: string,
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime() // 最近30天的时间戳
  ) {
    const results: IOrganizationPrResult = {};
    const repos = await this.getOrganizationRepos(owner);
    for (const repo of repos) {
      if (repo.owner.login && repo.name) {
        const pulls = await this.octo.pulls.list({
          owner: repo.owner.login,
          repo: repo.name,
          state: 'all',
          per_page: 100,
          sort: 'created',
          direction: 'desc',
        });
        if (pulls.data.length <= 0) {
          continue;
        }
        for (const pull of pulls.data) {
          if (
            !pull.merged_at ||
            !(new Date(pull.merged_at).getTime() >= startDate)
          ) {
            continue;
          }
          if (pull.user?.type === 'Bot') {
            continue;
          }
          const login = pull.user?.login;
          if (!login) {
            continue;
          }
          if (!results[login]) {
            results[login] = { details: [], total: 0 };
          }
          if (!results[login].details.includes(repo.full_name)) {
            results[login].details.push(repo.full_name);
          }
          results[login].total += 1;
        }
      }
    }
    return results;
  }

  async getOrganizationNewContributors(
    owner: string,
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 最近30天的时间戳
  ) {
    const results: IOrganizationNewContributionsResult = {};
    const repos = await this.getOrganizationRepos(owner);
    for (const repo of repos) {
      console.log(`Get new contributions from ${repo.full_name}`);
      const newContributors = await this.getNewContributions(
        repo.owner.login,
        repo.name,
        startDate
      );
      results[repo.full_name] = newContributors;
    }
    return results;
  }

  async getContributors(owner: string, repo: string, page = 1) {
    try {
      const { data } = await this.octo.repos.listContributors({
        owner,
        repo,
        page,
        per_page: 100,
      });
      return data;
    } catch (e) {}
    return [];
  }

  async getCommits(owner: string, repo: string, page = 1, since: string) {
    try {
      const { data } = await this.octo.repos.listCommits({
        owner,
        repo,
        per_page: 100, // 每页返回最多100条记录
        page,
        since,
      });
      return data;
    } catch (e) {}
    return [];
  }

  async getNewContributions(
    owner: string,
    repo: string,
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 最近30天的时间戳
  ) {
    let page = 1;
    let allContributors = await this.getContributors(owner, repo, page);
    while (
      allContributors &&
      allContributors.length &&
      allContributors.length % 100 === 0
    ) {
      page++;
      allContributors = allContributors.concat(
        await this.getContributors(owner, repo, page)
      );
    }
    page = 1;
    let allCommits = await this.getCommits(owner, repo, page, startDate);
    while (allCommits.length && allCommits.length % 100 === 0) {
      page++;
      allCommits = allCommits.concat(
        await this.getCommits(owner, repo, page, startDate)
      );
    }
    const monthlyContributors = new Map();
    for (const commit of allCommits) {
      const login = commit.author?.login || commit.commit.committer?.name;
      if (
        !(
          commit.commit.committer?.date &&
          new Date(commit.commit.committer?.date).getTime() >=
            new Date(startDate).getTime()
        )
      ) {
        break;
      }
      monthlyContributors.set(login, (monthlyContributors.get(login) || 0) + 1);
    }
    const newContributions = [];
    if (Array.isArray(allContributors)) {
      for (const contributor of allContributors) {
        if (
          contributor.contributions ===
          monthlyContributors.get(contributor.login)
        ) {
          newContributions.push(contributor);
        }
      }
    }
    console.log(
      `${owner}/${repo} 仓库新增贡献者数量：${newContributions.length}`
    );
    return newContributions;
  }

  async getMembershipForUserInOrg(
    org: string,
    team_slug: string,
    username: string
  ) {
    const result = await this.octo.teams.getMembershipForUserInOrg({
      org,
      team_slug,
      username,
    });
    return result.data;
  }

  async getMemberRole(org: string, username: string) {
    try {
      const isMentor =
        (
          await this.getMembershipForUserInOrg(
            org,
            TEAM_MEMBERS.MENTOR,
            username
          )
        ).state === 'active';
      if (isMentor) {
        return TEAM_MEMBERS.MENTOR;
      }
    } catch (e) {}
    try {
      const isCoreMember =
        (
          await this.getMembershipForUserInOrg(
            org,
            TEAM_MEMBERS.CORE_MEMBER,
            username
          )
        ).state === 'active';
      if (isCoreMember) {
        return TEAM_MEMBERS.CORE_MEMBER;
      }
    } catch (e) {}
    try {
      const isContributor =
        (
          await this.getMembershipForUserInOrg(
            org,
            TEAM_MEMBERS.CONTRIBUTOR,
            username
          )
        ).state === 'active';
      if (isContributor) {
        return TEAM_MEMBERS.CONTRIBUTOR;
      }
    } catch (e) {}
    return TEAM_MEMBERS.NONE;
  }
}

call(async ({ github, context, core }) => {
  const owner = 'opensumi';
  const repo = 'core';

  const service = new GitHubService(github);
  // 获取当前日期
  const today = new Date();
  // 获取当前月份的第一天
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  // 获取下个月份的第一天，再倒退一天得到本月最后一天
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const lastDay = new Date(nextMonth.getTime() - 86400000);

  const results = await service.getOrganizationPRCount(owner);
  const notUpToStandards = [];
  let content = '# Monthly Report of OpenSumi\n';
  content += `> This report counts OpenSumi organization data from ${formatDate(
    firstDay
  )} to ${formatDate(lastDay)}.\n\n`;
  content +=
    'The monthly report aims to provide an overview of the [OpenSumi](https://github.com/opensumi), it contains the basis of all projects within the [OpenSumi](https://github.com/opensumi) organization, as well as a summary of the most significant changes and improvements made during the month.\n';
  content += '## Overview\n';
  const contributors = await service.getContributors(owner, repo);
  const newContributors = await service.getOrganizationNewContributors(owner);
  const contributionIncrement = newContributors[`${owner}/${repo}`];

  const history = await service.getRepoHistory(
    owner,
    repo,
    firstDay.getTime(),
    lastDay.getTime()
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
  content += '## TeamMember requrement\n';
  content +=
    'We require each team member to have corresponding contribution requirements while enjoying permissions.\n';
  content += '| Team Role | Requirement (PRs) |\n';
  content += '| --------- | ----------------- |\n';
  content += '| Mentor | 10 |\n';
  content += '| Core Member | 5 |\n';
  content += '| Contributor | 3 |\n';
  content += '\n';
  content += 'Some team members did not meet the standard this month.\n';

  content += '| Contributor ID | Team Role | Count | Requirement (PRs) |\n';
  content += '| -------------- | --------- | --------- | ----------------- |\n';
  content += notUpToStandards
    .map(
      (standard) =>
        `| ${standard.login} | ${standard.role.toUpperCase()} | ${
          standard.total
        } | **${standard.requirement}** |`
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
            `@${contributor.login}`
        )
        .join('\n');
      content += '\n\n';
    }
  }
  content += '\n';
  content += 'Thanks goes to these wonderful people!';

  const title = `[Monthly Report] Monthly Report of OpenSumi from ${formatDate(
    firstDay
  )} to ${formatDate(lastDay)}`;

  await service.octo.issues.create({
    owner: 'opensumi',
    repo: 'reports',
    title,
    body: content,
    labels: ['monthly-report'],
  });
});
