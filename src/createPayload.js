const BASE_URL =
  'https://__REGION__.console.aws.amazon.com/codesuite/codecommit/repositories/__REPO_NAME__';
if (!BASE_URL) throw new Error('Missing BASE_URL!');

/**
 * @description Create formatted message payload for Slack.
 */
export function createPayload(message) {
  const payload = typeof message === 'string' ? JSON.parse(message) : message;

  // Add a primitive check to make sure it's the right format.
  if (!payload.account || !payload.detailType) {
    return JSON.stringify({
      text: payload
    });
  } else {
    // Common shared data among all events.
    const eventData = {
      detailType: payload.detailType,
      region: payload.region,
      time: payload.time,
      detail: payload.detail,
      detailEvent: payload.detail.event,
      repositoryName: payload.detail.repositoryName,
      callerUserArn: payload.detail.callerUserArn,
      user: payload.detail.callerUserArn.split('/')[2]
    };

    const { detailEvent, detail } = eventData;

    /**
     * @description Final processed data, including text, header and URL.
     */
    const processedData = (() => {
      if (detailEvent === 'commentOnCommitCreated') return createCommentOnCommitCreated(eventData);
      else if (detailEvent === 'commentOnPullRequestCreated')
        return createCommentOnPullRequestCreated(eventData);
      else if (detailEvent === 'referenceUpdated' && !detail.mergeOption)
        return createReferenceUpdated(eventData);
      else if (detailEvent === 'referenceUpdated' && detail.mergeOption)
        return createMergeReferenceUpdated(eventData);
      else if (detailEvent === 'pullRequestApprovalRuleOverridden')
        return createPullRequestApprovalRuleOverridden(eventData);
      else if (detailEvent === 'pullRequestApprovalStateChanged')
        return createPullRequestApprovalStateChanged(eventData);
      else if (detailEvent === 'pullRequestCreated') return createPullRequestCreated(eventData);
      else if (detailEvent === 'pullRequestMergeStatusUpdated')
        return createPullRequestMergeStatusUpdated(eventData);
      else if (detailEvent === 'pullRequestSourceBranchUpdated')
        return createPullRequestSourceBranchUpdated(eventData);
      else if (detailEvent === 'pullRequestStatusChanged')
        return createPullRequestStatusChanged(eventData);
      else if (detailEvent === 'referenceDeleted') return createReferenceDeleted(eventData);
      else
        return {
          header: 'Something happened',
          url: '',
          text: 'Something happened'
        };
    })();

    return JSON.stringify({
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: processedData.header
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: processedData.text
          },
          accessory: {
            type: 'image',
            image_url: 'https://www.fintail.me/icons/AWS-CodeCommit.png',
            alt_text: 'CodeCommit icon'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'See the change in the AWS console.'
          },
          accessory: {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Go to AWS'
            },
            value: 'aws',
            url: processedData.url,
            action_id: 'button-action'
          }
        }
      ]
    });
  }
}

/**
 * Message helpers.
 */

const createCommentOnCommitCreated = (eventData) => {
  const { region, user, repositoryName, time } = eventData;
  return {
    header: 'Comment on commit created',
    url: createUrl(region, `${repositoryName}/browse`),
    text: createText({
      User: user,
      Repo: repositoryName,
      Time: time
    })
  };
};

const createCommentOnPullRequestCreated = (eventData) => {
  const { region, user, repositoryName, time, detail } = eventData;
  const { pullRequestId } = detail;
  return {
    header: 'Comment on PR created',
    url: createUrl(region, `${repositoryName}/${pullRequestId}/details`),
    text: createText({
      User: user,
      Repo: repositoryName,
      Time: time,
      'PR ID': pullRequestId
    })
  };
};

const createReferenceUpdated = (eventData) => {
  const { region, user, repositoryName, time, detail } = eventData;
  const { referenceName, commitId } = detail;
  return {
    header: 'Reference updated',
    url: createUrl(region, `${repositoryName}/browse`),
    text: createText({
      User: user,
      Repo: repositoryName,
      'Branch reference': referenceName,
      Time: time,
      'Commit ID': commitId
    })
  };
};

const createMergeReferenceUpdated = (eventData) => {
  const { region, user, repositoryName, time, detail } = eventData;
  const { referenceName, commitId } = detail;
  return {
    header: 'Merge reference updated',
    url: createUrl(region, `${repositoryName}/browse`),
    text: createText({
      User: user,
      Repo: repositoryName,
      'Branch reference': referenceName,
      Time: time,
      'Commit ID': commitId
    })
  };
};

