import https from 'https';

const SLACK_HOOK_PATH = process.env.SLACK_HOOK_PATH;
if (!SLACK_HOOK_PATH) throw new Error(`Missing Slack webhook path environment variable!`);

/**
 * @description HTTPS request helper function.
 */
export async function request(data) {
  if (!data) return;

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'hooks.slack.com',
      path: SLACK_HOOK_PATH,
      port: 443,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https
      .request(options, (res) => {
        const body = [];
        res.on('data', (chunk) => body.push(chunk));
        res.on('end', () => resolve(Buffer.concat(body).toString()));
      })
      .on('error', (err) => {
        console.error('Rejected!', err);
        reject(err);
      })
      .on('timeout', () => {
        console.error('Request time out!', err);
        req.destroy();
        reject(new Error('Request time out'));
      });

    req.write(data);
    req.end();
  });
}
