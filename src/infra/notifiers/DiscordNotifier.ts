import { INotifier } from "../../services/JobMonitor";

export class DiscordNotifier implements INotifier {
  constructor(private readonly webhookUrl: string) { }

  async notify(jobAddress: string, transactionHash: string): Promise<void> {
    const body = {
      embeds: [
        {
          title: '🔔 MakerDAO Job Worked',
          color: 5814783,
          fields: [
            { name: 'Job Address', value: jobAddress, inline: true },
            { name: 'Tx Hash', value: transactionHash, inline: true },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(
        `[DiscordNotifier] Falló el envío: ${response.status} ${response.statusText}`
      );
    }
  }
}