const createPullRequestApprovalRuleOverridden = (eventData) => {
  const { region, user, time, detail } = eventData;
  const {
    author,
    description,
    destinationReference,
    overrideStatus,
    pullRequestId,
    pullRequestStatus,
    repositoryNames,
    sourceReference,
    title
  } = detail;

  return {
    header: 'Pull request approval rule overridden',
    url: createUrl(region, `${repositoryNames[0]}/pull-requests/${pullRequestId}/details`),
    text: createText({
      User: user,
      Author: author.split('/')[2],
      Repo: repositoryNames[0],
      'PR status': pullRequestStatus,
      Title: title,
      Description: description,
      'Source branch': sourceReference,
      'Destination branch': destinationReference,
      'Override status': overrideStatus,
      Time: time
    })
  };
};

const createPullRequestApprovalStateChanged = (eventData) => {
  const { region, user, time, detail } = eventData;
  const {
    approvalStatus,
    author,
    description,
    destinationReference,
    pullRequestId,
    pullRequestStatus,
    repositoryNames,
    sourceReference,
    title
  } = detail;

  return {
    header: 'Pull request approval state changed',
    url: createUrl(region, `${repositoryNames[0]}/pull-requests/${pullRequestId}/details`),
    text: createText({
      User: user,
      Author: author.split('/')[2],
      Repo: repositoryNames[0],
      'PR status': pullRequestStatus,
      Title: title,
      Description: description,
      'Source branch': sourceReference,
      'Approval status': approvalStatus,
      'Destination branch': destinationReference,
      Time: time
    })
  };
};

const createPullRequestCreated = (eventData) => {
  const { region, user, time, detail } = eventData;
  const {
    author,
    description,
    destinationReference,
    pullRequestId,
    pullRequestStatus,
    repositoryNames,
    sourceReference,
    title
  } = detail;

  return {
    header: 'Pull request created',
    url: createUrl(region, `${repositoryNames[0]}/pull-requests/${pullRequestId}/details`),
    text: createText({
      User: user,
      Author: author.split('/')[2],
      Repo: repositoryNames[0],
      'PR status': pullRequestStatus,
      Title: title,
      Description: description,
      'Source branch': sourceReference,
      'Destination branch': destinationReference,
      Time: time
    })
  };
};

const createPullRequestMergeStatusUpdated = (eventData) => {
  const { region, user, time, detail } = eventData;
  const {
    author,
    description,
    destinationReference,
    pullRequestId,
    pullRequestStatus,
    repositoryNames,
    sourceReference,
    title
  } = detail;

  return {
    header: 'Pull request merge status updated',
    url: createUrl(region, `${repositoryNames[0]}/pull-requests/${pullRequestId}/details`),
    text: createText({
      User: user,
      Author: author.split('/')[2],
      Repo: repositoryNames[0],
      'PR status': pullRequestStatus,
      Title: title,
      Description: description,
      'Source branch': sourceReference,
      'Destination branch': destinationReference,
      Time: time
    })
  };
};

const createPullRequestSourceBranchUpdated = (eventData) => {
  const { region, user, time, detail } = eventData;
  const {
    author,
    description,
    destinationReference,
    pullRequestId,
    pullRequestStatus,
    repositoryNames,
    sourceReference,
    title
  } = detail;

  return {
    header: 'Pull request source branch updated',
    url: createUrl(region, `${repositoryNames[0]}/pull-requests/${pullRequestId}/details`),
    text: createText({
      User: user,
      Author: author.split('/')[2],
      Repo: repositoryNames[0],
      'PR status': pullRequestStatus,
      Title: title,
      Description: description,
      'Source branch': sourceReference,
      'Destination branch': destinationReference,
      Time: time
    })
  };
};

const createPullRequestStatusChanged = (eventData) => {
  const { region, user, time, detail } = eventData;
  const {
    author,
    description,
    destinationReference,
    pullRequestId,
    pullRequestStatus,
    repositoryNames,
    sourceReference,
    title
  } = detail;

  return {
    header: 'Pull request merge status updated',
    url: createUrl(region, `${repositoryNames[0]}/pull-requests/${pullRequestId}/details`),
    text: createText({
      User: user,
      Author: author.split('/')[2],
      Repo: repositoryNames[0],
      'PR status': pullRequestStatus,
      Title: title,
      Description: description,
      'Source branch': sourceReference,
      'Destination branch': destinationReference,
      Time: time
    })
  };
};

const createReferenceDeleted = (eventData) => {
  const { region, user, repositoryName, time } = eventData;
  return {
    header: 'Branch or tag deleted',
    url: createUrl(region, `${repositoryName}/browse`),
    text: createText({
      User: user,
      Repo: repositoryName,
      Time: time
    })
  };
};

/**
 * String helpers.
 */
const createUrl = (region, ending) =>
  BASE_URL.replace('__REGION__', region).replace('__REPO_NAME__', ending);

const createText = (obj) => {
  let text = ``;
  Object.entries(obj).forEach((item) => (text += `*${item[0]}*: ${item[1]}\n`));
  return text;
};
