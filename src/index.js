import { request } from './request';
import { createPayload } from './createPayload';

/**
 * @description Formats a message to be sent to a Slack channel.
 */
export async function handler(event, context) {
  // Allow using body, in case you do local testing.
  const body = event.body ? JSON.parse(event.body) : undefined;

  // Use body if one exists, else attempt to get event record/message.
  const message = body?.event?.Records?.[0].Sns?.Message || event?.Records?.[0].Sns?.Message;
  if (!message) {
    console.error('Incoming data does not seem to be an SNS message...');
    return {
      statusCode: 401,
      body: JSON.stringify('Unauthorized')
    };
  }

  // Call Slack's API.
  try {
    const data = createPayload(message);
    await request(data);
  } catch (error) {
    // Handle errors.
    return {
      statusCode: 401,
      body: JSON.stringify(error)
    };
  }

  // Respond with success.
  return {
    statusCode: 200,
    body: JSON.stringify(`OK`)
  };
}
