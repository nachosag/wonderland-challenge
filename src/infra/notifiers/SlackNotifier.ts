import { INotifier } from "../../services/JobMonitor";

export class SlackNotifier implements INotifier {
  constructor(private readonly webhookUrl: string) { }

  async notify(jobAddress: string, transactionHash: string): Promise<void> {
    const body = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🔔 MakerDAO Job Worked'
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Job Address*\n${jobAddress}`
            },
            {
              type: 'mrkdwn',
              text: `*Tx Hash*\n${transactionHash}`
            }
          ]
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `🕐 ${new Date().toISOString()}`
            }
          ]
        }
      ]
    };

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`[SlackNotifier] Falló el envío: ${response.status} ${response.statusText}`);
    }
  }
}